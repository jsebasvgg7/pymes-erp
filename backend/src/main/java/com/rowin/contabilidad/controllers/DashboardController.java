package com.rowin.contabilidad.controllers;

import com.rowin.contabilidad.dto.caja.CajaResumenResponse;
import com.rowin.contabilidad.services.CajaService;
import com.rowin.contabilidad.services.ClienteService;
import com.rowin.contabilidad.services.ProductoService;
import com.rowin.contabilidad.services.ProveedorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ClienteService clienteService;
    private final ProveedorService proveedorService;
    private final ProductoService productoService;
    private final CajaService cajaService;

    public DashboardController(
        ClienteService clienteService,
        ProveedorService proveedorService,
        ProductoService productoService,
        CajaService cajaService
    ) {
        this.clienteService = clienteService;
        this.proveedorService = proveedorService;
        this.productoService = productoService;
        this.cajaService = cajaService;
    }

    @GetMapping("/resumen/{empresaId}")
    public ResponseEntity<Map<String, Object>> obtenerResumen(@PathVariable Long empresaId) {
        Map<String, Object> dashboard = new HashMap<>();

        // Totales
        dashboard.put("totalClientes", clienteService.listarPorEmpresa(empresaId, null).getTotalElements());
        dashboard.put("totalProveedores", proveedorService.listarPorEmpresa(empresaId, null).getTotalElements());
        dashboard.put("totalProductos", productoService.listarPorEmpresa(empresaId, null).getTotalElements());

        // Stock bajo
        dashboard.put("productosStockBajo", productoService.obtenerProductosConStockBajo(empresaId).size());
        dashboard.put("productosSinStock", productoService.obtenerProductosSinStock(empresaId).size());

        // Caja
        List<CajaResumenResponse> cajas = cajaService.obtenerResumenTodasCajas(empresaId);
        dashboard.put("totalCajas", cajas.size());

        BigDecimal saldoTotalCajas = cajas.stream()
            .map(CajaResumenResponse::saldoActual)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        dashboard.put("saldoTotalCajas", saldoTotalCajas);

        dashboard.put("cajas", cajas);

        // Fecha de consulta
        dashboard.put("fechaConsulta", LocalDateTime.now());

        return ResponseEntity.ok(dashboard);
    }
}

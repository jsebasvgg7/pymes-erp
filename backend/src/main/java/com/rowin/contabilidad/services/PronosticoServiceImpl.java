package com.rowin.contabilidad.services;

import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Producto;
import com.rowin.contabilidad.entities.PronosticoDemanda;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.ProductoRepository;
import com.rowin.contabilidad.repositories.PronosticoDemandaRepository;
import com.rowin.contabilidad.services.ml.ArbolDemanda;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class PronosticoServiceImpl extends BaseCrudService implements PronosticoService {

    private final PronosticoDemandaRepository pronosticoDemandaRepository;
    private final ProductoRepository productoRepository;
    private final EmpresaRepository empresaRepository;
    private final ArbolDemanda arbolDemanda;

    public PronosticoServiceImpl(
            PronosticoDemandaRepository pronosticoDemandaRepository,
            ProductoRepository productoRepository,
            EmpresaRepository empresaRepository,
            ArbolDemanda arbolDemanda) {
        this.pronosticoDemandaRepository = pronosticoDemandaRepository;
        this.productoRepository = productoRepository;
        this.empresaRepository = empresaRepository;
        this.arbolDemanda = arbolDemanda;
    }

    @Override
    public void recalcularPronosticos(Long empresaId) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa))
            return;

        List<Producto> productos = productoRepository.findByEmpresaIdAndActiveTrue(empresaId);
        LocalDate semanaPronosticada = LocalDate.now();

        for (Producto producto : productos) {
            Map<String, Double> variables = construirVectorVariables(producto);
            double prediccion = arbolDemanda.predecir(variables);

            PronosticoDemanda pronostico = pronosticoDemandaRepository
                    .findByEmpresaIdAndProductoIdAndActiveTrue(empresaId, producto.getId())
                    .orElse(new PronosticoDemanda());

            pronostico.setEmpresa(empresa);
            pronostico.setProducto(producto);
            pronostico.setSemanaPronosticada(semanaPronosticada);
            pronostico.setUnidadesProyectadas(BigDecimal.valueOf(prediccion));
            pronostico.setVersionModelo("1.0");
            pronostico.setFechaCalculo(LocalDateTime.now());
            pronostico.setActive(true);

            pronosticoDemandaRepository.save(pronostico);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<PronosticoDemanda> obtenerPronosticosPorEmpresa(Long empresaId) {
        return pronosticoDemandaRepository.findByEmpresaIdAndActiveTrue(empresaId);
    }

    private Map<String, Double> construirVectorVariables(Producto producto) {
        Map<String, Double> vars = new HashMap<>();

        // Se inicializan en 0 temporalmente para asegurar que el JSON reciba la
        // estructura completa.
        double ventasSem1 = 0.0;
        double ventasSem2 = 0.0;
        double ventasSem3 = 0.0;
        double ventasSem4 = 0.0;

        vars.put("ventas_sem_1", ventasSem1);
        vars.put("ventas_sem_2", ventasSem2);
        vars.put("ventas_sem_3", ventasSem3);
        vars.put("ventas_sem_4", ventasSem4);
        vars.put("promedio_4sem", (ventasSem1 + ventasSem2 + ventasSem3 + ventasSem4) / 4.0);

        // Detectar si los próximos 7 días incluyen quincena (15 o >= 28)
        LocalDate fecha = LocalDate.now();
        boolean esQuincena = false;
        for (int i = 0; i < 7; i++) {
            int dia = fecha.plusDays(i).getDayOfMonth();
            if (dia == 15 || dia >= 28) {
                esQuincena = true;
                break;
            }
        }
        vars.put("es_quincena", esQuincena ? 1.0 : 0.0);

        double categoriaId = (producto.getCategoria() != null) ? producto.getCategoria().getId() : 0.0;
        vars.put("categoria_id", categoriaId);

        double stockActual = producto.getInventario() != null
                ? producto.getInventario().getCantidadActual().doubleValue()
                : 0.0;
        vars.put("stock_actual", stockActual);

        return vars;
    }
}
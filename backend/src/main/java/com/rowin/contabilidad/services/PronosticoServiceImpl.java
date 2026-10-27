package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.factura.VentaSemanalProductoResponse;
import com.rowin.contabilidad.dto.pronostico.PronosticoDemandaResponse;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Producto;
import com.rowin.contabilidad.entities.PronosticoDemanda;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.ProductoRepository;
import com.rowin.contabilidad.repositories.PronosticoDemandaRepository;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import com.rowin.contabilidad.services.ml.ArbolDemanda;
import com.rowin.contabilidad.utils.HistorialSemanal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class PronosticoServiceImpl extends BaseCrudService implements PronosticoService {

    private static final Logger log = LoggerFactory.getLogger(PronosticoServiceImpl.class);
    private static final int SEMANAS_DE_ENTRADA = 4;
    private static final int MAX_SEMANAS_HISTORIAL = 104;

    private final PronosticoDemandaRepository pronosticoDemandaRepository;
    private final ProductoRepository productoRepository;
    private final EmpresaRepository empresaRepository;
    private final UsuarioRepository usuarioRepository;
    private final FacturaVentaService facturaVentaService;
    private final ArbolDemanda arbolDemanda;

    public PronosticoServiceImpl(
            PronosticoDemandaRepository pronosticoDemandaRepository,
            ProductoRepository productoRepository,
            EmpresaRepository empresaRepository,
            UsuarioRepository usuarioRepository,
            FacturaVentaService facturaVentaService,
            ArbolDemanda arbolDemanda) {
        this.pronosticoDemandaRepository = pronosticoDemandaRepository;
        this.productoRepository = productoRepository;
        this.empresaRepository = empresaRepository;
        this.usuarioRepository = usuarioRepository;
        this.facturaVentaService = facturaVentaService;
        this.arbolDemanda = arbolDemanda;
    }

    @Override
    public void recalcularPronosticos(Long empresaId, String email) {
        verificarEmpresa(empresaId, email);
        recalcularPronosticos(empresaId);
    }

    @Override
    public void recalcularPronosticos(Long empresaId) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            return;
        }

        LocalDate semanaPronosticada = HistorialSemanal.inicioSemana(LocalDate.now());
        Map<Long, VentasProducto> historial = cargarHistorial(empresaId, SEMANAS_DE_ENTRADA + 1);
        Map<Long, PronosticoDemanda> existentes = new HashMap<>();
        for (PronosticoDemanda p : pronosticoDemandaRepository.findByEmpresaIdAndActiveTrue(empresaId)) {
            existentes.putIfAbsent(p.getProducto().getId(), p);
        }

        List<PronosticoDemanda> porGuardar = new ArrayList<>();
        int calculados = 0;
        int omitidos = 0;

        for (Producto producto : productoRepository.findByEmpresaIdAndActiveTrue(empresaId)) {
            PronosticoDemanda existente = existentes.get(producto.getId());
            VentasProducto ventas = historial.get(producto.getId());

            if (ventas == null || ventas.sinDatosSuficientes()) {
                omitidos++;
                if (existente != null) {
                    existente.setActive(false);
                    porGuardar.add(existente);
                }
                continue;
            }

            Map<String, Double> variables = construirVectorVariables(producto, semanaPronosticada, ventas);
            BigDecimal prediccion = BigDecimal.valueOf(arbolDemanda.predecir(variables)).setScale(2, RoundingMode.HALF_UP);

            PronosticoDemanda pronostico = existente != null ? existente : new PronosticoDemanda();
            pronostico.setEmpresa(empresa);
            pronostico.setProducto(producto);
            pronostico.setSemanaPronosticada(semanaPronosticada);
            pronostico.setUnidadesProyectadas(prediccion);
            pronostico.setVersionModelo(arbolDemanda.getVersion());
            pronostico.setFechaCalculo(LocalDateTime.now());
            pronostico.setActive(true);
            porGuardar.add(pronostico);
            calculados++;
        }

        pronosticoDemandaRepository.saveAll(porGuardar);
        log.info("Pronósticos de la empresa {}: {} calculados, {} sin datos suficientes", empresaId, calculados, omitidos);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PronosticoDemandaResponse> obtenerPronosticosPorEmpresa(Long empresaId, String email) {
        verificarEmpresa(empresaId, email);

        List<PronosticoDemanda> pronosticos = pronosticoDemandaRepository.findByEmpresaIdAndActiveTrue(empresaId);
        if (pronosticos.isEmpty()) {
            return List.of();
        }

        LocalDate masAntigua = pronosticos.stream()
                .map(PronosticoDemanda::getSemanaPronosticada)
                .min(Comparator.naturalOrder())
                .orElseThrow();
        LocalDate semanaActual = HistorialSemanal.inicioSemana(LocalDate.now());
        long semanasNecesarias = ChronoUnit.WEEKS.between(masAntigua.minusWeeks(1), semanaActual) + 1;
        int semanas = (int) Math.max(2, Math.min(MAX_SEMANAS_HISTORIAL, semanasNecesarias));
        Map<Long, VentasProducto> historial = cargarHistorial(empresaId, semanas);

        return pronosticos.stream()
                .map(p -> aRespuesta(p, historial.get(p.getProducto().getId())))
                .sorted(Comparator.comparing((PronosticoDemandaResponse r) -> r.producto().nombre(), String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    static boolean semanaIncluyeQuincena(LocalDate lunes) {
        for (int i = 0; i < 7; i++) {
            int dia = lunes.plusDays(i).getDayOfMonth();
            if (dia == 15 || dia >= 28) {
                return true;
            }
        }
        return false;
    }

    private PronosticoDemandaResponse aRespuesta(PronosticoDemanda pronostico, VentasProducto ventas) {
        LocalDate semanaAnterior = pronostico.getSemanaPronosticada().minusWeeks(1);
        BigDecimal ventasAnterior = ventas == null ? BigDecimal.ZERO : ventas.unidadesDe(semanaAnterior);
        BigDecimal proyectadas = pronostico.getUnidadesProyectadas();
        BigDecimal variacion = ventasAnterior.signum() > 0
                ? proyectadas.subtract(ventasAnterior)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(ventasAnterior, 1, RoundingMode.HALF_UP)
                : null;

        Producto producto = pronostico.getProducto();
        return new PronosticoDemandaResponse(
                pronostico.getId(),
                new PronosticoDemandaResponse.ProductoResumen(producto.getId(), producto.getNombre(), producto.getSku()),
                pronostico.getSemanaPronosticada(),
                proyectadas,
                ventasAnterior,
                variacion,
                pronostico.getFechaCalculo());
    }

    private Map<String, Double> construirVectorVariables(Producto producto, LocalDate semanaPronosticada, VentasProducto ventas) {
        double ventasSem1 = ventas.unidadesDe(semanaPronosticada.minusWeeks(1)).doubleValue();
        double ventasSem2 = ventas.unidadesDe(semanaPronosticada.minusWeeks(2)).doubleValue();
        double ventasSem3 = ventas.unidadesDe(semanaPronosticada.minusWeeks(3)).doubleValue();
        double ventasSem4 = ventas.unidadesDe(semanaPronosticada.minusWeeks(4)).doubleValue();

        Map<String, Double> vars = new HashMap<>();
        vars.put("ventas_sem_1", ventasSem1);
        vars.put("ventas_sem_2", ventasSem2);
        vars.put("ventas_sem_3", ventasSem3);
        vars.put("ventas_sem_4", ventasSem4);
        vars.put("promedio_4sem", (ventasSem1 + ventasSem2 + ventasSem3 + ventasSem4) / SEMANAS_DE_ENTRADA);
        vars.put("es_quincena", semanaIncluyeQuincena(semanaPronosticada) ? 1.0 : 0.0);
        vars.put("categoria_id", producto.getCategoria() != null ? producto.getCategoria().getId() : 0.0);
        vars.put("stock_actual", producto.getInventario() != null
                ? producto.getInventario().getCantidadActual().doubleValue()
                : 0.0);
        return vars;
    }

    private Map<Long, VentasProducto> cargarHistorial(Long empresaId, int semanas) {
        Map<Long, VentasProducto> porProducto = new HashMap<>();
        for (VentaSemanalProductoResponse fila : facturaVentaService.obtenerHistorialSemanal(empresaId, semanas)) {
            porProducto
                    .computeIfAbsent(fila.productoId(), id -> new VentasProducto(new HashMap<>(), fila.sinDatosSuficientes()))
                    .unidades()
                    .put(fila.semanaInicio(), fila.unidades());
        }
        return porProducto;
    }

    private void verificarEmpresa(Long empresaId, String email) {
        Usuario usuario = email == null ? null : usuarioRepository.findByEmailAndActiveTrue(email).orElse(null);
        boolean autorizado = usuario != null
                && usuario.getEmpresa() != null
                && empresaId.equals(usuario.getEmpresa().getId());
        if (!autorizado) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a los pronósticos de esta empresa");
        }
    }

    private record VentasProducto(Map<LocalDate, BigDecimal> unidades, boolean sinDatosSuficientes) {

        BigDecimal unidadesDe(LocalDate semana) {
            return unidades.getOrDefault(semana, BigDecimal.ZERO);
        }
    }
}

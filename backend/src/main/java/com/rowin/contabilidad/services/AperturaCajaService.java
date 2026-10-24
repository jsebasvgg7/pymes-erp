package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.caja.AperturaCajaRequest;
import com.rowin.contabilidad.dto.caja.AperturaCajaResponse;
import com.rowin.contabilidad.dto.caja.CierreCajaRequest;
import com.rowin.contabilidad.dto.caja.CierreCajaResponse;
import com.rowin.contabilidad.dto.caja.EstadoCajaResponse;
import com.rowin.contabilidad.entities.AperturaCaja;
import com.rowin.contabilidad.entities.Caja;
import com.rowin.contabilidad.entities.EstadoAperturaCaja;
import com.rowin.contabilidad.entities.ResultadoCierreCaja;
import com.rowin.contabilidad.entities.TipoCierreCaja;
import com.rowin.contabilidad.entities.TipoFormaPago;
import com.rowin.contabilidad.entities.TipoMovimientoCaja;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.AperturaCajaRepository;
import com.rowin.contabilidad.repositories.CajaRepository;
import com.rowin.contabilidad.repositories.ConfiguracionEmpresaRepository;
import com.rowin.contabilidad.repositories.MovimientoCajaRepository;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class AperturaCajaService {

    static final ZoneId ZONA = ZoneId.of("America/Bogota");
    static final LocalTime HORA_CORTE = LocalTime.of(4, 0);

    static final String MENSAJE_CERRADA = "La caja está cerrada. Ábrela para registrar ventas y movimientos.";

    private final AperturaCajaRepository aperturaCajaRepository;
    private final CajaRepository cajaRepository;
    private final MovimientoCajaRepository movimientoCajaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ConfiguracionEmpresaRepository configuracionEmpresaRepository;

    public AperturaCajaService(
        AperturaCajaRepository aperturaCajaRepository,
        CajaRepository cajaRepository,
        MovimientoCajaRepository movimientoCajaRepository,
        UsuarioRepository usuarioRepository,
        ConfiguracionEmpresaRepository configuracionEmpresaRepository
    ) {
        this.aperturaCajaRepository = aperturaCajaRepository;
        this.cajaRepository = cajaRepository;
        this.movimientoCajaRepository = movimientoCajaRepository;
        this.usuarioRepository = usuarioRepository;
        this.configuracionEmpresaRepository = configuracionEmpresaRepository;
    }

    public AperturaCaja exigirAperturaDeCaja(Long cajaId) {
        return aperturaCajaRepository.findFirstByCajaIdAndEstado(cajaId, EstadoAperturaCaja.ABIERTA)
            .orElseThrow(() -> conflicto(MENSAJE_CERRADA));
    }

    public AperturaCaja exigirAperturaDeEmpresa(Long empresaId) {
        return aperturaCajaRepository.findPorEmpresaYEstado(empresaId, EstadoAperturaCaja.ABIERTA).stream()
            .findFirst()
            .orElseThrow(() -> conflicto(MENSAJE_CERRADA));
    }

    public AperturaCaja abrirInicial(Caja caja, Usuario usuario) {
        return crearApertura(caja, usuario, BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public List<EstadoCajaResponse> estados(Long empresaId, String email) {
        Usuario usuario = usuarioDe(email);
        if (usuario.getEmpresa() == null || !empresaId.equals(usuario.getEmpresa().getId())) {
            throw prohibido();
        }
        return cajaRepository.findByEmpresaIdAndActiveTrue(empresaId).stream()
            .map(this::construirEstado)
            .toList();
    }

    @Transactional(readOnly = true)
    public EstadoCajaResponse estado(Long cajaId, String email) {
        return construirEstado(cajaDelUsuario(cajaId, usuarioDe(email)));
    }

    @Transactional
    public AperturaCajaResponse abrir(Long cajaId, AperturaCajaRequest request, String email) {
        Usuario usuario = usuarioDe(email);
        Caja caja = cajaDelUsuario(cajaId, usuario);
        if (aperturaCajaRepository.findFirstByCajaIdAndEstado(cajaId, EstadoAperturaCaja.ABIERTA).isPresent()) {
            throw conflicto("La caja ya está abierta.");
        }
        return aRespuesta(crearApertura(caja, usuario, request.efectivoInicial()));
    }

    @Transactional
    public CierreCajaResponse cerrar(Long cajaId, CierreCajaRequest request, String email) {
        Usuario usuario = usuarioDe(email);
        cajaDelUsuario(cajaId, usuario);
        AperturaCaja apertura = aperturaCajaRepository.findFirstByCajaIdAndEstado(cajaId, EstadoAperturaCaja.ABIERTA)
            .orElseThrow(() -> conflicto("La caja no está abierta."));
        Totales totales = calcularTotales(apertura);
        aplicarCierre(apertura, totales.efectivoEsperado(), request.efectivoContado(), usuario, TipoCierreCaja.MANUAL);
        AperturaCaja guardada = aperturaCajaRepository.save(apertura);
        return new CierreCajaResponse(aRespuesta(guardada), totales.ingresosOtros(), totales.egresosOtros());
    }

    @Transactional
    public AperturaCajaResponse reabrir(Long cajaId, String email) {
        cajaDelUsuario(cajaId, usuarioDe(email));
        AperturaCaja ultima = aperturaCajaRepository.findFirstByCajaIdOrderByIdDesc(cajaId)
            .orElseThrow(() -> conflicto("Esta caja no tiene cierres para reabrir."));
        if (ultima.getEstado() == EstadoAperturaCaja.ABIERTA) {
            throw conflicto("La caja ya está abierta.");
        }
        if (ultima.getFechaApertura().isBefore(ultimoCorte(ahora(), horaCorteDe(ultima)))) {
            throw conflicto("Solo se puede reabrir un cierre del día en curso.");
        }
        ultima.setEstado(EstadoAperturaCaja.ABIERTA);
        ultima.setFechaCierre(null);
        ultima.setUsuarioCierre(null);
        ultima.setEfectivoEsperado(null);
        ultima.setEfectivoContado(null);
        ultima.setDiferencia(null);
        ultima.setTipoCierre(null);
        return aRespuesta(aperturaCajaRepository.save(ultima));
    }

    @Transactional(readOnly = true)
    public Page<AperturaCajaResponse> historial(Long cajaId, Pageable pageable, String email) {
        cajaDelUsuario(cajaId, usuarioDe(email));
        return aperturaCajaRepository
            .findByCajaIdAndEstadoOrderByFechaCierreDesc(cajaId, EstadoAperturaCaja.CERRADA, pageable)
            .map(this::aRespuesta);
    }

    boolean esVencida(AperturaCaja apertura) {
        return apertura.getEstado() == EstadoAperturaCaja.ABIERTA
            && apertura.getFechaApertura().isBefore(ultimoCorte(ahora(), horaCorteDe(apertura)));
    }

    static LocalDateTime ultimoCorte(LocalDateTime ahora, LocalTime horaCorte) {
        LocalDateTime corteDeHoy = ahora.toLocalDate().atTime(horaCorte);
        return ahora.isBefore(corteDeHoy) ? corteDeHoy.minusDays(1) : corteDeHoy;
    }

    private LocalTime horaCorteDe(AperturaCaja apertura) {
        return configuracionEmpresaRepository.findByEmpresaId(apertura.getEmpresa().getId())
            .map(configuracion -> configuracion.getHoraCierreAutomatico())
            .orElse(HORA_CORTE);
    }

    private static LocalDateTime ahora() {
        return LocalDateTime.now(ZONA);
    }

    private AperturaCaja crearApertura(Caja caja, Usuario usuario, BigDecimal efectivoInicial) {
        AperturaCaja apertura = new AperturaCaja();
        apertura.setEmpresa(caja.getEmpresa());
        apertura.setCaja(caja);
        apertura.setEstado(EstadoAperturaCaja.ABIERTA);
        apertura.setUsuarioApertura(usuario);
        apertura.setFechaApertura(ahora());
        apertura.setEfectivoInicial(efectivoInicial.setScale(2, RoundingMode.HALF_UP));
        return aperturaCajaRepository.save(apertura);
    }

    private void aplicarCierre(
        AperturaCaja apertura,
        BigDecimal esperado,
        BigDecimal contado,
        Usuario usuario,
        TipoCierreCaja tipo
    ) {
        apertura.setEstado(EstadoAperturaCaja.CERRADA);
        apertura.setFechaCierre(ahora());
        apertura.setUsuarioCierre(usuario);
        apertura.setTipoCierre(tipo);
        apertura.setEfectivoEsperado(esperado);
        if (contado == null) {
            apertura.setEfectivoContado(null);
            apertura.setDiferencia(null);
        } else {
            BigDecimal contadoNormalizado = contado.setScale(2, RoundingMode.HALF_UP);
            apertura.setEfectivoContado(contadoNormalizado);
            apertura.setDiferencia(contadoNormalizado.subtract(esperado));
        }
    }

    private Totales calcularTotales(AperturaCaja apertura) {
        BigDecimal ingresosEfectivo = BigDecimal.ZERO;
        BigDecimal egresosEfectivo = BigDecimal.ZERO;
        BigDecimal ingresosOtros = BigDecimal.ZERO;
        BigDecimal egresosOtros = BigDecimal.ZERO;

        for (Object[] fila : movimientoCajaRepository.totalesPorApertura(apertura.getId())) {
            TipoFormaPago formaPago = (TipoFormaPago) fila[0];
            TipoMovimientoCaja tipo = (TipoMovimientoCaja) fila[1];
            BigDecimal suma = (BigDecimal) fila[2];
            boolean ingreso = tipo == TipoMovimientoCaja.INGRESO;
            if (formaPago == TipoFormaPago.EFECTIVO) {
                if (ingreso) {
                    ingresosEfectivo = ingresosEfectivo.add(suma);
                } else {
                    egresosEfectivo = egresosEfectivo.add(suma);
                }
            } else if (ingreso) {
                ingresosOtros = ingresosOtros.add(suma);
            } else {
                egresosOtros = egresosOtros.add(suma);
            }
        }

        BigDecimal esperado = apertura.getEfectivoInicial()
            .add(ingresosEfectivo)
            .subtract(egresosEfectivo)
            .setScale(2, RoundingMode.HALF_UP);
        return new Totales(esperado, ingresosOtros, egresosOtros);
    }

    private EstadoCajaResponse construirEstado(Caja caja) {
        AperturaCaja abierta = aperturaCajaRepository
            .findFirstByCajaIdAndEstado(caja.getId(), EstadoAperturaCaja.ABIERTA)
            .orElse(null);
        BigDecimal sugerido = aperturaCajaRepository
            .findFirstByCajaIdAndEstadoOrderByFechaCierreDesc(caja.getId(), EstadoAperturaCaja.CERRADA)
            .map(AperturaCaja::getEfectivoContado)
            .orElse(null);
        return new EstadoCajaResponse(
            caja.getId(),
            caja.getNombre(),
            abierta != null,
            abierta != null && esVencida(abierta),
            abierta == null ? null : aRespuesta(abierta),
            sugerido
        );
    }

    private AperturaCajaResponse aRespuesta(AperturaCaja apertura) {
        Usuario abre = apertura.getUsuarioApertura();
        Usuario cierra = apertura.getUsuarioCierre();
        return new AperturaCajaResponse(
            apertura.getId(),
            apertura.getCaja().getId(),
            apertura.getCaja().getNombre(),
            apertura.getEstado(),
            abre == null ? null : abre.getId(),
            abre == null ? null : abre.getUsername(),
            apertura.getFechaApertura(),
            apertura.getEfectivoInicial(),
            cierra == null ? null : cierra.getId(),
            cierra == null ? null : cierra.getUsername(),
            apertura.getFechaCierre(),
            apertura.getEfectivoEsperado(),
            apertura.getEfectivoContado(),
            apertura.getDiferencia(),
            apertura.getTipoCierre(),
            resultadoDe(apertura.getDiferencia()),
            esVencida(apertura)
        );
    }

    private static ResultadoCierreCaja resultadoDe(BigDecimal diferencia) {
        if (diferencia == null) {
            return null;
        }
        int signo = diferencia.signum();
        if (signo == 0) {
            return ResultadoCierreCaja.CUADRADA;
        }
        return signo < 0 ? ResultadoCierreCaja.FALTANTE : ResultadoCierreCaja.SOBRANTE;
    }

    private Usuario usuarioDe(String email) {
        Usuario usuario = email == null ? null : usuarioRepository.findByEmailAndActiveTrue(email).orElse(null);
        if (usuario == null || usuario.getEmpresa() == null) {
            throw prohibido();
        }
        return usuario;
    }

    private Caja cajaDelUsuario(Long cajaId, Usuario usuario) {
        Caja caja = cajaRepository.findById(cajaId)
            .filter(Caja::isActive)
            .orElseThrow(() -> new ResourceNotFoundException("Caja no encontrada: " + cajaId));
        if (!caja.getEmpresa().getId().equals(usuario.getEmpresa().getId())) {
            throw prohibido();
        }
        return caja;
    }

    private static ResponseStatusException conflicto(String mensaje) {
        return new ResponseStatusException(HttpStatus.CONFLICT, mensaje);
    }

    private static ResponseStatusException prohibido() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a las cajas de esta empresa");
    }

    private record Totales(BigDecimal efectivoEsperado, BigDecimal ingresosOtros, BigDecimal egresosOtros) {
    }
}

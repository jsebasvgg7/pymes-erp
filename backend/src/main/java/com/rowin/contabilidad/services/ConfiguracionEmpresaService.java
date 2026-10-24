package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.configuracion.ConfiguracionEmpresaResponse;
import com.rowin.contabilidad.dto.configuracion.ConfiguracionEmpresaUpdateRequest;
import com.rowin.contabilidad.entities.ConfiguracionEmpresa;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Usuario;
import com.rowin.contabilidad.repositories.ConfiguracionEmpresaRepository;
import com.rowin.contabilidad.repositories.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
@Transactional
public class ConfiguracionEmpresaService {

    private static final DateTimeFormatter FORMATO_HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final ConfiguracionEmpresaRepository configuracionEmpresaRepository;
    private final ConfiguracionEmpresaSeeder configuracionEmpresaSeeder;
    private final UsuarioRepository usuarioRepository;

    public ConfiguracionEmpresaService(
        ConfiguracionEmpresaRepository configuracionEmpresaRepository,
        ConfiguracionEmpresaSeeder configuracionEmpresaSeeder,
        UsuarioRepository usuarioRepository
    ) {
        this.configuracionEmpresaRepository = configuracionEmpresaRepository;
        this.configuracionEmpresaSeeder = configuracionEmpresaSeeder;
        this.usuarioRepository = usuarioRepository;
    }

    public ConfiguracionEmpresaResponse obtener(Long empresaId, String email) {
        Empresa empresa = verificarEmpresa(empresaId, email);
        return toResponse(cargar(empresa));
    }

    public ConfiguracionEmpresaResponse actualizar(Long empresaId, ConfiguracionEmpresaUpdateRequest request, String email) {
        Empresa empresa = verificarEmpresa(empresaId, email);
        ConfiguracionEmpresa configuracion = cargar(empresa);
        aplicar(request, configuracion);
        return toResponse(configuracionEmpresaRepository.save(configuracion));
    }

    private ConfiguracionEmpresa cargar(Empresa empresa) {
        return configuracionEmpresaRepository.findByEmpresaId(empresa.getId())
            .orElseGet(() -> configuracionEmpresaSeeder.sembrar(empresa));
    }

    private void aplicar(ConfiguracionEmpresaUpdateRequest request, ConfiguracionEmpresa configuracion) {
        if (request.moneda() != null) {
            configuracion.setMoneda(request.moneda());
        }
        if (request.simboloMoneda() != null) {
            configuracion.setSimboloMoneda(request.simboloMoneda());
        }
        if (request.formatoFecha() != null) {
            configuracion.setFormatoFecha(request.formatoFecha());
        }
        if (request.clienteObligatorio() != null) {
            configuracion.setClienteObligatorio(request.clienteObligatorio());
        }
        if (request.diasVencimientoCredito() != null) {
            configuracion.setDiasVencimientoCredito(request.diasVencimientoCredito());
        }
        if (request.codigoBarrasActivo() != null) {
            configuracion.setCodigoBarrasActivo(request.codigoBarrasActivo());
        }
        if (request.stockMinimoDefecto() != null) {
            configuracion.setStockMinimoDefecto(request.stockMinimoDefecto());
        }
        if (request.avisarStockBajo() != null) {
            configuracion.setAvisarStockBajo(request.avisarStockBajo());
        }
        if (request.horaCierreAutomatico() != null) {
            configuracion.setHoraCierreAutomatico(LocalTime.parse(request.horaCierreAutomatico(), FORMATO_HORA));
        }
        if (request.anchoRecibo() != null) {
            if (request.anchoRecibo() != 58 && request.anchoRecibo() != 80) {
                throw new IllegalArgumentException("El ancho del recibo debe ser 58 u 80 mm");
            }
            configuracion.setAnchoRecibo(request.anchoRecibo());
        }
        if (request.nombreRecibo() != null) {
            configuracion.setNombreRecibo(blankToNull(request.nombreRecibo()));
        }
        if (request.mensajePieRecibo() != null) {
            configuracion.setMensajePieRecibo(blankToNull(request.mensajePieRecibo()));
        }
    }

    private ConfiguracionEmpresaResponse toResponse(ConfiguracionEmpresa configuracion) {
        return new ConfiguracionEmpresaResponse(
            configuracion.getEmpresa().getId(),
            configuracion.getUpdatedAt(),
            configuracion.getMoneda(),
            configuracion.getSimboloMoneda(),
            configuracion.getFormatoFecha(),
            configuracion.isClienteObligatorio(),
            configuracion.getDiasVencimientoCredito(),
            configuracion.isCodigoBarrasActivo(),
            configuracion.getStockMinimoDefecto(),
            configuracion.isAvisarStockBajo(),
            configuracion.getHoraCierreAutomatico().format(FORMATO_HORA),
            configuracion.getAnchoRecibo(),
            configuracion.getNombreRecibo(),
            configuracion.getMensajePieRecibo()
        );
    }

    private Empresa verificarEmpresa(Long empresaId, String email) {
        Usuario usuario = email == null ? null : usuarioRepository.findByEmailAndActiveTrue(email).orElse(null);
        boolean autorizado = usuario != null
            && usuario.getEmpresa() != null
            && empresaId.equals(usuario.getEmpresa().getId());
        if (!autorizado) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a la configuración de esta empresa");
        }
        return usuario.getEmpresa();
    }

    private String blankToNull(String value) {
        return value.isBlank() ? null : value.trim();
    }
}

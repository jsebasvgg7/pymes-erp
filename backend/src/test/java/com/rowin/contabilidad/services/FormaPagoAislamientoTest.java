package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.formapago.FormaPagoCreateRequest;
import com.rowin.contabilidad.dto.formapago.FormaPagoUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.FormaPago;
import com.rowin.contabilidad.entities.TipoFormaPago;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.FormaPagoRepository;
import com.rowin.contabilidad.utils.mappers.FormaPagoMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FormaPagoAislamientoTest {

    private static final Long FORMA_PAGO_ID = 50L;
    private static final Long EMPRESA_PROPIA = 1L;
    private static final Long EMPRESA_AJENA = 2L;

    @Mock private FormaPagoRepository formaPagoRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private FormaPagoMapper formaPagoMapper;
    @Mock private EmpresaAccesoService empresaAccesoService;

    @InjectMocks private FormaPagoServiceImpl service;

    @BeforeEach
    void permitirEmpresaPropia() {
        lenient().doNothing().when(empresaAccesoService).exigir(EMPRESA_PROPIA);
        lenient().doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
            .when(empresaAccesoService).exigir(EMPRESA_AJENA);
    }

    private FormaPago formaPagoDeEmpresa(Long empresaId) {
        Empresa empresa = new Empresa();
        empresa.setId(empresaId);
        FormaPago formaPago = new FormaPago();
        formaPago.setId(FORMA_PAGO_ID);
        formaPago.setEmpresa(empresa);
        return formaPago;
    }

    private void formaPagoExiste(FormaPago formaPago) {
        when(formaPagoRepository.findById(FORMA_PAGO_ID)).thenReturn(Optional.of(formaPago));
    }

    @Test
    void obtenerPorIdPermiteUnaFormaDePagoPropia() {
        FormaPago formaPago = formaPagoDeEmpresa(EMPRESA_PROPIA);
        formaPagoExiste(formaPago);

        service.obtenerPorId(FORMA_PAGO_ID);

        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
        verify(formaPagoMapper).toResponse(formaPago);
    }

    @Test
    void obtenerPorIdRechazaUnaFormaDePagoAjena() {
        formaPagoExiste(formaPagoDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class, () -> service.obtenerPorId(FORMA_PAGO_ID));

        verifyNoInteractions(formaPagoMapper);
    }

    @Test
    void crearRechazaUnaEmpresaAjena() {
        FormaPagoCreateRequest request =
            new FormaPagoCreateRequest(EMPRESA_AJENA, "Nequi", TipoFormaPago.OTRO);

        assertThrows(ResponseStatusException.class, () -> service.crear(request));

        verifyNoInteractions(empresaRepository, formaPagoMapper);
        verify(formaPagoRepository, never()).save(any());
    }

    @Test
    void actualizarRechazaUnaFormaDePagoAjena() {
        formaPagoExiste(formaPagoDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class,
            () -> service.actualizar(FORMA_PAGO_ID, new FormaPagoUpdateRequest("Nuevo", TipoFormaPago.OTRO)));

        verifyNoInteractions(formaPagoMapper);
        verify(formaPagoRepository, never()).save(any());
    }

    @Test
    void eliminarRechazaUnaFormaDePagoAjena() {
        FormaPago formaPago = formaPagoDeEmpresa(EMPRESA_AJENA);
        formaPagoExiste(formaPago);

        assertThrows(ResponseStatusException.class, () -> service.eliminar(FORMA_PAGO_ID));

        assertTrue(formaPago.isActive());
        verify(formaPagoRepository, never()).save(any());
    }
}

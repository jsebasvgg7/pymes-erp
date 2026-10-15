package com.rowin.contabilidad.services;

import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.FormaPago;
import com.rowin.contabilidad.entities.TipoFormaPago;
import com.rowin.contabilidad.repositories.FormaPagoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FormaPagoCreditoSeederTest {
    @Mock private FormaPagoRepository formaPagoRepository;

    @InjectMocks private FormaPagoCreditoSeeder seeder;

    private Empresa empresa() {
        Empresa empresa = new Empresa();
        empresa.setId(1L);
        return empresa;
    }

    @Test
    void createsCreditPaymentMethodWhenMissing() {
        Empresa empresa = empresa();
        when(formaPagoRepository.existsByEmpresaIdAndTipoAndActiveTrue(1L, TipoFormaPago.CREDITO)).thenReturn(false);

        seeder.sembrar(empresa);

        ArgumentCaptor<FormaPago> captor = ArgumentCaptor.forClass(FormaPago.class);
        verify(formaPagoRepository).save(captor.capture());
        assertEquals(TipoFormaPago.CREDITO, captor.getValue().getTipo());
        assertEquals("Crédito", captor.getValue().getNombre());
        assertEquals(empresa, captor.getValue().getEmpresa());
    }

    @Test
    void doesNothingWhenCreditPaymentMethodAlreadyExists() {
        when(formaPagoRepository.existsByEmpresaIdAndTipoAndActiveTrue(1L, TipoFormaPago.CREDITO)).thenReturn(true);

        seeder.sembrar(empresa());

        verify(formaPagoRepository, never()).save(any(FormaPago.class));
    }
}

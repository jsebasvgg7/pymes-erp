package com.rowin.contabilidad.services;

import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.FormaPago;
import com.rowin.contabilidad.entities.TipoFormaPago;
import com.rowin.contabilidad.repositories.FormaPagoRepository;
import org.springframework.stereotype.Component;

@Component
public class FormaPagoCreditoSeeder {

    private final FormaPagoRepository formaPagoRepository;

    public FormaPagoCreditoSeeder(FormaPagoRepository formaPagoRepository) {
        this.formaPagoRepository = formaPagoRepository;
    }

    public void sembrar(Empresa empresa) {
        if (formaPagoRepository.existsByEmpresaIdAndTipoAndActiveTrue(empresa.getId(), TipoFormaPago.CREDITO)) {
            return;
        }
        FormaPago credito = new FormaPago();
        credito.setEmpresa(empresa);
        credito.setNombre("Crédito");
        credito.setTipo(TipoFormaPago.CREDITO);
        formaPagoRepository.save(credito);
    }
}

package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.cliente.ClienteCreateRequest;
import com.rowin.contabilidad.dto.cliente.ClienteResponse;
import com.rowin.contabilidad.dto.cliente.ClienteUpdateRequest;
import com.rowin.contabilidad.entities.Cliente;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.ClienteRepository;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.utils.mappers.ClienteMapper;
import com.rowin.contabilidad.repositories.CuentaPorCobrarRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
@Transactional
public class ClienteServiceImpl extends BaseCrudService implements ClienteService {

    private final ClienteRepository clienteRepository;
    private final EmpresaRepository empresaRepository;
    private final ClienteMapper clienteMapper;
    private final CuentaPorCobrarRepository cuentaPorCobrarRepository;

    public ClienteServiceImpl(
        ClienteRepository clienteRepository,
        EmpresaRepository empresaRepository,
        ClienteMapper clienteMapper,
        CuentaPorCobrarRepository cuentaPorCobrarRepository
    ) {
        this.clienteRepository = clienteRepository;
        this.empresaRepository = empresaRepository;
        this.clienteMapper = clienteMapper;
        this.cuentaPorCobrarRepository = cuentaPorCobrarRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClienteResponse> listar(Pageable pageable) {
        return clienteRepository.findByActiveTrue(pageable)
            .map(clienteMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClienteResponse> listarPorEmpresa(Long empresaId, Pageable pageable) {
        // Verificar que la empresa existe
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return clienteRepository.findByActiveTrueAndEmpresaId(pageable, empresaId)
            .map(clienteMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ClienteResponse obtenerPorId(Long id) {
        Cliente entity = clienteRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));
        return clienteMapper.toResponse(entity);
    }

    @Override
    public ClienteResponse crear(ClienteCreateRequest request) {
        // Verificar que la empresa existe
        Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
        }

        Cliente entity = clienteMapper.toEntity(request, empresa);
        Cliente saved = clienteRepository.save(entity);
        return clienteMapper.toResponse(saved);
    }

    @Override
    public ClienteResponse actualizar(Long id, ClienteUpdateRequest request) {
        Cliente entity = clienteRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));

        clienteMapper.updateEntity(request, entity);
        Cliente saved = clienteRepository.save(entity);
        return clienteMapper.toResponse(saved);
    }

    @Override
    public void eliminar(Long id) {
        // Soft delete
        Cliente entity = clienteRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));
        softDelete(entity);
        clienteRepository.save(entity);
    }

    @Override
    public void eliminarFisicamente(Long id) {
        // Hard delete (físico)
        Cliente entity = clienteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));
        clienteRepository.delete(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal obtenerSaldoPendiente(Long id) {
        // Validamos que el cliente exista
        Cliente entity = clienteRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));

        return cuentaPorCobrarRepository.calcularSaldoPendientePorCliente(id);
    }

}

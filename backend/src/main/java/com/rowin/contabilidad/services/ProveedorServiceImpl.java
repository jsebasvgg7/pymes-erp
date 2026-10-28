package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.proveedor.ProveedorCreateRequest;
import com.rowin.contabilidad.dto.proveedor.ProveedorResponse;
import com.rowin.contabilidad.dto.proveedor.ProveedorUpdateRequest;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Proveedor;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.ProveedorRepository;
import com.rowin.contabilidad.utils.mappers.ProveedorMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProveedorServiceImpl extends BaseCrudService implements ProveedorService {

    private final ProveedorRepository proveedorRepository;
    private final EmpresaRepository empresaRepository;
    private final ProveedorMapper proveedorMapper;
    private final EmpresaAccesoService empresaAccesoService;

    public ProveedorServiceImpl(
        ProveedorRepository proveedorRepository,
        EmpresaRepository empresaRepository,
        ProveedorMapper proveedorMapper,
        EmpresaAccesoService empresaAccesoService
    ) {
        this.proveedorRepository = proveedorRepository;
        this.empresaRepository = empresaRepository;
        this.proveedorMapper = proveedorMapper;
        this.empresaAccesoService = empresaAccesoService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProveedorResponse> listar(Pageable pageable) {
        return proveedorRepository.findByActiveTrueAndEmpresaId(pageable, empresaAccesoService.empresaIdActual())
            .map(proveedorMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProveedorResponse> listarPorEmpresa(Long empresaId, Pageable pageable) {
        Empresa empresa = getByIdOrThrow(empresaRepository, empresaId, "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + empresaId);
        }

        return proveedorRepository.findByActiveTrueAndEmpresaId(pageable, empresaId)
            .map(proveedorMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long contarPorEmpresa(Long empresaId) {
        return proveedorRepository.countByEmpresaIdAndActiveTrue(empresaId);
    }

    @Override
    @Transactional(readOnly = true)
    public ProveedorResponse obtenerPorId(Long id) {
        Proveedor entity = proveedorRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado: " + id));
        empresaAccesoService.exigir(entity.getEmpresa().getId());
        return proveedorMapper.toResponse(entity);
    }

    @Override
    public ProveedorResponse crear(ProveedorCreateRequest request) {
        empresaAccesoService.exigir(request.empresaId());
        Empresa empresa = getByIdOrThrow(empresaRepository, request.empresaId(), "Empresa");
        if (!isActive(empresa)) {
            throw new ResourceNotFoundException("Empresa no encontrada: " + request.empresaId());
        }

        Proveedor entity = proveedorMapper.toEntity(request, empresa);
        Proveedor saved = proveedorRepository.save(entity);
        return proveedorMapper.toResponse(saved);
    }

    @Override
    public ProveedorResponse actualizar(Long id, ProveedorUpdateRequest request) {
        Proveedor entity = proveedorRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado: " + id));
        empresaAccesoService.exigir(entity.getEmpresa().getId());

        proveedorMapper.updateEntity(request, entity);
        Proveedor saved = proveedorRepository.save(entity);
        return proveedorMapper.toResponse(saved);
    }

    @Override
    public void eliminar(Long id) {
        Proveedor entity = proveedorRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado: " + id));
        empresaAccesoService.exigir(entity.getEmpresa().getId());
        softDelete(entity);
        proveedorRepository.save(entity);
    }

    @Override
    public void eliminarFisicamente(Long id) {
        Proveedor entity = proveedorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado: " + id));
        empresaAccesoService.exigir(entity.getEmpresa().getId());
        proveedorRepository.delete(entity);
    }
}

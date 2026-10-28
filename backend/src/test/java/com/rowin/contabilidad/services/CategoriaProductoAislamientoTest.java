package com.rowin.contabilidad.services;

import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoCreateRequest;
import com.rowin.contabilidad.dto.categoriaproducto.CategoriaProductoUpdateRequest;
import com.rowin.contabilidad.entities.CategoriaProducto;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.repositories.CategoriaProductoRepository;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.utils.mappers.CategoriaProductoMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoriaProductoAislamientoTest {

    private static final Long CATEGORIA_ID = 90L;
    private static final Long EMPRESA_PROPIA = 1L;
    private static final Long EMPRESA_AJENA = 2L;

    @Mock private CategoriaProductoRepository categoriaProductoRepository;
    @Mock private EmpresaRepository empresaRepository;
    @Mock private CategoriaProductoMapper categoriaProductoMapper;
    @Mock private EmpresaAccesoService empresaAccesoService;

    @InjectMocks private CategoriaProductoServiceImpl service;

    @BeforeEach
    void permitirEmpresaPropia() {
        lenient().doNothing().when(empresaAccesoService).exigir(EMPRESA_PROPIA);
        lenient().doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
            .when(empresaAccesoService).exigir(EMPRESA_AJENA);
    }

    private CategoriaProducto categoriaDeEmpresa(Long empresaId) {
        Empresa empresa = new Empresa();
        empresa.setId(empresaId);
        CategoriaProducto categoria = new CategoriaProducto();
        categoria.setId(CATEGORIA_ID);
        categoria.setEmpresa(empresa);
        return categoria;
    }

    private void categoriaExiste(CategoriaProducto categoria) {
        when(categoriaProductoRepository.findById(CATEGORIA_ID)).thenReturn(Optional.of(categoria));
    }

    @Test
    void obtenerPorIdPermiteUnaCategoriaPropia() {
        CategoriaProducto categoria = categoriaDeEmpresa(EMPRESA_PROPIA);
        categoriaExiste(categoria);

        service.obtenerPorId(CATEGORIA_ID);

        verify(empresaAccesoService).exigir(EMPRESA_PROPIA);
        verify(categoriaProductoMapper).toResponse(categoria);
    }

    @Test
    void obtenerPorIdRechazaUnaCategoriaAjena() {
        categoriaExiste(categoriaDeEmpresa(EMPRESA_AJENA));

        assertThrows(ResponseStatusException.class, () -> service.obtenerPorId(CATEGORIA_ID));

        verifyNoInteractions(categoriaProductoMapper);
    }

    @Test
    void crearRechazaUnaEmpresaAjena() {
        assertThrows(ResponseStatusException.class,
            () -> service.crear(new CategoriaProductoCreateRequest(EMPRESA_AJENA, "Categoria")));

        verifyNoInteractions(empresaRepository, categoriaProductoMapper);
        verify(categoriaProductoRepository, never()).save(any());
    }

    @Test
    void actualizarRechazaUnaCategoriaAjena() {
        CategoriaProducto categoria = categoriaDeEmpresa(EMPRESA_AJENA);
        categoria.setNombre("Original");
        categoriaExiste(categoria);

        assertThrows(ResponseStatusException.class,
            () -> service.actualizar(CATEGORIA_ID, new CategoriaProductoUpdateRequest("Nuevo", null)));

        assertEquals("Original", categoria.getNombre());
        verify(categoriaProductoRepository, never()).save(any());
    }

    @Test
    void reactivarRechazaUnaCategoriaAjena() {
        CategoriaProducto categoria = categoriaDeEmpresa(EMPRESA_AJENA);
        categoria.setActive(false);
        categoriaExiste(categoria);

        assertThrows(ResponseStatusException.class, () -> service.reactivar(CATEGORIA_ID));

        assertFalse(categoria.isActive());
        verify(categoriaProductoRepository, never()).save(any());
    }

    @Test
    void eliminarRechazaUnaCategoriaAjena() {
        CategoriaProducto categoria = categoriaDeEmpresa(EMPRESA_AJENA);
        categoriaExiste(categoria);

        assertThrows(ResponseStatusException.class, () -> service.eliminar(CATEGORIA_ID));

        assertTrue(categoria.isActive());
        verify(categoriaProductoRepository, never()).save(any());
    }
}

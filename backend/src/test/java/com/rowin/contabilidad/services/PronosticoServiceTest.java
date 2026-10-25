package com.rowin.contabilidad.services;

import com.rowin.contabilidad.entities.CategoriaProducto;
import com.rowin.contabilidad.entities.Empresa;
import com.rowin.contabilidad.entities.Inventario;
import com.rowin.contabilidad.entities.Producto;
import com.rowin.contabilidad.repositories.EmpresaRepository;
import com.rowin.contabilidad.repositories.ProductoRepository;
import com.rowin.contabilidad.repositories.PronosticoDemandaRepository;
import com.rowin.contabilidad.services.ml.ArbolDemanda;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PronosticoServiceTest {

    @Mock
    private PronosticoDemandaRepository pronosticoDemandaRepository;
    @Mock
    private ProductoRepository productoRepository;
    @Mock
    private EmpresaRepository empresaRepository;
    @Mock
    private ArbolDemanda arbolDemanda;

    @InjectMocks
    private PronosticoServiceImpl pronosticoService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void validarConstruccionVectorVariables() {
        // 1. Preparar datos simulados
        Long empresaId = 1L;
        Empresa empresa = new Empresa();
        empresa.setId(empresaId);
        empresa.setActive(true);

        CategoriaProducto categoria = new CategoriaProducto();
        categoria.setId(3L);

        Inventario inventario = new Inventario();
        inventario.setCantidadActual(new BigDecimal("15.5"));

        Producto producto = new Producto();
        producto.setId(10L);
        producto.setCategoria(categoria);
        producto.setInventario(inventario);

        // 2. Configurar mocks para coincidir con BaseCrudService.getByIdOrThrow
        when(empresaRepository.findById(empresaId)).thenReturn(Optional.of(empresa));

        // Simular la obtención de productos
        when(productoRepository.findByEmpresaIdAndActiveTrue(empresaId)).thenReturn(List.of(producto));

        // Simular el árbol
        when(arbolDemanda.predecir(any())).thenReturn(25.0);

        // 3. Ejecutar el servicio
        pronosticoService.recalcularPronosticos(empresaId);

        // 4. Capturar el vector de variables
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Double>> captor = ArgumentCaptor.forClass(Map.class);
        verify(arbolDemanda).predecir(captor.capture());

        Map<String, Double> vector = captor.getValue();

        // 5. Validar que las llaves y valores son exactamente los que espera Python
        assertTrue(vector.containsKey("es_quincena"), "Falta la variable es_quincena");
        assertEquals(3.0, vector.get("categoria_id"), "El ID de categoría no se mapeó correctamente");
        assertEquals(15.5, vector.get("stock_actual"), "El stock actual no se mapeó correctamente");
        assertEquals(0.0, vector.get("ventas_sem_1"), "Falta la variable ventas_sem_1");
        assertEquals(0.0, vector.get("promedio_4sem"), "Falta la variable promedio_4sem");
    }
}
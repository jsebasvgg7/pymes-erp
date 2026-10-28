package com.rowin.contabilidad.services.ml;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ArbolDemandaTest {

    private static final double TOLERANCIA = 0.000001;

    private ArbolDemanda arbolDemanda;

    @BeforeEach
    void setUp() {
        arbolDemanda = new ArbolDemanda();
        arbolDemanda.inicializar();
    }

    @Test
    void laVersionDelModeloSeLeeDelArchivoMeta() {
        assertEquals("1.1", arbolDemanda.getVersion());
    }

    @Test
    void elTipoDeObjetivoSeLeeDelArchivoMeta() {
        assertEquals(ArbolDemanda.OBJETIVO_RAZON_PROMEDIO, arbolDemanda.getTipoObjetivo());
    }

    @Test
    void predecirCoincideConLaRazonDePython() throws Exception {
        List<Map<String, Object>> casos = cargarCasos();

        for (int i = 0; i < casos.size(); i++) {
            Map<String, Object> fila = casos.get(i);
            double razonPython = numero(fila, "razon_python");

            assertEquals(razonPython, arbolDemanda.predecir(variablesDe(fila)), TOLERANCIA,
                    "Fallo en el caso índice " + i + ": la razón de Java no coincide con la de Python");
        }
    }

    @Test
    void proyectarCoincideConLaPrediccionDePython() throws Exception {
        List<Map<String, Object>> casos = cargarCasos();

        for (int i = 0; i < casos.size(); i++) {
            Map<String, Object> fila = casos.get(i);
            double prediccionPython = numero(fila, "prediccion_python");

            assertEquals(prediccionPython, arbolDemanda.proyectar(variablesDe(fila)), TOLERANCIA,
                    "Fallo en el caso índice " + i + ": la proyección de Java no coincide con la de Python");
        }
    }

    @Test
    void proyectarMultiplicaLaRazonPorElPromedioDeCuatroSemanas() throws Exception {
        for (Map<String, Object> fila : cargarCasos()) {
            Map<String, Double> variables = variablesDe(fila);

            assertEquals(arbolDemanda.predecir(variables) * variables.get("promedio_4sem"),
                    arbolDemanda.proyectar(variables), TOLERANCIA);
        }
    }

    @Test
    void conPromedioCeroLaProyeccionEsCero() {
        Map<String, Double> variables = new HashMap<>();
        variables.put("ventas_sem_1", 0.0);
        variables.put("ventas_sem_2", 0.0);
        variables.put("ventas_sem_3", 0.0);
        variables.put("ventas_sem_4", 0.0);
        variables.put("promedio_4sem", 0.0);
        variables.put("es_quincena", 1.0);
        variables.put("stock_actual", 50.0);

        assertEquals(0.0, arbolDemanda.proyectar(variables), TOLERANCIA);
    }

    private List<Map<String, Object>> cargarCasos() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, Object>> casos;
        try (InputStream is = new ClassPathResource("modelos/casos_prueba.json").getInputStream()) {
            casos = mapper.readValue(is, new TypeReference<>() {
            });
        }
        assertNotNull(casos, "No se pudo cargar el archivo casos_prueba.json");
        assertFalse(casos.isEmpty(), "El archivo de casos de prueba está vacío");
        return casos;
    }

    private Map<String, Double> variablesDe(Map<String, Object> fila) {
        Map<String, Double> variables = new HashMap<>();
        variables.put("ventas_sem_1", numero(fila, "ventas_sem_1"));
        variables.put("ventas_sem_2", numero(fila, "ventas_sem_2"));
        variables.put("ventas_sem_3", numero(fila, "ventas_sem_3"));
        variables.put("ventas_sem_4", numero(fila, "ventas_sem_4"));
        variables.put("promedio_4sem", numero(fila, "promedio_4sem"));
        variables.put("es_quincena", numero(fila, "es_quincena"));
        variables.put("stock_actual", numero(fila, "stock_actual"));
        return variables;
    }

    private double numero(Map<String, Object> fila, String clave) {
        return ((Number) fila.get(clave)).doubleValue();
    }
}

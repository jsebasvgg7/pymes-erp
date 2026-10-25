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

    private ArbolDemanda arbolDemanda;

    @BeforeEach
    void setUp() {
        arbolDemanda = new ArbolDemanda();
        arbolDemanda.inicializar();
    }

    @Test
    void validarPrediccionesContraPython() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        InputStream is = new ClassPathResource("modelos/casos_prueba.json").getInputStream();
        List<Map<String, Object>> casos = mapper.readValue(is, new TypeReference<>() {
        });

        assertNotNull(casos, "No se pudo cargar el archivo casos_prueba.json");
        assertFalse(casos.isEmpty(), "El archivo de casos de prueba está vacío");

        for (int i = 0; i < casos.size(); i++) {
            Map<String, Object> fila = casos.get(i);

            // Extraer la predicción generada originalmente por Colab
            double prediccionPython = ((Number) fila.get("prediccion_python")).doubleValue();

            // Mapear los atributos predictivos al vector esperado por Java
            Map<String, Double> variables = new HashMap<>();
            variables.put("ventas_sem_1", ((Number) fila.get("ventas_sem_1")).doubleValue());
            variables.put("ventas_sem_2", ((Number) fila.get("ventas_sem_2")).doubleValue());
            variables.put("ventas_sem_3", ((Number) fila.get("ventas_sem_3")).doubleValue());
            variables.put("ventas_sem_4", ((Number) fila.get("ventas_sem_4")).doubleValue());
            variables.put("promedio_4sem", ((Number) fila.get("promedio_4sem")).doubleValue());
            variables.put("es_quincena", ((Number) fila.get("es_quincena")).doubleValue());
            variables.put("categoria_id", ((Number) fila.get("categoria_id")).doubleValue());
            variables.put("stock_actual", ((Number) fila.get("stock_actual")).doubleValue());

            // Calcular predicción nativa en Spring Boot
            double prediccionJava = arbolDemanda.predecir(variables);

            // Validar tolerancia máxima de divergencia
            assertEquals(prediccionPython, prediccionJava, 0.000001,
                    "Fallo en el caso índice " + i + ": el árbol de Java no coincide con el de Python");
        }
    }
}
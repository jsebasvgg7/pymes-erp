package com.rowin.contabilidad.services.ml;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.Map;

@Component
public class ArbolDemanda {

    private JsonNode raiz;

    @PostConstruct
    public void inicializar() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream is = new ClassPathResource("modelos/demanda_arbol.json").getInputStream();
            this.raiz = mapper.readTree(is);
            System.out.println("Modelo predictivo de demanda cargado exitosamente en memoria.");
        } catch (Exception e) {
            throw new RuntimeException("Error al cargar el modelo predictivo de demanda: " + e.getMessage(), e);
        }
    }

    public double predecir(Map<String, Double> variables) {
        if (raiz == null) {
            throw new IllegalStateException("El árbol de decisión no está cargado.");
        }
        return evaluarNodo(raiz, variables);
    }

    private double evaluarNodo(JsonNode nodo, Map<String, Double> variables) {
        // Si el nodo es una hoja, retorna la predicción final
        if (nodo.has("prediccion")) {
            return nodo.get("prediccion").asDouble();
        }

        // Si es un nodo de decisión, extrae la regla
        String variable = nodo.get("variable").asText();
        double umbral = nodo.get("umbral").asDouble();

        // Obtiene el valor actual de esa variable para el producto analizado
        double valor = variables.getOrDefault(variable, 0.0);

        // Desciende por la rama correspondiente de forma recursiva
        if (valor <= umbral) {
            return evaluarNodo(nodo.get("izq"), variables);
        } else {
            return evaluarNodo(nodo.get("der"), variables);
        }
    }
}
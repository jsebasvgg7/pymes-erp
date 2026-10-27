package com.rowin.contabilidad.services.ml;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

@Component
public class ArbolDemanda {

    private static final Logger log = LoggerFactory.getLogger(ArbolDemanda.class);
    private static final String RUTA_ARBOL = "modelos/demanda_arbol.json";
    private static final String RUTA_META = "modelos/demanda_arbol.meta.json";

    private JsonNode raiz;
    private String version;

    @PostConstruct
    public void inicializar() {
        ObjectMapper mapper = new ObjectMapper();
        try (InputStream arbol = new ClassPathResource(RUTA_ARBOL).getInputStream();
             InputStream meta = new ClassPathResource(RUTA_META).getInputStream()) {
            this.raiz = mapper.readTree(arbol);
            this.version = mapper.readTree(meta).path("version").asText();
        } catch (IOException e) {
            throw new IllegalStateException("Error al cargar el modelo predictivo de demanda: " + e.getMessage(), e);
        }
        if (version.isBlank()) {
            throw new IllegalStateException("El modelo predictivo de demanda no declara su versión");
        }
        log.info("Modelo predictivo de demanda {} cargado en memoria", version);
    }

    public String getVersion() {
        return version;
    }

    public double predecir(Map<String, Double> variables) {
        if (raiz == null) {
            throw new IllegalStateException("El árbol de decisión no está cargado.");
        }
        return evaluarNodo(raiz, variables);
    }

    private double evaluarNodo(JsonNode nodo, Map<String, Double> variables) {
        if (nodo.has("prediccion")) {
            return nodo.get("prediccion").asDouble();
        }
        String variable = nodo.get("variable").asText();
        double umbral = nodo.get("umbral").asDouble();
        double valor = variables.getOrDefault(variable, 0.0);
        return valor <= umbral
            ? evaluarNodo(nodo.get("izq"), variables)
            : evaluarNodo(nodo.get("der"), variables);
    }
}

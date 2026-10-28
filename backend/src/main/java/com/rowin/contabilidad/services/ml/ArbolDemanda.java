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
    public static final String OBJETIVO_VALOR_ABSOLUTO = "valor_absoluto";
    public static final String OBJETIVO_RAZON_PROMEDIO = "razon_promedio_4sem";

    private JsonNode raiz;
    private String version;
    private String tipoObjetivo;

    @PostConstruct
    public void inicializar() {
        ObjectMapper mapper = new ObjectMapper();
        try (InputStream arbol = new ClassPathResource(RUTA_ARBOL).getInputStream();
             InputStream meta = new ClassPathResource(RUTA_META).getInputStream()) {
            this.raiz = mapper.readTree(arbol);
            JsonNode metaRaiz = mapper.readTree(meta);
            this.version = metaRaiz.path("version").asText();
            this.tipoObjetivo = metaRaiz.path("tipo_objetivo").asText(OBJETIVO_VALOR_ABSOLUTO);
        } catch (IOException e) {
            throw new IllegalStateException("Error al cargar el modelo predictivo de demanda: " + e.getMessage(), e);
        }
        if (version.isBlank()) {
            throw new IllegalStateException("El modelo predictivo de demanda no declara su versión");
        }
        if (!OBJETIVO_VALOR_ABSOLUTO.equals(tipoObjetivo) && !OBJETIVO_RAZON_PROMEDIO.equals(tipoObjetivo)) {
            throw new IllegalStateException("El modelo predictivo de demanda declara un tipo de objetivo no soportado: " + tipoObjetivo);
        }
        log.info("Modelo predictivo de demanda {} ({}) cargado en memoria", version, tipoObjetivo);
    }

    public String getVersion() {
        return version;
    }

    public String getTipoObjetivo() {
        return tipoObjetivo;
    }

    public double proyectar(Map<String, Double> variables) {
        double hoja = predecir(variables);
        if (OBJETIVO_RAZON_PROMEDIO.equals(tipoObjetivo)) {
            return hoja * variables.getOrDefault("promedio_4sem", 0.0);
        }
        return hoja;
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

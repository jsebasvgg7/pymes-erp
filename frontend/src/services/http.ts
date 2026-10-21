import axios from "axios";

export const http = axios.create({
    // Ajusta esta URL si usas una diferente o una variable de entorno
    baseURL: "http://localhost:8080",
    headers: {
        "Content-Type": "application/json"
    }
});

// 1. Interceptor de peticiones: Adjunta el token a cada llamada
http.interceptors.request.use((config) => {
    const token = localStorage.getItem("token"); // Ajusta la clave si la llamas diferente
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 2. Interceptor de respuestas: Detecta tokens vencidos y redirige
http.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si el backend responde con 401 (No Autorizado) o 403 (Prohibido)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {

            // Limpiamos el rastro de la sesión vieja
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");

            // Redirigimos al login forzadamente (si no estamos ya allí)
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

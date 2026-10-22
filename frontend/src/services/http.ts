import axios from "axios";

export const http = axios.create({
    // Ajusta esta URL si tu backend corre en otro puerto en producción
    baseURL: "http://localhost:8080",
    headers: {
        "Content-Type": "application/json"
    }
});

// 1. Interceptor de peticiones: Adjunta el token a cada llamada
http.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 2. Interceptor de respuestas: Detecta tokens vencidos y redirige
http.interceptors.response.use(
    (response) => {
        // Si la respuesta es exitosa, simplemente la devolvemos
        return response;
    },
    (error) => {
        // Si el backend responde con 401 (No Autorizado) o 403 (Prohibido)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {

            // 1. Limpiamos el rastro de la sesión vieja
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");

            // 2. Redirigimos al login forzadamente
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        // Rechazamos la promesa para que los bloques catch(err) de los componentes sigan funcionando
        return Promise.reject(error);
    }
);

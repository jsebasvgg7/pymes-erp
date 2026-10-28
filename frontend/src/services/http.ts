import axios from "axios";

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
    headers: {
        "Content-Type": "application/json"
    }
});

http.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

http.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

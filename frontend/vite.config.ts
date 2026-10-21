import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 5173
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Separa React y React DOM
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            // Separa los íconos (que suelen pesar mucho)
            if (id.includes('lucide')) return 'vendor-icons';
            // Separa el enrutador
            if (id.includes('react-router')) return 'vendor-router';
            // El resto de dependencias (Axios, etc.)
            return 'vendor-core';
          }
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
});

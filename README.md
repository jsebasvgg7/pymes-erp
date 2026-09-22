# PYMES ERP

ERP ligero con Punto de Venta (POS) orientado a pequeños negocios: restaurantes, comidas rápidas, cafeterías, panaderías, tiendas y minimercados.

La idea del proyecto es que el usuario sienta que está usando una herramienta simple de ventas y operación diaria, mientras el sistema genera la información contable y administrativa a partir de esas operaciones.

> Proyecto en desarrollo activo — nació como proyecto académico y continúa evolucionando hacia una versión más completa.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Java 21 · Spring Boot 3.3.4 · Maven · JPA/Hibernate · MapStruct + Lombok |
| Seguridad | Spring Security con JWT y roles |
| Base de datos | **PostgreSQL** (hoy en Aiven), migraciones Flyway V1 a V6, borrado lógico con campo `active` |
| Frontend | React 18 · TypeScript · Vite 5 · React Router 6 · axios · `lucide-react` |
| Estilos | CSS plano por archivo, sin Tailwind (en migración a tema blanco/tokens) |
| Documentación de API | Springdoc OpenAPI / Swagger (`/swagger-ui.html`) |

---

## Estado actual

El frontend tiene 13/13 páginas funcionando **contra la API real** (Login, Dashboard, Clientes, Proveedores, Categorías, Productos, Inventario, Compras, POS, Caja, Reportes, Configuración, Usuarios). El modo LocalStorage fue **eliminado por completo**; los 8 archivos `*Storage.ts` ya no existen.

El backend tiene un modelo de dominio completo en JPA (22 entidades), migraciones Flyway V1–V6, autenticación JWT con roles, y aislamiento multiempresa por `empresaId`. La mayoría de módulos están completos en backend y frontend; el módulo de Impuestos está desactivado (501) para esta primera versión. Ver el detalle módulo por módulo y las brechas conocidas en [`ERP_PLAN.md`](./ERP_PLAN.md).

> `ERP_PLAN.md` es la fuente de verdad sobre el estado del proyecto. Este README se mantiene como resumen de instalación y arranque.

---

## Estructura del repositorio

```
contabilidad-pymes/
├── backend/            # Spring Boot 3.3.4 (Java 21) — API REST, JPA, Flyway
│   └── src/main/java/.../contabilidad/
│       ├── controllers/    # 15 controllers REST
│       ├── entities/       # 22 entidades JPA
│       ├── services/       # lógica de negocio
│       ├── dto/             # requests/responses por módulo
│       ├── repositories/    # Spring Data JPA
│       ├── config/          # seguridad, CORS, JWT
│       └── utils/mappers/   # MapStruct
│   └── src/main/resources/db/migration/   # V1 a V6 (Flyway)
└── frontend/           # React 18 + TypeScript + Vite
    └── src/
        ├── pages/           # 13 páginas (Login, Dashboard, POS, Caja, etc.)
        ├── components/      # DataTable, Modal, PageHeader, StatCard, etc.
        ├── services/        # clientes HTTP por módulo (axios)
        ├── layouts/, routes/, context/, hooks/
        └── landing/         # landing pública, ruta "/"
```

---

## Requisitos

- JDK 21
- Maven (o el wrapper del proyecto)
- Node.js + npm
- PostgreSQL 16 (o Docker, como alternativa local)

---

## Instalación y ejecución en desarrollo

### Base de datos

Usar una instancia de PostgreSQL (hoy en Aiven; alternativa local: PostgreSQL 16 en Docker) y configurar las variables de entorno correspondientes (ver más abajo). Flyway aplica las migraciones V1 a V6 automáticamente al arrancar el backend.

### Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

API disponible en `http://localhost:8080`
Swagger UI en `http://localhost:8080/swagger-ui.html`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Disponible en `http://localhost:5173`

---

## Variables de entorno

| Variable | Uso | Valor por defecto |
|---|---|---|
| `DB_URL` | URL JDBC de PostgreSQL | *(sin valor por defecto; ver `application.yml`)* |
| `DB_USER` | Usuario PostgreSQL | *(sin valor por defecto)* |
| `DB_PASSWORD` | Contraseña PostgreSQL | *(sin valor por defecto)* |
| `VITE_API_URL` | Base URL de la API para el frontend | `http://localhost:8080` |

---

## Visión del proyecto

El sistema busca convertirse en un ERP ligero con POS, inventario, compras, caja y reportes para pequeños negocios, priorizando siempre la facilidad de uso sobre la complejidad contable tradicional. Hoy el producto es una SPA web (React + Vite); la distribución como aplicación de escritorio (Electron) queda como decisión de arquitectura abierta, no confirmada — ver ERP_PLAN.md §3. El plan sí contempla modelo SaaS multiempresa y soporte para impresión térmica (58/80 mm) como características futuras, no implementadas.

Más detalle sobre alcance, filosofía y roadmap en [`ERP_PLAN.md`](./ERP_PLAN.md).


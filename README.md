# PYMES ERP

ERP ligero con Punto de Venta (POS) orientado a pequeños negocios: restaurantes, comidas rápidas, cafeterías, panaderías, tiendas y minimercados.

La idea del proyecto es que el usuario sienta que está usando una herramienta simple de ventas y operación diaria, mientras el sistema genera la información contable y administrativa a partir de esas operaciones.

> Proyecto en desarrollo activo — nació como proyecto académico y continúa evolucionando hacia una versión más completa.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Spring Boot 3.3.4 · Java 21 |
| Frontend | React 18.3.1 · TypeScript 5.6.3 · Vite 5.4.8 |
| Base de datos | MySQL (Flyway para migraciones) |
| Persistencia actual del frontend | LocalStorage (temporal, mientras se conecta la API) |
| Documentación de API | Springdoc OpenAPI / Swagger |

---

## Estado actual

El frontend tiene una experiencia operativa amplia (Login, Dashboard, Clientes, Proveedores, Categorías, Productos, Inventario, Compras, POS, Caja, Reportes, Configuración, Usuarios), pero **corre sobre LocalStorage**, no contra el backend todavía.

El backend tiene un modelo de dominio completo en JPA, migraciones Flyway, DTOs, servicios y mappers, pero **solo expone CRUD para un subconjunto de recursos** por ahora: Empresa, Categoría, Forma de pago, Rol e Impuesto (este último parcial).

La integración entre frontend y backend, la autenticación y el modo multiempresa están en desarrollo.

---

## Estructura del repositorio

```
pymes-erp/
├── backend/          # Spring Boot + Java 21
│   └── src/main/java/com/rowin/contabilidad/
│       ├── controllers/
│       ├── dto/
│       ├── entities/
│       ├── repositories/
│       ├── services/
│       └── utils/mappers/
├── frontend/         # React + TypeScript + Vite
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── routes/
└── ERP_PLAN.md       # Visión, alcance y roadmap del proyecto
```

---

## Requisitos

- JDK 21
- Maven (o el wrapper del proyecto)
- Node.js + npm
- MySQL

---

## Instalación y ejecución en desarrollo

### Base de datos

Crear una base de datos MySQL llamada `contabilidad` y configurar las variables de entorno correspondientes (ver más abajo).

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
| `DB_URL` | URL JDBC de MySQL | `jdbc:mysql://localhost:3306/contabilidad` |
| `DB_USER` | Usuario MySQL | `root` |
| `DB_PASSWORD` | Contraseña MySQL | *(sin valor por defecto)* |
| `VITE_API_URL` | Base URL de la API para el frontend | `http://localhost:8080` |

---

## Visión del proyecto

El sistema busca convertirse en un ERP ligero con POS, inventario, compras, caja y reportes para pequeños negocios, priorizando siempre la facilidad de uso sobre la complejidad contable tradicional. La arquitectura objetivo contempla una aplicación de escritorio (React + Electron), modelo SaaS multiempresa y soporte para impresión térmica (58/80 mm).

Más detalle sobre alcance, filosofía y roadmap en [`ERP_PLAN.md`](./ERP_PLAN.md).

---

## Licencia

Sin definir todavía.

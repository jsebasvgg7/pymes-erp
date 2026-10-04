# Pymes ERP

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-6DB33F)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1)
![Status](https://img.shields.io/badge/estado-en%20desarrollo-yellow)

ERP ligero con Punto de Venta (POS) para pequeños negocios de Cartagena de Indias: restaurantes y comidas rápidas, cafeterías y panaderías, tiendas de barrio y minimercados, papelerías y ferreterías pequeñas.

Integra productos, inventario, compras, ventas, caja y reportes, y genera información contable de forma automática a partir de la operación diaria — sin que el usuario tenga que llevar contabilidad por su cuenta.

Proyecto académico (Tecnología en Desarrollo de Software, Fundación Universitaria Tecnológico Comfenalco) con vocación comercial (SaaS).

---

## Tabla de contenido

- [Filosofía](#filosofía)
- [Arquitectura](#arquitectura)
- [Módulos](#módulos)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Decisiones de producto](#decisiones-de-producto)
- [Diseño y marca](#diseño-y-marca)
- [Seguridad](#seguridad)
- [Próximos pasos](#próximos-pasos)
- [Equipo](#equipo)

---

## Filosofía

- La prioridad del usuario es **vender**; la contabilidad se genera sola.
- No debe sentirse como software contable complejo.
- Pocos clics, intuitivo, con mouse y con pantalla táctil.
- La información nunca se duplica: cada módulo reutiliza la del anterior.
- La calidad pesa más que la velocidad.

**Flujo principal:**

```
Productos → Inventario → Punto de Venta (POS) → Caja → Reportes
```

Al finalizar una venta, el backend, en una sola transacción:

1. Valida stock contra Inventario y lo descuenta.
2. Calcula subtotal, impuestos y total.
3. Genera el número de factura (`FAC-YYYYMMDD-XXXXX`).
4. Registra el movimiento de caja (ingreso) y actualiza el saldo de la caja.
5. Crea cuenta por cobrar si hay cliente asociado.

Debe existir una **Caja activa** para la empresa, o la venta falla.

---

## Arquitectura

| Capa | Tecnología |
|---|---|
| Backend | Java 21, Spring Boot 3.3.4, Maven, JPA/Hibernate, MapStruct + Lombok |
| Seguridad | Spring Security con JWT y roles |
| Base de datos | PostgreSQL (Neon), migraciones Flyway, borrado lógico con campo `active` |
| API | REST, documentada con Swagger/OpenAPI (`/swagger-ui.html`) |
| Frontend | React 18, TypeScript, Vite 5, React Router 6, axios, `lucide-react` |
| Estilos | CSS plano por página + Tailwind CSS (acotado a los componentes de gráficas) |
| Control de versiones | Git, repo público `jsebasvgg7/pymes-erp`, rama `main` |

**Multiempresa:** toda entidad de negocio pertenece a una `Empresa`; el aislamiento se hace por `empresaId`. Modelo SaaS.

**Regla de estilo:** sin emojis en la UI, solo iconos `lucide-react`.

---

## Módulos

| Módulo | Descripción |
|---|---|
| Login / Autenticación | JWT, roles, interceptor de sesión |
| Dashboard | Estadísticas en vivo, gráficas de flujo de caja y ventas por categoría |
| Clientes | Gestión completa, cuentas por cobrar |
| Proveedores | Gestión completa, cuentas por pagar |
| Categorías | Organización de productos |
| Productos | Costo, stock mínimo por producto, unidad de medida |
| Inventario | Ajustes de entrada, salida y conteo, con auditoría de movimientos |
| Compras | Aumenta inventario automáticamente, forma de pago obligatoria |
| Punto de Venta (POS) | Módulo principal del sistema, recibo en modal |
| Caja | Apertura, movimientos, resumen por caja |
| Reportes | Sobre la operación real registrada |
| Configuración | Datos de la empresa |
| Usuarios y Roles | Multi-rol por usuario |

**Formas de pago:** Efectivo, Tarjeta, Transferencia como catálogo base, configurable por empresa.

---

## Instalación y ejecución local

### Requisitos previos

- Java 21
- Maven
- Node.js 18+ y npm
- Una base de datos PostgreSQL (local vía Docker, o una instancia en Neon)

### Backend

```bash
git clone https://github.com/jsebasvgg7/pymes-erp.git
cd pymes-erp/backend
```

Crea un archivo `.env` en la raíz del backend con las credenciales de la base de datos:

```
DB_URL=jdbc:postgresql://<host>:<puerto>/<base>
DB_USER=<usuario>
DB_PASSWORD=<contraseña>
```

Ejecuta las migraciones y levanta el servidor:

```bash
mvn clean install
mvn spring-boot:run
```

El backend queda disponible en `http://localhost:8080`, con la documentación de la API en `http://localhost:8080/swagger-ui.html`.

### Frontend

```bash
cd pymes-erp/frontend
npm install
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

### Primer arranque (base de datos vacía)

Para poblar el primer usuario en una base vacía hoy se requiere pasar manualmente por Swagger: crear Empresa → Rol admin → Usuario admin → Formas de pago → Caja inicial, en ese orden. Ver `ERP_PLAN.md` para el detalle y el estado de un flujo de registro automático que resolvería esto.

---

## Decisiones de producto

- Primera versión sin IVA ni impuestos.
- Stock mínimo por producto, no global.
- **Costo** (no "precio de compra") es el campo real del producto, con costo promedio de inventario.
- Sin campo Imagen en producto.
- Borrado lógico en todas las entidades, nunca eliminación física desde la interfaz.

---

## Diseño y marca

Tema blanco (`--paper`), negro como secundario (`--ink`), tipografía única Inter. Seis tokens de color (`--paper`, `--ink`, `--muted`, `--line`, `--surface`, `--brand`) cubren toda la interfaz, sin colores sueltos fuera del sistema.

**Nombre oficial:** Pymes ERP — "Pymes" como nombre propio en Title Case, "ERP" como sigla técnica en mayúsculas, siguiendo el mismo criterio que "ChatGPT".

La landing page (`/`) presenta el producto con secciones de hero, soluciones, módulos, beneficios, stack tecnológico, estado del repositorio en vivo (métricas reales vía API de GitHub), precios y contacto.

---

## Seguridad

- JWT en todos los endpoints salvo autenticación, documentación de API y monitoreo de salud.
- CORS configurado para los orígenes de desarrollo del frontend.
- Credenciales de base de datos fuera del código, vía variables de entorno.
- Aislamiento de datos por empresa en cada endpoint.

---

## Próximos pasos

- **Pasarela de pagos y membresías.** Hoy no existe cobro ni activación automática de cuentas; el modelo de precios (licencia de pago único o suscripción mensual) está definido en la landing, pero el flujo real de compra y alta de cliente sigue sin implementar.
- **Definición de distribución final: web o escritorio.** Se evalúa llevar la aplicación a un empaquetado tipo Electron, como app de escritorio portable con almacenamiento local y backups del propio usuario, en vez de (o además de) mantenerla como SPA web con base de datos en la nube.
- **Impresión térmica de recibos** (58 mm y 80 mm), planeada pero no implementada.
- **Reportes avanzados** y severidad de alertas de stock bajo.
- **Código de barras** en productos, pendiente de soporte en backend.

---

## Equipo

John Sebastian Vega Gonzalez, Bryan Andres Tuñon Bermudez, Mahicol Hurtado Jimenez y Rowin Otalora Cano.
Docente: Laura Beatriz Martinez Garcia.
Fundación Universitaria Tecnológico Comfenalco, 2026.
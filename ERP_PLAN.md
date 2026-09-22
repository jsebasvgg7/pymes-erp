# ERP Plan — PYMES ERP

**Última actualización:** martes 22 de septiembre de 2026 (landing: vista 1 y vista 2 cerradas y ajustadas a detalle; orden de secciones y nombres redefinidos; nuevas reglas de trabajo)
**Reemplaza a:** la versión anterior del plan (nombre provisional "Contabilidad PYMES", LocalStorage, MySQL, Electron).

> Documentos relacionados: `INICIO_FRONTEND.md` (bitácora técnica por sesión), `TRASPASO_FRONTEND.md` (resumen ejecutivo al 13 de septiembre), `NuevoPlanPymes.md` (bitácora de la sesión de landing y tema blanco).

---

## 1. Proyecto

**Nombre oficial:** PYMES ERP (el sidebar aún dice "Contabilidad PYMES · ERP", pendiente de unificar).
**Objetivo:** ERP ligero con Punto de Venta (POS) para pequeños negocios de Cartagena de Indias, que integre productos, inventario, compras, ventas, caja y reportes, y genere información contable de forma automática a partir de la operación diaria.
**Naturaleza:** proyecto académico (Tecnología en Desarrollo de Software, Tecnológico Comfenalco) con vocación comercial (SaaS).

**Público objetivo:**

- Restaurantes y comidas rápidas
- Cafeterías y panaderías
- Tiendas de barrio y minimercados
- Papelerías y ferreterías pequeñas

No está pensado para grandes empresas ni para procesos contables avanzados.

---

## 2. Filosofía

- La prioridad del usuario es **vender**; la contabilidad se genera sola.
- No debe sentirse como software contable complejo.
- Pocos clics, intuitivo, con mouse y con pantalla táctil.
- La información nunca se duplica: cada módulo reutiliza la del anterior.
- La calidad pesa más que la velocidad.

**Flujo principal:**

```text
Productos → Inventario → Punto de Venta (POS) → Caja → Reportes
```

**Flujo de una venta.** Al finalizar, el backend, en una sola transacción:

1. Valida stock contra Inventario y lo descuenta.
2. Calcula subtotal, impuestos y total.
3. Genera el número de factura (`FAC-YYYYMMDD-XXXXX`).
4. Registra el movimiento de caja (ingreso) y actualiza el saldo de la caja.
5. Crea cuenta por cobrar si hay cliente asociado.

Requisito: debe existir una **Caja activa** para la empresa, o la venta falla.

---

## 3. Arquitectura oficial (actual)

| Capa | Tecnología |
|---|---|
| Backend | Java 21, Spring Boot 3.3.4, Maven, JPA/Hibernate, MapStruct + Lombok |
| Seguridad | Spring Security con JWT y roles |
| Base de datos | **PostgreSQL** (hoy en Aiven, ver §7), migraciones Flyway V1 a V6, borrado lógico con campo `active` |
| API | REST, documentada con Swagger/OpenAPI (`/swagger-ui.html`) |
| Frontend | React 18, TypeScript, Vite 5, React Router 6, axios, `lucide-react` |
| Estilos | CSS plano por archivo (25 archivos), sin Tailwind |
| Control de versiones | Git, repo público `jsebasvgg7/pymes-erp`, rama `main` |

**Multiempresa:** toda entidad de negocio pertenece a una `Empresa`; el aislamiento se hace por `empresaId`. Modelo SaaS previsto.

**Regla de estilo del proyecto:** sin emojis en la UI, solo iconos `lucide-react`.

### Decisiones abiertas de arquitectura

- [ ] **Distribución: web o escritorio (Electron).** El plan anterior decía React + Electron con instalador y membresía activa; el informe metodológico y la landing describen una aplicación web SaaS. Hoy el código es una SPA web. **Falta decidir cuál es la oficial** y alinear informe y landing.
- [ ] **Membresías / planes.** El plan anterior exigía membresía activa para acceder. No existe implementación. La landing no debe inventar tarifas (usar "Próximamente").

---

## 4. Módulos y estado

| # | Módulo | Backend | Frontend | Notas |
|---|---|---|---|---|
| 1 | Login / Autenticación | Completo (JWT) | Completo | Interceptor en `http.ts` redirige a `/login` en 401 |
| 2 | Dashboard | Completo | Completo | Sin tendencias históricas (el backend solo da valor actual) |
| 3 | Clientes | Completo | Completo | Hard delete existe en backend, no expuesto en UI |
| 4 | Proveedores | Completo | Completo | |
| 5 | Categorías | Completo | Completo | Reactivación soportada en backend (`active`); botón pendiente en UI |
| 6 | Productos | Completo | Completo | Cambio de categoría soportado en backend; pendiente en UI |
| 7 | Inventario | Completo | Completo | Ajustes ENTRADA / SALIDA / CONTEO con auditoría en `movimiento_inventario` |
| 8 | Compras | Completo | Completo | Aumenta inventario automáticamente |
| 9 | Punto de Venta (POS) | Completo | Completo | Módulo principal; recibo en modal |
| 10 | Caja | Completo | Completo | Apertura, movimientos, resumen por caja |
| 11 | Reportes | Parcial | Completo (básico) | Sobre endpoints existentes; avanzados requieren backend nuevo |
| 12 | Configuración | Parcial | Parcial | Solo 5 campos de empresa funcionales (ver §6) |
| 13 | Usuarios y Roles | Completo | Completo | Multi-rol por usuario; un usuario no puede desactivarse a sí mismo |
| 14 | Impuestos | Desactivado (501) | Sin UI | Fuera de la primera versión |

**Formas de pago (catálogo):** Efectivo, Tarjeta, Transferencia sembradas como mínimo. El plan anterior mencionaba también Nequi y Daviplata; se crean vía `POST /api/formas-pago/crear` por empresa. Pago mixto: versión futura.

**Migración de datos completada:** 13/13 páginas usan servicios reales. Los 8 archivos `*Storage.ts` (LocalStorage) fueron **eliminados**. Ya no existe modo LocalStorage.

---

## 5. Decisiones de producto vigentes

- **Primera versión sin IVA ni impuestos.**
- **Stock mínimo por producto** (no global).
- **Costo** (no "precio de compra") es el campo real del producto; existe también costo promedio de inventario.
- **Sin campo Imagen en producto** (no existe en el backend).
- **Borrado lógico** en todas las entidades.
- **Código de barras habilitable:** intención vigente, pero hoy la opción está deshabilitada en Configuración por falta de backend.
- **Impresión térmica (58 mm y 80 mm; Epson, XPrinter, GOOJPRT):** se mantiene como característica oficial planeada, **no implementada**. La landing no debe prometerla como disponible.
- **No prometer como disponible:** impresión térmica, reportes avanzados, facturación electrónica DIAN, impuestos/IVA. Máximo "Próximamente".

---

## 6. Brechas conocidas (backend)

- **Configuración extendida (requiere migración V7):** moneda y símbolo, código de barras on/off, logo, ancho y textos del recibo, notas internas. En la UI están visibles pero deshabilitados con badge "Pendiente".
- **Reportes avanzados:** requieren endpoints nuevos. Además se perdió el matiz de severidad del stock bajo (Bajo/Crítico); hoy solo Activo/Inactivo.
- **Enum `UnidadMedida`:** la lista del frontend (`UNIDAD, KILOGRAMO, GRAMO, LITRO, MILILITRO, CAJA, PAQUETE`) está hardcodeada y sin verificar contra el enum real.
- **`GET /api/categorias-producto/listar`** no filtra por empresa (se filtra en cliente). Existe `listar-por-empresa`; confirmar uso.
- **`formaPagoService` y `rolService`:** aún filtran por empresa en el cliente; los endpoints `listar-por-empresa` ya existen en el backend. Falta simplificar los servicios.
- **Auditoría de mappers MapStruct:** se corrigieron `CategoriaProductoMapper`, `FormaPagoMapper` y `RolMapper` (auto-mapeo accidental desde la entidad padre). Pendiente revisar `InventarioMapper` e `ImpuestoMapper`.
- **`pom.xml`:** orden corregido de `annotationProcessorPaths` (Lombok, `lombok-mapstruct-binding`, MapStruct). Requiere `mvn clean install` cuando aparezca `NoClassDefFoundError` por classpath viejo.
- **Warnings de MapStruct** (`Unmapped target properties`) en Impuesto, Rol, Empresa y FormaPago: solo advertencias.

---

## 7. Base de datos — resuelto

El backend no arrancaba por un `UnknownHostException` contra el host de PostgreSQL en Aiven. **Causa real: la instancia estaba apagada**, no eliminada. Se reactivó y el backend vuelve a arrancar con normalidad. No hubo pérdida de datos ni fue necesario recrear la base.

**Pendiente relacionado (§8):** sigue abierto mover credenciales de `application.yml` a variables de entorno (`DB_URL`, `DB_USER`, `DB_PASSWORD`) y rotar credenciales, como buena práctica de seguridad, no como requisito para destrabar el arranque.

**Alternativa local disponible:** PostgreSQL 16 en Docker.

---

## 8. Seguridad

- JWT en todos los endpoints salvo `/api/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**`.
- CORS configurado para `localhost:5173` y `localhost:5174`.
- [ ] Rotar credenciales de la base de datos.
- [ ] Mover `application.yml` a variables de entorno.
- [ ] Aislamiento por empresa revisado endpoint por endpoint (hubo casos sin filtro por empresa).

---

## 9. Diseño y marca (decisión del 21 de septiembre de 2026)

**Cambio de estilo confirmado:** toda la UI migra a **tema blanco**, con **negro como secundario** y **Inter como tipografía única**.

**Referencias:** Finyon (hero dividido, navbar en píldora), KeyGuard (bento grid, pestañas de producto, CTA en píldora), Spark Pixel (blanco hueso, etiquetas monoespaciadas, verde discreto para variaciones), PulseIQ (hero blanco, titular enorme, botón negro en píldora).

**Tokens base** (definidos en `src/styles.css`): `--paper: #fff`, `--ink: #000`, `--muted: #5c606a`, `--line: #e3e5e9`, `--surface: #f2f3f5`, `--brand: #6366f1`, `--font-sans` (Inter).

**Estado actual del estilo:**

- Landing (vista 1, hero): construida, corriendo y ajustada a detalle. Imagen del hero ya resuelta (`hero-illustration.png`).
- Landing (vista 2, Módulos): construida, corriendo y ajustada a detalle. Header centrado (3 íconos + título + subtítulo + botón "Un solo sistema"), diagrama con 4 nodos arriba y 2 abajo del mismo tamaño, conectados por curvas SVG animadas. Nav con scroll suave a anclas y logo que resetea el scroll si ya se está en `/`.
- App interna: **sigue en tema oscuro**, con **0 variables CSS**, 213 colores hex y 645 `rgba` hardcodeados. El tema oscuro de cada página son overrides bajo clases como `.cat`, `.prod`, `.inv`, `.posWrap`. La migración debe pasar por tokens.
- Marca inconsistente: login "PYMES ERP" vs sidebar "Contabilidad PYMES"; botones azules (POS, Configuración) vs violeta/índigo (login, logo). Pendiente unificar (US-02).
- **Logo: decidido (21 sep 2026), US-01 cerrada.** Diseño 1 — "Minimalista moderno" (ícono tipo P/flecha ascendente con bloque inferior), monocromo, sin degradados. Assets generados: `logo-black.png` (P negra sobre tarjeta blanca redondeada, margen transparente — para fondos claros) y `logo-white.png` (P blanca, fondo transparente — para fondos oscuros). Pendiente: reemplazar físicamente `src/assets/logo.png` y `public/favicon.png` en el repo con estos assets (AC3 de US-01).

**Componentes compartidos a migrar primero:** `DataTable`, `Modal`, `PageHeader`, `StatCard`, `SearchBar`, `StatusBadge`, `ConfirmDialog`, `PrimaryButton`, `SecondaryButton`, `LoadingState`.

---

## 10. Landing page

**Ubicación:** `frontend/src/landing/`, misma app, ruta `/`. Todo el CSS bajo el prefijo `.lp`.

**Orden de secciones (reemplaza la lista de 13 secciones original, decisión del 22 de septiembre de 2026):**

1. Navbar
2. Hero
3. **Soluciones** (antes llamada "Problema"; mismo contenido —cuadernos y Excel, inventario que no cuadra, cierres de caja con diferencias, dato de la Cámara de Comercio— pero encuadrado en positivo: "esto es lo que resolvemos", no un listado de quejas)
4. Módulos
5. Cómo funciona (Productos → Inventario → Venta → Caja y reportes; numeración válida aquí por ser secuencia real)
6. Tecnologías (reemplaza a "Equipo"; más útil mostrar el stack real — Java, Spring Boot, React, TypeScript — que el equipo, en un proyecto con vocación SaaS)
7. Contacto
8. Footer

**Descartado del plan original:**
- **Beneficios** ya no es sección aparte; su contenido se reparte entre Soluciones y Cómo funciona.
- **Equipo** como sección propia queda reemplazada por Tecnologías (ver arriba). El navbar pasa de `#equipo` a `#tecnologia`.

**Pendiente de decidir:** si "Capturas del sistema" y "Planes" entran en este orden final o se descartan igual que Beneficios/Equipo.

**Estado:**
- Vista 1 (Hero): completa y ajustada a detalle. Imagen resuelta.
- Vista 2 (Módulos): completa y ajustada a detalle (ver §9).
- Siguiente paso: **Soluciones**, luego **Cómo funciona**.

**Pendientes generales aún abiertos:** destino real de "Solicitar una demo" (`#contacto` no existe todavía), anclajes `#equipo`/`#contacto` sin sección de destino, decidir si se queda la línea de autoría del hero, borrar `HomePage.tsx` (sin uso).

**Reglas de contenido:** no inventar testimonios ni estadísticas; capturas con datos creíbles de un negocio real (sembrar antes de capturar; evitar Configuración por las etiquetas "Pendiente").

---

## 11. Roadmap

Alineado con `PYMES_ERP_Planeacion_Scrum.docx` (4 sprints, 22/09/2026 – 12/11/2026). El roadmap anterior a esa fecha no se toca; desde aquí, cada ítem enlaza a su historia de usuario (US-xx) para que ambos documentos no se desalineen.

> **El Sprint 1 es una guía, no un reglamento.** La landing es contenido nuevo que se está diseñando sobre la marcha (nombres de sección, orden, qué se descarta) — ver §10. Los puntos, nombres de historia y alcance de EPIC-02 se ajustan libremente a medida que el diseño avanza, sin necesidad de negociar el cambio como si fuera un desvío del plan.

**Hecho (antes del rediseño)**

- [x] Modelo de datos (22 entidades) y migraciones V1 a V6
- [x] API REST: 15 controllers, JWT con roles, multiempresa
- [x] Frontend 13/13 páginas contra API real
- [x] Ajustes de inventario con auditoría
- [x] Branding inicial: logo en sidebar, login y favicon (versión violeta/índigo, hoy en reemplazo — ver US-01)
- [x] Landing, vista 1 (navbar + hero)
- [x] Recuperar la base de datos (la instancia estaba apagada; reactivada sin pérdida de datos)

**Sprint 1 — Marca, Landing y ajustes de backend (22/09 – 04/10, 26 puntos, moldeable — ver nota arriba)**

*EPIC-01: Rediseño de marca*
- [x] **US-01 — Diseño del nuevo logo/ícono (3 pts).** Decidido: Diseño 1, monocromo. Assets `logo-black.png` / `logo-white.png` generados. Falta AC2/AC3: exportar a `favicon.png` y reemplazar `src/assets/logo.png` en el repo.
- [ ] **US-02 — Unificar nombre de marca en toda la app (2 pts).** Sidebar sigue diciendo "Contabilidad PYMES"; debe decir "PYMES ERP" en todas partes (sidebar, títulos de pestaña, footer).

*EPIC-02: Landing completa*
- [x] **US-03 — Sección de módulos (4 pts).** Cerrada. En vez de bento grid: header centrado (íconos + título + subtítulo) y diagrama con curvas SVG, 4 nodos arriba + 2 abajo, mismo tamaño.
- [ ] **US-04 — Cerrar pendientes de la vista 1 / hero (3 pts).** Imagen del hero ya resuelta. Falta: destino real de `#contacto` para "Solicitar una demo", anclaje `#equipo` (ahora `#tecnologia`, ver §10).
- [ ] **US-05 — Sección Soluciones (2 pts).** Antes "Problema"; ver §10 para el cambio de nombre y encuadre.
- [ ] **US-06 — Sección Cómo funciona (2 pts).**
- [ ] **US-07 — Sección Tecnologías (2 pts).** Antes cubría Beneficios/Para qué negocios; ese contenido se repartió en Soluciones y Cómo funciona (§10).
- [ ] **US-08 — Sección Capturas del sistema (3 pts).** Pendiente de decidir si entra (§10). Requiere sembrar datos creíbles antes de capturar.
- [ ] **US-09 — Contacto y Footer (3 pts).**

*EPIC-03: Ajustes de backend detectados en QA*
- [ ] **US-10 — Forma de pago al registrar una Compra (2 pts).**
- [ ] **US-11 — Configuración extendida de empresa (3 pts).** Requiere migración V7 (ver §6).
- [ ] **US-12 — Reportes avanzados: severidad de stock bajo (3 pts).**
- [ ] **US-13 — Impresión térmica de recibos (5 pts).**
- [ ] **US-14 — Reactivar categorías y simplificar servicios por empresa (3 pts).**

**Sprint 2 — Migración de color y mejora de diseño (05/10 – 17/10, 20 puntos)**
- [ ] US-15 — Definir tokens del tema blanco (3 pts)
- [ ] US-16 — Migrar componentes compartidos (6 pts)
- [ ] US-17 — Migrar páginas internas al tema blanco (7 pts)
- [ ] US-18 — Mejora general de diseño post-migración (4 pts)

**Sprint 3 — Despliegue en la nube (18/10 – 27/10, 14 puntos)**
- [ ] US-19 — Investigar y elegir plataforma de despliegue (2 pts)
- [ ] US-20 — Desplegar backend y base de datos en la nube (5 pts)
- [ ] US-21 — Desplegar el frontend en la nube (3 pts)
- [ ] US-22 — Renombrar el proyecto en la plataforma elegida (2 pts)

**Sprint 4 — Modelo predictivo de demanda (28/10 – 12/11, 16 puntos)**
- [ ] US-23 — Preparar datos históricos de ventas (3 pts)
- [ ] US-24 — Entrenar y validar el modelo (8 pts)
- [ ] US-25 — Exponer la predicción en el módulo de Inventario (5 pts)

**Pendientes fuera del alcance de los 4 sprints (heredados de la planeación técnica)**

- [ ] Pasar credenciales de `application.yml` a variables de entorno (relacionado con US-11/seguridad, ver §8)
- [ ] Prueba end-to-end de una venta real (stock, factura, caja, recibo)
- [ ] Decisiones abiertas de arquitectura: web vs. Electron, membresías/planes (§3)

**Documentación académica**

- [ ] Actualizar el Capítulo IV y las conclusiones del informe metodológico (dice "14 páginas", "LocalStorage" y desfase JPA/Flyway como pendiente; hoy es 13/13 contra API real)
- [ ] Resolver las inconsistencias del informe: MySQL vs PostgreSQL, web vs Electron, cronograma desactualizado

---

## 12. Reglas de trabajo

**Nuevas (22 de septiembre de 2026):**

1. **El Sprint 1 es moldeable.** Como la landing es contenido nuevo que se diseña sobre la marcha, el Sprint 1 (en especial EPIC-02) es una guía de referencia, no un reglamento fijo. Nombres de sección, orden, alcance y puntos de historia se ajustan libremente a medida que avanza el diseño — no hace falta tratarlo como una desviación del plan cada vez que cambia.
2. **Evitar comentarios en el código.** Para entregar un diseño limpio, no se agregan comentarios explicativos en el código (componentes, estilos, etc.) salvo que sean estrictamente necesarios para algo no evidente por sí mismo.

**Generales:**

- No cambiar la arquitectura ni las tecnologías sin acuerdo del equipo.
- Nada de refactorizaciones grandes salvo errores críticos.
- Construir módulo por módulo; terminar el anterior antes de abrir el siguiente.
- Reutilizar componentes; no duplicar.
- Antes de escribir un servicio, revisar el controller y los DTOs reales del backend (no asumir la forma de los datos).
- Al reentregar un archivo ya entregado, **reemplazarlo completo**, no fusionarlo a mano.
- Cada sesión se registra en `INICIO_FRONTEND.md`.

---

## 13. Equipo

John Sebastian Vega Gonzalez, Bryan Andres Tuñon Bermudez, Mahicol Hurtado Jimenez y Rowin Otalora Cano. Docente: Laura Beatriz Martinez Garcia. Fundación Universitaria Tecnológico Comfenalco, 2026.
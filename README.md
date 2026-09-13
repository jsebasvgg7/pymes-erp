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
Directory structure:
└── contabilidad-pymes/
    ├── README.md
    ├── ERP_PLAN.md
    ├── .directory
    ├── backend/
    │   ├── mvnw.cmd
    │   ├── pom.xml
    │   ├── src/
    │   │   ├── main/
    │   │   │   ├── java/
    │   │   │   │   └── com/
    │   │   │   │       └── rowin/
    │   │   │   │           └── contabilidad/
    │   │   │   │               ├── ContabilidadApplication.java
    │   │   │   │               ├── config/
    │   │   │   │               │   ├── CorsConfig.java
    │   │   │   │               │   ├── JpaAuditingConfig.java
    │   │   │   │               │   ├── JwtAuthenticationFilter.java
    │   │   │   │               │   ├── JwtTokenProvider.java
    │   │   │   │               │   ├── package-info.java
    │   │   │   │               │   └── SecurityConfig.java
    │   │   │   │               ├── controllers/
    │   │   │   │               │   ├── AuthController.java
    │   │   │   │               │   ├── CajaController.java
    │   │   │   │               │   ├── CategoriaProductoController.java
    │   │   │   │               │   ├── ClienteController.java
    │   │   │   │               │   ├── CompraController.java
    │   │   │   │               │   ├── DashboardController.java
    │   │   │   │               │   ├── EmpresaController.java
    │   │   │   │               │   ├── FacturaVentaController.java
    │   │   │   │               │   ├── FormaPagoController.java
    │   │   │   │               │   ├── ImpuestoController.java
    │   │   │   │               │   ├── package-info.java
    │   │   │   │               │   ├── ProductoController.java
    │   │   │   │               │   ├── ProveedorController.java
    │   │   │   │               │   ├── RolController.java
    │   │   │   │               │   └── UsuarioController.java
    │   │   │   │               ├── dto/
    │   │   │   │               │   ├── package-info.java
    │   │   │   │               │   ├── auth/
    │   │   │   │               │   │   ├── LoginRequest.java
    │   │   │   │               │   │   ├── LoginResponse.java
    │   │   │   │               │   │   └── RegisterRequest.java
    │   │   │   │               │   ├── caja/
    │   │   │   │               │   │   ├── CajaResumenResponse.java
    │   │   │   │               │   │   ├── MovimientoCajaRequest.java
    │   │   │   │               │   │   └── MovimientoCajaResponse.java
    │   │   │   │               │   ├── categoriaproducto/
    │   │   │   │               │   │   ├── CategoriaProductoCreateRequest.java
    │   │   │   │               │   │   ├── CategoriaProductoResponse.java
    │   │   │   │               │   │   └── CategoriaProductoUpdateRequest.java
    │   │   │   │               │   ├── cliente/
    │   │   │   │               │   │   ├── ClienteCreateRequest.java
    │   │   │   │               │   │   ├── ClienteResponse.java
    │   │   │   │               │   │   └── ClienteUpdateRequest.java
    │   │   │   │               │   ├── compra/
    │   │   │   │               │   │   ├── CompraCreateRequest.java
    │   │   │   │               │   │   ├── CompraResponse.java
    │   │   │   │               │   │   └── CompraUpdateRequest.java
    │   │   │   │               │   ├── detalle/
    │   │   │   │               │   │   ├── DetalleFacturaRequest.java
    │   │   │   │               │   │   └── DetalleFacturaResponse.java
    │   │   │   │               │   ├── detallecompra/
    │   │   │   │               │   │   ├── DetalleCompraRequest.java
    │   │   │   │               │   │   └── DetalleCompraResponse.java
    │   │   │   │               │   ├── empresa/
    │   │   │   │               │   │   ├── EmpresaCreateRequest.java
    │   │   │   │               │   │   ├── EmpresaResponse.java
    │   │   │   │               │   │   └── EmpresaUpdateRequest.java
    │   │   │   │               │   ├── factura/
    │   │   │   │               │   │   ├── FacturaVentaCreateRequest.java
    │   │   │   │               │   │   ├── FacturaVentaResponse.java
    │   │   │   │               │   │   └── FacturaVentaUpdateRequest.java
    │   │   │   │               │   ├── formapago/
    │   │   │   │               │   │   ├── FormaPagoCreateRequest.java
    │   │   │   │               │   │   ├── FormaPagoResponse.java
    │   │   │   │               │   │   └── FormaPagoUpdateRequest.java
    │   │   │   │               │   ├── impuesto/
    │   │   │   │               │   │   ├── ImpuestoCreateRequest.java
    │   │   │   │               │   │   ├── ImpuestoResponse.java
    │   │   │   │               │   │   └── ImpuestoUpdateRequest.java
    │   │   │   │               │   ├── producto/
    │   │   │   │               │   │   ├── ProductoCreateRequest.java
    │   │   │   │               │   │   ├── ProductoResponse.java
    │   │   │   │               │   │   └── ProductoUpdateRequest.java
    │   │   │   │               │   ├── proveedor/
    │   │   │   │               │   │   ├── ProveedorCreateRequest.java
    │   │   │   │               │   │   ├── ProveedorResponse.java
    │   │   │   │               │   │   └── ProveedorUpdateRequest.java
    │   │   │   │               │   ├── rol/
    │   │   │   │               │   │   ├── RolCreateRequest.java
    │   │   │   │               │   │   ├── RolResponse.java
    │   │   │   │               │   │   └── RolUpdateRequest.java
    │   │   │   │               │   └── usuario/
    │   │   │   │               │       ├── UsuarioCreateRequest.java
    │   │   │   │               │       ├── UsuarioResponse.java
    │   │   │   │               │       └── UsuarioUpdateRequest.java
    │   │   │   │               ├── entities/
    │   │   │   │               │   ├── BaseEntity.java
    │   │   │   │               │   ├── Caja.java
    │   │   │   │               │   ├── CategoriaProducto.java
    │   │   │   │               │   ├── Cliente.java
    │   │   │   │               │   ├── Compra.java
    │   │   │   │               │   ├── CompraEstado.java
    │   │   │   │               │   ├── CuentaPorCobrar.java
    │   │   │   │               │   ├── CuentaPorPagar.java
    │   │   │   │               │   ├── DetalleCompra.java
    │   │   │   │               │   ├── DetalleFactura.java
    │   │   │   │               │   ├── Empresa.java
    │   │   │   │               │   ├── EstadoCuenta.java
    │   │   │   │               │   ├── FacturaEstado.java
    │   │   │   │               │   ├── FacturaVenta.java
    │   │   │   │               │   ├── FormaPago.java
    │   │   │   │               │   ├── Impuesto.java
    │   │   │   │               │   ├── Inventario.java
    │   │   │   │               │   ├── MovimientoCaja.java
    │   │   │   │               │   ├── package-info.java
    │   │   │   │               │   ├── Producto.java
    │   │   │   │               │   ├── Proveedor.java
    │   │   │   │               │   ├── Rol.java
    │   │   │   │               │   ├── TipoFormaPago.java
    │   │   │   │               │   ├── TipoImpuesto.java
    │   │   │   │               │   ├── TipoMovimientoCaja.java
    │   │   │   │               │   ├── TipoReferenciaMovimientoCaja.java
    │   │   │   │               │   ├── UnidadMedida.java
    │   │   │   │               │   └── Usuario.java
    │   │   │   │               ├── exceptions/
    │   │   │   │               │   ├── ApiErrorResponse.java
    │   │   │   │               │   ├── GlobalExceptionHandler.java
    │   │   │   │               │   ├── package-info.java
    │   │   │   │               │   ├── ResourceNotFoundException.java
    │   │   │   │               │   └── ValidationErrorResponse.java
    │   │   │   │               ├── repositories/
    │   │   │   │               │   ├── CajaRepository.java
    │   │   │   │               │   ├── CategoriaProductoRepository.java
    │   │   │   │               │   ├── ClienteRepository.java
    │   │   │   │               │   ├── CompraRepository.java
    │   │   │   │               │   ├── DetalleCompraRepository.java
    │   │   │   │               │   ├── DetalleFacturaRepository.java
    │   │   │   │               │   ├── EmpresaRepository.java
    │   │   │   │               │   ├── FacturaVentaRepository.java
    │   │   │   │               │   ├── FormaPagoRepository.java
    │   │   │   │               │   ├── ImpuestoRepository.java
    │   │   │   │               │   ├── InventarioRepository.java
    │   │   │   │               │   ├── MovimientoCajaRepository.java
    │   │   │   │               │   ├── package-info.java
    │   │   │   │               │   ├── ProductoRepository.java
    │   │   │   │               │   ├── ProveedorRepository.java
    │   │   │   │               │   ├── RolRepository.java
    │   │   │   │               │   └── UsuarioRepository.java
    │   │   │   │               ├── security/
    │   │   │   │               │   ├── CustomUserDetailsService.java
    │   │   │   │               │   └── package-info.java
    │   │   │   │               ├── services/
    │   │   │   │               │   ├── AuthService.java
    │   │   │   │               │   ├── AuthServiceImpl.java
    │   │   │   │               │   ├── BaseCrudService.java
    │   │   │   │               │   ├── CajaService.java
    │   │   │   │               │   ├── CajaServiceImpl.java
    │   │   │   │               │   ├── CategoriaProductoService.java
    │   │   │   │               │   ├── CategoriaProductoServiceImpl.java
    │   │   │   │               │   ├── ClienteService.java
    │   │   │   │               │   ├── ClienteServiceImpl.java
    │   │   │   │               │   ├── CompraService.java
    │   │   │   │               │   ├── CompraServiceImpl.java
    │   │   │   │               │   ├── EmpresaService.java
    │   │   │   │               │   ├── EmpresaServiceImpl.java
    │   │   │   │               │   ├── FacturaVentaService.java
    │   │   │   │               │   ├── FacturaVentaServiceImpl.java
    │   │   │   │               │   ├── FormaPagoService.java
    │   │   │   │               │   ├── FormaPagoServiceImpl.java
    │   │   │   │               │   ├── ImpuestoService.java
    │   │   │   │               │   ├── ImpuestoServiceImpl.java
    │   │   │   │               │   ├── package-info.java
    │   │   │   │               │   ├── ProductoService.java
    │   │   │   │               │   ├── ProductoServiceImpl.java
    │   │   │   │               │   ├── ProveedorService.java
    │   │   │   │               │   ├── ProveedorServiceImpl.java
    │   │   │   │               │   ├── RolService.java
    │   │   │   │               │   ├── RolServiceImpl.java
    │   │   │   │               │   ├── UsuarioService.java
    │   │   │   │               │   └── UsuarioServiceImpl.java
    │   │   │   │               └── utils/
    │   │   │   │                   ├── package-info.java
    │   │   │   │                   └── mappers/
    │   │   │   │                       ├── CajaMapper.java
    │   │   │   │                       ├── CategoriaProductoMapper.java
    │   │   │   │                       ├── ClienteMapper.java
    │   │   │   │                       ├── CompraMapper.java
    │   │   │   │                       ├── EmpresaMapper.java
    │   │   │   │                       ├── FacturaVentaMapper.java
    │   │   │   │                       ├── FormaPagoMapper.java
    │   │   │   │                       ├── ImpuestoMapper.java
    │   │   │   │                       ├── ProductoMapper.java
    │   │   │   │                       ├── ProveedorMapper.java
    │   │   │   │                       ├── RolMapper.java
    │   │   │   │                       └── UsuarioMapper.java
    │   │   │   └── resources/
    │   │   │       ├── application.yml
    │   │   │       └── db/
    │   │   │           └── migration/
    │   │   │               ├── V1__initial_erp_schema.sql
    │   │   │               ├── V2__add_impuestos_y_cuentas.sql
    │   │   │               ├── V3__make_nullable_fields.sql
    │   │   │               ├── V4__rename_tasa_to_porcentaje.sql
    │   │   │               └── V5__rename_tipo_impuesto_to_tipo.sql
    │   │   └── test/
    │   │       └── java/
    │   │           └── com/
    │   │               └── rowin/
    │   │                   └── contabilidad/
    │   │                       └── ContabilidadApplicationTests.java
    │   └── .mvn/
    │       └── wrapper/
    │           └── .gitkeep
    └── frontend/
        ├── index.html
        ├── package.json
        ├── tsconfig.json
        ├── tsconfig.node.json
        ├── vite.config.ts
        └── src/
            ├── App.tsx
            ├── main.tsx
            ├── styles.css
            ├── vite-env.d.ts
            ├── assets/
            │   └── .gitkeep
            ├── components/
            │   ├── ConfirmDialog.css
            │   ├── ConfirmDialog.tsx
            │   ├── DataTable.css
            │   ├── DataTable.tsx
            │   ├── LoadingState.css
            │   ├── LoadingState.tsx
            │   ├── Modal.css
            │   ├── Modal.tsx
            │   ├── PageHeader.css
            │   ├── PageHeader.tsx
            │   ├── Placeholder.tsx
            │   ├── PrimaryButton.css
            │   ├── PrimaryButton.tsx
            │   ├── SearchBar.css
            │   ├── SearchBar.tsx
            │   ├── SecondaryButton.css
            │   ├── SecondaryButton.tsx
            │   ├── StatCard.css
            │   ├── StatCard.tsx
            │   ├── StatusBadge.css
            │   └── StatusBadge.tsx
            ├── context/
            │   └── AppContext.tsx
            ├── hooks/
            │   └── useAppContext.ts
            ├── layouts/
            │   ├── DashboardLayout.css
            │   ├── DashboardLayout.tsx
            │   └── MainLayout.tsx
            ├── pages/
            │   ├── CajaPage.css
            │   ├── CajaPage.tsx
            │   ├── CategoriasPage.css
            │   ├── CategoriasPage.tsx
            │   ├── ClientesPage.css
            │   ├── ClientesPage.tsx
            │   ├── ComprasPage.css
            │   ├── ComprasPage.tsx
            │   ├── ConfiguracionPage.css
            │   ├── ConfiguracionPage.tsx
            │   ├── DashboardPage.css
            │   ├── DashboardPage.tsx
            │   ├── HomePage.tsx
            │   ├── InventarioPage.css
            │   ├── InventarioPage.tsx
            │   ├── LoginPage.css
            │   ├── LoginPage.tsx
            │   ├── NotFoundPage.tsx
            │   ├── PosPage.css
            │   ├── PosPage.tsx
            │   ├── ProductosPage.css
            │   ├── ProductosPage.tsx
            │   ├── ProveedoresPage.css
            │   ├── ProveedoresPage.tsx
            │   ├── ReportesPage.css
            │   ├── ReportesPage.tsx
            │   ├── UsuariosPage.css
            │   └── UsuariosPage.tsx
            ├── routes/
            │   └── AppRouter.tsx
            └── services/
                ├── authService.ts
                ├── cajaService.ts
                ├── cashStorage.ts
                ├── CategoriaProductoService.ts
                ├── categoryStorage.ts
                ├── clienteService.ts
                ├── compraService.ts
                ├── dashboardService.ts
                ├── http.ts
                ├── ProductoService.ts
                ├── productStorage.ts
                ├── providerStorage.ts
                ├── purchaseStorage.ts
                ├── salesStorage.ts
                ├── settingsStorage.ts
                ├── userStorage.ts
                └── VentaService.ts
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

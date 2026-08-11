# ERP Plan — Contabilidad PYMES

## Proyecto

**Nombre provisional:** Contabilidad PYMES  
**Objetivo:** Desarrollar un ERP ligero con Punto de Venta (POS) para pequeños negocios, especialmente:

- Restaurantes
- Comidas rápidas
- Cafeterías
- Panaderías
- Tiendas
- Minimercados
- Negocios de barrio

El sistema debe ser **sencillo, rápido y profesional**.  
La prioridad del usuario es **vender**.  
La contabilidad debe **generarse automáticamente** a partir de las operaciones.

---

## Filosofía

- El sistema **no** debe sentirse como un software contable complejo.
- Debe sentirse como un software **fácil de usar**.
- Debe requerir **pocos clics**.
- Debe ser **intuitivo**.
- Debe funcionar tanto con **mouse** como con **pantalla táctil**.

---

## Módulos

1. Login
2. Dashboard
3. Clientes
4. Proveedores
5. Productos
6. Categorías
7. Inventario
8. Compras
9. Punto de Venta (POS)
10. Caja
11. Reportes
12. Configuración
13. Usuarios y Roles
14. Autenticación

---

## Productos

Cada producto podrá tener:

- Nombre
- Categoría
- Precio de compra
- Precio de venta
- Estado
- Imagen (opcional)

Campos opcionales:

- Código de barras (solo si la función está habilitada)
- Descripción corta

**Primera versión:** no usar IVA ni impuestos.

---

## Configuración

Existirá una opción:

- **Habilitar código de barras**

Si está desactivada:

- El sistema ocultará completamente esa funcionalidad.

---

## Punto de Venta (POS)

El POS será el **módulo principal**. Permitirá:

- Buscar productos
- Seleccionarlos
- Modificar cantidades
- Eliminar productos
- Aplicar descuentos (versión futura)
- Seleccionar método de pago
- Finalizar venta
- Imprimir recibo
- Registrar automáticamente la venta
- Actualizar caja
- Actualizar inventario

---

## Impresión

El sistema deberá prepararse para trabajar con **impresoras térmicas**.

Modelos comunes:

- Epson
- XPrinter
- GOOJPRT

Debe soportar:

- 58 mm
- 80 mm

La impresión será una **característica oficial** del proyecto.

---

## Inventario

- Los productos aparecerán automáticamente cuando sean creados.
- No se duplicará información.

---

## Compras

- Cada compra aumentará automáticamente el inventario.

---

## Ventas

Cada venta deberá:

- Actualizar inventario
- Registrar ingreso en caja
- Guardar la venta
- Permitir imprimir recibo

---

## Reportes

- Ventas del día
- Ventas del mes
- Productos más vendidos
- Ganancias
- Compras
- Caja
- Inventario

---

## Desarrollo

Mientras el backend no esté conectado:

- Toda la información podrá almacenarse temporalmente en **LocalStorage**.

Cuando el backend esté listo:

- Toda la persistencia pasará automáticamente a **Spring Boot + MySQL**.
- La interfaz **no deberá cambiar**.

---

## Reglas del proyecto

- No cambiar la arquitectura.
- No cambiar tecnologías.
- No hacer refactorizaciones grandes salvo errores críticos.
- Construir módulo por módulo.
- Priorizar reutilización de componentes.
- Mantener un diseño consistente.

---

## Objetivo final

Crear un ERP profesional que pueda venderse comercialmente y que sea fácil de usar para pequeños negocios.

## Público objetivo

Este sistema está diseñado principalmente para:

- Restaurantes
- Comidas rápidas
- Cafeterías
- Panaderías
- Tiendas de barrio
- Minimercados
- Papelerías
- Ferreterías pequeñas

El sistema debe adaptarse fácilmente a cualquier pequeño negocio que venda productos o servicios.

No está pensado inicialmente para grandes empresas ni para procesos contables avanzados.

## Flujo principal del sistema

Todo el ERP girará alrededor del siguiente flujo:

```text
Productos
↓
Inventario
↓
Punto de Venta (POS)
↓
Caja
↓
Reportes
```

La información nunca deberá duplicarse.  
Cada módulo reutilizará la información del anterior.

## Flujo de una venta

El proceso de venta será:

1. Abrir el Punto de Venta.
2. Buscar productos.
3. Agregar productos al pedido.
4. Modificar cantidades.
5. Seleccionar método de pago.
6. Finalizar venta.

Al finalizar la venta el sistema deberá automáticamente:

- Registrar la venta.
- Actualizar el inventario.
- Registrar el ingreso en caja.
- Generar el recibo.
- Permitir imprimir el recibo.

Todo esto deberá ocurrir sin intervención adicional del usuario.

## Métodos de pago

La primera versión deberá soportar:

- Efectivo
- Tarjeta
- Nequi
- Daviplata
- Transferencia

En una versión futura podrá existir pago mixto.

## Caja

La caja permitirá:

- Apertura de caja
- Cierre de caja
- Registrar ingresos
- Registrar egresos
- Consultar movimientos
- Consultar total vendido
- Consultar efectivo esperado

## Impresión

La impresión será una característica oficial del sistema.

El ERP deberá quedar preparado para trabajar con impresoras térmicas.

Modelos comunes:

- Epson
- XPrinter
- GOOJPRT

Anchos soportados:

- 58 mm
- 80 mm

En futuras versiones podrá imprimir automáticamente comandas para cocina.


## Datos durante el desarrollo

Mientras no exista conexión con el backend:

Toda la información será almacenada en LocalStorage.

Esto permitirá que:

- Productos creados aparezcan automáticamente en Inventario.

- Los productos puedan venderse desde el POS.

- Las ventas actualicen Caja.

- Los reportes usen la información almacenada localmente.

Cuando Spring Boot y MySQL sean conectados, únicamente cambiará el origen de los datos.  
La interfaz y la experiencia del usuario no deberán cambiar.

## Roadmap del proyecto

Estado actual:

- ✅ Login
- ✅ Dashboard
- ✅ Clientes
- ✅ Proveedores
- ⬜ Productos
- ⬜ Categorías
- ⬜ Inventario
- ⬜ Compras
- ⬜ Punto de Venta (POS)
- ⬜ Caja
- ⬜ Reportes
- ⬜ Configuración
- ⬜ Usuarios
- ⬜ Roles
- ⬜ Autenticación
- ⬜ Integración Backend
- ⬜ Base de Datos
- ⬜ Impresoras térmicas
- ⬜ Versión Comercial

## Principios del proyecto

Todo módulo nuevo deberá cumplir las siguientes reglas:

- Debe verse profesional.
- Debe ser moderno.
- Debe ser responsive.

- Debe ser intuitivo.

- Debe requerir pocos clics.

- Debe reutilizar componentes existentes.

- No se crearán componentes duplicados.

- No se realizarán refactorizaciones innecesarias.

- No se cambiará la arquitectura definida.

- Antes de crear un módulo nuevo, deberá estar completamente terminado el anterior.

- La calidad es más importante que la velocidad de desarrollo.

## Visión del producto

Este proyecto no busca ser únicamente un software de contabilidad.

Su objetivo es convertirse en un ERP ligero con Punto de Venta (POS), inventario, compras, caja y reportes para pequeños negocios.

La prioridad siempre será facilitar el trabajo diario del usuario.

La contabilidad deberá generarse automáticamente a partir de las operaciones realizadas.

Toda decisión futura deberá respetar esta visión.

## Arquitectura oficial del proyecto

El ERP será distribuido como una aplicación de escritorio.

Tecnología:

- React
- Electron

La aplicación requerirá conexión permanente a Internet.

No existirá modo offline.

Toda la información será almacenada en el servidor mediante Spring Boot y MySQL.

La autenticación será obligatoria.

Cada empresa tendrá su propia cuenta y su propia información.

El sistema funcionará bajo un modelo SaaS (Software as a Service).

Los usuarios descargarán el instalador oficial, iniciarán sesión y accederán únicamente si su membresía se encuentra activa.
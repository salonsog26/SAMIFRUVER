# 💻 Frontend (Interfaz de Usuario)

Este directorio contiene el código fuente de la aplicación del lado del cliente para **SAMIFRUBER**.


## Responsive (móvil)

- Breakpoints: 1024, 900, 768 y 380 px (`src/styles/variables.css`).
- En ≤900 px el menú lateral es un drawer (botón hamburguesa en `BarraMovil`; se cierra con Escape, fondo o al navegar).
- En ≤768 px las tablas de productos se muestran como tarjetas.
- Inputs a 16 px (evita el zoom de iOS).
- El formulario de producto incluye el campo "Foto del producto" (JPG/PNG/WEBP, ≤2 MB, ≥300x300), obligatorio.
- Tests: `npm test` (102).

## Épica 3 · Pedidos

Rutas de cliente: `/carrito`, `/pedido-creado/:id`, `/pedidos` (historial) y `/pedidos/:id` (seguimiento y cancelación). El carrito se guarda en `localStorage` por cliente. Dirección y pago son simulados (Visa ···· 4242 / Mercado Pago, sin cobro real) y el mapa del repartidor es ilustrativo. Estilos en `src/styles/pedidos.css`.
Tests: `npm test` (102).

# 🗄️ Base de Datos

Esta carpeta contiene todo lo relacionado con el modelo de datos de **SAMIFRUBER** para garantizar el correcto almacenamiento del inventario y los pedidos.


## Épica 3 · Pedidos

`01_schema.sql` agrega las tablas `pedidos` y `pedido_items` (el pedido guarda una copia de dirección, precios y nombres, así el historial no cambia si luego se edita el producto).

- **Bases ya creadas (local, Supabase, Neon):** vuelve a correr `npm run db:init` desde `src/backend`; usa `CREATE TABLE IF NOT EXISTS`, no borra datos existentes.
- Estados: `recibido → preparacion → en_camino → entregado`, o `cancelado`.
- Al crear un pedido se descuenta el stock en una transacción; al cancelar se restituye.

## Épica 4 · Pagos

- `01_schema.sql` agrega la tabla `metodos_pago` (tarjetas guardadas del cliente: **solo marca, últimos 4 dígitos, titular y vencimiento; nunca el número completo ni el CVV**) y, en `pedidos`, las columnas `pago_estado` (`pendiente`, `aprobado`, `devolucion_en_proceso`, `devuelto`, `anulado`), `pago_referencia` (TX-…), `pagado_en`, `metodo_pago_id`, `devolucion_ref` (DEV-…) y `devuelto_en`. `metodo_pago` ahora es `tarjeta` o `efectivo` (Mercado Pago ya no existe).
- `03_e4_migracion.sql` actualiza una base que **ya tenía la Épica 3** (agrega las columnas, cambia los checks y marca los pedidos viejos como pagados). Es idempotente y `npm run db:init` la ejecuta sola después de `01_schema.sql`. Si prefieres hacerlo a mano en Supabase/Neon, pega primero `01_schema.sql` y luego `03_e4_migracion.sql` en el editor SQL.


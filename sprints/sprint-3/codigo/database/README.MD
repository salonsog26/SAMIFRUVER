# 🗄️ Base de Datos

Esta carpeta contiene todo lo relacionado con el modelo de datos de **SAMIFRUBER** para garantizar el correcto almacenamiento del inventario y los pedidos.


## Épica 3 · Pedidos

`01_schema.sql` agrega las tablas `pedidos` y `pedido_items` (el pedido guarda una copia de dirección, precios y nombres, así el historial no cambia si luego se edita el producto).

- **Bases ya creadas (local, Supabase, Neon):** vuelve a correr `npm run db:init` desde `src/backend`; usa `CREATE TABLE IF NOT EXISTS`, no borra datos existentes.
- Estados: `recibido → preparacion → en_camino → entregado`, o `cancelado`.
- Al crear un pedido se descuenta el stock en una transacción; al cancelar se restituye.

# ⚙️ Backend (Lógica del Servidor)

Este directorio contiene la lógica de negocio, la API y la conexión a la base de datos de **SAMIFRUBER**.


## Base de datos (PostgreSQL)

El backend usa PostgreSQL. Los scripts SQL viven en `database/` (en la raíz del repo, fuera de `src`); ver `database/README.md`.

```bash
cd src/backend
cp .env.example .env        # editar DATABASE_URL
npm install
npm run db:init             # crea tablas + datos demo (admin@samifruver.com / admin123)
npm run db:migrar-json      # opcional: importa data/*.json (hashea contraseñas)
npm run dev
```

Variables: `DATABASE_URL`, `DATABASE_SSL=true` (Neon/Render/Supabase), `CORS_ORIGIN`, `PORT`.
Contraseñas con scrypt. `GET /api/health` confirma la conexión. Tests: `npm test` (132 con la Épica 3, usan pg-mem, no requieren Postgres).

## Pedidos (Épica 3)

Rutas bajo `/api/pedidos` (el cliente se identifica con el header `X-Cliente-Id`; **identificación de demostración, no es autenticación real**):

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/pedidos` | Crea el pedido (E3-HU2). 409 si no hay stock suficiente |
| GET | `/api/pedidos` | Historial del cliente (E3-HU3) |
| GET | `/api/pedidos/:id` | Seguimiento (E3-HU1) |
| POST | `/api/pedidos/:id/cancelar` | Cancela y restituye stock (E3-HU4); 409 si ya va en camino/entregado |
| PATCH | `/api/pedidos/:id/estado` | Avanza el estado; requiere header `X-Admin-Key` = `ADMIN_KEY` |

Variables nuevas: `ADMIN_KEY` (defínela también en Render; si no existe, el endpoint de avance responde 403).

Para avanzar un pedido en una demo:

```bash
npm run pedido:avanzar -- SF-1003          # un paso (recibido → preparación → en camino → entregado)
npm run pedido:avanzar -- SF-1003 --todo   # hasta entregado
```

Pruebas: `npm test` (132). Las de rollback y concurrencia corren solo contra PostgreSQL real:
`TEST_DATABASE_URL=postgresql://usuario:clave@localhost:5432/samifruver_test npm test`.

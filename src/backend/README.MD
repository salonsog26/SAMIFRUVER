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

## Pagos (Épica 4)

El pago es **simulado** (no se cobra nada real): `lib/pasarela.js` aprueba cualquier tarjeta válida y rechaza la que termina en `0002` (así se puede demostrar el pago rechazado, p. ej. `4000 0000 0000 0002`; la tarjeta `4242 4242 4242 4242` se aprueba). Cambiar a una pasarela real solo implica reemplazar la función `cobrar`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/metodos-pago` | Tarjetas guardadas del cliente (E4-HU3) |
| POST | `/api/metodos-pago` | Guarda una tarjeta `{titular, numero, vencimiento:"MM/AA", cvv, predeterminada}`. Valida Luhn, marca (Visa/Mastercard), vencimiento y CVV; solo se guardan los 4 últimos dígitos. 400 con `errores` por campo |
| DELETE | `/api/metodos-pago/:id` | Elimina una tarjeta propia (si era la predeterminada, otra pasa a serlo) |
| POST | `/api/pedidos` | Ahora recibe `metodoPago: "tarjeta" \| "efectivo"` y, con tarjeta, `metodoPagoId`. Tarjeta aprobada → pago `aprobado`; efectivo → `pendiente`; **rechazada → 402**, no se crea el pedido ni se descuenta stock (E4-HU1) |
| GET | `/api/pedidos/:id` | Trae `pago`: `{estado, etiqueta, metodo, detalle, total, referencia, pagadoEn, devolucion}` (E4-HU2) |
| POST | `/api/pedidos/:id/cancelar` | Con tarjeta pasa el pago a `devolucion_en_proceso` (ref. DEV-…); en efectivo queda `anulado` ("Sin cobro") |
| PATCH | `/api/pedidos/:id/devolucion` | Confirma el reintegro → `devuelto`; requiere `X-Admin-Key` |

Reglas: el pago en efectivo pasa a `aprobado` cuando el pedido se marca `entregado`. Para la demo del reintegro:

```bash
npm run pedido:devolver -- SF-1003      # "Devolución en proceso" → "Devuelto"
```

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

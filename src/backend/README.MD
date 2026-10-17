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
Contraseñas con scrypt. `GET /api/health` confirma la conexión. Tests: `npm test` (83, usan pg-mem, no requieren Postgres).

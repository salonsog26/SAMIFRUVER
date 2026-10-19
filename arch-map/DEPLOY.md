# Despliegue en línea (Netlify)

El mapa se publica como sitio estático en Netlify, el mismo servicio que ya usa el frontend de SAMIFRUVER. Vive **dentro del repositorio** en la carpeta `arch-map/`, así cada `git push` a `main` vuelve a construirlo y sus datos de actividad salen del historial real del repo.

## 1. Subir la carpeta al repositorio

Desde la raíz de tu copia local de SAMIFRUVER:

```bash
# descomprime arch-map.zip aquí, de modo que quede SAMIFRUVER/arch-map/
cd arch-map
npm install
npm run build        # prueba local: debe decir "[sync-repo] fuente: git"
npm run preview      # abre http://localhost:4173
cd ..

git add arch-map
git commit -m "Agrega mapa interactivo de arquitectura"
git push origin main
```

`node_modules/`, `dist/` y `public/repo-status.json` ya están en `arch-map/.gitignore`.

## 2. Crear el sitio en Netlify (una sola vez)

Lo hace alguien con acceso al repo `salonsog26/SAMIFRUVER` en GitHub.

1. Netlify → **Add new site** → **Import an existing project** → **GitHub** → elegir `SAMIFRUVER`.
2. **Branch to deploy:** `main`.
3. **Base directory:** `arch-map`.
4. Build command y publish directory se leen solos de `arch-map/netlify.toml` (`npm run build` → `dist`). Si el formulario los muestra, deben quedar así.
5. **Deploy**. Opcional: *Site configuration → Change site name* (por ejemplo `samifruver-mapa` → `samifruver-mapa.netlify.app`).

### Variable opcional

| Variable | Cuándo hace falta |
|---|---|
| `GITHUB_TOKEN` | Solo si el log del build muestra `fuente: github-api` y un error 403 (límite de 60 peticiones/hora de la API pública). Crea un *fine-grained token* de solo lectura (Contents + Metadata) para el repo y agrégalo en *Site configuration → Environment variables*. |

Lo normal es que no se necesite: el script lee el historial con `git` dentro del propio build.

## 3. Qué se actualiza solo y qué no

Cada push a `main` dispara un build (`netlify.toml` tiene `ignore = "exit 1"` para que ningún push se salte) y `scripts/sync-repo.mjs` regenera `repo-status.json`:

| Se actualiza solo en cada push | Requiere editar `src/data/architecture.json` |
|---|---|
| Último cambio de cada módulo (fecha, autor, commit) | Módulos nuevos y sus descripciones |
| Punto verde en módulos con cambios en los últimos 7 días | Conexiones (`edges`) |
| Aviso de módulos cuya carpeta se borró o renombró | Responsables y estado (`implementado` / `planeado`) |
| Aviso de carpetas nuevas que aún no están en el mapa | Apodos y saludos del equipo (`meta.team`) |

Las descripciones las escribe una persona: el script no inventa texto, solo detecta que algo cambió y lo señala en el panel "Estado del repositorio".

### Cuando aparece un aviso

- **Carpeta nueva** (p. ej. `src/backend/middlewares`): agrega un nodo en `architecture.json` con su `githubLink`, o súmala a `meta.sync.ignore` si no merece estar en el mapa.
- **Carpeta inexistente**: corrige el `githubLink` del módulo (probablemente se renombró) o elimina el nodo y sus `edges`.

Las carpetas vigiladas se configuran en `meta.sync.watch`.

## Si el build falla en Netlify

- **Versión de Node:** Vite 8 necesita Node ≥ 20.19. `netlify.toml` fija `NODE_VERSION = "22"`.
- **El script de sincronización nunca rompe el build**: si no puede leer el repo, publica el mapa sin datos de actividad y lo indica en el panel.

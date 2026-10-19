# SAMIFRUVER · Mapa Interactivo de Arquitectura

Mapa navegable de la arquitectura de [SAMIFRUVER](https://github.com/salonsog26/SAMIFRUVER) construido con React, Vite, Tailwind CSS y React Flow (`@xyflow/react`).

- **Selección de usuario al entrar**, con saludo personalizado (apodos en `meta.team`). Los módulos a cargo de esa persona se marcan con "Tú". Se recuerda mientras la pestaña esté abierta. El botón ⇄ de la barra superior cambia de usuario.
- **Funciona en celular y tablet:** en celular el detalle sube como hoja inferior, en tablet entra como cajón lateral y en escritorio queda fijo a la derecha. El botón ⓘ abre el resumen en pantallas pequeñas.
- Módulos arrastrables, agrupados por capa (Negocio, Frontend, Backend, Datos, Calidad).
- Sidebar derecho con el detalle del módulo, su responsable, su último cambio en el repo y sus conexiones (clic para saltar al módulo vecino).
- Toggle **Vista No-Técnica / Vista Técnica**: cambia la descripción (`description` ↔ `techDesc`), las etiquetas de las flechas y muestra la ruta, el commit y el enlace a GitHub.
- **Sincronización con el repositorio** en cada `dev` y `build`: último commit por módulo, avisos de carpetas nuevas sin mapear y de carpetas borradas.

## Uso local

```bash
npm install
npm run dev        # corre primero scripts/sync-repo.mjs
```

Comandos:

| Comando | Qué hace |
|---|---|
| `npm run dev` | Sincroniza y abre el servidor de desarrollo |
| `npm run build` | Sincroniza y genera `dist/` para producción |
| `npm run preview` | Sirve `dist/` localmente |
| `npm run sync` | Solo regenera `public/repo-status.json` |

La sincronización usa el historial de git si este proyecto está dentro del repo SAMIFRUVER (carpeta `arch-map/`). Fuera de él, consulta la API pública de GitHub. Para apuntar a otra copia local: `REPO_DIR=/ruta/a/SAMIFRUVER npm run sync`.

## Despliegue

Ver **[DEPLOY.md](./DEPLOY.md)**: Netlify, con la carpeta `arch-map/` dentro del repo. Cada push a `main` reconstruye el mapa.

## Estructura

```
arch-map/
├── netlify.toml                 ← configuración de despliegue
├── scripts/sync-repo.mjs        ← lee el repo → public/repo-status.json
└── src/
    ├── App.jsx                  ← selección de usuario + mapa
    ├── data/architecture.json   ← nodos, edges, lanes, equipo y config de sync
    ├── context/MapContext.js
    ├── lib/
    │   ├── buildGraph.js        ← JSON → nodos/edges de React Flow
    │   ├── repoStatus.js        ← carga del estado del repo y fechas relativas
    │   ├── team.js              ← saludos, apodos, avatar, sesión
    │   ├── useMediaQuery.js     ← celular / tablet / escritorio
    │   └── theme.js             ← colores por capa y estilos de relación
    └── components/
        ├── UserGate.jsx         ← pantalla "¿Quién eres?" y bienvenida
        ├── TopBar.jsx
        ├── ModuleNode.jsx
        ├── LaneNode.jsx
        └── Sidebar.jsx
```

## Editar el mapa

Todo sale de `src/data/architecture.json`.

**Nodos:**

| Campo | Uso |
|---|---|
| `id`, `label` | Identificador y nombre del módulo |
| `description` / `techDesc` | Texto para la vista no técnica / técnica |
| `type` | `business` o `technical` |
| `owner`, `ownerRole` | Responsable (debe coincidir con un `name` de `meta.team` para el "Tú") |
| `githubLink` | Carpeta en GitHub; el sync la usa para buscar su último commit |
| `status` | `implementado` o `planeado` |
| `layer` | `negocio`, `frontend`, `backend`, `datos` o `calidad` |
| `path`, `position` | Ruta mostrada y posición inicial `{ x, y }` |

**Edges:** `kind` (`flujo`, `implementa`, `dependencia`, `api`, `prueba`), `label` (no técnica) y `techLabel` (técnica).

**Equipo (`meta.team`):** `nickname` es opcional (si falta se usa el primer nombre) y `greeting` es `Bienvenido` o `Bienvenida`.

**Sync (`meta.sync`):** `watch` lista las carpetas cuyas subcarpetas deben estar en el mapa. `ignore` lista las que no se reportan.

> Los responsables por módulo son una propuesta por rol: el README del repositorio lista el equipo pero no asigna módulos a personas.

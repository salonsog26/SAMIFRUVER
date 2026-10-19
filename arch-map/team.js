{
  "meta": {
    "project": "SAMIFRUVER",
    "summary": "Plataforma digital para comerciantes de plazas de mercado y galerías: catálogo de productos, pedidos, pagos en línea y recogida o domicilio.",
    "repo": "https://github.com/salonsog26/SAMIFRUVER",
    "branch": "main",
    "stack": {
      "Frontend": ["React 18", "Vite 5", "React Router 6", "lucide-react", "Vitest + Testing Library"],
      "Backend": ["Node.js", "Express 4", "pg (node-postgres)", "dotenv", "cors", "Vitest + Supertest + pg-mem"],
      "Base de datos": ["PostgreSQL"],
      "Despliegue": ["Netlify (frontend, public/_redirects)"]
    },
    "team": [
      { "id": "lesber",  "name": "Lesber Estanga Montezuma", "role": "Analista",        "nickname": "Les",      "greeting": "Bienvenido" },
      { "id": "diana",   "name": "Diana Velasco Lasso",      "role": "Desarrollador 1", "nickname": null,       "greeting": "Bienvenida" },
      { "id": "samuel",  "name": "Samuel Guevara Morales",   "role": "Desarrollador 2", "nickname": null,       "greeting": "Bienvenido" },
      { "id": "david",   "name": "David Lopez Gomez",        "role": "Tester 1",        "nickname": null,       "greeting": "Bienvenido" },
      { "id": "nicolle", "name": "Nicolle Castro Cardozo",   "role": "Tester 2",        "nickname": "Micolita", "greeting": "Bienvenida" }
    ],
    "ownershipNote": "El README lista roles, no asigna módulos a personas. Los responsables de este mapa son una propuesta por rol: épicas → Analista, frontend → Desarrollador 1, backend y datos → Desarrollador 2, pruebas → Testers.",
    "sync": {
      "watch": [".", "src", "src/frontend/src", "src/frontend/src/pages", "src/backend"],
      "ignore": [
        ".vscode", ".github", "arch-map", "src/backend/data",
        "src/frontend/src/assets", "src/frontend/src/styles", "src/frontend/src/tests"
      ]
    }
  },

  "lanes": [
    { "id": "lane-negocio",  "label": "Negocio · Épicas",          "y": 0,    "height": 210, "color": "amber" },
    { "id": "lane-frontend", "label": "Frontend · React + Vite",   "y": 250,  "height": 360, "color": "sky" },
    { "id": "lane-backend",  "label": "Backend · Express API",     "y": 650,  "height": 200, "color": "violet" },
    { "id": "lane-datos",    "label": "Datos · PostgreSQL",        "y": 890,  "height": 200, "color": "emerald" },
    { "id": "lane-calidad",  "label": "Calidad y documentación",   "y": 1130, "height": 200, "color": "slate" }
  ],

  "nodes": [
    {
      "id": "epic-usuario",
      "label": "Gestión de Usuario",
      "type": "business",
      "status": "implementado",
      "layer": "negocio",
      "path": "README.md › Épica 2",
      "description": "Permite que un cliente nuevo se registre, inicie sesión y mantenga actualizados los datos de su perfil. Es la puerta de entrada a la plataforma.",
      "techDesc": "Épica E2. Implementada en las páginas públicas Registro.jsx, Login.jsx y Perfil.jsx, que consumen POST /api/clientes/registro, POST /api/auth/login y GET/PUT /api/clientes/:id. Las contraseñas se guardan con scrypt (lib/passwords.js). Tiene carpeta de pruebas funcionales en tests/PruebasFuncionales/E2-GestionUsuario.",
      "owner": "Lesber Estanga Montezuma",
      "ownerRole": "Analista",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER#2-gestión-de-usuario",
      "position": { "x": 40, "y": 70 }
    },
    {
      "id": "epic-inventario",
      "label": "Gestión de Inventario",
      "type": "business",
      "status": "implementado",
      "layer": "negocio",
      "path": "README.md › Épica 1",
      "description": "El comerciante registra, edita y consulta sus productos (jengibre, pimentón, champiñones…) y el cliente ve qué hay disponible antes de comprar.",
      "techDesc": "Épica E1. CRUD completo de productos: páginas admin ConsultarProductos, RegistrarProducto y EditarProducto (vía ProductosContext) + catálogo público. Endpoints GET/POST/PUT/DELETE /api/productos. Validación de nombre, precio, stock, unidad y foto (JPG/PNG/WEBP ≤2 MB) en cliente y servidor.",
      "owner": "Lesber Estanga Montezuma",
      "ownerRole": "Analista",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER#1-gestión-de-inventario",
      "position": { "x": 360, "y": 70 }
    },
    {
      "id": "epic-pedidos",
      "label": "Gestión de Pedidos",
      "type": "business",
      "status": "planeado",
      "layer": "negocio",
      "path": "README.md › Épica 3",
      "description": "El cliente arma su pedido y consulta su historial; el comerciante recibe y gestiona los pedidos que llegan.",
      "techDesc": "Épica E3. Aún sin código: no existen tablas de pedidos en database/01_schema.sql ni rutas /api/pedidos. Solo hay una carpeta de pruebas funcionales (tests/PruebasFuncionales/E3-GestiónPedidos) con un Readme.",
      "owner": "Lesber Estanga Montezuma",
      "ownerRole": "Analista",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER#3-gestión-de-pedidos",
      "position": { "x": 680, "y": 70 }
    },
    {
      "id": "epic-pagos",
      "label": "Gestión de Pagos",
      "type": "business",
      "status": "planeado",
      "layer": "negocio",
      "path": "README.md › Épica 4",
      "description": "Cobra de forma segura los pedidos en línea y permite saber si un pago fue aprobado, rechazado o está pendiente.",
      "techDesc": "Épica E4. Sin implementación en el repositorio. Requerirá una pasarela de pago, una tabla de pagos ligada a pedidos y endpoints de consulta de estado.",
      "owner": "Lesber Estanga Montezuma",
      "ownerRole": "Analista",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER#4-gestión-de-pagos",
      "position": { "x": 1000, "y": 70 }
    },
    {
      "id": "epic-despacho",
      "label": "Gestión de Despacho",
      "type": "business",
      "status": "planeado",
      "layer": "negocio",
      "path": "README.md › Épica 6",
      "description": "Herramienta interna del comerciante: ver los pedidos listos para salir, asignarle un domiciliario a cada uno y despacharlos.",
      "techDesc": "Épica E6. Sin implementación. Dependerá de pedidos (E3) y de un modelo de domiciliarios; probablemente un nuevo grupo de páginas en pages/admin.",
      "owner": "Lesber Estanga Montezuma",
      "ownerRole": "Analista",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER#6-gestión-de-despacho",
      "position": { "x": 1320, "y": 70 }
    },
    {
      "id": "epic-domicilios",
      "label": "Gestión de Domicilios",
      "type": "business",
      "status": "planeado",
      "layer": "negocio",
      "path": "README.md › Épica 5",
      "description": "Pensado para el repartidor: ve los pedidos que le asignaron, los datos de entrega y va marcando en qué estado está cada domicilio.",
      "techDesc": "Épica E5. Sin implementación. Implica un tercer rol (domiciliario) además de admin y cliente, por lo que RutaProtegida y el login deberán soportarlo.",
      "owner": "Lesber Estanga Montezuma",
      "ownerRole": "Analista",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER#5-gestión-de-domicilios",
      "position": { "x": 1640, "y": 70 }
    },

    {
      "id": "fe-router",
      "label": "Enrutador y acceso",
      "type": "technical",
      "status": "implementado",
      "layer": "frontend",
      "path": "src/frontend/src/routes",
      "description": "Decide qué pantalla ve cada persona según la dirección y su rol: el público ve el catálogo, el cliente su perfil y el administrador el panel de productos.",
      "techDesc": "AppRouter.jsx define las rutas con react-router-dom 6 (/, /login, /registro, /perfil, /admin/productos…). RutaProtegida.jsx envuelve las rutas privadas y exige rolRequerido=\"cliente\" o \"admin\"; /admin/dashboard redirige a /admin/productos.",
      "owner": "Diana Velasco Lasso",
      "ownerRole": "Desarrollador 1",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/src/frontend/src/routes",
      "position": { "x": 40, "y": 320 }
    },
    {
      "id": "fe-public",
      "label": "Páginas públicas y cliente",
      "type": "technical",
      "status": "implementado",
      "layer": "frontend",
      "path": "src/frontend/src/pages/public",
      "description": "Las pantallas que ve el comprador: el catálogo de productos, el inicio de sesión, el registro y su perfil.",
      "techDesc": "CatalogoPublico.jsx (fetch GET /api/productos), Login.jsx, Registro.jsx (POST /api/clientes/registro) y Perfil.jsx (GET/PUT /api/clientes/:id). Usan componentes de components/public y components/forms.",
      "owner": "Diana Velasco Lasso",
      "ownerRole": "Desarrollador 1",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/src/frontend/src/pages/public",
      "position": { "x": 360, "y": 320 }
    },
    {
      "id": "fe-admin",
      "label": "Panel de administración",
      "type": "technical",
      "status": "implementado",
      "layer": "frontend",
      "path": "src/frontend/src/pages/admin",
      "description": "Donde el comerciante administra su inventario: ve la lista de productos, crea nuevos y edita los existentes.",
      "techDesc": "ConsultarProductos.jsx, RegistrarProducto.jsx y EditarProducto.jsx. Toda la lectura/escritura pasa por useProductos() del ProductosContext. Layout con components/admin (Sidebar, BarraMovil, ProductTable).",
      "owner": "Diana Velasco Lasso",
      "ownerRole": "Desarrollador 1",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/src/frontend/src/pages/admin",
      "position": { "x": 680, "y": 320 }
    },
    {
      "id": "fe-components",
      "label": "Componentes de interfaz",
      "type": "technical",
      "status": "implementado",
      "layer": "frontend",
      "path": "src/frontend/src/components",
      "description": "Las piezas visuales reutilizables: botones, alertas, tarjetas de producto, formularios y menús.",
      "techDesc": "Cuatro subcarpetas: ui/ (Button, Alert, Badge, Modal, InlineAlert), forms/ (AuthForm, AuthInput, ProductForm), public/ (Navbar, ProductCard, Footer, ClienteSidebar…) y admin/ (Sidebar, ProductTable, ContentHeader, BarraMovil). Responsive con breakpoints de styles/variables.css.",
      "owner": "Diana Velasco Lasso",
      "ownerRole": "Desarrollador 1",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/src/frontend/src/components",
      "position": { "x": 1000, "y": 320 }
    },
    {
      "id": "fe-utils",
      "label": "Sesión y utilidades",
      "type": "technical",
      "status": "implementado",
      "layer": "frontend",
      "path": "src/frontend/src/utils",
      "description": "Recuerda quién inició sesión y revisa que los datos de los formularios estén bien escritos antes de enviarlos.",
      "techDesc": "auth.js: login() contra POST /api/auth/login y sesión en localStorage (clave samifruber_sesion). config.js: API_URL desde VITE_API_URL (por defecto http://localhost:4000). También validaciones.js, imagenes.js y el hook useMenuLateral.js.",
      "owner": "Diana Velasco Lasso",
      "ownerRole": "Desarrollador 1",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/src/frontend/src/utils",
      "position": { "x": 40, "y": 480 }
    },
    {
      "id": "fe-context",
      "label": "Estado de productos",
      "type": "technical",
      "status": "implementado",
      "layer": "frontend",
      "path": "src/frontend/src/context",
      "description": "Mantiene en un solo lugar la lista de productos para que todas las pantallas del panel estén sincronizadas.",
      "techDesc": "ProductosContext.jsx: provider con productos, cargando y errorCarga, y acciones agregarProducto / actualizarProducto / eliminarProducto que llaman a /api/productos y actualizan el estado local. Exporta validarProducto() y el hook useProductos().",
      "owner": "Diana Velasco Lasso",
      "ownerRole": "Desarrollador 1",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/src/frontend/src/context",
      "position": { "x": 680, "y": 480 }
    },

    {
      "id": "be-server",
      "label": "Servidor API",
      "type": "technical",
      "status": "implementado",
      "layer": "backend",
      "path": "src/backend",
      "description": "El “cerebro” en línea: recibe las peticiones de la aplicación web y devuelve la información de productos y clientes.",
      "techDesc": "server.js arranca Express en PORT (4000 por defecto). app.js configura CORS (CORS_ORIGIN), JSON hasta 6 MB (fotos en base64), monta /api/auth, /api/clientes y /api/productos, expone GET /api/health y un manejador de errores 400/413/500.",
      "owner": "Samuel Guevara Morales",
      "ownerRole": "Desarrollador 2",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/src/backend",
      "position": { "x": 360, "y": 710 }
    },
    {
      "id": "be-routes",
      "label": "Rutas de la API",
      "type": "technical",
      "status": "implementado",
      "layer": "backend",
      "path": "src/backend/routes",
      "description": "El directorio de “ventanillas” del servidor: cada dirección lleva a la función que atiende esa solicitud.",
      "techDesc": "auth.routes.js (POST /login), clientes.routes.js (POST /registro, POST /login, GET /:id, PUT /:id) y productos.routes.js (GET /, POST /, PUT /:id, DELETE /:id). Cada router delega en su controller.",
      "owner": "Samuel Guevara Morales",
      "ownerRole": "Desarrollador 2",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/src/backend/routes",
      "position": { "x": 680, "y": 710 }
    },
    {
      "id": "be-controllers",
      "label": "Lógica de negocio",
      "type": "technical",
      "status": "implementado",
      "layer": "backend",
      "path": "src/backend/controllers",
      "description": "Las reglas del negocio: no repetir nombres de productos, verificar contraseñas, validar precios y existencias.",
      "techDesc": "auth.controller.js (login único para admin y cliente), clientes.controller.js (registrar, login, obtener, actualizar) y productos.controller.js (CRUD + chequeo de nombre duplicado con mismoNombre()). Consultan PostgreSQL vía lib/db.js.",
      "owner": "Samuel Guevara Morales",
      "ownerRole": "Desarrollador 2",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/src/backend/controllers",
      "position": { "x": 1000, "y": 710 }
    },
    {
      "id": "be-lib",
      "label": "Librerías internas",
      "type": "technical",
      "status": "implementado",
      "layer": "backend",
      "path": "src/backend/lib",
      "description": "Herramientas de apoyo del servidor: la conexión con la base de datos, el cifrado de contraseñas y las validaciones.",
      "techDesc": "db.js: Pool de pg con DATABASE_URL y DATABASE_SSL, query() y setPool() para inyectar pg-mem en tests. passwords.js: hashing con scrypt. validaciones.js y util.js: validación y helpers compartidos.",
      "owner": "Samuel Guevara Morales",
      "ownerRole": "Desarrollador 2",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/src/backend/lib",
      "position": { "x": 1320, "y": 710 }
    },

    {
      "id": "be-scripts",
      "label": "Scripts de base de datos",
      "type": "technical",
      "status": "implementado",
      "layer": "datos",
      "path": "src/backend/scripts",
      "description": "Comandos para preparar la base de datos desde cero y cargar datos de ejemplo.",
      "techDesc": "db-init.js (npm run db:init: crea tablas y datos demo), migrar-json.js (npm run db:migrar-json: importa data/*.json hasheando contraseñas) y hash-password.js (npm run db:hash).",
      "owner": "Samuel Guevara Morales",
      "ownerRole": "Desarrollador 2",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/src/backend/scripts",
      "position": { "x": 1640, "y": 950 }
    },
    {
      "id": "database",
      "label": "Base de datos",
      "type": "technical",
      "status": "implementado",
      "layer": "datos",
      "path": "database",
      "description": "Donde se guarda la información de forma permanente: productos, categorías, clientes y administradores.",
      "techDesc": "PostgreSQL. 01_schema.sql crea categorias, administradores, clientes y productos (productos.categoria_id → categorias.id). 02_seed.sql carga datos iniciales. Aún no hay tablas para pedidos, pagos ni domicilios.",
      "owner": "Samuel Guevara Morales",
      "ownerRole": "Desarrollador 2",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/database",
      "position": { "x": 1320, "y": 950 }
    },

    {
      "id": "docs",
      "label": "Planeación y diseño UX",
      "type": "business",
      "status": "implementado",
      "layer": "calidad",
      "path": "docs",
      "description": "Los documentos de planeación del equipo: historias de usuario, backlog, estimaciones y los diseños de pantallas en Figma.",
      "techDesc": "docs/planeacion: Historias Usuario.xlsx, Story mapping.xlsx, PLANINGPOKER.xlsx y la plantilla de Backlog. docs/ui-ux: MOCKUPS-E1.pdf y el enlace al prototipo de Figma (SAMIFRUVER-E1).",
      "owner": "Lesber Estanga Montezuma",
      "ownerRole": "Analista",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/docs",
      "position": { "x": 40, "y": 1190 }
    },
    {
      "id": "tests-funcionales",
      "label": "Pruebas funcionales",
      "type": "technical",
      "status": "implementado",
      "layer": "calidad",
      "path": "tests",
      "description": "Comprobaciones manuales de que cada épica hace lo que el negocio pidió, antes de entregarla.",
      "techDesc": "tests/PruebasFuncionales con una carpeta por épica: E1-GestiónInventario, E2-GestionUsuario y E3-GestiónPedidos (por ahora contienen solo un readme).",
      "owner": "Nicolle Castro Cardozo",
      "ownerRole": "Tester 2",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/tests",
      "position": { "x": 360, "y": 1190 }
    },
    {
      "id": "tests-auto",
      "label": "Pruebas automatizadas",
      "type": "technical",
      "status": "implementado",
      "layer": "calidad",
      "path": "src/backend/tests",
      "description": "Pruebas que se ejecutan solas para detectar errores cada vez que alguien cambia el código.",
      "techDesc": "Backend: auth, clientes y productos con Vitest + Supertest sobre una base en memoria (pg-mem), sin necesitar PostgreSQL. El frontend tiene su propia suite en src/frontend/src/tests (Testing Library + jsdom). Ambas: npm test / npm run test:coverage.",
      "owner": "David Lopez Gomez",
      "ownerRole": "Tester 1",
      "githubLink": "https://github.com/salonsog26/SAMIFRUVER/tree/main/src/backend/tests",
      "position": { "x": 1000, "y": 1190 }
    }
  ],

  "edges": [
    { "id": "f1", "source": "epic-usuario",    "target": "epic-inventario", "kind": "flujo", "label": "ve el catálogo",   "techLabel": "sesión cliente" },
    { "id": "f2", "source": "epic-inventario", "target": "epic-pedidos",    "kind": "flujo", "label": "elige productos",        "techLabel": "verifica stock" },
    { "id": "f3", "source": "epic-pedidos",    "target": "epic-pagos",      "kind": "flujo", "label": "paga en línea",          "techLabel": "pedido → pago" },
    { "id": "f4", "source": "epic-pagos",      "target": "epic-despacho",   "kind": "flujo", "label": "prepara pedido", "techLabel": "pago aprobado" },
    { "id": "f5", "source": "epic-despacho",   "target": "epic-domicilios", "kind": "flujo", "label": "asigna reparto",      "techLabel": "asignación" },

    { "id": "i1", "source": "epic-usuario",    "target": "fe-public", "kind": "implementa", "label": "registro y perfil", "techLabel": "Login / Registro / Perfil" },
    { "id": "i2", "source": "epic-inventario", "target": "fe-admin",  "kind": "implementa", "label": "administra productos", "techLabel": "CRUD productos" },
    { "id": "i3", "source": "epic-inventario", "target": "fe-public", "kind": "implementa", "label": "catálogo", "techLabel": "CatalogoPublico" },

    { "id": "d1", "source": "fe-router", "target": "fe-public",     "kind": "dependencia", "label": "muestra",         "techLabel": "rutas públicas" },
    { "id": "d2", "source": "fe-router", "target": "fe-admin",      "kind": "dependencia", "label": "solo admin",      "techLabel": "RutaProtegida" },
    { "id": "d3", "source": "fe-public", "target": "fe-components", "kind": "dependencia", "label": "usa",             "techLabel": "public/ forms/ ui/" },
    { "id": "d4", "source": "fe-admin",  "target": "fe-components", "kind": "dependencia", "label": "usa",             "techLabel": "admin/ forms/ ui/" },
    { "id": "d5", "source": "fe-admin",  "target": "fe-context",    "kind": "dependencia", "label": "lee y guarda",    "techLabel": "useProductos()" },
    { "id": "d6", "source": "fe-public", "target": "fe-utils",      "kind": "dependencia", "label": "inicia sesión",   "techLabel": "auth.login()" },

    { "id": "a1", "source": "fe-utils",   "target": "be-server", "kind": "api", "label": "inicio de sesión", "techLabel": "POST /api/auth/login" },
    { "id": "a2", "source": "fe-public",  "target": "be-server", "kind": "api", "label": "datos del cliente", "techLabel": "/api/clientes · GET /api/productos" },
    { "id": "a3", "source": "fe-context", "target": "be-server", "kind": "api", "label": "productos",        "techLabel": "GET/POST/PUT/DELETE /api/productos" },

    { "id": "b1", "source": "be-server",      "target": "be-routes",      "kind": "dependencia", "label": "atiende",    "techLabel": "app.use('/api/…')" },
    { "id": "b2", "source": "be-routes",      "target": "be-controllers", "kind": "dependencia", "label": "delega",     "techLabel": "router → controller" },
    { "id": "b3", "source": "be-controllers", "target": "be-lib",         "kind": "dependencia", "label": "se apoya en", "techLabel": "query() · scrypt" },
    { "id": "b4", "source": "be-lib",         "target": "database",       "kind": "api",         "label": "guarda y lee", "techLabel": "pg Pool (DATABASE_URL)" },
    { "id": "b5", "source": "be-scripts",     "target": "database",       "kind": "dependencia", "label": "prepara",    "techLabel": "db:init · db:migrar-json" },

    { "id": "q1", "source": "tests-auto", "target": "be-controllers", "kind": "prueba", "label": "verifica", "techLabel": "Supertest + pg-mem" }
  ]
}

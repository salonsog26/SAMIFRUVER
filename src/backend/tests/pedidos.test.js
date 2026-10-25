import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prepararEntorno } from './helpers.js';

let env;
beforeEach(() => { env = prepararEntorno(); });
afterEach(() => { delete process.env.ADMIN_KEY; return env.limpiar(); });

// Productos semilla: 1 Tomate ($3.000, stock 20) y 2 Jengibre ($5.000, stock 10). Clientes: 1 Ana y 2 Luis.
const DIRECCION = { alias: 'Casa', nombre: 'Ana Pérez', linea: 'Calle 95 # 15-42, apto. 302', ciudad: 'Bogotá', telefono: '310 555 0182' };
const pedidoValido = (extra = {}) => ({
    items: [{ productoId: 1, cantidad: 2 }, { productoId: 2, cantidad: 1 }],
    direccion: DIRECCION,
    metodoPago: 'tarjeta',
    ...extra
});
const como = (id) => ({ 'X-Cliente-Id': String(id) });
const crear = (cuerpo = pedidoValido(), cliente = 1) => env.api.post('/api/pedidos').set(como(cliente)).send(cuerpo);
const stockDe = (id) => Number(env.leerTabla('productos').find((p) => p.id === id).stock);

describe('E3-HU2 Crear pedido', () => {
    it('ESC1: pedido creado → 201, descuenta el stock y calcula subtotal, domicilio y total', async () => {
        const r = await crear();
        expect(r.status).toBe(201);
        expect(r.body.mensaje).toBe('Pedido creado correctamente');
        const p = r.body.pedido;
        expect(p).toMatchObject({ id: 1, numero: 'SF-1001', estado: 'recibido', subtotal: 11000, domicilio: 5000, total: 16000, productos: 2, unidades: 3 });
        expect(p.pagoDetalle).toBe('Visa ···· 4242');
        expect(p.direccion).toMatchObject({ linea: 'Calle 95 # 15-42, apto. 302', ciudad: 'Bogotá' });
        expect(p.items.map((i) => [i.nombre, i.cantidad, i.subtotal])).toEqual([['Tomate', 2, 6000], ['Jengibre', 1, 5000]]);
        expect(stockDe(1)).toBe(18);
        expect(stockDe(2)).toBe(9);
        expect(env.leerTabla('pedidos')).toHaveLength(1);
        expect(env.leerTabla('pedido_items')).toHaveLength(2);
    });
    it('el primer estado ya tiene la hora de "Pedido recibido" y las demás etapas pendientes', async () => {
        const { etapas } = (await crear()).body.pedido;
        expect(etapas.map((e) => e.clave)).toEqual(['recibido', 'preparacion', 'en_camino', 'entregado']);
        expect(etapas[0].completada).toBe(true);
        expect(etapas[0].hora).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(etapas.slice(1).every((e) => !e.completada && e.hora === null)).toBe(true);
    });
    it('el mismo producto repetido en el carrito se suma en una sola línea', async () => {
        const r = await crear(pedidoValido({ items: [{ productoId: 1, cantidad: 1 }, { productoId: 1, cantidad: 2 }] }));
        expect(r.status).toBe(201);
        expect(r.body.pedido.items).toHaveLength(1);
        expect(r.body.pedido.items[0].cantidad).toBe(3);
        expect(stockDe(1)).toBe(17);
    });
    it('también acepta Mercado Pago', async () => {
        const r = await crear(pedidoValido({ metodoPago: 'mercadopago' }));
        expect(r.status).toBe(201);
        expect(r.body.pedido).toMatchObject({ metodoPago: 'mercadopago', pagoDetalle: 'Mercado Pago' });
    });
    it('ESC2: carrito vacío → 400 y no crea nada', async () => {
        for (const items of [[], undefined, 'x']) {
            const r = await crear(pedidoValido({ items }));
            expect(r.status).toBe(400);
            expect(r.body.mensaje).toBe('No puedes realizar un pedido sin productos. Agrega al menos un producto a tu carrito.');
        }
        expect(env.leerTabla('pedidos')).toHaveLength(0);
    });
    it('ESC3: sin método de pago → 400 "Selección de método de pago es obligatorio" y no descuenta stock', async () => {
        for (const metodoPago of [undefined, '', 'efectivo', 5]) {
            const r = await crear(pedidoValido({ metodoPago }));
            expect(r.status).toBe(400);
            expect(r.body.mensaje).toBe('Selección de método de pago es obligatorio');
        }
        expect(stockDe(1)).toBe(20);
        expect(env.leerTabla('pedidos')).toHaveLength(0);
    });
    it('ESC4: cantidad mayor al stock → 409 con las unidades disponibles y no se descuenta nada', async () => {
        // El producto que no alcanza va primero: así esta prueba no depende del ROLLBACK (pg-mem no lo soporta;
        // el rollback real se verifica en pedidos.postgres.test.js contra un PostgreSQL de verdad).
        const r = await crear(pedidoValido({ items: [{ productoId: 1, cantidad: 21 }, { productoId: 2, cantidad: 1 }] }));
        expect(r.status).toBe(409);
        expect(r.body.mensaje).toBe('No hay suficiente stock de Tomate. Disponible: 20 lb.');
        expect(stockDe(1)).toBe(20);
        expect(stockDe(2)).toBe(10);
        expect(env.leerTabla('pedidos')).toHaveLength(0);
        expect(env.leerTabla('pedido_items')).toHaveLength(0);
    });
    it('se puede comprar justo todo el stock disponible', async () => {
        const r = await crear(pedidoValido({ items: [{ productoId: 2, cantidad: 10 }] }));
        expect(r.status).toBe(201);
        expect(stockDe(2)).toBe(0);
        expect((await crear(pedidoValido({ items: [{ productoId: 2, cantidad: 1 }] }))).status).toBe(409);
    });
    it('producto inexistente → 400', async () => {
        const r = await crear(pedidoValido({ items: [{ productoId: 99, cantidad: 1 }] }));
        expect(r.status).toBe(400);
        expect(r.body.mensaje).toMatch(/ya no está disponible/);
    });
    it.each([
        ['cantidad 0', { productoId: 1, cantidad: 0 }],
        ['cantidad negativa', { productoId: 1, cantidad: -2 }],
        ['cantidad decimal', { productoId: 1, cantidad: 1.5 }],
        ['cantidad texto', { productoId: 1, cantidad: 'dos' }],
        ['cantidad enorme', { productoId: 1, cantidad: 100000 }],
        ['productoId inválido', { productoId: 'abc', cantidad: 1 }],
        ['sin productoId', { cantidad: 1 }]
    ])('item inválido (%s) → 400', async (_, item) => {
        const r = await crear(pedidoValido({ items: [item] }));
        expect(r.status).toBe(400);
        expect(r.body.mensaje).toBe('Los productos del carrito no son válidos.');
    });
    it.each([
        ['sin dirección', undefined],
        ['dirección vacía', { linea: '', ciudad: '' }],
        ['sin ciudad', { ...DIRECCION, ciudad: '' }],
        ['línea muy corta', { ...DIRECCION, linea: 'abc' }]
    ])('%s → 400 "Selecciona o agrega una dirección de entrega."', async (_, direccion) => {
        const r = await crear(pedidoValido({ direccion }));
        expect(r.status).toBe(400);
        expect(r.body.mensaje).toBe('Selecciona o agrega una dirección de entrega.');
    });
    it('teléfono de entrega inválido → 400; si no se envía usa el del cliente', async () => {
        expect((await crear(pedidoValido({ direccion: { ...DIRECCION, telefono: 'abc' } }))).status).toBe(400);
        const r = await crear(pedidoValido({ direccion: { ...DIRECCION, telefono: '' } }));
        expect(r.body.pedido.direccion.telefono).toBe('3001234567');
    });
    it('sin sesión o con cliente inexistente → 401', async () => {
        expect((await env.api.post('/api/pedidos').send(pedidoValido())).status).toBe(401);
        expect((await crear(pedidoValido(), 99)).status).toBe(401);
        expect((await env.api.post('/api/pedidos').set({ 'X-Cliente-Id': 'abc' }).send(pedidoValido())).status).toBe(401);
    });
    it('el precio guardado en el pedido no cambia si luego se edita el producto', async () => {
        const { body } = await crear();
        await env.api.put('/api/productos/1').send({ nombre: 'Tomate', precio: 9999, categoria: 'Verduras', stock: 18, unidad: 'lb' });
        const r = await env.api.get(`/api/pedidos/${body.pedido.id}`).set(como(1));
        expect(r.body.pedido.total).toBe(16000);
        expect(r.body.pedido.items[0].precioUnitario).toBe(3000);
    });
    it('si el producto se elimina, el pedido conserva su nombre y precio', async () => {
        const { body } = await crear();
        expect((await env.api.delete('/api/productos/1')).status).toBe(200);
        const r = await env.api.get(`/api/pedidos/${body.pedido.id}`).set(como(1));
        expect(r.status).toBe(200);
        expect(r.body.pedido.items[0]).toMatchObject({ nombre: 'Tomate', productoId: null, cantidad: 2 });
    });
});

describe('E3-HU3 Historial de pedidos', () => {
    it('ESC2: sin pedidos → lista vacía', async () => {
        const r = await env.api.get('/api/pedidos').set(como(1));
        expect(r.status).toBe(200);
        expect(r.body).toEqual({ pedidos: [], total: 0 });
    });
    it('ESC1: lista los pedidos del cliente, del más reciente al más antiguo, con número, fecha y total', async () => {
        await crear(pedidoValido({ items: [{ productoId: 1, cantidad: 1 }] }));
        await crear(pedidoValido({ items: [{ productoId: 2, cantidad: 1 }] }));
        await crear(pedidoValido({ items: [{ productoId: 1, cantidad: 2 }] }));
        const r = await env.api.get('/api/pedidos').set(como(1));
        expect(r.body.pedidos.map((p) => p.numero)).toEqual(['SF-1003', 'SF-1002', 'SF-1001']);
        expect(r.body.pedidos[0]).toMatchObject({ total: 11000, estado: 'recibido' });
        expect(r.body.pedidos[0].creadoEn).toMatch(/^\d{4}-/);
    });
    it('un cliente no ve los pedidos de otro', async () => {
        await crear();
        await crear(pedidoValido(), 2);
        expect((await env.api.get('/api/pedidos').set(como(1))).body.pedidos).toHaveLength(1);
        expect((await env.api.get('/api/pedidos').set(como(2))).body.pedidos).toHaveLength(1);
    });
    it('filtra por estado y total sigue contando todos', async () => {
        await crear();
        await crear();
        await env.api.post('/api/pedidos/2/cancelar').set(como(1));
        const r = await env.api.get('/api/pedidos?estado=cancelado').set(como(1));
        expect(r.body.pedidos.map((p) => p.numero)).toEqual(['SF-1002']);
        expect(r.body.total).toBe(2);
        expect((await env.api.get('/api/pedidos?estado=inventado').set(como(1))).body.pedidos).toHaveLength(2);
    });
    it('sin sesión → 401', async () => {
        expect((await env.api.get('/api/pedidos')).status).toBe(401);
    });
});

describe('E3-HU1 Consultar pedido (seguimiento)', () => {
    it('devuelve el detalle completo del pedido', async () => {
        await crear();
        const r = await env.api.get('/api/pedidos/1').set(como(1));
        expect(r.status).toBe(200);
        expect(r.body.pedido).toMatchObject({ numero: 'SF-1001', estado: 'recibido', puedeCancelar: true, repartidor: null, llegadaEstimada: null });
        expect(r.body.pedido.items).toHaveLength(2);
    });
    it('pedido de otro cliente, inexistente o con id inválido → 404', async () => {
        await crear();
        for (const [id, cliente] of [[1, 2], [99, 1], ['abc', 1]]) {
            const r = await env.api.get(`/api/pedidos/${id}`).set(como(cliente));
            expect(r.status).toBe(404);
            expect(r.body.mensaje).toBe('Pedido no encontrado');
        }
    });
    it('ESC1: "En preparación" sin repartidor → etapas 1 y 2 completas, 3 y 4 pendientes', async () => {
        await crear();
        process.env.ADMIN_KEY = 'k';
        await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'k');
        const { pedido } = (await env.api.get('/api/pedidos/1').set(como(1))).body;
        expect(pedido.estado).toBe('preparacion');
        expect(pedido.etapas.map((e) => e.completada)).toEqual([true, true, false, false]);
        expect(pedido.repartidor).toBeNull();
    });
    it('ESC2: "En camino" → repartidor asignado y ventana de llegada estimada', async () => {
        await crear();
        process.env.ADMIN_KEY = 'k';
        for (let i = 0; i < 2; i++) await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'k');
        const { pedido } = (await env.api.get('/api/pedidos/1').set(como(1))).body;
        expect(pedido.estado).toBe('en_camino');
        expect(pedido.etapas.map((e) => e.completada)).toEqual([true, true, true, false]);
        expect(pedido.repartidor).toMatchObject({ nombre: 'Andrés Martínez', vehiculo: 'Bicicleta' });
        const { desde, hasta } = pedido.llegadaEstimada;
        expect(new Date(hasta) - new Date(desde)).toBe(10 * 60000);
        expect(pedido.puedeCancelar).toBe(false);
    });
    it('ESC3: "Entregado" → las 4 etapas con hora', async () => {
        await crear();
        process.env.ADMIN_KEY = 'k';
        for (let i = 0; i < 3; i++) await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'k');
        const { pedido } = (await env.api.get('/api/pedidos/1').set(como(1))).body;
        expect(pedido.estado).toBe('entregado');
        expect(pedido.etapas.every((e) => e.completada && e.hora)).toBe(true);
        expect(pedido.llegadaEstimada).toBeNull();
    });
});

describe('E3-HU4 Cancelar pedido', () => {
    it('ESC1: cancela un pedido recibido → devuelve el stock, marca la devolución y queda "cancelado"', async () => {
        await crear();
        expect(stockDe(1)).toBe(18);
        const r = await env.api.post('/api/pedidos/1/cancelar').set(como(1));
        expect(r.status).toBe(200);
        expect(r.body.mensaje).toBe('Pedido cancelado correctamente');
        expect(r.body.pedido).toMatchObject({ estado: 'cancelado', devolucionIniciada: true, puedeCancelar: false });
        expect(r.body.pedido.canceladoEn).toMatch(/^\d{4}-/);
        expect(stockDe(1)).toBe(20);
        expect(stockDe(2)).toBe(10);
        const h = await env.api.get('/api/pedidos').set(como(1));
        expect(h.body.pedidos[0].estado).toBe('cancelado');
    });
    it('también se puede cancelar "En preparación"', async () => {
        await crear();
        process.env.ADMIN_KEY = 'k';
        await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'k');
        expect((await env.api.post('/api/pedidos/1/cancelar').set(como(1))).status).toBe(200);
    });
    it('ESC2: "En camino" o "Entregado" → 409 y el pedido no cambia', async () => {
        await crear();
        process.env.ADMIN_KEY = 'k';
        await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'k');
        await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'k');
        let r = await env.api.post('/api/pedidos/1/cancelar').set(como(1));
        expect(r.status).toBe(409);
        expect(r.body.mensaje).toBe('Este pedido ya no se puede cancelar porque está en camino o fue entregado.');
        await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'k');
        r = await env.api.post('/api/pedidos/1/cancelar').set(como(1));
        expect(r.status).toBe(409);
        expect((await env.api.get('/api/pedidos/1').set(como(1))).body.pedido.estado).toBe('entregado');
        expect(stockDe(1)).toBe(18);
    });
    it('cancelar dos veces no devuelve el stock dos veces', async () => {
        await crear();
        await env.api.post('/api/pedidos/1/cancelar').set(como(1));
        const r = await env.api.post('/api/pedidos/1/cancelar').set(como(1));
        expect(r.status).toBe(409);
        expect(r.body.mensaje).toBe('Este pedido ya fue cancelado.');
        expect(stockDe(1)).toBe(20);
    });
    it('no se puede cancelar el pedido de otro cliente ni uno inexistente → 404', async () => {
        await crear();
        expect((await env.api.post('/api/pedidos/1/cancelar').set(como(2))).status).toBe(404);
        expect((await env.api.post('/api/pedidos/99/cancelar').set(como(1))).status).toBe(404);
        expect((await env.api.post('/api/pedidos/abc/cancelar').set(como(1))).status).toBe(404);
        expect(stockDe(1)).toBe(18);
    });
    it('sin sesión → 401', async () => {
        await crear();
        expect((await env.api.post('/api/pedidos/1/cancelar')).status).toBe(401);
    });
});

describe('Avanzar estado (provisional, hasta las Épicas 5 y 6)', () => {
    it('sin ADMIN_KEY configurada → 403 (función deshabilitada)', async () => {
        await crear();
        const r = await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'x');
        expect(r.status).toBe(403);
        expect(r.body.mensaje).toMatch(/ADMIN_KEY/);
    });
    it('con clave incorrecta o ausente → 403', async () => {
        await crear();
        process.env.ADMIN_KEY = 'secreta';
        expect((await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'otra')).status).toBe(403);
        expect((await env.api.patch('/api/pedidos/1/estado')).status).toBe(403);
        expect((await env.api.patch('/api/pedidos/1/estado').set(como(1))).status).toBe(403);
    });
    it('recorre recibido → preparacion → en_camino → entregado y luego responde 409', async () => {
        await crear();
        process.env.ADMIN_KEY = 'secreta';
        const estados = [];
        for (let i = 0; i < 3; i++) {
            const r = await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'secreta');
            expect(r.status).toBe(200);
            estados.push(r.body.pedido.estado);
        }
        expect(estados).toEqual(['preparacion', 'en_camino', 'entregado']);
        expect((await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'secreta')).status).toBe(409);
    });
    it('un pedido cancelado no puede avanzar; uno inexistente → 404', async () => {
        await crear();
        process.env.ADMIN_KEY = 'secreta';
        await env.api.post('/api/pedidos/1/cancelar').set(como(1));
        expect((await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'secreta')).status).toBe(409);
        expect((await env.api.patch('/api/pedidos/99/estado').set('X-Admin-Key', 'secreta')).status).toBe(404);
    });
    it('permite indicar el repartidor al pasar a "en_camino"', async () => {
        await crear();
        process.env.ADMIN_KEY = 'secreta';
        await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'secreta');
        const r = await env.api.patch('/api/pedidos/1/estado').set('X-Admin-Key', 'secreta')
            .send({ repartidor: { nombre: 'Laura Ríos', vehiculo: 'Moto', telefono: '3001112233' } });
        expect(r.body.pedido.repartidor).toEqual({ nombre: 'Laura Ríos', vehiculo: 'Moto', telefono: '3001112233' });
    });
});

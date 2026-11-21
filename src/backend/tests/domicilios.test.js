// Pruebas del portal del domiciliario (Épica 5: E5-HU1, E5-HU2, E5-HU3).
// Base en memoria con el esquema real del proyecto (ver helpers.js).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prepararEntorno } from './helpers.js';

let env;
beforeEach(() => { process.env.ADMIN_KEY = 'clave-admin'; env = prepararEntorno(); });
afterEach(() => { delete process.env.ADMIN_KEY; return env.limpiar(); });

const comoCliente = (id) => ({ 'X-Cliente-Id': String(id) });
const comoDom = (id) => ({ 'X-Domiciliario-Id': String(id) });
const ADMIN = { 'X-Admin-Key': 'clave-admin' };
const DIRECCION = { alias: 'Casa', nombre: 'Ana Pérez', linea: 'Carrera 15 # 63-42, apto. 302', ciudad: 'Bogotá', telefono: '310 555 0182' };
const cuerpoPedido = (extra = {}) => ({
    items: [{ productoId: 1, cantidad: 2 }],
    direccion: DIRECCION,
    metodoPago: 'tarjeta',
    ...extra
});

// Crea un pedido como cliente y lo asigna al domiciliario indicado (queda en "preparacion").
async function crearAsignado({ cliente = 1, dom = 1, metodoPago = 'tarjeta', entregaEstimada } = {}) {
    const r = await env.api.post('/api/pedidos').set(comoCliente(cliente)).send(cuerpoPedido({ metodoPago }));
    expect(r.status).toBe(201);
    const id = r.body.pedido.id;
    const a = await env.api.post(`/api/pedidos/${id}/asignar`).set(ADMIN).send({ domiciliarioId: dom, entregaEstimada });
    expect(a.status).toBe(200);
    return id;
}

describe('E5-HU2 Consultar pedidos asignados', () => {
    it('sin cabecera de domiciliario → 401', async () => {
        const r = await env.api.get('/api/domicilios/pedidos');
        expect(r.status).toBe(401);
        expect(r.body.mensaje).toBe('Inicia sesión para continuar.');
    });

    it('lista vacía al inicio y con resumen en cero', async () => {
        const r = await env.api.get('/api/domicilios/pedidos').set(comoDom(1));
        expect(r.status).toBe(200);
        expect(r.body.pedidos).toEqual([]);
        expect(r.body.resumen).toEqual({ porRecoger: 0, enCamino: 0, entregadosHoy: 0 });
    });

    it('muestra el pedido asignado con datos de entrega, cliente y estado "preparacion"', async () => {
        const id = await crearAsignado();
        const r = await env.api.get('/api/domicilios/pedidos').set(comoDom(1));
        expect(r.status).toBe(200);
        expect(r.body.total).toBe(1);
        const p = r.body.pedidos[0];
        expect(p).toMatchObject({ id, numero: 'SF-1001', estado: 'preparacion', clienteNombre: 'Ana Pérez' });
        expect(p.direccion.linea).toBe('Carrera 15 # 63-42, apto. 302');
        expect(p.items).toHaveLength(1);
        expect(r.body.resumen.porRecoger).toBe(1);
    });

    it('ordena por hora estimada de entrega', async () => {
        const lejos = await crearAsignado({ entregaEstimada: new Date(Date.now() + 90 * 60000).toISOString() });
        const cerca = await crearAsignado({ entregaEstimada: new Date(Date.now() + 30 * 60000).toISOString() });
        const r = await env.api.get('/api/domicilios/pedidos').set(comoDom(1));
        expect(r.body.pedidos.map((p) => p.id)).toEqual([cerca, lejos]);
    });

    it('cada domiciliario solo ve sus pedidos asignados', async () => {
        await crearAsignado({ dom: 1 });
        const propio = await env.api.get('/api/domicilios/pedidos').set(comoDom(1));
        const ajeno = await env.api.get('/api/domicilios/pedidos').set(comoDom(2));
        expect(propio.body.total).toBe(1);
        expect(ajeno.body.pedidos).toEqual([]);
        // El detalle y las acciones de un pedido ajeno responden 404.
        const id = propio.body.pedidos[0].id;
        expect((await env.api.get(`/api/domicilios/pedidos/${id}`).set(comoDom(2))).status).toBe(404);
        expect((await env.api.post(`/api/domicilios/pedidos/${id}/iniciar`).set(comoDom(2))).status).toBe(404);
        expect((await env.api.post(`/api/domicilios/pedidos/${id}/confirmar`).set(comoDom(2))).status).toBe(404);
    });
});

describe('E5-HU1 Actualizar el estado del domicilio', () => {
    it('ESC1: iniciar entrega desde "preparacion" → "en_camino" con hora y repartidor', async () => {
        const id = await crearAsignado();
        const r = await env.api.post(`/api/domicilios/pedidos/${id}/iniciar`).set(comoDom(1));
        expect(r.status).toBe(200);
        expect(r.body.mensaje).toBe('Estado actualizado correctamente');
        const p = r.body.pedido;
        expect(p.estado).toBe('en_camino');
        expect(p.etapas.find((e) => e.clave === 'en_camino').completada).toBe(true);
        expect(p.repartidor).toMatchObject({ nombre: 'Carlos Ruiz', vehiculo: 'Moto' });
        const fila = env.leerTabla('pedidos').find((x) => x.id === id);
        expect(fila.en_camino_en).toBeTruthy();
    });

    it('no permite iniciar dos veces la misma entrega', async () => {
        const id = await crearAsignado();
        await env.api.post(`/api/domicilios/pedidos/${id}/iniciar`).set(comoDom(1));
        const r = await env.api.post(`/api/domicilios/pedidos/${id}/iniciar`).set(comoDom(1));
        expect(r.status).toBe(409);
        expect(r.body.mensaje).toBe('La entrega ya fue iniciada.');
    });

    it('ESC3: confirmar sin haber iniciado → 409 "Primero debes iniciar la entrega para poder confirmarla"', async () => {
        const id = await crearAsignado();
        const r = await env.api.post(`/api/domicilios/pedidos/${id}/confirmar`).set(comoDom(1));
        expect(r.status).toBe(409);
        expect(r.body.mensaje).toBe('Primero debes iniciar la entrega para poder confirmarla');
        expect(env.leerTabla('pedidos').find((x) => x.id === id).estado).toBe('preparacion');
    });

    it('ESC2: confirmar desde "en_camino" → "entregado" con hora de entrega', async () => {
        const id = await crearAsignado();
        await env.api.post(`/api/domicilios/pedidos/${id}/iniciar`).set(comoDom(1));
        const r = await env.api.post(`/api/domicilios/pedidos/${id}/confirmar`).set(comoDom(1));
        expect(r.status).toBe(200);
        expect(r.body.mensaje).toBe('Pedido entregado correctamente');
        const p = r.body.pedido;
        expect(p.estado).toBe('entregado');
        expect(p.etapas.find((e) => e.clave === 'entregado').completada).toBe(true);
        const fila = env.leerTabla('pedidos').find((x) => x.id === id);
        expect(fila.entregado_en).toBeTruthy();
        // El pago con tarjeta ya estaba aprobado: no cambia.
        expect(p.pagoEstado).toBe('aprobado');
    });

    it('no permite confirmar dos veces el mismo pedido', async () => {
        const id = await crearAsignado();
        await env.api.post(`/api/domicilios/pedidos/${id}/iniciar`).set(comoDom(1));
        await env.api.post(`/api/domicilios/pedidos/${id}/confirmar`).set(comoDom(1));
        const r = await env.api.post(`/api/domicilios/pedidos/${id}/confirmar`).set(comoDom(1));
        expect(r.status).toBe(409);
        expect(r.body.mensaje).toBe('Este pedido ya fue entregado.');
    });

    it('pago en efectivo: queda pendiente hasta confirmar y pasa a recibido al entregar', async () => {
        // El efectivo no se puede crear por la API de clientes todavía; se inserta directo en la base.
        const fila = env.db.one(
            `INSERT INTO pedidos (cliente_id, estado, subtotal, domicilio, total, metodo_pago, pago_detalle, pago_estado,
                dir_alias, dir_nombre, dir_linea, dir_ciudad, dir_telefono, domiciliario_id, entrega_estimada, en_camino_en)
             VALUES (1, 'en_camino', 10000, 5000, 15000, 'efectivo', 'Efectivo', 'pendiente',
                'Casa', 'Ana Pérez', 'Calle 1 # 2-3', 'Bogotá', '3001234567', 1, now(), now())
             RETURNING id`
        );
        env.db.none(
            `INSERT INTO pedido_items (pedido_id, producto_id, nombre, imagen, unidad, precio_unitario, cantidad, subtotal)
             VALUES (${fila.id}, 1, 'Tomate', '/images/tomate.webp', 'lb', 10000, 1, 10000)`
        );
        const antes = await env.api.get(`/api/domicilios/pedidos/${fila.id}`).set(comoDom(1));
        expect(antes.body.pedido).toMatchObject({ metodoPago: 'efectivo', pagoEstado: 'pendiente', total: 15000 });
        const r = await env.api.post(`/api/domicilios/pedidos/${fila.id}/confirmar`).set(comoDom(1));
        expect(r.status).toBe(200);
        expect(r.body.pedido).toMatchObject({ estado: 'entregado', pagoEstado: 'recibido', pagoDetalle: 'Efectivo recibido' });
    });

    it('ESC4: pedido cancelado por el cliente → no se puede iniciar ni confirmar', async () => {
        const id = await crearAsignado();
        const c = await env.api.post(`/api/pedidos/${id}/cancelar`).set(comoCliente(1));
        expect(c.status).toBe(200);
        expect(c.body.pedido.estado).toBe('cancelado');
        const ini = await env.api.post(`/api/domicilios/pedidos/${id}/iniciar`).set(comoDom(1));
        expect(ini.status).toBe(409);
        expect(ini.body.mensaje).toBe('Este pedido fue cancelado y no se puede entregar.');
        const conf = await env.api.post(`/api/domicilios/pedidos/${id}/confirmar`).set(comoDom(1));
        expect(conf.status).toBe(409);
        expect(conf.body.mensaje).toBe('Este pedido fue cancelado y no se puede entregar.');
    });
});

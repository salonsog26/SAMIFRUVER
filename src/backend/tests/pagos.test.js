import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prepararEntorno, guardarTarjeta, TARJETA_RECHAZADA } from './helpers.js';

let env;
let TARJETA_ID;
beforeEach(async () => { env = prepararEntorno(); TARJETA_ID = await guardarTarjeta(env.api, 1); });
afterEach(() => { delete process.env.ADMIN_KEY; return env.limpiar(); });

// Productos semilla: 1 Tomate ($3.000, stock 20) y 2 Jengibre ($5.000, stock 10).
const DIRECCION = { alias: 'Casa', nombre: 'Ana Pérez', linea: 'Calle 95 # 15-42, apto. 302', ciudad: 'Bogotá', telefono: '310 555 0182' };
const cuerpo = (extra = {}) => ({
    items: [{ productoId: 1, cantidad: 2 }, { productoId: 2, cantidad: 1 }],   // 11.000 + 5.000 de domicilio = 16.000
    direccion: DIRECCION, metodoPago: 'tarjeta', metodoPagoId: TARJETA_ID, ...extra
});
const efectivo = (extra = {}) => cuerpo({ metodoPago: 'efectivo', metodoPagoId: undefined, ...extra });
const como = (id) => ({ 'X-Cliente-Id': String(id) });
const crear = (c = cuerpo(), cliente = 1) => env.api.post('/api/pedidos').set(como(cliente)).send(c);
const ver = (id, cliente = 1) => env.api.get(`/api/pedidos/${id}`).set(como(cliente));
const cancelar = (id, cliente = 1) => env.api.post(`/api/pedidos/${id}/cancelar`).set(como(cliente));
const stockDe = (id) => Number(env.leerTabla('productos').find((p) => p.id === id).stock);

describe('E4-HU1 Realizar el pago', () => {
    it('ESC1: pago con tarjeta aprobado → 201 "Pago realizado correctamente", pago "Aprobado" y pedido confirmado', async () => {
        const r = await crear();
        expect(r.status).toBe(201);
        expect(r.body.mensajePago).toBe('Pago realizado correctamente');
        const { pedido } = r.body;
        expect(pedido).toMatchObject({ estado: 'recibido', total: 16000, metodoPago: 'tarjeta', pagoDetalle: 'Visa terminada en 4242', pagoEstado: 'aprobado' });
        expect(pedido.pago).toMatchObject({ estado: 'aprobado', etiqueta: 'Aprobado', total: 16000, referencia: 'TX-1001', devolucion: null });
        expect(pedido.pago.pagadoEn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(stockDe(1)).toBe(18);
        expect(env.leerTabla('pedidos')[0]).toMatchObject({ pago_estado: 'aprobado', metodo_pago_id: TARJETA_ID });
    });
    it('ESC2: pago en efectivo → sin cobro en línea, pago "Pendiente" y pedido confirmado', async () => {
        const r = await crear(efectivo());
        expect(r.status).toBe(201);
        expect(r.body.mensajePago).toBeNull();
        expect(r.body.pedido).toMatchObject({ estado: 'recibido', metodoPago: 'efectivo', pagoDetalle: 'Efectivo al recibir', pagoEstado: 'pendiente' });
        expect(r.body.pedido.pago).toMatchObject({ estado: 'pendiente', etiqueta: 'Pendiente', total: 16000, referencia: null, pagadoEn: null });
        expect(stockDe(1)).toBe(18);
    });
    it('ESC3: pago rechazado → 402, NO crea el pedido, no toca el stock y trae el mensaje y la referencia del intento', async () => {
        const rechazada = await guardarTarjeta(env.api, 1, TARJETA_RECHAZADA);
        const r = await crear(cuerpo({ metodoPagoId: rechazada }));
        expect(r.status).toBe(402);
        expect(r.body.mensaje).toBe('No se pudo procesar el pago. Intenta nuevamente o prueba con otro método de pago.');
        expect(r.body.detalle).toMatch(/ningún cargo/i);
        expect(r.body.intento.referencia).toMatch(/^INT-\d+$/);
        expect(env.leerTabla('pedidos')).toHaveLength(0);
        expect(env.leerTabla('pedido_items')).toHaveLength(0);
        // (Que el stock descontado se restituya depende del ROLLBACK, que pg-mem no soporta:
        //  se comprueba contra PostgreSQL real en pedidos.postgres.test.js.)
        // "Prueba con otro método de pago": el mismo carrito se paga bien con la otra tarjeta o en efectivo.
        expect((await crear(efectivo())).status).toBe(201);
        expect((await crear()).status).toBe(201);
    });
    it('con tarjeta es obligatorio elegir una tarjeta guardada (de ese cliente)', async () => {
        for (const metodoPagoId of [undefined, null, 'abc', 999]) {
            const r = await crear(cuerpo({ metodoPagoId }));
            expect(r.status).toBe(400);
            expect(r.body.mensaje).toMatch(/tarjeta guardada/i);
        }
        // La tarjeta de Ana no sirve para Luis.
        expect((await crear(cuerpo(), 2)).status).toBe(400);
        expect(env.leerTabla('pedidos')).toHaveLength(0);
        expect(stockDe(1)).toBe(20);   // se rechaza antes de tocar el stock
    });
    it('una tarjeta guardada que ya venció no se puede usar', async () => {
        env.ejecutar("INSERT INTO metodos_pago (cliente_id, marca, ultimos4, titular, vence_mes, vence_anio) VALUES (1, 'visa', '1881', 'Ana Pérez', 1, 2020)");
        const vencida = env.leerTabla('metodos_pago').find((t) => t.ultimos4 === '1881').id;
        const r = await crear(cuerpo({ metodoPagoId: vencida }));
        expect(r.status).toBe(400);
        expect(r.body.mensaje).toMatch(/vencida/i);
        expect(env.leerTabla('pedidos')).toHaveLength(0);
        expect(stockDe(1)).toBe(20);
    });
    it('método de pago ausente o desconocido → 400 y no crea nada', async () => {
        for (const metodoPago of [undefined, '', 'mercadopago', 5]) {
            const r = await crear(cuerpo({ metodoPago }));
            expect(r.status).toBe(400);
            expect(r.body.mensaje).toBe('Selección de método de pago es obligatorio');
        }
        expect(env.leerTabla('pedidos')).toHaveLength(0);
    });
    it('eliminar la tarjeta no borra el detalle del pago del pedido ya hecho', async () => {
        const { pedido } = (await crear()).body;
        await env.api.delete(`/api/metodos-pago/${TARJETA_ID}`).set(como(1));
        const v = (await ver(pedido.id)).body.pedido;
        expect(v.pagoDetalle).toBe('Visa terminada en 4242');
        expect(v.pago.estado).toBe('aprobado');
    });
});

describe('E4-HU2 Consultar el estado de pago', () => {
    it('ESC1: pedido pagado con tarjeta → "Aprobado", método, referencia y total', async () => {
        const { pedido } = (await crear()).body;
        const v = (await ver(pedido.id)).body.pedido;
        expect(v.pago).toMatchObject({ estado: 'aprobado', etiqueta: 'Aprobado', metodo: 'tarjeta', detalle: 'Visa terminada en 4242', total: 16000, referencia: 'TX-1001' });
    });
    it('ESC2: pedido en efectivo → "Pendiente" con el total a pagar', async () => {
        const { pedido } = (await crear(efectivo())).body;
        const v = (await ver(pedido.id)).body.pedido;
        expect(v.pago).toMatchObject({ estado: 'pendiente', etiqueta: 'Pendiente', metodo: 'efectivo', total: 16000 });
    });
    it('ESC3: cancelar un pedido pagado con tarjeta → "Devolución en proceso" con el monto a devolver y referencia DEV', async () => {
        const { pedido } = (await crear()).body;
        const r = await cancelar(pedido.id);
        expect(r.status).toBe(200);
        expect(r.body.pedido).toMatchObject({ estado: 'cancelado', devolucionIniciada: true, pagoEstado: 'devolucion_en_proceso' });
        expect(r.body.pedido.pago.etiqueta).toBe('Devolución en proceso');
        expect(r.body.pedido.pago.devolucion).toMatchObject({ estado: 'devolucion_en_proceso', referencia: 'DEV-1001', monto: 16000, devueltoEn: null });
        expect(r.body.pedido.pago.devolucion.solicitadaEn).toMatch(/^\d{4}-/);
        expect(stockDe(1)).toBe(20);
    });
    it('ESC3: cuando se reintegra el valor pasa a "Devuelto"', async () => {
        process.env.ADMIN_KEY = 'clave-demo';
        const { pedido } = (await crear()).body;
        await cancelar(pedido.id);
        const sin = await env.api.patch(`/api/pedidos/${pedido.id}/devolucion`).set('X-Admin-Key', 'mala');
        expect(sin.status).toBe(403);
        const ok = await env.api.patch(`/api/pedidos/${pedido.id}/devolucion`).set('X-Admin-Key', 'clave-demo');
        expect(ok.status).toBe(200);
        expect(ok.body.pedido.pago).toMatchObject({ estado: 'devuelto', etiqueta: 'Devuelto' });
        expect(ok.body.pedido.pago.devolucion).toMatchObject({ estado: 'devuelto', monto: 16000 });
        expect(ok.body.pedido.pago.devolucion.devueltoEn).toMatch(/^\d{4}-/);
        // No se puede devolver dos veces ni un pedido sin devolución.
        expect((await env.api.patch(`/api/pedidos/${pedido.id}/devolucion`).set('X-Admin-Key', 'clave-demo')).status).toBe(409);
        expect((await env.api.patch('/api/pedidos/999/devolucion').set('X-Admin-Key', 'clave-demo')).status).toBe(404);
    });
    it('cancelar un pedido en efectivo no genera devolución: el pago queda "Sin cobro"', async () => {
        const { pedido } = (await crear(efectivo())).body;
        const r = await cancelar(pedido.id);
        expect(r.body.pedido).toMatchObject({ estado: 'cancelado', devolucionIniciada: false, pagoEstado: 'anulado' });
        expect(r.body.pedido.pago).toMatchObject({ etiqueta: 'Sin cobro', devolucion: null });
    });
    it('el pago en efectivo pasa a "Aprobado" cuando el pedido se entrega', async () => {
        process.env.ADMIN_KEY = 'clave-demo';
        const { pedido } = (await crear(efectivo())).body;
        for (let i = 0; i < 3; i += 1) await env.api.patch(`/api/pedidos/${pedido.id}/estado`).set('X-Admin-Key', 'clave-demo');
        const v = (await ver(pedido.id)).body.pedido;
        expect(v.estado).toBe('entregado');
        expect(v.pago).toMatchObject({ estado: 'aprobado', referencia: 'TX-1001' });
        expect(v.pago.pagadoEn).toMatch(/^\d{4}-/);
    });
    it('el historial también trae el estado de pago de cada pedido', async () => {
        await crear();
        await crear(efectivo());
        const { pedidos } = (await env.api.get('/api/pedidos').set(como(1))).body;
        expect(pedidos.map((p) => p.pago.estado).sort()).toEqual(['aprobado', 'pendiente']);
    });
    it('un cliente no puede ver el pago de un pedido ajeno', async () => {
        const { pedido } = (await crear()).body;
        expect((await ver(pedido.id, 2)).status).toBe(404);
    });
});

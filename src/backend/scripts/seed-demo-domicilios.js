// Script temporal: datos de demostración para el portal del domiciliario.
// Crea pedidos en todos los estados y asigna fotos de perfil. Se puede borrar después.
require('dotenv').config();
const { getPool, cerrar } = require('../lib/db');

const API = 'http://localhost:4000';
const dir = { alias: 'Casa', nombre: 'Ana Pérez', linea: 'Carrera 15 # 63-42, apto. 302', ciudad: 'Bogotá', telefono: '310 555 0182', indicaciones: 'Portería: anunciarse a nombre de Lucía.' };

const post = (ruta, headers, body) => fetch(API + ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
}).then((r) => r.json());

const crearPedido = (items, metodoPago = 'tarjeta') =>
    post('/api/pedidos', { 'X-Cliente-Id': '1' }, { items, direccion: dir, metodoPago });

const asignar = (id) => getPool().query(
    `UPDATE pedidos SET domiciliario_id = 1, entrega_estimada = now() + interval '40 minutes',
        estado = CASE WHEN estado = 'recibido' THEN 'preparacion' ELSE estado END,
        preparacion_en = CASE WHEN estado = 'recibido' THEN now() ELSE preparacion_en END
     WHERE id = $1 RETURNING id`, [id]);

(async () => {
    try {
        const pool = getPool();
        await pool.query("UPDATE domiciliarios SET foto = '/images/avatares/carlos-ruiz.svg' WHERE correo = 'domicilio@samifruver.com'");
        await pool.query("UPDATE clientes SET foto = '/images/avatares/ana-perez.svg' WHERE correo = 'ana@correo.com'");
        console.log('fotos listas');

        // 1) EN CAMINO con pago en efectivo pendiente (para probar el cobro al entregar)
        let r = await crearPedido([{ productoId: 1, cantidad: 1 }, { productoId: 2, cantidad: 1 }]);
        let id = r.pedido.id;
        await asignar(id);
        await post(`/api/domicilios/pedidos/${id}/iniciar`, { 'X-Domiciliario-Id': '1' }, {});
        await pool.query("UPDATE pedidos SET metodo_pago = 'efectivo', pago_estado = 'pendiente', pago_detalle = '' WHERE id = $1", [id]);
        console.log(`en_camino (efectivo): #SF-${1000 + id}`);

        // 2) ENTREGADO: ciclo completo con timestamps (historial)
        r = await crearPedido([{ productoId: 2, cantidad: 2 }]);
        id = r.pedido.id;
        await asignar(id);
        await post(`/api/domicilios/pedidos/${id}/iniciar`, { 'X-Domiciliario-Id': '1' }, {});
        const conf = await post(`/api/domicilios/pedidos/${id}/confirmar`, { 'X-Domiciliario-Id': '1' }, {});
        console.log(`entregado: #SF-${1000 + id} ->`, conf.mensaje);

        // 3) CANCELADO por el cliente estando en preparación
        r = await crearPedido([{ productoId: 1, cantidad: 1 }]);
        id = r.pedido.id;
        await asignar(id);
        const canc = await post(`/api/pedidos/${id}/cancelar`, { 'X-Cliente-Id': '1' }, {});
        console.log(`cancelado: #SF-${1000 + id} ->`, canc.pedido && canc.pedido.estado);

        // 4) PREPARACION: ya existe SF-1006
        const lista = await fetch(API + '/api/domicilios/pedidos', { headers: { 'X-Domiciliario-Id': '1' } }).then((x) => x.json());
        console.log('activos:', lista.pedidos.map((p) => `#${p.numero}:${p.estado}`).join(', '), '| resumen', JSON.stringify(lista.resumen));
        const hist = await fetch(API + '/api/domicilios/pedidos?vista=historial', { headers: { 'X-Domiciliario-Id': '1' } }).then((x) => x.json());
        console.log('historial:', hist.pedidos.map((p) => `#${p.numero}:${p.estado}`).join(', '));
    } catch (e) {
        console.error('ERROR:', e.message);
        process.exitCode = 1;
    } finally {
        await cerrar();
    }
})();

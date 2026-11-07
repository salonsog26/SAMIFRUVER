// Confirma el reintegro de un pedido cancelado (demo de la Épica 4): "Devolución en proceso" → "Devuelto".
//   npm run pedido:devolver -- 3          (o SF-1003)
require('dotenv').config();
const { completarDevolucion, ErrorNegocio } = require('../controllers/pedidos.controller');
const { cerrar } = require('../lib/db');

(async () => {
    const arg = process.argv[2] || '';
    const coincide = arg.match(/^(?:SF-)?(\d+)$/i);
    if (!coincide) {
        console.error('Uso: npm run pedido:devolver -- <id | SF-1003>');
        process.exit(1);
    }
    const numero = Number(coincide[1]);
    const id = /^SF-/i.test(arg) ? numero - 1000 : numero;
    try {
        const pedido = await completarDevolucion(id);
        console.log(`Pedido ${pedido.numero} → pago "${pedido.pago.etiqueta}" (${pedido.pago.devolucion.referencia})`);
    } catch (error) {
        console.error(error instanceof ErrorNegocio ? `No se pudo: ${error.mensaje}` : error);
        process.exitCode = 1;
    } finally {
        await cerrar();
    }
})();

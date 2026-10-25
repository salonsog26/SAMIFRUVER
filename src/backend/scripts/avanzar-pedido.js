// Avanza un pedido al siguiente estado (demo de la Épica 3, mientras no existan las pantallas de despacho).
//   npm run pedido:avanzar -- 3          (o SF-1003)
//   npm run pedido:avanzar -- 3 --todo   (lo lleva hasta "entregado")
require('dotenv').config();
const { avanzarEstado, ErrorNegocio } = require('../controllers/pedidos.controller');
const { cerrar } = require('../lib/db');

const ETIQUETAS = { preparacion: 'En preparación', en_camino: 'En camino', entregado: 'Entregado' };

(async () => {
    const arg = process.argv[2] || '';
    const coincide = arg.match(/^(?:SF-)?(\d+)$/i);
    if (!coincide) {
        console.error('Uso: npm run pedido:avanzar -- <id | SF-1003> [--todo]');
        process.exit(1);
    }
    const numero = Number(coincide[1]);
    const id = /^SF-/i.test(arg) ? numero - 1000 : numero;   // "SF-1003" es el pedido con id 3
    const todo = process.argv.includes('--todo');
    try {
        let pedido;
        do {
            pedido = await avanzarEstado(id);
            console.log(`Pedido ${pedido.numero} → ${ETIQUETAS[pedido.estado] || pedido.estado}`);
        } while (todo && pedido.estado !== 'entregado');
    } catch (error) {
        console.error(error instanceof ErrorNegocio ? `No se pudo: ${error.mensaje}` : error);
        process.exitCode = 1;
    } finally {
        await cerrar();
    }
})();

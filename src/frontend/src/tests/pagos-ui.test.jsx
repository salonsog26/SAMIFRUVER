import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Carrito from '../pages/public/Carrito';
import PedidoCreado from '../pages/public/PedidoCreado';
import SeguimientoPedido from '../pages/public/SeguimientoPedido';
import MetodosPago from '../pages/public/MetodosPago';
import { agregarAlCarrito, leerCarrito } from '../utils/carrito';
import { renderEnRutas, simularFetch, llamadasA, ponerSesion, SESION_CLIENTE } from './utils.jsx';

const rutaActual = () => screen.getByTestId('ruta-actual').textContent;

const TOMATE = { id: 1, nombre: 'Tomate', precio: 3000, unidad: 'lb', imagen: '/images/tomate.webp', stock: 5 };
const CLIENTE_API = { cliente: { id: 1, nombre: 'Ana Pérez', telefono: '3001234567', direccion: 'Calle 10 # 5-20', ciudad: 'Popayán' } };
const VISA = { id: 7, marca: 'visa', marcaEtiqueta: 'Visa', ultimos4: '4321', titular: 'Ana Pérez', vence: '08/40', predeterminada: true, creadoEn: '2026-11-04T15:00:00.000Z', descripcion: 'Visa terminada en 4321' };
const MASTER = { id: 8, marca: 'mastercard', marcaEtiqueta: 'Mastercard', ultimos4: '4444', titular: 'Ana Pérez', vence: '09/41', predeterminada: false, creadoEn: '2026-11-05T15:00:00.000Z', descripcion: 'Mastercard terminada en 4444' };

const pagoDe = (estado, extra = {}) => ({
    estado, etiqueta: { aprobado: 'Aprobado', pendiente: 'Pendiente', devolucion_en_proceso: 'Devolución en proceso', devuelto: 'Devuelto', anulado: 'Sin cobro' }[estado],
    metodo: estado === 'pendiente' ? 'efectivo' : 'tarjeta', detalle: estado === 'pendiente' ? 'Efectivo al recibir' : 'Visa terminada en 4321',
    total: 32000, referencia: estado === 'pendiente' ? null : 'TX-1048', pagadoEn: estado === 'pendiente' ? null : '2026-11-04T15:42:00.000Z', devolucion: null, ...extra
});
const pedido = (estadoPedido, pago, extra = {}) => ({
    id: 48, numero: 'SF-1048', estado: estadoPedido, subtotal: 28200, domicilio: 3800, total: 32000,
    metodoPago: pago.metodo, pagoDetalle: pago.detalle, pagoEstado: pago.estado, pago,
    direccion: { alias: 'Casa', nombre: 'Ana Pérez', linea: 'Calle 10 # 5-20', ciudad: 'Popayán', telefono: '3001234567' },
    repartidor: null, devolucionIniciada: pago.estado === 'devolucion_en_proceso', creadoEn: '2026-11-04T15:42:00.000Z', canceladoEn: estadoPedido === 'cancelado' ? '2026-11-04T16:20:00.000Z' : null, entregadoEn: null,
    etapas: [{ clave: 'recibido', hora: '2026-11-04T15:42:00.000Z', completada: true }], llegadaEstimada: null,
    puedeCancelar: estadoPedido === 'recibido', productos: 1, unidades: 2,
    items: [{ id: 1, productoId: 1, nombre: 'Tomate', imagen: '/images/tomate.webp', unidad: 'lb', precioUnitario: 3000, cantidad: 2, subtotal: 6000 }], ...extra
});

beforeEach(() => ponerSesion(SESION_CLIENTE));

// ------------------------------------------------------------------ E4-HU1: realizar el pago (Carrito)
describe('E4-HU1 Realizar el pago', () => {
    const montar = (rutas = {}) => {
        const f = simularFetch({
            'GET /api/productos': { json: [TOMATE] },
            'GET /api/clientes/1': { json: CLIENTE_API },
            'GET /api/metodos-pago': { json: { metodos: [VISA, MASTER] } },
            ...rutas
        });
        renderEnRutas([
            { path: '/carrito', element: <Carrito /> },
            { path: '/pedido-creado/:id', element: <div>creado</div> },
            { path: '/metodos-pago', element: <div>metodos</div> }
        ], '/carrito');
        return f;
    };
    const listo = async () => { await screen.findByText(/Calle 10 # 5-20/); };

    it('solo ofrece los métodos de los mockups: tarjeta y efectivo (ya no hay Mercado Pago)', async () => {
        agregarAlCarrito(TOMATE);
        montar();
        await listo();
        const radios = screen.getAllByRole('radio').map((r) => r.getAttribute('aria-label') || r.textContent);
        expect(screen.getByRole('radio', { name: /tarjeta de crédito o débito/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /efectivo al recibir/i })).toBeInTheDocument();
        expect(radios.join(' ')).not.toMatch(/mercado pago/i);
    });

    it('ESC1 tarjeta: la predeterminada viene elegida y el pedido se envía con metodoPagoId', async () => {
        agregarAlCarrito(TOMATE);
        const f = montar({ 'POST /api/pedidos': { status: 201, json: { mensajePago: 'Pago realizado correctamente', pedido: pedido('recibido', pagoDe('aprobado')) } } });
        await listo();
        await userEvent.click(screen.getByRole('radio', { name: /tarjeta de crédito o débito/i }));
        const visa = await screen.findByRole('radio', { name: /visa terminada en 4321/i });
        expect(visa).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: /mastercard terminada en 4444/i })).toHaveAttribute('aria-checked', 'false');
        await userEvent.click(screen.getByRole('button', { name: /realizar pedido/i }));
        await waitFor(() => expect(rutaActual()).toBe('/pedido-creado/48'));
        const cuerpo = JSON.parse(llamadasA(f, 'POST /api/pedidos')[0][1].body);
        expect(cuerpo).toMatchObject({ metodoPago: 'tarjeta', metodoPagoId: 7 });
        expect(leerCarrito()).toEqual([]);
    });

    it('se puede elegir otra de las tarjetas guardadas', async () => {
        agregarAlCarrito(TOMATE);
        const f = montar({ 'POST /api/pedidos': { status: 201, json: { pedido: pedido('recibido', pagoDe('aprobado')) } } });
        await listo();
        await userEvent.click(screen.getByRole('radio', { name: /tarjeta de crédito o débito/i }));
        await userEvent.click(await screen.findByRole('radio', { name: /mastercard terminada en 4444/i }));
        await userEvent.click(screen.getByRole('button', { name: /realizar pedido/i }));
        await waitFor(() => expect(llamadasA(f, 'POST /api/pedidos')).toHaveLength(1));
        expect(JSON.parse(llamadasA(f, 'POST /api/pedidos')[0][1].body).metodoPagoId).toBe(8);
    });

    it('ESC2 efectivo: no pide tarjeta y envía metodoPago "efectivo" sin metodoPagoId', async () => {
        agregarAlCarrito(TOMATE);
        const f = montar({ 'GET /api/metodos-pago': { json: { metodos: [] } }, 'POST /api/pedidos': { status: 201, json: { pedido: pedido('recibido', pagoDe('pendiente')) } } });
        await listo();
        await userEvent.click(screen.getByRole('radio', { name: /efectivo al recibir/i }));
        await userEvent.click(screen.getByRole('button', { name: /realizar pedido/i }));
        await waitFor(() => expect(rutaActual()).toBe('/pedido-creado/48'));
        const cuerpo = JSON.parse(llamadasA(f, 'POST /api/pedidos')[0][1].body);
        expect(cuerpo.metodoPago).toBe('efectivo');
        expect(cuerpo).not.toHaveProperty('metodoPagoId');
    });

    it('ESC3 pago rechazado: muestra el mensaje y "Cargo no realizado", NO navega y el carrito queda igual', async () => {
        agregarAlCarrito(TOMATE);
        agregarAlCarrito(TOMATE);
        montar({
            'POST /api/pedidos': {
                status: 402,
                json: {
                    mensaje: 'No se pudo procesar el pago. Intenta nuevamente o prueba con otro método de pago.',
                    detalle: 'No se ha realizado ningún cargo en tu tarjeta. Tu cesta sigue guardada.',
                    intento: { referencia: 'INT-123456', fecha: '2026-11-04T15:42:00.000Z' }
                }
            }
        });
        await listo();
        await userEvent.click(screen.getByRole('radio', { name: /tarjeta de crédito o débito/i }));
        await screen.findByRole('radio', { name: /visa terminada en 4321/i });
        await userEvent.click(screen.getByRole('button', { name: /realizar pedido/i }));
        expect(await screen.findByText(/No se pudo procesar el pago\. Intenta nuevamente o prueba con otro método de pago\./)).toBeInTheDocument();
        expect(screen.getByText(/No se ha realizado ningún cargo/)).toBeInTheDocument();
        expect(screen.getByText('Cargo no realizado')).toBeInTheDocument();
        expect(screen.getByText(/INT-123456/)).toBeInTheDocument();
        expect(rutaActual()).toBe('/carrito');
        expect(leerCarrito()).toHaveLength(1);
        expect(leerCarrito()[0].cantidad).toBe(2);
        // "Prueba con otro método de pago": puede cambiar a efectivo y reintentar con el mismo carrito.
        expect(screen.getByRole('radio', { name: /efectivo al recibir/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /realizar pedido/i })).toBeEnabled();
    });

    it('con tarjeta y sin tarjetas guardadas: avisa y lleva a agregar una (volviendo al carrito)', async () => {
        agregarAlCarrito(TOMATE);
        const f = montar({ 'GET /api/metodos-pago': { json: { metodos: [] } } });
        await listo();
        await userEvent.click(screen.getByRole('radio', { name: /tarjeta de crédito o débito/i }));
        expect(await screen.findByText(/aún no tienes tarjetas guardadas/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /agregar tarjeta/i })).toHaveAttribute('href', '/metodos-pago?volver=carrito');
        await userEvent.click(screen.getByRole('button', { name: /realizar pedido/i }));
        expect(await screen.findByText(/selecciona una tarjeta guardada o agrega una nueva/i)).toBeInTheDocument();
        expect(llamadasA(f, 'POST /api/pedidos')).toHaveLength(0);
    });

    it('"Cambiar o agregar tarjeta" lleva a Métodos de pago', async () => {
        agregarAlCarrito(TOMATE);
        montar();
        await listo();
        await userEvent.click(screen.getByRole('radio', { name: /tarjeta de crédito o débito/i }));
        await userEvent.click(await screen.findByRole('link', { name: /cambiar o agregar tarjeta/i }));
        expect(rutaActual()).toBe('/metodos-pago');
    });
});

// ------------------------------------------------------------------ E4-HU3: métodos de pago
describe('E4-HU3 Gestionar métodos de pago', () => {
    const montar = (rutas = {}, inicial = '/metodos-pago') => {
        const f = simularFetch({ 'GET /api/metodos-pago': { json: { metodos: [VISA] } }, ...rutas });
        renderEnRutas([{ path: '/metodos-pago', element: <MetodosPago /> }, { path: '/carrito', element: <div>carrito</div> }], inicial);
        return f;
    };
    const llenar = async ({ titular = 'Lucía Martínez', numero = '4242424242424242', vence = '0840', cvv = '123' } = {}) => {
        if (titular) await userEvent.type(screen.getByLabelText('Titular de la tarjeta'), titular);
        if (numero) await userEvent.type(screen.getByLabelText('Número de tarjeta'), numero);
        if (vence) await userEvent.type(screen.getByLabelText('Fecha de vencimiento'), vence);
        if (cvv) await userEvent.type(screen.getByLabelText('Código de seguridad'), cvv);
    };

    it('lista las tarjetas guardadas solo con tipo y últimos 4 dígitos', async () => {
        montar();
        expect(await screen.findByText('Visa terminada en 4321')).toBeInTheDocument();
        expect(screen.getByText('Predeterminada')).toBeInTheDocument();
        expect(screen.getByText(/1 tarjeta/)).toBeInTheDocument();
    });

    it('ESC1 agregar con éxito: da formato mientras escribe, envía los datos, muestra el mensaje y lista la tarjeta', async () => {
        const nueva = { ...MASTER, id: 9, ultimos4: '4242', marca: 'visa', marcaEtiqueta: 'Visa', descripcion: 'Visa terminada en 4242', predeterminada: false };
        const f = montar({ 'POST /api/metodos-pago': { status: 201, json: { mensaje: 'Método de pago agregado correctamente', metodo: nueva, metodos: [VISA, nueva] } } });
        await screen.findByText('Visa terminada en 4321');
        await llenar();
        expect(screen.getByLabelText('Número de tarjeta')).toHaveValue('4242 4242 4242 4242');
        expect(screen.getByLabelText('Fecha de vencimiento')).toHaveValue('08/40');
        await userEvent.click(screen.getByRole('button', { name: /agregar tarjeta/i }));
        expect(await screen.findByText('Método de pago agregado correctamente')).toBeInTheDocument();
        const cuerpo = JSON.parse(llamadasA(f, 'POST /api/metodos-pago')[0][1].body);
        expect(cuerpo).toMatchObject({ titular: 'Lucía Martínez', numero: '4242 4242 4242 4242', vencimiento: '08/40', cvv: '123', predeterminada: false });
        expect(screen.getByText('Visa terminada en 4242')).toBeInTheDocument();
        expect(screen.getByText(/2 tarjetas/)).toBeInTheDocument();
        expect(screen.getByLabelText('Número de tarjeta')).toHaveValue('');     // el formulario se limpia
    });

    it('ESC2 campos en blanco: no llama al servidor y marca cada campo con "Este campo es obligatorio"', async () => {
        const f = montar();
        await screen.findByText('Visa terminada en 4321');
        await userEvent.click(screen.getByRole('button', { name: /agregar tarjeta/i }));
        expect(screen.getAllByText('Este campo es obligatorio')).toHaveLength(4);
        expect(screen.getByText('Revisa los datos de tu tarjeta.')).toBeInTheDocument();
        expect(screen.getByLabelText('Titular de la tarjeta')).toHaveAttribute('aria-invalid', 'true');
        expect(llamadasA(f, 'POST /api/metodos-pago')).toHaveLength(0);
    });

    it('ESC2 tarjeta inválida: "Tarjeta inválida" y se queda en la misma pantalla', async () => {
        const f = montar();
        await screen.findByText('Visa terminada en 4321');
        await llenar({ numero: '1234567890' });
        await userEvent.click(screen.getByRole('button', { name: /agregar tarjeta/i }));
        expect(screen.getByText('Tarjeta inválida')).toBeInTheDocument();
        expect(screen.getByLabelText('Número de tarjeta')).toHaveAttribute('aria-invalid', 'true');
        expect(llamadasA(f, 'POST /api/metodos-pago')).toHaveLength(0);
        expect(rutaActual()).toBe('/metodos-pago');
    });

    it('ESC2 tarjeta vencida: lo avisa antes de enviar', async () => {
        montar();
        await screen.findByText('Visa terminada en 4321');
        await llenar({ vence: '0120' });
        await userEvent.click(screen.getByRole('button', { name: /agregar tarjeta/i }));
        expect(screen.getByText('La tarjeta está vencida')).toBeInTheDocument();
    });

    it('si el servidor rechaza los datos, muestra sus mensajes por campo', async () => {
        montar({ 'POST /api/metodos-pago': { status: 400, json: { mensaje: 'Revisa los datos de tu tarjeta.', errores: { numero: 'Tarjeta inválida' } } } });
        await screen.findByText('Visa terminada en 4321');
        await llenar();
        await userEvent.click(screen.getByRole('button', { name: /agregar tarjeta/i }));
        expect(await screen.findByText('Tarjeta inválida')).toBeInTheDocument();
    });

    it('ESC3 eliminar: pide confirmación, luego muestra el mensaje y el estado vacío', async () => {
        const f = montar({ 'DELETE /api/metodos-pago/7': { json: { mensaje: 'Método de pago eliminado correctamente', metodos: [] } } });
        await screen.findByText('Visa terminada en 4321');
        await userEvent.click(screen.getByRole('button', { name: /eliminar visa terminada en 4321/i }));
        const dialogo = screen.getByRole('dialog');
        expect(within(dialogo).getByText('¿Eliminar método de pago?')).toBeInTheDocument();
        expect(llamadasA(f, 'DELETE /api/metodos-pago/7')).toHaveLength(0);       // todavía no: falta confirmar
        await userEvent.click(within(dialogo).getByRole('button', { name: 'Eliminar' }));
        expect(await screen.findByText('Método de pago eliminado correctamente')).toBeInTheDocument();
        expect(screen.getByText('Aún no tienes tarjetas guardadas')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByText('Visa terminada en 4321')).not.toBeInTheDocument();
    });

    it('ESC3 cancelar en la confirmación no elimina nada', async () => {
        const f = montar();
        await screen.findByText('Visa terminada en 4321');
        await userEvent.click(screen.getByRole('button', { name: /eliminar visa terminada en 4321/i }));
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(llamadasA(f, 'DELETE /api/metodos-pago/7')).toHaveLength(0);
        expect(screen.getByText('Visa terminada en 4321')).toBeInTheDocument();
    });

    it('si eliminar falla muestra el error dentro de la ventana y permite reintentar', async () => {
        montar({ 'DELETE /api/metodos-pago/7': { status: 500, json: { mensaje: 'Error interno del servidor.' } } });
        await screen.findByText('Visa terminada en 4321');
        await userEvent.click(screen.getByRole('button', { name: /eliminar visa terminada en 4321/i }));
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));
        expect(await within(screen.getByRole('dialog')).findByText('Error interno del servidor.')).toBeInTheDocument();
        expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
        expect(screen.getAllByText('Visa terminada en 4321').length).toBeGreaterThan(0);   // la tarjeta sigue guardada
    });

    it('viniendo del carrito muestra "Volver al carrito"', async () => {
        montar({}, '/metodos-pago?volver=carrito');
        await screen.findByText('Visa terminada en 4321');
        await userEvent.click(screen.getByRole('link', { name: /volver al carrito/i }));
        expect(rutaActual()).toBe('/carrito');
    });
});

// ------------------------------------------------------------------ E4-HU2: estado del pago
describe('E4-HU2 Consultar el estado de pago', () => {
    const montar = (p) => {
        simularFetch({ 'GET /api/pedidos/48': { json: { pedido: p } } });
        renderEnRutas([{ path: '/pedidos/:id', element: <SeguimientoPedido /> }, { path: '/pedidos', element: <div>historial</div> }], '/pedidos/48');
    };

    it('ESC1 aprobado: estado "Aprobado", método, referencia y total', async () => {
        montar(pedido('recibido', pagoDe('aprobado')));
        expect(await screen.findByText('Tu pago está aprobado')).toBeInTheDocument();
        const resumen = screen.getByRole('region', { name: 'Resumen del pago' });
        expect(within(resumen).getByText('Estado: Aprobado')).toBeInTheDocument();
        expect(within(resumen).getByText('Visa terminada en 4321')).toBeInTheDocument();
        expect(within(resumen).getByText('TX-1048')).toBeInTheDocument();
        expect(within(resumen).getByText('$ 32.000 COP')).toBeInTheDocument();
    });

    it('ESC2 efectivo: estado "Pendiente", se paga al recibir y muestra el total a pagar', async () => {
        montar(pedido('recibido', pagoDe('pendiente')));
        expect(await screen.findByText('Estado: Pago Pendiente.')).toBeInTheDocument();
        expect(screen.getByText(/El pago se realiza al recibir el pedido/)).toBeInTheDocument();
        const resumen = screen.getByRole('region', { name: 'Resumen del pago' });
        expect(within(resumen).getByText('Estado: Pendiente')).toBeInTheDocument();
        expect(within(resumen).getByText('Total a pagar')).toBeInTheDocument();
        expect(within(resumen).getByText('Efectivo al recibir')).toBeInTheDocument();
    });

    it('ESC3 cancelado con tarjeta: "Devolución en proceso" y el monto a reintegrar', async () => {
        const dev = { estado: 'devolucion_en_proceso', referencia: 'DEV-1048', monto: 32000, solicitadaEn: '2026-11-04T16:20:00.000Z', devueltoEn: null };
        montar(pedido('cancelado', pagoDe('devolucion_en_proceso', { devolucion: dev })));
        expect(await screen.findByText('Estamos gestionando tu devolución')).toBeInTheDocument();
        const resumen = screen.getByRole('region', { name: 'Resumen del pago' });
        expect(within(resumen).getByText('Estado: Devolución en proceso')).toBeInTheDocument();
        expect(within(resumen).getByText('Total a reintegrar')).toBeInTheDocument();
        const reintegro = resumen.querySelector('.pag-reintegro');
        expect(within(reintegro).getByText('$ 32.000 COP')).toBeInTheDocument();
        expect(within(resumen).getByText('DEV-1048')).toBeInTheDocument();
        expect(within(resumen).getByText(/aún no se ha completado/)).toBeInTheDocument();
    });

    it('ESC3 cuando ya se reintegró: "Devuelto"', async () => {
        const dev = { estado: 'devuelto', referencia: 'DEV-1048', monto: 32000, solicitadaEn: '2026-11-04T16:20:00.000Z', devueltoEn: '2026-11-06T12:00:00.000Z' };
        montar(pedido('cancelado', pagoDe('devuelto', { devolucion: dev })));
        expect(await screen.findByText('Devolución completada')).toBeInTheDocument();
        const resumen = screen.getByRole('region', { name: 'Resumen del pago' });
        expect(within(resumen).getByText('Estado: Devuelto')).toBeInTheDocument();
        expect(within(resumen).getByText('Total reintegrado')).toBeInTheDocument();
    });

    it('cancelado en efectivo: "Sin cobro", sin devolución', async () => {
        montar(pedido('cancelado', pagoDe('anulado', { metodo: 'efectivo', detalle: 'Efectivo al recibir' })));
        expect(await screen.findByText('Sin cobro')).toBeInTheDocument();
        expect(screen.queryByText(/Total a reintegrar/)).not.toBeInTheDocument();
    });
});

describe('E4 Confirmación del pedido según el pago', () => {
    const montar = (p) => {
        simularFetch({ 'GET /api/pedidos/48': { json: { pedido: p } } });
        renderEnRutas([{ path: '/pedido-creado/:id', element: <PedidoCreado /> }], '/pedido-creado/48');
    };
    it('tarjeta aprobada: "Pago realizado correctamente"', async () => {
        montar(pedido('recibido', pagoDe('aprobado')));
        expect(await screen.findByText('Pago realizado correctamente')).toBeInTheDocument();
        expect(screen.getByText(/ya está confirmado/)).toBeInTheDocument();
        expect(screen.getByText(/Pago aprobado con Visa terminada en 4321/)).toBeInTheDocument();
    });
    it('efectivo: aviso de pago pendiente con el importe exacto', async () => {
        montar(pedido('recibido', pagoDe('pendiente')));
        expect(await screen.findByText('Estado: Pago Pendiente.')).toBeInTheDocument();
        expect(screen.getByText(/importe exacto de \$ 32\.000 COP/)).toBeInTheDocument();
        expect(screen.queryByText('Pago realizado correctamente')).not.toBeInTheDocument();
    });
});

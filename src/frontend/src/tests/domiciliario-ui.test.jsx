// Pruebas del portal del domiciliario (E5-HU1, E5-HU2, E5-HU3).
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MisPedidos from '../pages/domiciliario/MisPedidos';
import DetallePedido from '../pages/domiciliario/DetallePedido';
import HistorialEntregas from '../pages/domiciliario/HistorialEntregas';
import PerfilDomiciliario from '../pages/domiciliario/PerfilDomiciliario';
import DomiciliarioLayout from '../components/domiciliario/DomiciliarioLayout';
import { DomiciliarioAvisosProvider } from '../context/DomiciliarioAvisosContext';
import { renderEnRutas, simularFetch, llamadasA, ponerSesion, SESION_DOMICILIARIO } from './utils.jsx';

const conAvisos = (el) => <DomiciliarioAvisosProvider>{el}</DomiciliarioAvisosProvider>;

const domPedido = (estado, extra = {}) => ({
    id: 7, numero: 'SF-1007', estado,
    subtotal: 27000, domicilio: 5000, total: 32000,
    metodoPago: 'tarjeta', pagoDetalle: 'Visa ···· 4242', pagoEstado: 'aprobado',
    direccion: { alias: 'Casa', nombre: 'Ana Pérez', linea: 'Carrera 15 # 63-42, apto. 302', ciudad: 'Bogotá', telefono: '310 555 0182', indicaciones: '' },
    clienteNombre: 'Ana Pérez', clienteTelefono: '310 555 0182',
    entregaEstimada: '2026-11-20T15:45:00.000Z',
    repartidor: null, devolucionIniciada: false,
    creadoEn: '2026-11-20T14:02:00.000Z', canceladoEn: null, entregadoEn: null,
    etapas: [
        { clave: 'recibido', hora: '2026-11-20T14:02:00.000Z', completada: true },
        { clave: 'preparacion', hora: estado === 'recibido' ? null : '2026-11-20T14:10:00.000Z', completada: estado !== 'recibido' },
        { clave: 'en_camino', hora: estado === 'en_camino' || estado === 'entregado' ? '2026-11-20T14:25:00.000Z' : null, completada: estado === 'en_camino' || estado === 'entregado' },
        { clave: 'entregado', hora: estado === 'entregado' ? '2026-11-20T14:48:00.000Z' : null, completada: estado === 'entregado' }
    ],
    llegadaEstimada: null, puedeCancelar: false,
    productos: 3, unidades: 5,
    items: [
        { id: 1, productoId: 1, nombre: 'Tomate Chonto', imagen: '/images/tomate-chonto.webp', unidad: 'lb', precioUnitario: 5000, cantidad: 2, subtotal: 10000 },
        { id: 2, productoId: 2, nombre: 'Aguacate Hass', imagen: '/images/producto-defecto.webp', unidad: 'lb', precioUnitario: 9000, cantidad: 1, subtotal: 9000 },
        { id: 3, productoId: 3, nombre: 'Banano criollo', imagen: '/images/producto-defecto.webp', unidad: 'lb', precioUnitario: 4000, cantidad: 2, subtotal: 8000 }
    ],
    ...extra
});

const respuestaLista = (pedidos, resumen = {}) => ({
    json: {
        pedidos,
        resumen: { porRecoger: 0, enCamino: 0, entregadosHoy: 0, ...resumen },
        total: pedidos.length
    }
});

beforeEach(() => ponerSesion(SESION_DOMICILIARIO));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('E5-HU2 Mis pedidos asignados', () => {
    const montar = (rutas = {}) => {
        const f = simularFetch({ 'GET /api/domicilios/pedidos?vista=activos': respuestaLista([], {}), ...rutas });
        renderEnRutas([
            { path: '/domiciliario/pedidos', element: conAvisos(<MisPedidos />) },
            { path: '/domiciliario/pedidos/:id', element: <div>detalle</div> }
        ], '/domiciliario/pedidos');
        return f;
    };

    it('muestra título, contadores y la lista ordenada por hora estimada', async () => {
        const tarde = domPedido('preparacion', { id: 8, numero: 'SF-1008', entregaEstimada: '2026-11-20T16:30:00.000Z' });
        const pronto = domPedido('en_camino', { id: 7, numero: 'SF-1007', entregaEstimada: '2026-11-20T15:45:00.000Z' });
        montar({
            'GET /api/domicilios/pedidos?vista=activos': respuestaLista([pronto, tarde], { porRecoger: 1, enCamino: 1, entregadosHoy: 2 })
        });
        expect(await screen.findByText('Mis pedidos asignados')).toBeInTheDocument();
        expect(screen.getByText('Gestiona tus entregas de hoy y consulta la información de cada pedido.')).toBeInTheDocument();
        expect(screen.getByText('Por recoger')).toBeInTheDocument();
        expect(screen.getAllByText('En camino').length).toBeGreaterThan(0);
        expect(screen.getByText('Entregados hoy')).toBeInTheDocument();
        const filas = document.querySelectorAll('.dom-pedido');
        expect(filas).toHaveLength(2);
        expect(filas[0].dataset.pedido).toBe('SF-1007');
        expect(filas[1].dataset.pedido).toBe('SF-1008');
        expect(screen.getAllByRole('link', { name: /Ver detalle/ })).toHaveLength(2);
        expect(screen.getByText(/Revisa las indicaciones del cliente/)).toBeInTheDocument();
    });

    it('estado vacío: ilustración, textos y píldora de disponibilidad', async () => {
        montar();
        expect(await screen.findByText('No tienes pedidos asignados por el momento')).toBeInTheDocument();
        expect(screen.getByText('Te avisaremos cuando se te asigne un nuevo pedido')).toBeInTheDocument();
        expect(screen.getByText('Disponible para nuevas entregas')).toBeInTheDocument();
    });

    it('pedido cancelado: banner de aviso y fila atenuada con "Iniciar entrega" deshabilitado', async () => {
        const cancelado = domPedido('cancelado', { canceladoEn: '2026-11-20T15:00:00.000Z' });
        montar({ 'GET /api/domicilios/pedidos?vista=activos': respuestaLista([cancelado], {}) });
        expect(await screen.findByText(/El cliente canceló el pedido #SF-1007\. Fue retirado de tus entregas pendientes/)).toBeInTheDocument();
        expect(screen.getByText('Pedidos del día')).toBeInTheDocument();
        const fila = document.querySelector('.dom-pedido');
        expect(fila.className).toContain('dom-pedido-cancelado');
        expect(within(fila).getByRole('button', { name: 'Iniciar entrega' })).toBeDisabled();
        expect(within(fila).queryByRole('link', { name: /Ver detalle/ })).not.toBeInTheDocument();
    });

    it('nuevo pedido asignado: toast, badge "Nuevo" y contador actualizado', async () => {
        vi.stubEnv('VITE_DOMICILIARIO_POLL_MS', '50');
        const primero = domPedido('preparacion', { id: 7, numero: 'SF-1007' });
        const nuevo = domPedido('preparacion', { id: 9, numero: 'SF-1009', entregaEstimada: '2026-11-20T15:10:00.000Z' });
        let llamadas = 0;
        simularFetch({
            'GET /api/domicilios/pedidos?vista=activos': () => (++llamadas === 1
                ? respuestaLista([primero], { porRecoger: 1 })
                : respuestaLista([nuevo, primero], { porRecoger: 2 }))
        });
        renderEnRutas([
            { path: '/domiciliario/pedidos', element: conAvisos(<MisPedidos />) },
            { path: '/domiciliario/pedidos/:id', element: <div>detalle</div> }
        ], '/domiciliario/pedidos');
        await screen.findByText('#SF-1007');
        expect(await screen.findByText('Tienes un nuevo pedido asignado', {}, { timeout: 3000 })).toBeInTheDocument();
        expect(screen.getByText('Consulta los detalles para preparar tu entrega.')).toBeInTheDocument();
        const filaNueva = document.querySelector('.dom-pedido.nuevo');
        expect(filaNueva).toBeTruthy();
        expect(within(filaNueva).getByText('Nuevo')).toBeInTheDocument();
    });

    it('la búsqueda filtra por número de pedido o dirección', async () => {
        const a = domPedido('preparacion', { id: 7, numero: 'SF-1007' });
        const b = domPedido('preparacion', { id: 8, numero: 'SF-1008', direccion: { ...a.direccion, linea: 'Calle 85 # 19-22', ciudad: 'Cali' } });
        simularFetch({ 'GET /api/domicilios/pedidos?vista=activos': respuestaLista([a, b], {}) });
        renderEnRutas([
            { path: '/domiciliario/pedidos', element: conAvisos(<MisPedidos />) }
        ], '/domiciliario/pedidos?busqueda=SF-1007');
        await screen.findByText('#SF-1007');
        expect(document.querySelectorAll('.dom-pedido')).toHaveLength(1);
        expect(screen.queryByText('#SF-1008')).not.toBeInTheDocument();
    });
});

describe('E5-HU1 Detalle: iniciar y confirmar entrega', () => {
    const montarDetalle = (pedido, extras = {}) => {
        const f = simularFetch({
            [`GET /api/domicilios/pedidos/${pedido.id}`]: { json: { pedido } },
            ...extras
        });
        renderEnRutas([
            { path: '/domiciliario/pedidos/:id', element: <DetallePedido /> },
            { path: '/domiciliario/pedidos', element: <div>lista</div> }
        ], `/domiciliario/pedidos/${pedido.id}`);
        return f;
    };

    it('en preparación: "Iniciar entrega" habilitado, "Confirmar entrega" deshabilitado y aviso', async () => {
        montarDetalle(domPedido('preparacion'));
        expect(await screen.findByText('Detalle del pedido')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Iniciar entrega' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeDisabled();
        expect(screen.getByText('Primero debes iniciar la entrega para poder confirmarla')).toBeInTheDocument();
        expect(screen.getAllByText('En preparación').length).toBeGreaterThan(0);
    });

    it('iniciar entrega llama al backend y muestra "Estado actualizado correctamente"', async () => {
        const pedido = domPedido('preparacion');
        const enCamino = domPedido('en_camino', { repartidor: { nombre: 'Carlos Ruiz', vehiculo: 'Moto', telefono: '310 555 0194' } });
        const f = montarDetalle(pedido, { 'POST /api/domicilios/pedidos/7/iniciar': { json: { mensaje: 'Estado actualizado correctamente', pedido: enCamino } } });
        await screen.findByText('Detalle del pedido');
        await userEvent.click(screen.getByRole('button', { name: 'Iniciar entrega' }));
        await waitFor(() => expect(llamadasA(f, 'POST /api/domicilios/pedidos/7/iniciar')).toHaveLength(1));
        expect(await screen.findByText('Estado actualizado correctamente')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Iniciar entrega' })).toBeDisabled();
    });

    it('confirmar entrega pide confirmación en modal y luego marca "Entregado"', async () => {
        const pedido = domPedido('en_camino');
        const entregado = domPedido('entregado', { entregadoEn: '2026-11-20T14:48:00.000Z' });
        const f = montarDetalle(pedido, { 'POST /api/domicilios/pedidos/7/confirmar': { json: { mensaje: 'Pedido entregado correctamente', pedido: entregado } } });
        await screen.findByText('Detalle del pedido asignado');
        await userEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
        expect(await screen.findByText('¿Confirmas que entregaste el pedido #SF-1007?')).toBeInTheDocument();
        expect(screen.getByText(/Confirma solo cuando el cliente haya recibido todos los productos/)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
        await waitFor(() => expect(llamadasA(f, 'POST /api/domicilios/pedidos/7/confirmar')).toHaveLength(1));
        expect(await screen.findByText('Pedido entregado correctamente')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Iniciar entrega' })).toBeDisabled();
    });

    it('ESC4: error del servidor muestra aviso y no cambia el estado', async () => {
        montarDetalle(domPedido('preparacion'), {
            'POST /api/domicilios/pedidos/7/iniciar': { status: 500, json: { mensaje: 'Error interno del servidor.' } }
        });
        await screen.findByText('Detalle del pedido');
        await userEvent.click(screen.getByRole('button', { name: 'Iniciar entrega' }));
        expect(await screen.findByText(/No se pudo actualizar el estado del pedido/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Iniciar entrega' })).toBeEnabled();
        expect(screen.getAllByText('En preparación').length).toBeGreaterThan(0);
    });
});

describe('E5-HU3 Información del pedido y pago', () => {
    const montarDetalle = (pedido, extras = {}) => {
        simularFetch({ [`GET /api/domicilios/pedidos/${pedido.id}`]: { json: { pedido } }, ...extras });
        renderEnRutas([
            { path: '/domiciliario/pedidos/:id', element: <DetallePedido /> },
            { path: '/domiciliario/pedidos', element: <div>lista</div> }
        ], `/domiciliario/pedidos/${pedido.id}`);
    };

    it('pedido pagado en línea: muestra productos, dirección, cliente, pago aprobado y aviso de no cobro', async () => {
        montarDetalle(domPedido('en_camino'));
        expect(await screen.findByText('Productos del pedido')).toBeInTheDocument();
        expect(screen.getByText('Tomate Chonto')).toBeInTheDocument();
        expect(screen.getByText('Datos de entrega')).toBeInTheDocument();
        expect(screen.getByText('Carrera 15 # 63-42, apto. 302')).toBeInTheDocument();
        expect(screen.getByText('Datos del cliente')).toBeInTheDocument();
        expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
        expect(screen.getByText('Resumen del pago')).toBeInTheDocument();
        expect(screen.getByText('Aprobado')).toBeInTheDocument();
        expect(screen.getByText('Este pedido ya fue pagado. No debes realizar ningún cobro')).toBeInTheDocument();
        expect(screen.getByText('Pagado por adelantado · No debes realizar ningún cobro')).toBeInTheDocument();
    });

    it('pedido en efectivo: resalta el valor a cobrar y pago pendiente', async () => {
        const efectivo = domPedido('en_camino', { metodoPago: 'efectivo', pagoDetalle: 'Efectivo', pagoEstado: 'pendiente' });
        montarDetalle(efectivo);
        expect(await screen.findByText(/Pago en efectivo: cobrar \$ 32\.000 COP al entregar/)).toBeInTheDocument();
        expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0);
        expect(screen.getByText('Pago en efectivo · Cobrar al entregar')).toBeInTheDocument();
    });

    it('botón "Llamar" abre el modal de contacto con enlace tel:', async () => {
        montarDetalle(domPedido('en_camino'));
        await screen.findByText('Detalle del pedido asignado');
        await userEvent.click(screen.getByRole('button', { name: 'Llamar' }));
        expect(await screen.findByText('Contactar al cliente')).toBeInTheDocument();
        expect(screen.getByText('Coordina los detalles de la entrega con tu cliente.')).toBeInTheDocument();
        expect(screen.getAllByText('310 555 0182').length).toBeGreaterThan(0);
        const enlace = screen.getByRole('link', { name: /Llamar/ });
        expect(enlace).toHaveAttribute('href', expect.stringContaining('tel:'));
        await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
        await waitFor(() => expect(screen.queryByText('Contactar al cliente')).not.toBeInTheDocument());
    });
});

describe('Historial y perfil del domiciliario', () => {
    it('historial lista entregados y cancelados', async () => {
        simularFetch({
            'GET /api/domicilios/pedidos?vista=historial': respuestaLista([
                domPedido('entregado', { id: 5, numero: 'SF-1005', entregadoEn: '2026-11-20T14:48:00.000Z' }),
                domPedido('cancelado', { id: 6, numero: 'SF-1006', canceladoEn: '2026-11-20T13:00:00.000Z' })
            ], {})
        });
        renderEnRutas([{ path: '/domiciliario/historial', element: <HistorialEntregas /> }], '/domiciliario/historial');
        expect(await screen.findByText('Historial de entregas')).toBeInTheDocument();
        expect(screen.getByText('#SF-1005')).toBeInTheDocument();
        expect(screen.getByText('#SF-1006')).toBeInTheDocument();
        expect(screen.getAllByText('Entregado').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Cancelado').length).toBeGreaterThan(0);
    });

    it('perfil muestra los datos del domiciliario', async () => {
        simularFetch({ 'GET /api/domicilios/perfil': { json: { domiciliario: { id: 1, nombre: 'Carlos Ruiz', correo: 'domicilio@samifruver.com', telefono: '310 555 0194', vehiculo: 'Moto' } } } });
        renderEnRutas([{ path: '/domiciliario/perfil', element: <PerfilDomiciliario /> }], '/domiciliario/perfil');
        expect(await screen.findByText('Carlos Ruiz')).toBeInTheDocument();
        expect(screen.getByText('domicilio@samifruver.com')).toBeInTheDocument();
        expect(screen.getAllByText('Moto').length).toBeGreaterThan(0);
    });

    it('el layout muestra menú, buscador y campana', async () => {
        simularFetch({ 'GET /api/domicilios/perfil': { json: { domiciliario: { id: 1, nombre: 'Carlos Ruiz' } } } });
        renderEnRutas([{ path: '/domiciliario/perfil', element: <DomiciliarioLayout /> }, { path: '/domiciliario/pedidos', element: <div>pedidos</div> }], '/domiciliario/perfil');
        expect(await screen.findAllByText('Pedidos asignados')).not.toHaveLength(0);
        expect(screen.getByPlaceholderText('Buscar por número de pedido o dirección')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /avisos/i })).toBeInTheDocument();
        expect(screen.getAllByText('Carlos Ruiz').length).toBeGreaterThan(0);
    });
});

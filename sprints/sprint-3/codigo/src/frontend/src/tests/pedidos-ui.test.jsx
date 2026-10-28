import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Carrito from '../pages/public/Carrito';
import PedidoCreado from '../pages/public/PedidoCreado';
import Pedidos from '../pages/public/Pedidos';
import SeguimientoPedido from '../pages/public/SeguimientoPedido';
import ProductCard from '../components/public/ProductCard';
import Navbar from '../components/public/Navbar';
import { agregarAlCarrito, leerCarrito } from '../utils/carrito';
import { renderEnRutas, simularFetch, llamadasA, ponerSesion, SESION_CLIENTE } from './utils.jsx';

const rutaActual = () => screen.getByTestId('ruta-actual').textContent;

const TOMATE = { id: 1, nombre: 'Tomate', precio: 3000, unidad: 'lb', imagen: '/images/tomate.webp', stock: 3 };
const CLIENTE_API = { cliente: { id: 1, nombre: 'Ana Pérez', telefono: '3001234567', direccion: 'Calle 10 # 5-20', ciudad: 'Popayán' } };
const PRODUCTOS_API = [{ ...TOMATE }];

const base = (estado, extra = {}) => ({
    id: 3, numero: 'SF-1003', estado, subtotal: 6000, domicilio: 5000, total: 11000,
    metodoPago: 'tarjeta', pagoDetalle: 'Visa ···· 4242',
    direccion: { alias: 'Casa', nombre: 'Ana Pérez', linea: 'Calle 10 # 5-20', ciudad: 'Popayán', telefono: '3001234567' },
    repartidor: null, devolucionIniciada: false,
    creadoEn: '2026-10-24T15:00:00.000Z', canceladoEn: null, entregadoEn: null,
    etapas: [{ clave: 'recibido', hora: '2026-10-24T15:00:00.000Z', completada: true }],
    llegadaEstimada: null, puedeCancelar: estado === 'recibido' || estado === 'preparacion',
    productos: 1, unidades: 2,
    items: [{ id: 1, productoId: 1, nombre: 'Tomate', imagen: '/images/tomate.webp', unidad: 'lb', precioUnitario: 3000, cantidad: 2, subtotal: 6000 }],
    ...extra
});

beforeEach(() => ponerSesion(SESION_CLIENTE));

describe('E3-HU2 Carrito y creación de pedido', () => {
    const montarCarrito = (rutas = {}) => {
        const f = simularFetch({
            'GET /api/productos': { json: PRODUCTOS_API },
            'GET /api/clientes/1': { json: CLIENTE_API },
            ...rutas
        });
        renderEnRutas([
            { path: '/carrito', element: <Carrito /> },
            { path: '/pedido-creado/:id', element: <div>creado</div> },
            { path: '/', element: <div>inicio</div> }
        ], '/carrito');
        return f;
    };

    it('carrito vacío: muestra el estado vacío y no deja realizar pedido', async () => {
        montarCarrito();
        expect(await screen.findByText(/no puedes realizar un pedido sin productos/i, {}, { timeout: 2000 }).catch(() => null) || screen.getByText(/carrito está vacío|vacío/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /realizar pedido/i })).toBeDisabled();
    });

    it('agregar: el límite de stock no deja pasar de las unidades disponibles', async () => {
        agregarAlCarrito(TOMATE);
        agregarAlCarrito(TOMATE);
        agregarAlCarrito(TOMATE);
        const r = agregarAlCarrito(TOMATE);
        expect(r.ok).toBe(false);
        expect(leerCarrito()[0].cantidad).toBe(3);
    });

    it('sin método de pago: muestra el error y no llama al servidor', async () => {
        agregarAlCarrito(TOMATE);
        const f = montarCarrito();
        await screen.findByText('Productos en tu carrito');
        await screen.findByText(/Calle 10 # 5-20/);
        await userEvent.click(screen.getByRole('button', { name: /realizar pedido/i }));
        expect(await screen.findByText('Selección de método de pago es obligatorio')).toBeInTheDocument();
        expect(screen.getByText('Selecciona una opción para continuar.')).toBeInTheDocument();
        expect(llamadasA(f, 'POST /api/pedidos')).toHaveLength(0);
    });

    it('pedido exitoso: envía el pedido con el header del cliente, vacía el carrito y va a la confirmación', async () => {
        agregarAlCarrito(TOMATE);
        agregarAlCarrito(TOMATE);
        const f = montarCarrito({ 'POST /api/pedidos': { status: 201, json: { pedido: base('recibido') } } });
        await screen.findByText(/Calle 10 # 5-20/);
        await userEvent.click(screen.getByRole('radio', { name: /tarjeta/i }));
        await userEvent.click(screen.getByRole('button', { name: /realizar pedido/i }));
        await waitFor(() => expect(rutaActual()).toBe('/pedido-creado/3'));
        const [, opc] = llamadasA(f, 'POST /api/pedidos')[0];
        expect(opc.headers['X-Cliente-Id']).toBe('1');
        expect(JSON.parse(opc.body).metodoPago).toBe('tarjeta');
        expect(leerCarrito()).toEqual([]);
    });

    it('quitar un producto lo elimina del carrito', async () => {
        agregarAlCarrito(TOMATE);
        montarCarrito();
        await userEvent.click(await screen.findByRole('button', { name: /eliminar tomate/i }));
        expect(leerCarrito()).toEqual([]);
    });

    it('error 409 de stock se muestra y el carrito se conserva', async () => {
        agregarAlCarrito(TOMATE);
        montarCarrito({ 'POST /api/pedidos': { status: 409, json: { mensaje: 'No hay suficiente stock de Tomate. Disponible: 1 lb.' } } });
        await screen.findByText(/Calle 10 # 5-20/);
        await userEvent.click(screen.getByRole('radio', { name: /mercado pago/i }));
        await userEvent.click(screen.getByRole('button', { name: /realizar pedido/i }));
        expect(await screen.findByText(/No hay suficiente stock de Tomate/)).toBeInTheDocument();
        expect(leerCarrito()).toHaveLength(1);
    });
});

describe('Confirmación del pedido', () => {
    it('muestra el número y los botones', async () => {
        simularFetch({ 'GET /api/pedidos/3': { json: { pedido: base('recibido') } } });
        renderEnRutas([{ path: '/pedido-creado/:id', element: <PedidoCreado /> }, { path: '/pedidos/:id', element: <div>seg</div> }], '/pedido-creado/3');
        expect((await screen.findAllByText(/SF-1003/)).length).toBeGreaterThan(0);
        await userEvent.click(screen.getByRole('link', { name: /ver seguimiento/i }));
        expect(rutaActual()).toBe('/pedidos/3');
    });
});

describe('E3-HU3 Historial de pedidos', () => {
    const montar = () => renderEnRutas([{ path: '/pedidos', element: <Pedidos /> }, { path: '/pedidos/:id', element: <div>detalle</div> }, { path: '/', element: <div>inicio</div> }], '/pedidos');

    it('sin pedidos: estado vacío con "Ir a Inicio"', async () => {
        simularFetch({ 'GET /api/pedidos': { json: { pedidos: [] } } });
        montar();
        expect(await screen.findByText('Aún no has realizado pedidos')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /ir a inicio/i })).toHaveAttribute('href', '/');
    });

    it('lista, filtra por estado y abre el detalle', async () => {
        simularFetch({ 'GET /api/pedidos': { json: { pedidos: [base('entregado', { id: 2, numero: 'SF-1002' }), base('recibido')] } } });
        montar();
        expect(await screen.findByText('#SF-1003')).toBeInTheDocument();
        expect(screen.getByText('#SF-1002')).toBeInTheDocument();
        expect(screen.getByText(/Mostrando 2 de 2 pedidos/)).toBeInTheDocument();
        await userEvent.selectOptions(screen.getByLabelText('Filtrar por estado'), 'entregado');
        expect(screen.queryByText('#SF-1003')).not.toBeInTheDocument();
        expect(screen.getByText('#SF-1002')).toBeInTheDocument();
        await userEvent.click(screen.getByText('#SF-1002'));
        expect(rutaActual()).toBe('/pedidos/2');
    });
});

describe('E3-HU1 Seguimiento y E3-HU4 Cancelación', () => {
    const montar = (pedido, extra = {}) => {
        const f = simularFetch({ 'GET /api/pedidos/3': { json: { pedido } }, ...extra });
        renderEnRutas([{ path: '/pedidos/:id', element: <SeguimientoPedido /> }, { path: '/pedidos', element: <div>historial</div> }], '/pedidos/3');
        return f;
    };

    it('preparación: aviso de preparación y cancelar habilitado', async () => {
        montar(base('preparacion'));
        expect(await screen.findByText(/Estamos preparando tu pedido/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancelar pedido' })).toBeEnabled();
    });

    it('en camino: muestra repartidor, mapa ilustrativo y bloquea la cancelación', async () => {
        montar(base('en_camino', {
            puedeCancelar: false,
            repartidor: { nombre: 'Andrés Martínez', vehiculo: 'Bicicleta', telefono: '310 555 0194' },
            llegadaEstimada: { desde: '2026-10-24T15:30:00.000Z', hasta: '2026-10-24T15:40:00.000Z' }
        }));
        expect(await screen.findByText('Andrés Martínez')).toBeInTheDocument();
        expect(screen.getByText(/Mapa ilustrativo/)).toBeInTheDocument();
        expect(screen.getByText(/Contacto: 310 555 0194/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancelar pedido' })).toBeDisabled();
        expect(screen.getAllByText('Este pedido ya no se puede cancelar porque está en camino o fue entregado').length).toBeGreaterThan(0);
    });

    it('entregado: banner de entrega y cancelar deshabilitado', async () => {
        montar(base('entregado', { puedeCancelar: false, entregadoEn: '2026-10-24T16:10:00.000Z' }));
        expect(await screen.findByText('¡Tu pedido ha sido entregado!')).toBeInTheDocument();
        expect(screen.getByText(/Recibido por Ana Pérez/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancelar pedido' })).toBeDisabled();
        expect(screen.getByRole('link', { name: /seguir comprando/i })).toBeInTheDocument();
    });

    it('ESC1: cancelar con confirmación muestra "Pedido cancelado correctamente"', async () => {
        montar(base('recibido'), {
            'POST /api/pedidos/3/cancelar': { json: { pedido: base('cancelado', { puedeCancelar: false, devolucionIniciada: true, canceladoEn: '2026-10-24T15:05:00.000Z' }) } }
        });
        await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }));
        const dlg = screen.getByRole('dialog');
        expect(within(dlg).getByText('¿Cancelar pedido?')).toBeInTheDocument();
        expect(within(dlg).getByText(/Total pagado/)).toBeInTheDocument();
        await userEvent.click(within(dlg).getByRole('button', { name: 'Sí, cancelar pedido' }));
        expect(await screen.findByText('Pedido cancelado correctamente')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Devolución iniciada' })).toBeInTheDocument();
        expect(screen.getByText(/restituyeron al inventario/)).toBeInTheDocument();
    });

    it('"Volver" cierra la ventana sin cancelar', async () => {
        const f = montar(base('recibido'));
        await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }));
        await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Volver' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(llamadasA(f, 'POST /api/pedidos/3/cancelar')).toHaveLength(0);
    });

    it('ESC3: si falla la conexión muestra el error y permite reintentar', async () => {
        let intento = 0;
        montar(base('recibido'), {
            'POST /api/pedidos/3/cancelar': () => {
                intento += 1;
                if (intento === 1) throw new Error('red');
                return { json: { pedido: base('cancelado', { puedeCancelar: false, canceladoEn: '2026-10-24T15:05:00.000Z' }) } };
            }
        });
        await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }));
        await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar pedido' }));
        expect(await screen.findByText('No se pudo cancelar el pedido. Inténtalo nuevamente')).toBeInTheDocument();
        expect(screen.getByText(/No se han aplicado cambios/)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
        expect(await screen.findByText('Pedido cancelado correctamente')).toBeInTheDocument();
    });

    it('pedido inexistente: muestra "Pedido no encontrado"', async () => {
        simularFetch({ 'GET /api/pedidos/3': { status: 404, json: { mensaje: 'Pedido no encontrado' } } });
        renderEnRutas([{ path: '/pedidos/:id', element: <SeguimientoPedido /> }], '/pedidos/3');
        expect(await screen.findByText('Pedido no encontrado')).toBeInTheDocument();
    });
});

describe('Catálogo y navbar con carrito', () => {
    it('ProductCard agotado deshabilita el botón', () => {
        renderEnRutas([{ path: '/', element: <ProductCard nombre="Tomate" precio="$ 3.000" agotado onAgregar={() => {}} /> }], '/');
        expect(screen.getByRole('button', { name: /agotado/i })).toBeDisabled();
    });
    it('la navbar del cliente muestra "Mis pedidos" y la cantidad del carrito', () => {
        agregarAlCarrito(TOMATE);
        renderEnRutas([{ path: '/', element: <Navbar /> }], '/');
        expect(screen.getByRole('link', { name: 'Mis pedidos' })).toHaveAttribute('href', '/pedidos');
        expect(screen.getByText('1')).toBeInTheDocument();
    });
});

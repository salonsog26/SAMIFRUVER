import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConsultarProductos from '../pages/admin/ConsultarProductos';
import RegistrarProducto from '../pages/admin/RegistrarProducto';
import EditarProducto from '../pages/admin/EditarProducto';
import { renderEnRutas, simularFetch, llamadasA, ponerSesion, SESION_ADMIN, PRODUCTOS } from './utils.jsx';

const rutaActual = () => screen.getByTestId('ruta-actual').textContent;
const rutas = [
    { path: '/admin/productos', element: <ConsultarProductos /> },
    { path: '/admin/productos/nuevo', element: <RegistrarProducto /> },
    { path: '/admin/productos/editar/:id', element: <EditarProducto /> }
];
const base = { 'GET /api/productos': { json: PRODUCTOS } };

beforeEach(() => ponerSesion(SESION_ADMIN));

describe('Consultar productos (E1-HU3)', () => {
    it('muestra los productos del servidor', async () => {
        simularFetch(base);
        renderEnRutas(rutas, '/admin/productos', { conProductos: true });
        expect(await screen.findByText('Tomate')).toBeInTheDocument();
        expect(screen.getByText('Jengibre')).toBeInTheDocument();
    });
    it('E1-HU3 ESC2: búsqueda encontrada (sin importar mayúsculas)', async () => {
        simularFetch(base);
        renderEnRutas(rutas, '/admin/productos', { conProductos: true });
        await screen.findByText('Tomate');
        await userEvent.type(screen.getByPlaceholderText(/buscar por nombre/i), 'TOMA');
        expect(screen.getByText('Tomate')).toBeInTheDocument();
        expect(screen.queryByText('Jengibre')).not.toBeInTheDocument();
    });
    it('E1-HU3 ESC1: búsqueda sin resultados → "No existen coincidencias en el catálogo"', async () => {
        simularFetch(base);
        renderEnRutas(rutas, '/admin/productos', { conProductos: true });
        await screen.findByText('Tomate');
        await userEvent.type(screen.getByPlaceholderText(/buscar por nombre/i), 'zzz');
        expect(screen.getByText('No existen coincidencias en el catálogo')).toBeInTheDocument();
    });
    it('servidor caído → mensaje de error de carga', async () => {
        simularFetch({});
        renderEnRutas(rutas, '/admin/productos', { conProductos: true });
        expect(await screen.findByText('No se pudo conectar con el servidor.')).toBeInTheDocument();
    });
    it('eliminar: confirma en el modal, llama a DELETE y quita el producto', async () => {
        const f = simularFetch({ ...base, 'DELETE /api/productos/1': { json: { mensaje: 'ok' } } });
        renderEnRutas(rutas, '/admin/productos', { conProductos: true });
        await screen.findByText('Tomate');
        await userEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);
        await userEvent.click(await screen.findByRole('button', { name: 'Eliminar producto' }));
        await waitFor(() => expect(screen.queryByText('Tomate')).not.toBeInTheDocument());
        expect(llamadasA(f, 'DELETE /api/productos/1')).toHaveLength(1);
    });
});

describe('Registrar producto (E1-HU1)', () => {
    const montar = async (extra = {}) => {
        const f = simularFetch({ ...base, ...extra });
        renderEnRutas(rutas, '/admin/productos/nuevo', { conProductos: true });
        await screen.findByRole('button', { name: /guardar producto/i });
        return f;
    };
    const boton = () => screen.getByRole('button', { name: /guardar producto/i });
    const llenar = async ({ nombre = 'Papaya', precio = '4500', categoria = 'Frutas', stock = '12' } = {}) => {
        if (nombre) await userEvent.type(screen.getByLabelText('Nombre del Producto'), nombre);
        if (precio) await userEvent.type(screen.getByLabelText('Precio (COP)'), precio);
        if (categoria) await userEvent.selectOptions(screen.getByLabelText('Categoría'), categoria);
        if (stock) await userEvent.type(screen.getByLabelText('Stock disponible'), stock);
    };

    it('E1-HU1 ESC3: formulario vacío → botón gris y deshabilitado', async () => {
        await montar();
        expect(boton()).toBeDisabled();
        expect(boton()).toHaveClass('btn-primary-gris');
    });
    it('botón se vuelve verde (habilitado) al completar todo correctamente', async () => {
        await montar();
        await llenar();
        expect(boton()).toBeEnabled();
        expect(boton()).not.toHaveClass('btn-primary-gris');
    });
    it('nombre solo con espacios o precio 0 → el botón sigue gris', async () => {
        await montar();
        await llenar({ nombre: '   ', precio: '0' });
        expect(boton()).toBeDisabled();
    });
    it('E1-HU1 ESC2: producto nuevo → POST con datos limpios y vuelve al listado con alerta de éxito', async () => {
        const f = await montar({
            'POST /api/productos': (b) => ({ status: 201, json: { mensaje: 'ok', producto: { id: 3, imagen: '', ...b } } })
        });
        await llenar({ nombre: '  Papaya ' });
        await userEvent.click(boton());
        await waitFor(() => expect(rutaActual()).toBe('/admin/productos'));
        expect(await screen.findByText('Producto registrado exitosamente')).toBeInTheDocument();
        const cuerpo = JSON.parse(llamadasA(f, 'POST /api/productos')[0][1].body);
        expect(cuerpo).toMatchObject({ nombre: 'Papaya', precio: 4500, categoria: 'Frutas', stock: 12 });
    });
    it('E1-HU1 ESC1: producto duplicado → "El producto ya existe" y no llama al servidor', async () => {
        const f = await montar();
        await llenar({ nombre: ' tomate ', categoria: 'Verduras' });
        await userEvent.click(boton());
        expect(await screen.findByText(/El producto ya existe/)).toBeInTheDocument();
        expect(llamadasA(f, 'POST /api/productos')).toHaveLength(0);
    });
    it('error del servidor (400/409) se muestra en la alerta', async () => {
        await montar({ 'POST /api/productos': { status: 409, json: { mensaje: 'El producto ya existe.' } } });
        await llenar();
        await userEvent.click(boton());
        expect(await screen.findByText('El producto ya existe.')).toBeInTheDocument();
        expect(rutaActual()).toBe('/admin/productos/nuevo');
    });
    it('nombre inválido (símbolos) → error de validación y no envía', async () => {
        const f = await montar();
        await llenar({ nombre: '@@@' });
        await userEvent.click(boton());
        expect(await screen.findByText(/Ingresa un nombre válido/)).toBeInTheDocument();
        expect(llamadasA(f, 'POST /api/productos')).toHaveLength(0);
    });
    it('Cancelar → vuelve al listado', async () => {
        await montar();
        await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
        expect(rutaActual()).toBe('/admin/productos');
    });
});

describe('Actualizar producto (E1-HU2)', () => {
    const montar = async (extra = {}, id = 1) => {
        const f = simularFetch({ ...base, ...extra });
        renderEnRutas(rutas, `/admin/productos/editar/${id}`, { conProductos: true });
        return f;
    };
    const guardar = () => userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    it('carga los datos actuales del producto en el formulario', async () => {
        await montar();
        expect(await screen.findByLabelText('Nombre del Producto')).toHaveValue('Tomate');
        expect(screen.getByLabelText('Precio (COP)')).toHaveValue(3000);
    });
    it('E1-HU2 ESC3: guardar sin modificaciones → advertencia y no llama al servidor', async () => {
        const f = await montar();
        await screen.findByLabelText('Nombre del Producto');
        await guardar();
        expect(await screen.findByText(/No se detectaron cambios/)).toBeInTheDocument();
        expect(llamadasA(f, 'PUT /api/productos/1')).toHaveLength(0);
    });
    it('E1-HU2 ESC1: cambios válidos → PUT y vuelve al listado con alerta de éxito', async () => {
        const f = await montar({ 'PUT /api/productos/1': (b) => ({ json: { mensaje: 'ok', producto: { id: 1, imagen: '', ...b } } }) });
        const precio = await screen.findByLabelText('Precio (COP)');
        await userEvent.clear(precio);
        await userEvent.type(precio, '3500');
        await guardar();
        await waitFor(() => expect(rutaActual()).toBe('/admin/productos'));
        expect(await screen.findByText('Información del producto actualizada correctamente')).toBeInTheDocument();
        expect(JSON.parse(llamadasA(f, 'PUT /api/productos/1')[0][1].body).precio).toBe(3500);
    });
    it('E1-HU2 ESC2: cancelar con cambios → pide confirmación de descarte', async () => {
        await montar();
        const precio = await screen.findByLabelText('Precio (COP)');
        await userEvent.type(precio, '9');
        await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
        expect(screen.getByText('Confirmar descarte')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Descartar cambios' }));
        expect(rutaActual()).toBe('/admin/productos');
    });
    it('E1-HU2 ESC2b: cancelar sin cambios → sale sin confirmar', async () => {
        await montar();
        await screen.findByLabelText('Nombre del Producto');
        await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
        expect(rutaActual()).toBe('/admin/productos');
    });
    it('vaciar el nombre deja el botón en gris y deshabilitado', async () => {
        await montar();
        await userEvent.clear(await screen.findByLabelText('Nombre del Producto'));
        const b = screen.getByRole('button', { name: /guardar cambios/i });
        expect(b).toBeDisabled();
        expect(b).toHaveClass('btn-primary-gris');
    });
    it('producto inexistente → "Producto no encontrado"', async () => {
        await montar({}, 99);
        expect(await screen.findByText('Producto no encontrado')).toBeInTheDocument();
    });
});

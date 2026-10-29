import React from 'react';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
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

// jsdom no decodifica imágenes: simulamos una de 400x400 para el campo "Foto del producto"
beforeAll(() => {
    URL.createObjectURL = vi.fn(() => 'blob:prueba');
    URL.revokeObjectURL = vi.fn();
    globalThis.Image = class {
        set src(_) { this.naturalWidth = 400; this.naturalHeight = 400; setTimeout(() => this.onload && this.onload(), 0); }
    };
});
const subirFoto = async () => {
    const archivo = new File([new Uint8Array(1000)], 'foto.png', { type: 'image/png' });
    await userEvent.upload(screen.getByLabelText('Foto del producto'), archivo);
    await screen.findByAltText('Vista previa del producto');
};

describe('Consultar productos (E1-HU3)', () => {
    it('E1-HU3 ESC1: búsqueda sin resultados → "No existen coincidencias en el catálogo"', async () => {
        simularFetch(base);
        renderEnRutas(rutas, '/admin/productos', { conProductos: true });
        await screen.findByText('Tomate');
        await userEvent.type(screen.getByPlaceholderText(/buscar por nombre/i), 'zzz');
        expect(screen.getByText('No existen coincidencias en el catálogo')).toBeInTheDocument();
    });
    it('E1-HU3 ESC2: búsqueda encontrada (sin importar mayúsculas)', async () => {
        simularFetch(base);
        renderEnRutas(rutas, '/admin/productos', { conProductos: true });
        await screen.findByText('Tomate');
        await userEvent.type(screen.getByPlaceholderText(/buscar por nombre/i), 'TOMA');
        expect(screen.getByText('Tomate')).toBeInTheDocument();
        expect(screen.queryByText('Jengibre')).not.toBeInTheDocument();
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
    const llenar = async ({ nombre = 'Papaya', precio = '4500', categoria = 'Frutas', stock = '12', foto = true } = {}) => {
        if (nombre) await userEvent.type(screen.getByLabelText('Nombre del Producto'), nombre);
        if (precio) await userEvent.type(screen.getByLabelText('Precio (COP)'), precio);
        if (categoria) await userEvent.selectOptions(screen.getByLabelText('Categoría'), categoria);
        if (stock) await userEvent.type(screen.getByLabelText('Stock disponible'), stock);
        if (foto) await subirFoto();
    };

    it('E1-HU1 ESC1: producto duplicado → "El producto ya existe" y no llama al servidor', async () => {
        const f = await montar();
        await llenar({ nombre: ' tomate ', categoria: 'Verduras' });
        await userEvent.click(boton());
        expect(await screen.findByText(/El producto ya existe/)).toBeInTheDocument();
        expect(llamadasA(f, 'POST /api/productos')).toHaveLength(0);
    });
    it('E1-HU1 ESC3: formulario vacío → botón gris y deshabilitado', async () => {
        await montar();
        expect(boton()).toBeDisabled();
        expect(boton()).toHaveClass('btn-primary-gris');
    });
});

describe('Actualizar producto (E1-HU2)', () => {
    const montar = async (extra = {}, id = 1) => {
        const f = simularFetch({ ...base, ...extra });
        renderEnRutas(rutas, `/admin/productos/editar/${id}`, { conProductos: true });
        return f;
    };
    const guardar = () => userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

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
    it('E1-HU2 ESC3: guardar sin modificaciones → advertencia y no llama al servidor', async () => {
        const f = await montar();
        await screen.findByLabelText('Nombre del Producto');
        await guardar();
        expect(await screen.findByText(/No se detectaron cambios/)).toBeInTheDocument();
        expect(llamadasA(f, 'PUT /api/productos/1')).toHaveLength(0);
    });
});
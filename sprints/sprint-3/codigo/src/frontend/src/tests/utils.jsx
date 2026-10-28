// Utilidades compartidas por las pruebas del frontend.
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { ProductosProvider } from '../context/ProductosContext';

export const PRODUCTOS = [
    { id: 1, nombre: 'Tomate', precio: 3000, categoria: 'Verduras', stock: 20, unidad: 'lb', imagen: '/images/tomate.webp' },
    { id: 2, nombre: 'Jengibre', precio: 5000, categoria: 'Especias', stock: 10, unidad: 'lb', imagen: '/images/jengibre.webp' }
];

// Simula fetch. rutas: { 'METODO /ruta': (body) => ({ status, json }) | { status, json } }
export function simularFetch(rutas) {
    const mock = vi.fn(async (url, opciones = {}) => {
        const ruta = String(url).replace(/^https?:\/\/[^/]+/, '');
        const clave = `${opciones.method || 'GET'} ${ruta}`;
        const entrada = rutas[clave];
        if (!entrada) throw new Error('Ruta no simulada: ' + clave);
        const body = opciones.body ? JSON.parse(opciones.body) : undefined;
        const { status = 200, json = {} } = typeof entrada === 'function' ? entrada(body) : entrada;
        return { ok: status >= 200 && status < 300, status, json: async () => json };
    });
    vi.stubGlobal('fetch', mock);
    return mock;
}

export const llamadasA = (mock, clave) =>
    mock.mock.calls.filter(([u, o]) => `${(o && o.method) || 'GET'} ${String(u).replace(/^https?:\/\/[^/]+/, '')}` === clave);

export function ponerSesion(sesion) {
    localStorage.setItem('samifruber_sesion', JSON.stringify(sesion));
}
export const SESION_ADMIN = { correo: 'admin@samifruber.com', nombre: 'Administrador', rol: 'admin', token: 't' };
export const SESION_CLIENTE = { id: 1, nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '3001234567', rol: 'cliente', token: 't' };

function MostrarRuta() {
    const l = useLocation();
    return <div data-testid="ruta-actual">{l.pathname}</div>;
}

// Renderiza `rutas` ([{path, element}]) empezando en `inicial`, con un marcador de la ruta actual.
export function renderEnRutas(rutas, inicial, { conProductos = false } = {}) {
    const contenido = (
        <MemoryRouter initialEntries={[inicial]}>
            <Routes>
                {rutas.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}
                <Route path="*" element={<div>otra-pagina</div>} />
            </Routes>
            <MostrarRuta />
        </MemoryRouter>
    );
    return render(conProductos ? <ProductosProvider>{contenido}</ProductosProvider> : contenido);
}

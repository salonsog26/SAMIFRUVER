import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Perfil from '../pages/public/Perfil';
import { obtenerSesion } from '../utils/auth';
import { renderEnRutas, simularFetch, llamadasA, ponerSesion, SESION_CLIENTE } from './utils.jsx';

const rutaActual = () => screen.getByTestId('ruta-actual').textContent;
const CLIENTE_API = { id: 1, nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '3001234567', documento: '1.023.456.789', direccion: 'Carrera 18 # 72–26', ciudad: 'Bogotá, D. C.', rol: 'cliente' };

// Simula el servidor: GET del perfil siempre responde; `extra` agrega/reemplaza rutas (p. ej. el PUT).
const montar = (extra = {}) => {
    const f = simularFetch({ 'GET /api/clientes/1': { json: { cliente: CLIENTE_API } }, ...extra });
    renderEnRutas([
        { path: '/perfil', element: <Perfil /> },
        { path: '/login', element: <div>pantalla-login</div> },
        { path: '/', element: <div>pantalla-principal</div> }
    ], '/perfil');
    return f;
};
const PUT = 'PUT /api/clientes/1';
const campo = (n) => screen.getByLabelText(n);
const guardar = () => userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
const cancelar = () => userEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
const esperarCarga = () => waitFor(() => expect(campo('Documento')).toHaveValue('1.023.456.789'));

beforeEach(() => ponerSesion(SESION_CLIENTE));

describe('Editar perfil (E2-HU3)', () => {
    it('E2-HU3 ESC1: campos obligatorios vacíos → "Este campo es obligatorio" y no envía', async () => {
        const f = montar();
        await esperarCarga();
        for (const n of ['Nombre', 'Correo', 'Teléfono']) await userEvent.clear(campo(n));
        await guardar();
        expect(await screen.findAllByText('Este campo es obligatorio')).toHaveLength(3);
        expect(llamadasA(f, PUT)).toHaveLength(0);
    });
    it('E2-HU3 ESC2: correo de otro cliente → aviso del servidor y la sesión no cambia', async () => {
        const MSJ = 'El correo le pertenece a otro cliente ya existe';
        montar({ [PUT]: { status: 409, json: { mensaje: MSJ, errores: { correo: MSJ } } } });
        await esperarCarga();
        await userEvent.clear(campo('Correo'));
        await userEvent.type(campo('Correo'), 'luis@correo.com');
        await guardar();
        expect(await screen.findByText(MSJ)).toBeInTheDocument();
        expect(obtenerSesion().correo).toBe('ana@correo.com');
    });
    it('E2-HU3 ESC3: cancelar sin cambios → vuelve a la pantalla principal sin confirmar', async () => {
        montar();
        await esperarCarga();
        await cancelar();
        expect(rutaActual()).toBe('/');
    });
    it('E2-HU3 ESC4: guardar sin cambios → "No se ha realizado ningún cambio" y no llama al servidor', async () => {
        const f = montar();
        await esperarCarga();
        await guardar();
        expect(await screen.findByText('No se ha realizado ningún cambio')).toBeInTheDocument();
        expect(llamadasA(f, PUT)).toHaveLength(0);
    });
    it('E2-HU3 ESC5: salir con cambios → modal de advertencia; "Cancelar" mantiene la edición y "Aceptar" descarta', async () => {
        montar();
        await esperarCarga();
        await userEvent.type(campo('Nombre'), ' María');
        await cancelar();
        expect(screen.getByText('¿Estás seguro que quieres salir sin guardar cambios?')).toBeInTheDocument();
        expect(screen.getByText('La información que modificaste se perderá.')).toBeInTheDocument();
        const botones = screen.getAllByRole('button', { name: /^cancelar$/i });
        await userEvent.click(botones[botones.length - 1]); // el del modal
        expect(screen.queryByText('La información que modificaste se perderá.')).not.toBeInTheDocument();
        expect(rutaActual()).toBe('/perfil');
        expect(campo('Nombre')).toHaveValue('Ana Pérez María');
        await cancelar();
        await userEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
        expect(rutaActual()).toBe('/');
        expect(obtenerSesion().nombre).toBe('Ana Pérez');
    });
    it('E2-HU3 ESC6: guardado exitoso → "Cambios guardados correctamente", envía los 6 campos y actualiza la sesión', async () => {
        const f = montar({ [PUT]: (b) => ({ json: { mensaje: 'Cambios guardados correctamente', cliente: { id: 1, ...b } } }) });
        await esperarCarga();
        await userEvent.clear(campo('Teléfono'));
        await userEvent.type(campo('Teléfono'), '311 222 3344');
        await guardar();
        expect(await screen.findByText('Cambios guardados correctamente')).toBeInTheDocument();
        expect(JSON.parse(llamadasA(f, PUT)[0][1].body)).toEqual({
            nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '311 222 3344',
            documento: '1.023.456.789', direccion: 'Carrera 18 # 72–26', ciudad: 'Bogotá, D. C.'
        });
        await waitFor(() => expect(obtenerSesion().telefono).toBe('311 222 3344'));
        await cancelar(); // ya no hay cambios pendientes: sale directo
        expect(rutaActual()).toBe('/');
    });
});
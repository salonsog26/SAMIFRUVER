import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Perfil from '../pages/public/Perfil';
import { obtenerSesion } from '../utils/auth';
import { renderEnRutas, simularFetch, llamadasA, ponerSesion, SESION_CLIENTE } from './utils.jsx';

const rutaActual = () => screen.getByTestId('ruta-actual').textContent;
const montar = () => renderEnRutas([
    { path: '/perfil', element: <Perfil /> },
    { path: '/', element: <div>pantalla-principal</div> }
], '/perfil');
const nombre = () => screen.getByLabelText('Nombre');
const correo = () => screen.getByLabelText('Correo');
const telefono = () => screen.getByLabelText('Teléfono');
const guardar = () => userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
const cancelar = () => userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

beforeEach(() => ponerSesion(SESION_CLIENTE));

describe('Editar perfil (E2-HU3)', () => {
    it('muestra los datos actuales del cliente', () => {
        montar();
        expect(nombre()).toHaveValue('Ana Pérez');
        expect(correo()).toHaveValue('ana@correo.com');
        expect(telefono()).toHaveValue('3001234567');
    });
    it('E2-HU3 ESC1: campos obligatorios vacíos → "Este campo es obligatorio" y no envía', async () => {
        const f = simularFetch({});
        montar();
        await userEvent.clear(nombre());
        await userEvent.clear(correo());
        await userEvent.clear(telefono());
        await guardar();
        expect(await screen.findAllByText('Este campo es obligatorio')).toHaveLength(3);
        expect(f).not.toHaveBeenCalled();
    });
    it('E2-HU3 ESC1b: correo con formato inválido → mensaje', async () => {
        simularFetch({});
        montar();
        await userEvent.clear(correo());
        await userEvent.type(correo(), 'malcorreo');
        await guardar();
        expect(await screen.findByText('Ingresa un correo electrónico válido')).toBeInTheDocument();
    });
    it('E2-HU3 ESC2: correo ya usado por otro usuario → error y no cambia la sesión', async () => {
        simularFetch({ 'PUT /api/clientes/1': { status: 409, json: { mensaje: 'El correo ya está registrado por otro usuario', errores: { correo: 'El correo ya está registrado por otro usuario' } } } });
        montar();
        await userEvent.clear(correo());
        await userEvent.type(correo(), 'luis@correo.com');
        await guardar();
        expect((await screen.findAllByText('El correo ya está registrado por otro usuario')).length).toBeGreaterThan(0);
        expect(obtenerSesion().correo).toBe('ana@correo.com');
    });
    it('E2-HU3 ESC3: cancelar sin cambios → vuelve a la pantalla principal sin confirmar', async () => {
        montar();
        await cancelar();
        expect(rutaActual()).toBe('/');
    });
    it('E2-HU3 ESC4: guardar sin cambios → "No se ha realizado ningún cambio" y no llama al servidor', async () => {
        const f = simularFetch({});
        montar();
        await guardar();
        expect(await screen.findByText('No se ha realizado ningún cambio')).toBeInTheDocument();
        expect(f).not.toHaveBeenCalled();
    });
    it('E2-HU3 ESC4b: cambios solo de espacios cuentan como "sin cambios"', async () => {
        const f = simularFetch({});
        montar();
        await userEvent.type(nombre(), '   ');
        await guardar();
        expect(await screen.findByText('No se ha realizado ningún cambio')).toBeInTheDocument();
        expect(f).not.toHaveBeenCalled();
    });
    it('E2-HU3 ESC5: salir con cambios sin guardar → pide confirmación; "Cancelar" mantiene la edición', async () => {
        montar();
        await userEvent.type(nombre(), ' María');
        await cancelar();
        expect(screen.getByText('¿Salir sin guardar?')).toBeInTheDocument();
        const botones = screen.getAllByRole('button', { name: /^cancelar$/i });
        await userEvent.click(botones[botones.length - 1]); // el del modal
        expect(screen.queryByText('¿Salir sin guardar?')).not.toBeInTheDocument();
        expect(rutaActual()).toBe('/perfil');
    });
    it('E2-HU3 ESC5b: confirmar salida descarta los cambios y vuelve a inicio', async () => {
        montar();
        await userEvent.type(nombre(), ' María');
        await cancelar();
        await userEvent.click(screen.getByRole('button', { name: /salir sin guardar/i }));
        expect(rutaActual()).toBe('/');
        expect(obtenerSesion().nombre).toBe('Ana Pérez');
    });
    it('E2-HU3 ESC6: guardado exitoso → "Cambios guardados correctamente", envía datos y actualiza la sesión', async () => {
        const f = simularFetch({ 'PUT /api/clientes/1': (b) => ({ json: { mensaje: 'Cambios guardados correctamente', cliente: { id: 1, ...b } } }) });
        montar();
        await userEvent.clear(telefono());
        await userEvent.type(telefono(), '3112223344');
        await guardar();
        expect(await screen.findByText('Cambios guardados correctamente')).toBeInTheDocument();
        expect(JSON.parse(llamadasA(f, 'PUT /api/clientes/1')[0][1].body)).toEqual({ nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '3112223344' });
        await waitFor(() => expect(obtenerSesion().telefono).toBe('3112223344'));
        // tras guardar ya no hay cambios pendientes: cancelar sale directo
        await cancelar();
        expect(rutaActual()).toBe('/');
    });
    it('servidor caído al guardar → mensaje de conexión', async () => {
        simularFetch({});
        montar();
        await userEvent.type(nombre(), ' X');
        await guardar();
        expect(await screen.findByText(/no se pudo conectar/i)).toBeInTheDocument();
    });
});

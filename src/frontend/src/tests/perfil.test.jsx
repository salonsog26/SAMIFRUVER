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
    it('muestra título, migas, la insignia y los datos actuales del cliente (incluye documento, dirección y ciudad)', async () => {
        montar();
        expect(screen.getByText('Tu información personal')).toBeInTheDocument();
        expect(screen.getByText('Cuenta verificada')).toBeInTheDocument();
        expect(campo('Nombre')).toHaveValue('Ana Pérez');
        expect(campo('Correo')).toHaveValue('ana@correo.com');
        expect(campo('Teléfono')).toHaveValue('3001234567');
        await esperarCarga();
        expect(campo('Dirección')).toHaveValue('Carrera 18 # 72–26');
        expect(campo('Ciudad')).toHaveValue('Bogotá, D. C.');
    });
    it('E2-HU3 ESC1: campos obligatorios vacíos → "Este campo es obligatorio" y no envía', async () => {
        const f = montar();
        await esperarCarga();
        for (const n of ['Nombre', 'Correo', 'Teléfono']) await userEvent.clear(campo(n));
        await guardar();
        expect(await screen.findAllByText('Este campo es obligatorio')).toHaveLength(3);
        expect(llamadasA(f, PUT)).toHaveLength(0);
    });
    it('E2-HU3 ESC1b: correo con formato inválido → mensaje de dominio válido', async () => {
        const f = montar();
        await esperarCarga();
        await userEvent.clear(campo('Correo'));
        await userEvent.type(campo('Correo'), 'malcorreo');
        await guardar();
        expect(await screen.findByText('El correo debe incluir un dominio válido, por ejemplo: nombre@dominio.com')).toBeInTheDocument();
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
    it('E2-HU3 ESC4b: cambios solo de espacios cuentan como "sin cambios"', async () => {
        const f = montar();
        await esperarCarga();
        await userEvent.type(campo('Nombre'), '   ');
        await guardar();
        expect(await screen.findByText('No se ha realizado ningún cambio')).toBeInTheDocument();
        expect(llamadasA(f, PUT)).toHaveLength(0);
    });
    it('E2-HU3 ESC5: salir con cambios → modal de advertencia; "Cancelar" mantiene la edición', async () => {
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
    });
    it('E2-HU3 ESC5b: "Aceptar" descarta los cambios y vuelve a inicio', async () => {
        montar();
        await esperarCarga();
        await userEvent.type(campo('Nombre'), ' María');
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
    it('E2-HU3: los campos opcionales se pueden dejar vacíos y se validan si traen datos inválidos', async () => {
        const f = montar({ [PUT]: (b) => ({ json: { cliente: { id: 1, ...b } } }) });
        await esperarCarga();
        await userEvent.clear(campo('Documento'));
        await userEvent.type(campo('Ciudad'), '123');
        await guardar();
        expect(await screen.findByText('Ingresa una ciudad válida')).toBeInTheDocument();
        expect(llamadasA(f, PUT)).toHaveLength(0);
    });
    it('servidor caído al guardar → mensaje de conexión', async () => {
        montar(); // sin ruta PUT simulada = servidor caído
        await esperarCarga();
        await userEvent.type(campo('Nombre'), ' X');
        await guardar();
        expect(await screen.findByText(/no se pudo conectar/i)).toBeInTheDocument();
    });
});

describe('Barra lateral del cliente', () => {
    it('muestra al usuario y "Cerrar sesión" borra la sesión y lleva a /login', async () => {
        montar();
        expect(screen.getByText('Mi perfil')).toBeInTheDocument();
        expect(screen.getByText('Cliente')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }));
        expect(obtenerSesion()).toBeNull();
        await waitFor(() => expect(rutaActual()).toBe('/login'));
    });
    it('las opciones futuras (pedidos, direcciones, favoritos) no navegan', async () => {
        montar();
        await userEvent.click(screen.getByText('Mis pedidos'));
        expect(rutaActual()).toBe('/perfil');
    });
});

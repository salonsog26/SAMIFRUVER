import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../pages/public/Login';
import Registro from '../pages/public/Registro';
import { obtenerSesion } from '../utils/auth';
import { renderEnRutas, simularFetch, llamadasA } from './utils.jsx';

const rutaActual = () => screen.getByTestId('ruta-actual').textContent;
const INCORRECTO = 'La información de inicio de sesión que ingresaste es incorrecta.';

describe('Login (E1-HU4 administrador y E2-HU2 cliente)', () => {
    const montar = () => renderEnRutas([
        { path: '/login', element: <Login /> },
        { path: '/', element: <div>pantalla-principal</div> },
        { path: '/admin/productos', element: <div>panel-admin</div> }
    ], '/login');
    const campos = () => ({ correo: screen.getByLabelText('Correo electrónico'), pass: screen.getByLabelText('Contraseña'), boton: screen.getByRole('button', { name: /ingresar/i }) });

    it('E1-HU4 ESC1 / E2-HU2 ESC1: datos incorrectos → mensaje genérico, sin sesión, se queda en /login', async () => {
        simularFetch({ 'POST /api/auth/login': { status: 401, json: { success: false, mensaje: INCORRECTO } } });
        montar();
        await userEvent.type(campos().correo, 'x@y.com');
        await userEvent.type(campos().pass, 'mala');
        await userEvent.click(campos().boton);
        expect(await screen.findByText(INCORRECTO)).toBeInTheDocument();
        expect(rutaActual()).toBe('/login');
        expect(obtenerSesion()).toBeNull();
    });
    it('E1-HU4 ESC2: admin correcto → /admin/productos y sesión admin guardada', async () => {
        simularFetch({ 'POST /api/auth/login': { json: { success: true, token: 'T', usuario: { correo: 'admin@samifruber.com', nombre: 'Administrador', rol: 'admin' } } } });
        montar();
        await userEvent.type(campos().correo, 'admin@samifruber.com');
        await userEvent.type(campos().pass, 'admin123');
        await userEvent.click(campos().boton);
        await waitFor(() => expect(rutaActual()).toBe('/admin/productos'));
        expect(obtenerSesion().rol).toBe('admin');
    });
    it('E2-HU2 ESC2: cliente correcto → pantalla principal', async () => {
        simularFetch({ 'POST /api/auth/login': { json: { success: true, token: 'T', usuario: { id: 1, correo: 'ana@correo.com', nombre: 'Ana', rol: 'cliente' } } } });
        montar();
        await userEvent.type(campos().correo, 'ana@correo.com');
        await userEvent.type(campos().pass, 'clave1234');
        await userEvent.click(campos().boton);
        await waitFor(() => expect(rutaActual()).toBe('/'));
        expect(obtenerSesion().rol).toBe('cliente');
    });
    it('E2-HU2 ESC3: sin datos → botón deshabilitado', () => {
        montar();
        expect(campos().boton).toBeDisabled();
    });
});

describe('Registro de cliente (E2-HU1)', () => {
    const montar = () => renderEnRutas([
        { path: '/registro', element: <Registro /> },
        { path: '/login', element: <div>pantalla-login</div> }
    ], '/registro');
    const llenar = async (d = {}) => {
        const v = { nombre: 'María López', correo: 'maria@correo.com', telefono: '3205551234', password: 'abcd1234', ...d };
        for (const [label, valor] of [['Nombre', v.nombre], ['Correo', v.correo], ['Teléfono', v.telefono], ['Contraseña', v.password]]) {
            if (valor) await userEvent.type(screen.getByLabelText(label), valor);
        }
    };
    const enviar = () => userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    it('E2-HU1 ESC1: usuario ya registrado → "El usuario ya existe"', async () => {
        simularFetch({ 'POST /api/clientes/registro': { status: 409, json: { mensaje: 'El usuario ya existe', errores: { correo: 'El usuario ya existe' } } } });
        montar();
        await llenar();
        await enviar();
        expect(await screen.findByText('El usuario ya existe')).toBeInTheDocument();
        expect(screen.queryByText('pantalla-login')).not.toBeInTheDocument();
    });
    it('E2-HU1 ESC2: registro exitoso → "Registro exitoso" y luego va a /login', async () => {
        const f = simularFetch({ 'POST /api/clientes/registro': { status: 201, json: { mensaje: 'Registro exitoso', cliente: { id: 3 } } } });
        montar();
        await llenar();
        await enviar();
        expect(await screen.findByText('Registro exitoso')).toBeInTheDocument();
        expect(llamadasA(f, 'POST /api/clientes/registro')).toHaveLength(1);
        await waitFor(() => expect(rutaActual()).toBe('/login'), { timeout: 3000 });
    });
});
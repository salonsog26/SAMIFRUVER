import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../pages/public/Login';
import Registro from '../pages/public/Registro';
import RutaProtegida from '../routes/RutaProtegida';
import { obtenerSesion } from '../utils/auth';
import { renderEnRutas, simularFetch, llamadasA, ponerSesion, SESION_ADMIN, SESION_CLIENTE } from './utils.jsx';

const rutaActual = () => screen.getByTestId('ruta-actual').textContent;
const INCORRECTO = 'La información de inicio de sesión que ingresaste es incorrecta.';

describe('Guard de rutas (RutaProtegida)', () => {
    const rutas = [
        { path: '/login', element: <div>pantalla-login</div> },
        { path: '/', element: <div>inicio-publico</div> },
        { path: '/admin/productos', element: <RutaProtegida rolRequerido="admin"><div>panel-admin</div></RutaProtegida> }
    ];
    it('sin sesión → redirige a /login', () => {
        renderEnRutas(rutas, '/admin/productos');
        expect(rutaActual()).toBe('/login');
    });
    it('cliente intentando entrar al panel de admin → redirige a inicio', () => {
        ponerSesion(SESION_CLIENTE);
        renderEnRutas(rutas, '/admin/productos');
        expect(rutaActual()).toBe('/');
        expect(screen.queryByText('panel-admin')).not.toBeInTheDocument();
    });
    it('admin con sesión → ve el panel', () => {
        ponerSesion(SESION_ADMIN);
        renderEnRutas(rutas, '/admin/productos');
        expect(screen.getByText('panel-admin')).toBeInTheDocument();
    });
    it('sesión corrupta → /login', () => {
        localStorage.setItem('samifruber_sesion', '{{');
        renderEnRutas(rutas, '/admin/productos');
        expect(rutaActual()).toBe('/login');
    });
});

describe('Login (E1-HU4 administrador y E2-HU2 cliente)', () => {
    const montar = () => renderEnRutas([
        { path: '/login', element: <Login /> },
        { path: '/', element: <div>pantalla-principal</div> },
        { path: '/admin/productos', element: <div>panel-admin</div> }
    ], '/login');
    const campos = () => ({ correo: screen.getByLabelText(/correo/i), pass: screen.getByLabelText(/contraseña/i), boton: screen.getByRole('button', { name: /ingresar/i }) });

    it('E1-HU4 ESC3 / E2-HU2 ESC3: sin datos → botón deshabilitado', () => {
        montar();
        expect(campos().boton).toBeDisabled();
    });
    it('solo espacios en blanco → botón sigue deshabilitado', async () => {
        montar();
        await userEvent.type(campos().correo, '   ');
        await userEvent.type(campos().pass, '   ');
        expect(campos().boton).toBeDisabled();
    });
    it('con correo y contraseña → botón habilitado', async () => {
        montar();
        await userEvent.type(campos().correo, 'a@b.com');
        await userEvent.type(campos().pass, 'x');
        expect(campos().boton).toBeEnabled();
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
    it('E1-HU4 ESC4: correo con formato inválido → no inicia sesión y muestra el mensaje genérico', async () => {
        simularFetch({ 'POST /api/auth/login': { status: 401, json: { success: false, mensaje: INCORRECTO } } });
        montar();
        await userEvent.type(campos().correo, 'esto-no-es-un-correo');
        await userEvent.type(campos().pass, 'admin123');
        await userEvent.click(campos().boton);
        expect(await screen.findByText(INCORRECTO)).toBeInTheDocument();
        expect(obtenerSesion()).toBeNull();
    });
    it('corregir un campo borra el mensaje de error', async () => {
        simularFetch({ 'POST /api/auth/login': { status: 401, json: { success: false, mensaje: INCORRECTO } } });
        montar();
        await userEvent.type(campos().correo, 'x@y.com');
        await userEvent.type(campos().pass, 'mala');
        await userEvent.click(campos().boton);
        await screen.findByText(INCORRECTO);
        await userEvent.type(campos().pass, '2');
        expect(screen.queryByText(INCORRECTO)).not.toBeInTheDocument();
    });
    it('servidor caído → mensaje de conexión', async () => {
        simularFetch({});
        montar();
        await userEvent.type(campos().correo, 'x@y.com');
        await userEvent.type(campos().pass, 'mala');
        await userEvent.click(campos().boton);
        expect(await screen.findByText(/no se pudo conectar/i)).toBeInTheDocument();
    });
    it('envía el correo y contraseña tal cual al endpoint /api/auth/login', async () => {
        const f = simularFetch({ 'POST /api/auth/login': { status: 401, json: { success: false } } });
        montar();
        await userEvent.type(campos().correo, 'x@y.com');
        await userEvent.type(campos().pass, 'mala');
        await userEvent.click(campos().boton);
        expect(JSON.parse(llamadasA(f, 'POST /api/auth/login')[0][1].body)).toEqual({ correo: 'x@y.com', password: 'mala' });
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

    it('E2-HU1 ESC3: campos vacíos → "Este campo es obligatorio" en cada campo y no llama al servidor', async () => {
        const f = simularFetch({});
        montar();
        await enviar();
        expect(await screen.findAllByText('Este campo es obligatorio')).toHaveLength(4);
        expect(f).not.toHaveBeenCalled();
    });
    it('E2-HU1 ESC4: correo inválido → mensaje y no envía', async () => {
        const f = simularFetch({});
        montar();
        await llenar({ correo: 'maria.correo.com' });
        await enviar();
        expect(await screen.findByText('Ingresa un correo electrónico válido')).toBeInTheDocument();
        expect(f).not.toHaveBeenCalled();
    });
    it('E2-HU1 ESC4: contraseña de menos de 8 caracteres y teléfono con letras', async () => {
        simularFetch({});
        montar();
        await llenar({ password: '123', telefono: 'abc' });
        await enviar();
        expect(await screen.findByText('La contraseña debe tener mínimo 8 caracteres')).toBeInTheDocument();
        expect(screen.getByText('Ingresa un teléfono válido')).toBeInTheDocument();
    });
    it('E2-HU1 ESC1: usuario ya registrado → "usuario ya existe"', async () => {
        simularFetch({ 'POST /api/clientes/registro': { status: 409, json: { mensaje: 'usuario ya existe', errores: { correo: 'usuario ya existe' } } } });
        montar();
        await llenar();
        await enviar();
        expect((await screen.findAllByText('usuario ya existe')).length).toBeGreaterThan(0);
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
    it('servidor caído → mensaje de conexión', async () => {
        simularFetch({});
        montar();
        await llenar();
        await enviar();
        expect(await screen.findByText(/no se pudo conectar/i)).toBeInTheDocument();
    });
});

import { describe, it, expect } from 'vitest';
import { validarPerfil, validarRegistro, validarCorreoLogin, validarTelefono, OBLIGATORIO, MSJ_CORREO, MSJ_CORREO_LOGIN } from '../utils/validaciones';
import { obtenerSesion, guardarSesion, cerrarSesion, obtenerToken, login } from '../utils/auth';
import { simularFetch } from './utils.jsx';

describe('E2 validaciones de cliente (front)', () => {
    const ok = { nombre: 'María López', correo: 'm@c.com', telefono: '3205551234', password: 'abcd1234' };
    it('registro válido → sin errores', () => expect(validarRegistro(ok)).toEqual({}));
    it('el teléfono admite espacios entre dígitos pero no letras', () => {
        expect(validarTelefono('300 456 7890')).toBeUndefined();
        expect(validarTelefono('300 abc 7890')).toBeTruthy();
        expect(validarTelefono('123')).toBeTruthy();
    });
    it('E2-HU2: validarCorreoLogin devuelve "Correo no válido" solo si el formato es incorrecto', () => {
        expect(validarCorreoLogin('a@b.com')).toBeUndefined();
        expect(validarCorreoLogin('a@b')).toBe(MSJ_CORREO_LOGIN);
        expect(MSJ_CORREO_LOGIN).toBe('Correo no válido');
    });
    it('E2-HU3: documento, dirección y ciudad son opcionales pero se validan si vienen', () => {
        expect(validarPerfil({ ...ok, documento: '', direccion: '', ciudad: '' })).toEqual({});
        expect(validarPerfil({ ...ok, documento: '1.023.456.789', direccion: 'Carrera 18 # 72–26', ciudad: 'Bogotá, D. C.' })).toEqual({});
        expect(validarPerfil({ ...ok, documento: 'abc' })).toHaveProperty('documento');
        expect(validarPerfil({ ...ok, ciudad: '123' })).toHaveProperty('ciudad');
    });
    it('E2-HU3: validarPerfil no exige contraseña', () => {
        expect(validarPerfil(ok)).toEqual({});
    });
});

describe('Sesión (localStorage)', () => {
    it('guarda, lee y cierra sesión', () => {
        guardarSesion({ correo: 'a@b.c', rol: 'admin', token: 'tk' });
        expect(obtenerSesion().rol).toBe('admin');
        expect(obtenerToken()).toBe('tk');
        cerrarSesion();
        expect(obtenerSesion()).toBeNull();
    });
    it('sesión corrupta se trata como sin sesión (no lanza error)', () => {
        localStorage.setItem('samifruber_sesion', '{no-json');
        expect(obtenerSesion()).toBeNull();
        localStorage.setItem('samifruber_sesion', '"texto"');
        expect(obtenerSesion()).toBeNull();
    });
});

describe('login() contra la API', () => {
    it('éxito: guarda la sesión con token y rol', async () => {
        simularFetch({ 'POST /api/auth/login': { json: { success: true, token: 'T', usuario: { correo: 'a@b.c', rol: 'cliente' } } } });
        const r = await login('a@b.c', 'x');
        expect(r.ok).toBe(true);
        expect(obtenerSesion()).toMatchObject({ rol: 'cliente', token: 'T' });
    });
    it('credenciales incorrectas: no guarda sesión', async () => {
        simularFetch({ 'POST /api/auth/login': { status: 401, json: { success: false, mensaje: 'mal' } } });
        const r = await login('a@b.c', 'x');
        expect(r).toMatchObject({ ok: false, mensaje: 'mal' });
        expect(obtenerSesion()).toBeNull();
    });
    it('sin conexión: devuelve error de red', async () => {
        simularFetch({});
        const r = await login('a@b.c', 'x');
        expect(r.ok).toBe(false);
        expect(r.red).toBe(true);
    });
});
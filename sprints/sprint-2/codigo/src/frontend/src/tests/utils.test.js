import { describe, it, expect } from 'vitest';
import { validarProducto } from '../context/ProductosContext';
import { validarPerfil, validarRegistro, OBLIGATORIO } from '../utils/validaciones';
import { resolverImagen, IMAGEN_DEFECTO } from '../utils/imagenes';
import { obtenerSesion, guardarSesion, cerrarSesion, obtenerToken, login } from '../utils/auth';
import { simularFetch } from './utils.jsx';

describe('E1-HU1/HU2 validarProducto (front)', () => {
    const ok = { nombre: 'Papaya', precio: '4500', categoria: 'Frutas', stock: '3', unidad: 'lb' };
    it('datos correctos → sin errores', () => expect(validarProducto(ok)).toEqual({}));
    it('E1-HU1 ESC3: campos vacíos → errores en todos', () => {
        expect(Object.keys(validarProducto({ nombre: '', precio: '', categoria: '', stock: '', unidad: '' })).sort())
            .toEqual(['categoria', 'nombre', 'precio', 'stock', 'unidad']);
    });
    it.each([
        ['nombre solo espacios', { nombre: '   ' }, 'nombre'],
        ['nombre de un carácter', { nombre: 'A' }, 'nombre'],
        ['nombre con símbolos', { nombre: '$$$' }, 'nombre'],
        ['precio 0', { precio: '0' }, 'precio'],
        ['precio negativo', { precio: '-3' }, 'precio'],
        ['precio texto', { precio: 'abc' }, 'precio'],
        ['stock negativo', { stock: '-1' }, 'stock'],
        ['stock texto', { stock: 'x' }, 'stock']
    ])('E1-HU1 ESC3: %s → error', (_n, cambio, campo) => {
        expect(validarProducto({ ...ok, ...cambio })[campo]).toBeTruthy();
    });
    it('acepta stock 0, nombres con tildes y decimales', () => {
        expect(validarProducto({ ...ok, stock: '0', nombre: 'Piña', precio: '1500.5' })).toEqual({});
    });
});

describe('E2 validaciones de cliente (front)', () => {
    const ok = { nombre: 'María López', correo: 'm@c.com', telefono: '3205551234', password: 'abcd1234' };
    it('registro válido → sin errores', () => expect(validarRegistro(ok)).toEqual({}));
    it('E2-HU1 ESC3: todo vacío → obligatorio en 4 campos', () => {
        const e = validarRegistro({ nombre: '', correo: '', telefono: '', password: '' });
        expect(Object.values(e)).toEqual(Array(4).fill(OBLIGATORIO));
    });
    it.each([
        ['correo sin @', { correo: 'abc.com' }, 'correo'],
        ['teléfono con letras', { telefono: '12ab567' }, 'telefono'],
        ['contraseña corta', { password: '123' }, 'password'],
        ['nombre con números', { nombre: 'M4ria' }, 'nombre']
    ])('E2-HU1 ESC4: %s', (_n, cambio, campo) => {
        expect(validarRegistro({ ...ok, ...cambio })[campo]).toBeTruthy();
    });
    it('E2-HU3: validarPerfil no exige contraseña', () => {
        expect(validarPerfil(ok)).toEqual({});
        expect(validarPerfil({ nombre: '', correo: 'x', telefono: '' })).toHaveProperty('nombre', OBLIGATORIO);
    });
});

describe('Imágenes', () => {
    it('usa imagen por defecto si no hay URL, no es texto o es placehold.co', () => {
        expect(resolverImagen('')).toBe(IMAGEN_DEFECTO);
        expect(resolverImagen(null)).toBe(IMAGEN_DEFECTO);
        expect(resolverImagen(5)).toBe(IMAGEN_DEFECTO);
        expect(resolverImagen('https://placehold.co/100')).toBe(IMAGEN_DEFECTO);
    });
    it('respeta una URL válida', () => expect(resolverImagen('/images/x.webp')).toBe('/images/x.webp'));
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

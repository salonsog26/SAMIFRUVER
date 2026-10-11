import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prepararEntorno } from './helpers.js';

let env;
beforeEach(() => { env = prepararEntorno(); });
afterEach(() => env.limpiar());

describe('E1-HU4 Login de administrador (API)', () => {
    it('E1-HU4 ESC1: credenciales incorrectas → 401 con mensaje genérico', async () => {
        const r = await env.api.post('/api/auth/login').send({ correo: 'admin@samifruber.com', password: 'mala' });
        expect(r.status).toBe(401);
        expect(r.body.mensaje).toBe('La información de inicio de sesión que ingresaste es incorrecta.');
        expect(r.body.token).toBeUndefined();
    });
    it('E1-HU4 ESC2: credenciales correctas → 200, token y rol admin', async () => {
        const r = await env.api.post('/api/auth/login').send({ correo: 'admin@samifruber.com', password: 'admin123' });
        expect(r.status).toBe(200);
        expect(r.body.token).toBeTruthy();
        expect(r.body.usuario.rol).toBe('admin');
    });
    it('E1-HU4 ESC2b: ignora espacios y mayúsculas en el correo', async () => {
        const r = await env.api.post('/api/auth/login').send({ correo: '  ADMIN@samifruber.com ', password: ' admin123 ' });
        expect(r.status).toBe(200);
    });
    it('E1-HU4 ESC3: campos vacíos → 401', async () => {
        const r = await env.api.post('/api/auth/login').send({ correo: '', password: '' });
        expect(r.status).toBe(401);
    });
    it('E1-HU4 ESC3b: cuerpo vacío o con tipos no válidos no rompe el servidor', async () => {
        expect((await env.api.post('/api/auth/login').send({})).status).toBe(401);
        expect((await env.api.post('/api/auth/login').send({ correo: 123, password: {} })).status).toBe(401);
    });
    it('E1-HU4 ESC4: la respuesta nunca revela cuál dato falló', async () => {
        const a = await env.api.post('/api/auth/login').send({ correo: 'otro@x.com', password: 'admin123' });
        const b = await env.api.post('/api/auth/login').send({ correo: 'admin@samifruber.com', password: 'x' });
        expect(a.body.mensaje).toBe(b.body.mensaje);
    });
});

describe('E2-HU2 Login de cliente (API)', () => {
    it('E2-HU2 ESC1: datos incorrectos → 401', async () => {
        const r = await env.api.post('/api/clientes/login').send({ correo: 'ana@correo.com', password: 'incorrecta' });
        expect(r.status).toBe(401);
        expect(r.body.mensaje).toContain('incorrecta');
    });
    it('E2-HU2 ESC2: datos correctos → 200, token y sin contraseña en la respuesta', async () => {
        const r = await env.api.post('/api/clientes/login').send({ correo: 'ANA@correo.com ', password: 'clave1234' });
        expect(r.status).toBe(200);
        expect(r.body.token).toBe('mock-token-cliente-1');
        expect(r.body.cliente.password).toBeUndefined();
    });
    it('E2-HU2 ESC3: sin datos → 401', async () => {
        expect((await env.api.post('/api/clientes/login').send({})).status).toBe(401);
    });
    it('E2-HU2 ESC2b: el endpoint unificado /api/auth/login también acepta clientes', async () => {
        const r = await env.api.post('/api/auth/login').send({ correo: 'luis@correo.com', password: 'secreto99' });
        expect(r.status).toBe(200);
        expect(r.body.usuario.rol).toBe('cliente');
        expect(r.body.usuario.password).toBeUndefined();
    });
});

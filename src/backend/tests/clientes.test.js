import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prepararEntorno } from './helpers.js';

let env;
beforeEach(() => { env = prepararEntorno(); });
afterEach(() => env.limpiar());

const nuevo = { nombre: 'María López', correo: 'maria@correo.com', telefono: '3205551234', password: 'abcd1234' };

describe('E2-HU1 Registro de cliente (API)', () => {
    it('E2-HU1 ESC1: correo ya registrado (aunque cambie mayúsculas) → 409 "El usuario ya existe"', async () => {
        const r = await env.api.post('/api/clientes/registro').send({ ...nuevo, correo: 'ANA@correo.com' });
        expect(r.status).toBe(409);
        expect(r.body.errores.correo).toBe('El usuario ya existe');
        expect(env.leerTabla('clientes')).toHaveLength(2);
    });
    it('E2-HU1 ESC2: registro exitoso → 201 "Registro exitoso", sin contraseña en la respuesta', async () => {
        const r = await env.api.post('/api/clientes/registro').send(nuevo);
        expect(r.status).toBe(201);
        expect(r.body.mensaje).toBe('Registro exitoso');
        expect(r.body.cliente.password).toBeUndefined();
        expect(env.leerTabla('clientes')).toHaveLength(3);
    });
});

describe('E2-HU3 Editar perfil (API)', () => {
    const cambio = { nombre: 'Ana María Pérez', correo: 'ana@correo.com', telefono: '3001234567' };
    it('E2-HU3 ESC1: campos obligatorios vacíos → 400', async () => {
        const r = await env.api.put('/api/clientes/1').send({ nombre: '', correo: '', telefono: '' });
        expect(r.status).toBe(400);
        expect(Object.values(r.body.errores)).toEqual(Array(3).fill('Este campo es obligatorio'));
    });
    it('E2-HU3 ESC2: correo de otro usuario → 409 con el mensaje del diseño y no modifica', async () => {
        const r = await env.api.put('/api/clientes/1').send({ ...cambio, correo: 'luis@correo.com' });
        expect(r.status).toBe(409);
        expect(r.body.mensaje).toBe('El correo le pertenece a otro cliente ya existe');
        expect(env.leerTabla('clientes')[0].correo).toBe('ana@correo.com');
    });
    it('E2-HU3 ESC4: guardar sin cambios → "No se ha realizado ningún cambio"', async () => {
        const r = await env.api.put('/api/clientes/1').send({ nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '3001234567' });
        expect(r.status).toBe(200);
        expect(r.body.mensaje).toBe('No se ha realizado ningún cambio');
        expect(r.body.cambios).toBe(false);
    });
    it('E2-HU3 ESC6: guardado exitoso → "Cambios guardados correctamente" y se persiste', async () => {
        const r = await env.api.put('/api/clientes/1').send(cambio);
        expect(r.status).toBe(200);
        expect(r.body.mensaje).toBe('Cambios guardados correctamente');
        expect(r.body.cambios).toBe(true);
        expect(env.leerTabla('clientes')[0].nombre).toBe('Ana María Pérez');
    });
});

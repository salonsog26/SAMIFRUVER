import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prepararEntorno } from './helpers.js';

let env;
beforeEach(() => { env = prepararEntorno(); });
afterEach(() => env.limpiar());

const nuevo = { nombre: 'María López', correo: 'maria@correo.com', telefono: '3205551234', password: 'abcd1234' };

describe('E2-HU1 Registro de cliente (API)', () => {
    it('E2-HU1 ESC2: registro exitoso → 201 "Registro exitoso", sin contraseña en la respuesta', async () => {
        const r = await env.api.post('/api/clientes/registro').send(nuevo);
        expect(r.status).toBe(201);
        expect(r.body.mensaje).toBe('Registro exitoso');
        expect(r.body.cliente.password).toBeUndefined();
        expect(env.leerArchivo('clientes.json')).toHaveLength(3);
    });
    it('E2-HU1 ESC1: correo ya registrado (aunque cambie mayúsculas) → 409 "usuario ya existe"', async () => {
        const r = await env.api.post('/api/clientes/registro').send({ ...nuevo, correo: 'ANA@correo.com' });
        expect(r.status).toBe(409);
        expect(r.body.errores.correo).toBe('usuario ya existe');
        expect(env.leerArchivo('clientes.json')).toHaveLength(2);
    });
    it('E2-HU1 ESC3: campos vacíos → 400 "Este campo es obligatorio" en cada campo', async () => {
        const r = await env.api.post('/api/clientes/registro').send({ nombre: '', correo: '', telefono: '', password: '' });
        expect(r.status).toBe(400);
        expect(Object.values(r.body.errores)).toEqual(Array(4).fill('Este campo es obligatorio'));
    });
    it('E2-HU1 ESC3b: solo espacios cuenta como vacío', async () => {
        const r = await env.api.post('/api/clientes/registro').send({ ...nuevo, nombre: '   ', telefono: '  ' });
        expect(r.body.errores.nombre).toBe('Este campo es obligatorio');
        expect(r.body.errores.telefono).toBe('Este campo es obligatorio');
    });
    it.each([
        ['correo sin @', { correo: 'maria.correo.com' }, 'correo'],
        ['correo sin dominio', { correo: 'maria@' }, 'correo'],
        ['teléfono con letras', { telefono: '320abc1234' }, 'telefono'],
        ['teléfono muy corto', { telefono: '123' }, 'telefono'],
        ['contraseña de 7 caracteres', { password: '1234567' }, 'password'],
        ['nombre con números/símbolos', { nombre: 'M4r1@' }, 'nombre']
    ])('E2-HU1 ESC4: datos no permitidos (%s) → 400', async (_n, cambio, campo) => {
        const r = await env.api.post('/api/clientes/registro').send({ ...nuevo, ...cambio });
        expect(r.status).toBe(400);
        expect(r.body.errores[campo]).toBeTruthy();
    });
    it('E2-HU1 ESC4b: tipos no válidos (números/objetos) no rompen el servidor', async () => {
        const r = await env.api.post('/api/clientes/registro').send({ nombre: 1, correo: {}, telefono: 3, password: [] });
        expect(r.status).toBe(400);
    });
    it('E2-HU1: el correo se guarda en minúsculas y sin espacios', async () => {
        await env.api.post('/api/clientes/registro').send({ ...nuevo, correo: '  Maria@Correo.com ' });
        expect(env.leerArchivo('clientes.json')[2].correo).toBe('maria@correo.com');
    });
});

describe('E2-HU3 Editar perfil (API)', () => {
    const cambio = { nombre: 'Ana María Pérez', correo: 'ana@correo.com', telefono: '3001234567' };
    it('E2-HU3 ESC6: guardado exitoso → "Cambios guardados correctamente" y se persiste', async () => {
        const r = await env.api.put('/api/clientes/1').send(cambio);
        expect(r.status).toBe(200);
        expect(r.body.mensaje).toBe('Cambios guardados correctamente');
        expect(r.body.cambios).toBe(true);
        expect(env.leerArchivo('clientes.json')[0].nombre).toBe('Ana María Pérez');
    });
    it('E2-HU3: la contraseña no cambia ni se devuelve', async () => {
        const r = await env.api.put('/api/clientes/1').send(cambio);
        expect(r.body.cliente.password).toBeUndefined();
        expect(env.leerArchivo('clientes.json')[0].password).toBe('clave1234');
    });
    it('E2-HU3 ESC4: guardar sin cambios → "No se ha realizado ningún cambio"', async () => {
        const r = await env.api.put('/api/clientes/1').send({ nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '3001234567' });
        expect(r.status).toBe(200);
        expect(r.body.mensaje).toBe('No se ha realizado ningún cambio');
        expect(r.body.cambios).toBe(false);
    });
    it('E2-HU3 ESC1: campos obligatorios vacíos → 400', async () => {
        const r = await env.api.put('/api/clientes/1').send({ nombre: '', correo: '', telefono: '' });
        expect(r.status).toBe(400);
        expect(Object.values(r.body.errores)).toEqual(Array(3).fill('Este campo es obligatorio'));
    });
    it('E2-HU3 ESC2: correo de otro usuario → 409 y no modifica', async () => {
        const r = await env.api.put('/api/clientes/1').send({ ...cambio, correo: 'luis@correo.com' });
        expect(r.status).toBe(409);
        expect(env.leerArchivo('clientes.json')[0].correo).toBe('ana@correo.com');
    });
    it('E2-HU3: cliente inexistente → 404', async () => {
        expect((await env.api.put('/api/clientes/99').send(cambio)).status).toBe(404);
        expect((await env.api.get('/api/clientes/99')).status).toBe(404);
    });
    it('E2-HU3: consultar perfil devuelve datos sin contraseña', async () => {
        const r = await env.api.get('/api/clientes/1');
        expect(r.body.cliente.correo).toBe('ana@correo.com');
        expect(r.body.cliente.password).toBeUndefined();
    });
});

// src/backend/lib/passwords.js
// Cifrado de contraseñas con scrypt (incluido en Node, sin dependencias).
// Formato guardado en la BD:  scrypt$N$salt(hex)$hash(hex)
const crypto = require('crypto');

const N = 16384;
const LARGO = 64;

const hashSync = (password, saltHex) => {
    const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
    const hash = crypto.scryptSync(String(password), salt, LARGO, { N });
    return `scrypt$${N}$${salt.toString('hex')}$${hash.toString('hex')}`;
};

// Versión asíncrona: no bloquea el servidor mientras calcula el hash.
const hash = (password) =>
    new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16);
        crypto.scrypt(String(password), salt, LARGO, { N }, (err, key) => {
            if (err) return reject(err);
            resolve(`scrypt$${N}$${salt.toString('hex')}$${key.toString('hex')}`);
        });
    });

const verificar = (password, guardado) =>
    new Promise((resolve) => {
        const partes = String(guardado || '').split('$');
        if (partes.length !== 4 || partes[0] !== 'scrypt') return resolve(false);
        const esperado = Buffer.from(partes[3], 'hex');
        crypto.scrypt(String(password), Buffer.from(partes[2], 'hex'), esperado.length, { N: Number(partes[1]) }, (err, key) => {
            if (err) return resolve(false);
            resolve(key.length === esperado.length && crypto.timingSafeEqual(key, esperado));
        });
    });

module.exports = { hash, hashSync, verificar };

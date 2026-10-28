// src/backend/lib/store.js
// Lectura/escritura de los archivos JSON. La carpeta se puede cambiar con DATA_DIR
// (las pruebas automáticas usan una carpeta temporal para no tocar los datos reales).
const fs = require('fs');
const path = require('path');

const rutaArchivo = (nombre) =>
    path.join(process.env.DATA_DIR || path.join(__dirname, '../data'), nombre);

const leer = (nombre) => {
    try {
        return JSON.parse(fs.readFileSync(rutaArchivo(nombre), 'utf-8'));
    } catch (error) {
        return [];
    }
};

const escribir = (nombre, datos) => {
    fs.writeFileSync(rutaArchivo(nombre), JSON.stringify(datos, null, 2), 'utf-8');
};

// Siguiente id = máximo + 1 (no reutiliza ids de registros borrados al final).
const siguienteId = (lista) => lista.reduce((m, x) => Math.max(m, x.id), 0) + 1;

const esTexto = (v) => typeof v === 'string';

module.exports = { leer, escribir, siguienteId, esTexto };

import React from 'react';
import '../../styles/variables.css';

function Alert({ tipo, mensaje }) {
    // Ahora manejamos los 3 estados
    let alertClass = '';
    let icono = '';

    if (tipo === 'exito') {
        alertClass = 'alert-success';
        icono = '✔️';
    } else if (tipo === 'error') {
        alertClass = 'alert-error';
        icono = '❌';
    } else if (tipo === 'advertencia') {
        alertClass = 'alert-warning';
        icono = '⚠️';
    }

    return (
        <div className={`alert-toast ${alertClass}`}>
            <div className="alert-icon-placeholder">{icono}</div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{mensaje}</span>
        </div>
    );
}

export default Alert;
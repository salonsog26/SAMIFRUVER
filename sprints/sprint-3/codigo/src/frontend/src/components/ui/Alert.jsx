import React from 'react';
import { CircleCheck, CircleAlert, TriangleAlert } from 'lucide-react';
import '../../styles/variables.css';

// Aviso flotante (toast). tipo: 'exito' | 'error' | 'advertencia'. className opcional para ubicarlo.
function Alert({ tipo, mensaje, className = '' }) {
    let alertClass = '';
    let icono = null;

    if (tipo === 'exito') {
        alertClass = 'alert-success';
        icono = <CircleCheck size={20} />;
    } else if (tipo === 'error') {
        alertClass = 'alert-error';
        icono = <CircleAlert size={20} />;
    } else if (tipo === 'advertencia') {
        alertClass = 'alert-warning';
        icono = <TriangleAlert size={20} />;
    }

    return (
        <div className={`alert-toast ${alertClass} ${className}`.trim()} role={tipo === 'error' ? 'alert' : 'status'}>
            <div className="alert-icon-placeholder">{icono}</div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{mensaje}</span>
        </div>
    );
}

export default Alert;

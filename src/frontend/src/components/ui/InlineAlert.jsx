import React from 'react';
import { CircleAlert } from 'lucide-react';
import '../../styles/variables.css';

// Aviso dentro del formulario (ej. "El usuario ya existe" en Registro).
function InlineAlert({ mensaje }) {
    return (
        <div className="inline-alert-error" role="alert">
            <CircleAlert size={20} />
            <span>{mensaje}</span>
        </div>
    );
}

export default InlineAlert;

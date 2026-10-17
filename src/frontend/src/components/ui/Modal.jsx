import React from 'react';
import { TriangleAlert } from 'lucide-react';
import '../../styles/variables.css';

// variante "peligro": botón rojo (eliminar / descartar). variante "advertencia": icono ámbar y botón verde.
function Modal({ titulo, mensaje, textoConfirmar, onConfirm, onCancel, variante = 'peligro' }) {
    const advertencia = variante === 'advertencia';
    return (
        <div className="modal-overlay">
            <div className={`modal-content${advertencia ? ' modal-content-advertencia' : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
                {advertencia && (
                    <div className="modal-icon-warning"><TriangleAlert size={26} /></div>
                )}
                <h3 className={`modal-title${advertencia ? ' modal-title-grande' : ''}`}>{titulo}</h3>
                <p className="modal-text">{mensaje}</p>

                <div className={`modal-actions${advertencia ? ' modal-actions-derecha' : ''}`}>
                    <button className="btn-secondary" style={advertencia ? undefined : { flex: 1 }} onClick={onCancel}>
                        Cancelar
                    </button>
                    <button className={advertencia ? 'btn-primary btn-modal-ok' : 'btn-danger'} onClick={onConfirm}>
                        {textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Modal;

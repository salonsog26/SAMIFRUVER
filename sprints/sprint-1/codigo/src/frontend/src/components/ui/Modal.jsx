import React from 'react';
import '../../styles/variables.css';

function Modal({ titulo, mensaje, textoConfirmar, onConfirm, onCancel }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 className="modal-title">{titulo}</h3>
                <p className="modal-text">{mensaje}</p>

                <div className="modal-actions">
                    {/* Reutilizamos el btn-secondary del ProductForm */}
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
                        Cancelar
                    </button>
                    <button className="btn-danger" onClick={onConfirm}>
                        {textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Modal;
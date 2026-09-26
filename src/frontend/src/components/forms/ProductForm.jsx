// src/components/forms/ProductForm.jsx
import React, { useRef } from 'react';
import '../../styles/variables.css';

function ProductForm({ modoEdicion = false, datosIniciales = {}, errores = {}, onSubmit, onCancel }) {
    const formRef = useRef(null);

    const obtenerDatosFormulario = () => {
        const formEl = formRef.current;
        if (!formEl) return {};
        return {
            nombre: formEl.nombre.value,
            precio: formEl.precio.value,
            categoria: formEl.categoria.value,
            stock: formEl.stock.value,
            unidad: formEl.unidad.value,
        };
    };

    const manejarSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(obtenerDatosFormulario());
    };

    const manejarCancelar = () => {
        if (onCancel) onCancel(obtenerDatosFormulario());
    };

    return (
        <form ref={formRef} className="form-card" onSubmit={manejarSubmit}>

            <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <div className={`form-input-wrapper ${errores.nombre ? 'has-error' : ''}`}>
                    <input
                        type="text"
                        name="nombre"
                        className="form-input"
                        value={formData.nombre || ''}
                        onChange={onChange}
                        placeholder="Ej. Pimentón, Tomate..."
                        required
                    />
                </div>
                {errores.nombre && <span className="form-error-text">{errores.nombre}</span>}
            </div>

            <div className="form-group">
                <label className="form-label">Unidad de medida</label>
                <div className={`form-input-wrapper ${errores.unidad ? 'has-error' : ''}`}>
                    <select
                        name="unidad"
                        className="form-input"
                        defaultValue={datosIniciales.unidad || 'unidad'}
                    >
                        <option value="unidad">Por unidad</option>
                        <option value="lb">Por libra</option>
                    </select>
                </div>
                {errores.unidad && <span className="form-error-text">{errores.unidad}</span>}
            </div>

            <div className="form-group">
                <label className="form-label">Precio (COP)</label>
                <div className={`form-input-wrapper ${errores.precio ? 'has-error' : ''}`}>
                    <input
                        type="number"
                        name="precio"
                        className="form-input"
                        value={formData.precio ?? ''}
                        onChange={onChange}
                        required
                    />
                </div>
                {errores.precio && <span className="form-error-text">{errores.precio}</span>}
            </div>

            <div className="form-group">
                <label className="form-label">Categoría</label>
                <div className={`form-input-wrapper ${errores.categoria ? 'has-error' : ''}`}>
                    <select name="categoria" className="form-input" defaultValue={datosIniciales.categoria || ''}>
                        <option value="">Seleccionar...</option>
                        <option value="Verduras">Verduras</option>
                        <option value="Frutas">Frutas</option>
                        <option value="Especias">Especias</option>
                    </select>
                </div>
                {errores.categoria && <span className="form-error-text">{errores.categoria}</span>}
            </div>

            <div className="form-group">
                <label className="form-label">Stock disponible</label>
                <div className={`form-input-wrapper ${errores.stock ? 'has-error' : ''}`}>
                    <input
                        type="number"
                        name="stock"
                        className="form-input"
                        value={formData.stock ?? ''}
                        onChange={onChange}
                        required
                    />
                </div>
                {errores.stock && <span className="form-error-text">{errores.stock}</span>}
            </div>

            <div className="button-group">
                <button type="submit" className="btn-primary">
                    {modoEdicion ? 'Guardar Cambios' : 'Guardar Producto'}
                </button>
                <button type="button" className="btn-secondary" onClick={manejarCancelar}>
                    Cancelar
                </button>
            </div>

        </form>
    );
}

export default ProductForm;

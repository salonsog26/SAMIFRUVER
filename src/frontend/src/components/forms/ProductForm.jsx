// src/components/forms/ProductForm.jsx
import React, { useRef, useState } from 'react';
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

    // Determina si, con los valores actuales del formulario, hay lo mínimo
    // para intentar guardar (campos requeridos no vacíos, ignorando espacios).
    const calcularValidez = () => {
        const datos = obtenerDatosFormulario();
        return (
            Boolean(datos.nombre && datos.nombre.trim()) &&
            Boolean(datos.categoria) &&
            Boolean(datos.unidad) &&
            datos.precio !== '' && !Number.isNaN(Number(datos.precio)) && Number(datos.precio) > 0 &&
            datos.stock !== '' && !Number.isNaN(Number(datos.stock)) && Number(datos.stock) >= 0
        );
    };

    const [formValido, setFormValido] = useState(() => {
        // En modo edición, los datos iniciales ya vienen completos y válidos.
        if (!modoEdicion) return false;
        return Boolean(datosIniciales.nombre && datosIniciales.categoria && datosIniciales.unidad);
    });

    const actualizarValidez = () => {
        setFormValido(calcularValidez());
    };

    const manejarSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(obtenerDatosFormulario());
    };

    const manejarCancelar = () => {
        if (onCancel) onCancel(obtenerDatosFormulario());
    };

    return (
        <form ref={formRef} className="form-card" onSubmit={manejarSubmit} onChange={actualizarValidez} onInput={actualizarValidez}>

            <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <div className={`form-input-wrapper ${errores.nombre ? 'has-error' : ''}`}>
                    <input
                        type="text"
                        name="nombre"
                        className="form-input"
                        defaultValue={datosIniciales.nombre || ''}
                        placeholder="Ej. Pimentón, Tomate..."
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
                        defaultValue={datosIniciales.precio || ''}
                        min="0"
                        step="any"
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
                        defaultValue={datosIniciales.stock || ''}
                        min="0"
                        step="1"
                    />
                </div>
                {errores.stock && <span className="form-error-text">{errores.stock}</span>}
            </div>

            <div className="button-group">
                <button type="submit" className={`btn-primary${formValido ? '' : ' btn-primary-gris'}`} disabled={!formValido}>
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

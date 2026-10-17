import React, { useRef, useState } from 'react';
import '../../styles/variables.css';

function ProductForm({ modoEdicion = false, datosIniciales = {}, errores = {}, onSubmit, onCancel }) {
    const formRef = useRef(null);
    const [previewImagen, setPreviewImagen] = useState(datosIniciales.imagen || null);
    const [imagenBase64, setImagenBase64] = useState(datosIniciales.imagen || '');
    const [errorImagen, setErrorImagen] = useState('');

    const obtenerDatosFormulario = () => {
        const formEl = formRef.current;
        if (!formEl) return {};
        return {
            nombre: formEl.elements.namedItem('nombre').value,
            precio: formEl.elements.namedItem('precio').value,
            categoria: formEl.elements.namedItem('categoria').value,
            stock: formEl.elements.namedItem('stock').value,
            unidad: formEl.elements.namedItem('unidad').value,
        };
    };

    const calcularValidez = () => {
        const datos = obtenerDatosFormulario();
        return (
            Boolean(datos.nombre && datos.nombre.trim()) &&
            Boolean(datos.categoria) &&
            Boolean(datos.unidad) &&
            Boolean(datos.imagen) &&
            datos.precio !== '' && !Number.isNaN(Number(datos.precio)) && Number(datos.precio) > 0 &&
            datos.stock !== '' && !Number.isNaN(Number(datos.stock)) && Number(datos.stock) >= 0
        );
    };
    const [formValido, setFormValido] = useState(() => {
        if (!modoEdicion) return false;
        return Boolean(datosIniciales.nombre && datosIniciales.categoria && datosIniciales.unidad && datosIniciales.imagen);
    });
    const actualizarValidez = () => {
        setFormValido(calcularValidez());
    };

    const manejarCambioImagen = (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (!tiposPermitidos.includes(archivo.type)) {
            setErrorImagen('Solo se permiten imágenes JPG, PNG o WEBP');
            e.target.value = '';
            return;
        }

        const maxBytes = 2 * 1024 * 1024; // 2MB
        if (archivo.size > maxBytes) {
            setErrorImagen('La imagen no debe superar 2MB');
            e.target.value = '';
            return;
        }

        const urlTemporal = URL.createObjectURL(archivo);
        const img = new Image();
        img.onload = () => {
            if (img.naturalWidth < 300 || img.naturalHeight < 300) {
                setErrorImagen('La imagen debe tener al menos 300x300 píxeles');
                e.target.value = '';
                URL.revokeObjectURL(urlTemporal);
                return;
            }

            setErrorImagen('');
            setPreviewImagen(urlTemporal);

            // Convierte el archivo a base64 para enviarlo como texto al backend
            const lector = new FileReader();
            lector.onload = () => {
                setImagenBase64(lector.result);
                setFormValido(calcularValidez());
            };
            lector.readAsDataURL(archivo);
        };
        img.onerror = () => {
            setErrorImagen('No se pudo leer el archivo como imagen');
            e.target.value = '';
        };
        img.src = urlTemporal;
    };

    const manejarSubmit = (e) => {
        e.preventDefault();
        const datos = obtenerDatosFormulario();
        if (!datos.imagen) {
            setErrorImagen('Debes subir una foto del producto');
            return;
        }
        if (onSubmit) onSubmit(datos);
    };

    const manejarCancelar = () => {
        if (onCancel) onCancel(obtenerDatosFormulario());
    };

    return (
        <form ref={formRef} className="form-card" onSubmit={manejarSubmit} onChange={actualizarValidez} onInput={actualizarValidez}>

            <div className="form-group">
                <label className="form-label" htmlFor="campo-nombre">Nombre del Producto</label>
                <div className={`form-input-wrapper ${errores.nombre ? 'has-error' : ''}`}>
                    <input
                        type="text"
                        name="nombre"
                        id="campo-nombre"
                        className="form-input"
                        defaultValue={datosIniciales.nombre || ''}
                        placeholder="Ej. Pimentón, Tomate..."
                    />
                </div>
                {errores.nombre && <span className="form-error-text">{errores.nombre}</span>}
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="campo-unidad">Unidad de medida</label>
                <div className={`form-input-wrapper ${errores.unidad ? 'has-error' : ''}`}>
                    <select
                        name="unidad"
                        id="campo-unidad"
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
                <label className="form-label" htmlFor="campo-precio">Precio (COP)</label>
                <div className={`form-input-wrapper ${errores.precio ? 'has-error' : ''}`}>
                    <input
                        type="number"
                        name="precio"
                        id="campo-precio"
                        className="form-input"
                        defaultValue={datosIniciales.precio || ''}
                        min="0"
                        step="any"
                    />
                </div>
                {errores.precio && <span className="form-error-text">{errores.precio}</span>}
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="campo-categoria">Categoría</label>
                <div className={`form-input-wrapper ${errores.categoria ? 'has-error' : ''}`}>
                    <select name="categoria"
                        id="campo-categoria" className="form-input" defaultValue={datosIniciales.categoria || ''}>
                        <option value="">Seleccionar...</option>
                        <option value="Verduras">Verduras</option>
                        <option value="Frutas">Frutas</option>
                        <option value="Especias">Especias</option>
                    </select>
                </div>
                {errores.categoria && <span className="form-error-text">{errores.categoria}</span>}
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="campo-stock">Stock disponible</label>
                <div className={`form-input-wrapper ${errores.stock ? 'has-error' : ''}`}>
                    <input
                        type="number"
                        name="stock"
                        id="campo-stock"
                        className="form-input"
                        defaultValue={datosIniciales.stock || ''}
                        min="0"
                        step="any"
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
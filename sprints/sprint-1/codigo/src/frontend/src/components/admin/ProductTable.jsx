// src/components/admin/ProductTable.jsx
import React from 'react';
import '../../styles/variables.css';

function ProductTable({ productos = [], onEditar, onEliminar }) {
    // Si no hay productos, mostramos un mensaje vacío
    if (productos.length === 0) {
        return (
            <div className="table-container" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#8D6E63' }}>No hay productos para mostrar.</p>
            </div>
        );
    }

    return (
        <div className="table-container">
            {/* Encabezado */}
            <div className="product-table-header">
                <div className="col-foto table-header-text">Foto</div>
                <div className="col-nombre table-header-text">Nombre</div>
                <div className="col-categoria table-header-text">Categoría</div>
                <div className="col-stock table-header-text">Stock</div>
                <div className="col-precio table-header-text">Precio</div>
                {(onEditar || onEliminar) && (
                    <div className="col-acciones table-header-text">Acciones</div>
                )}
            </div>

            {/* Filas (Generadas dinámicamente) */}
            <div>
                {productos.map((producto) => (
                    <div key={producto.id} className="product-table-row">
                        <div className="col-foto">
                            <img src={producto.imagen} alt={producto.nombre} className="product-image" />
                        </div>
                        <div className="col-nombre">{producto.nombre}</div>
                        <div className="col-categoria">{producto.categoria}</div>
                        <div className="col-stock">{producto.stock} {producto.unidad || 'unidades'}</div>
                        <div className="col-precio">$ {Number(producto.precio).toLocaleString()}</div>
                        {(onEditar || onEliminar) && (
                            <div className="col-acciones">
                                {onEditar && (
                                    <button
                                        type="button"
                                        className="btn-table-action btn-table-edit"
                                        onClick={() => onEditar(producto.id)}
                                    >
                                        Editar
                                    </button>
                                )}
                                {onEliminar && (
                                    <button
                                        type="button"
                                        className="btn-table-action btn-table-delete"
                                        onClick={() => onEliminar(producto.id)}
                                    >
                                        Eliminar
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ProductTable;

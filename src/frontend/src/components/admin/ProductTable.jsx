import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/variables.css';

function formatearPrecio(precio, unidad) {
    const numero = Number(precio);
    if (Number.isNaN(numero)) return precio;
    const sufijo = unidad === 'lb' ? '/ lb' : '/ unidad';
    return `$${numero.toLocaleString('es-CO')} COP ${sufijo}`;
}

function formatearStock(stock, unidad) {
    return unidad === 'lb' ? `${stock} lb` : `${stock} uds`;
}

function ProductTable({ productos = [], onEliminar }) {
    const navigate = useNavigate();

    if (productos.length === 0) {
        return (
            <div className="table-container" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#8D6E63' }}>No hay productos para mostrar.</p>
            </div>
        );
    }

    return (
        <div className="table-container">
            <div className="product-table-header">
                <div className="col-foto table-header-text">Foto</div>
                <div className="col-nombre table-header-text">Nombre</div>
                <div className="col-stock table-header-text">Stock</div>
                <div className="col-precio table-header-text">Precio</div>
                <div className="col-acciones table-header-text">Acciones</div>
            </div>

            <div>
                {productos.map((producto) => (
                    <div key={producto.id} className="product-table-row">
                        <div className="col-foto">
                            <img
                                src={producto.imagen}
                                alt={producto.nombre}
                                className="product-image"
                                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }}
                            />
                        </div>
                        <div className="col-nombre">{producto.nombre}</div>
                        <div className="col-stock">{formatearStock(producto.stock, producto.unidad)}</div>
                        <div className="col-precio">{formatearPrecio(producto.precio, producto.unidad)}</div>
                        <div className="col-acciones">
                            <button
                                type="button"
                                className="btn-table btn-table-primary"
                                onClick={() => navigate(`/admin/productos/editar/${producto.id}`)}
                            >
                                Actualizar
                            </button>
                            <button
                                type="button"
                                className="btn-table btn-table-danger"
                                onClick={() => onEliminar(producto)}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ProductTable;
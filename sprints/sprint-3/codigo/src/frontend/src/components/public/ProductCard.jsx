// src/components/public/ProductCard.jsx
import React from 'react';
import Badge from '../ui/Badge';
import { resolverImagen, alFallarImagen } from '../../utils/imagenes';
import '../../styles/variables.css';

// onAgregar es opcional: sin él la tarjeta es solo informativa. agotado deshabilita el botón.
function ProductCard({ nombre, categoria, precio, unidad = 'lb', imagen, agotado = false, onAgregar }) {
    return (
        <div className="product-card">
            <div className="product-card-image-wrapper">
                <img src={resolverImagen(imagen)} alt={nombre} className="product-card-image" onError={alFallarImagen} />
            </div>
            <div className="product-card-body">
                <Badge categoria={categoria} />
                <h3 className="product-card-name">{nombre}</h3>
                <div className="product-card-price">
                    {precio} <span className="product-card-unit">/ {unidad}</span>
                </div>
                <button
                    type="button"
                    className={`btn-primary-full${agotado ? ' btn-primary-full-agotado' : ''}`}
                    disabled={agotado}
                    onClick={onAgregar}
                    aria-label={agotado ? `${nombre} agotado` : `Agregar ${nombre} al carrito`}
                >
                    {agotado ? 'Agotado' : 'Agregar al carrito'}
                </button>
            </div>
        </div>
    );
}

export default ProductCard;

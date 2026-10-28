// src/components/public/ProductCard.jsx
import React from 'react';
import Badge from '../ui/Badge';
import '../../styles/variables.css';

function ProductCard({ nombre, categoria, precio, unidad = 'lb', imagen }) {
    return (
        <div className="product-card">
            <div className="product-card-image-wrapper">
                <img src={imagen} alt={nombre} className="product-card-image" />
            </div>
            <div className="product-card-body">
                <Badge categoria={categoria} />
                <h3 className="product-card-name">{nombre}</h3>
                <div className="product-card-price">
                    {precio} <span className="product-card-unit">/ {unidad}</span>
                </div>
                <button type="button" className="btn-primary-full">Agregar al carrito</button>
            </div>
        </div>
    );
}

export default ProductCard;
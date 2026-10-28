// src/components/public/Navbar.jsx
import React from 'react';
import '../../styles/variables.css';

function Navbar({ cartCount = 0 }) {
    return (
        <header className="public-navbar">
            <div className="public-navbar-brand">
                <div className="public-navbar-logo">
                    <div className="public-navbar-logo-inner" />
                </div>
                <span className="public-navbar-title">SAMIFRUBER</span>
            </div>

            <div className="public-navbar-search">
                <div className="public-navbar-search-icon" />
                <input
                    type="text"
                    className="public-navbar-search-input"
                    placeholder="Buscar frutas, verduras..."
                />
            </div>

            <div className="public-navbar-actions">
                <a href="#carrito" className="public-navbar-cart">
                    <div className="public-navbar-cart-icon" />
                    <span className="public-navbar-cart-badge">{cartCount}</span>
                </a>
                <a href="/login" className="btn-outline">Iniciar Sesión</a>
                <a href="/registro" className="btn-primary-nav">Registrarse</a>
            </div>
        </header>
    );
}

export default Navbar;
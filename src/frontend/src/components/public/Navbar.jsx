// src/components/public/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo-samifruver.png';
import '../../styles/variables.css';

function Navbar({ cartCount = 0 }) {
    return (
        <header className="public-navbar">
            <Link to="/" className="public-navbar-brand" style={{ textDecoration: 'none' }}>
                <img src={logo} alt="Samifruver" style={{ height: 32, width: 'auto' }} />
            </Link>

            <div className="public-navbar-search">
                <div className="public-navbar-search-icon" />
                <input
                    type="text"
                    className="public-navbar-search-input"
                    placeholder="Buscar frutas, verduras..."
                />
            </div>

            <div className="public-navbar-actions">
                <Link to="/carrito" className="public-navbar-cart">
                    <div className="public-navbar-cart-icon" />
                    <span className="public-navbar-cart-badge">{cartCount}</span>
                </Link>
                <Link to="/login" className="btn-outline">Iniciar Sesión</Link>
                <Link to="/registro" className="btn-primary-nav">Registrarse</Link>
            </div>
        </header>
    );
}

export default Navbar;
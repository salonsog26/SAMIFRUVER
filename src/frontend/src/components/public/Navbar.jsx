// src/components/public/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { obtenerSesion } from '../../utils/auth';
import logo from '../../assets/logo-samifruver.png';
import '../../styles/variables.css';

export const iniciales = (texto = '') =>
    String(texto).split('@')[0].split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'US';

function Navbar({ cartCount = 0 }) {
    const sesion = obtenerSesion();

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
                {!sesion && (
                    <>
                        <Link to="/login" className="btn-outline">Iniciar Sesión</Link>
                        <Link to="/registro" className="btn-primary-nav">Registrarse</Link>
                    </>
                )}
                {sesion && (
                    <Link
                        to={sesion.rol === 'admin' ? '/admin/productos' : '/perfil'}
                        className="public-navbar-user"
                        aria-label={sesion.rol === 'admin' ? 'Ir al panel de administrador' : 'Ir a mi perfil'}
                    >
                        <span className="public-navbar-user-name">{(sesion.nombre || 'Usuario').split(' ')[0]}</span>
                        <span className="public-navbar-avatar">{iniciales(sesion.nombre || sesion.correo)}</span>
                    </Link>
                )}
            </div>
        </header>
    );
}

export default Navbar;
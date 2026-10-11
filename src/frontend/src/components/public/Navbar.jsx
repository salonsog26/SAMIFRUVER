// src/components/public/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { obtenerSesion, cerrarSesion } from '../../utils/auth';
import logo from '../../assets/logo-samifruver.png';
import '../../styles/variables.css';

function Navbar({ cartCount = 0 }) {
    const navigate = useNavigate();
    const sesion = obtenerSesion();

    const salir = () => {
        cerrarSesion();
        navigate('/login');
    };

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
                {sesion?.rol === 'cliente' && (
                    <>
                        <Link to="/perfil" className="btn-outline">Hola, {(sesion.nombre || 'cliente').split(' ')[0]}</Link>
                        <button type="button" className="btn-primary-nav" onClick={salir}>Cerrar sesión</button>
                    </>
                )}
                {sesion?.rol === 'admin' && (
                    <>
                        <Link to="/admin/productos" className="btn-outline">Panel admin</Link>
                        <button type="button" className="btn-primary-nav" onClick={salir}>Cerrar sesión</button>
                    </>
                )}
            </div>
        </header>
    );
}

export default Navbar;
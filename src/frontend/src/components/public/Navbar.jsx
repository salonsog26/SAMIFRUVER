// src/components/public/Navbar.jsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { obtenerSesion } from '../../utils/auth';
import { useCarrito } from '../../utils/carrito';
import logo from '../../assets/logo-samifruver.png';
import '../../styles/variables.css';

export const iniciales = (texto = '') =>
    String(texto).split('@')[0].split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'US';

// cartCount es opcional: por defecto se muestra la cantidad de unidades del carrito del cliente.
function Navbar({ cartCount }) {
    const sesion = obtenerSesion();
    const carrito = useCarrito();
    const cantidad = cartCount ?? carrito.unidades;
    const esCliente = sesion?.rol === 'cliente';

    return (
        <header className="public-navbar">
            <Link to="/" className="public-navbar-brand" style={{ textDecoration: 'none' }}>
                <img src={logo} alt="Samifruver" style={{ height: 32, width: 'auto' }} />
            </Link>

            {esCliente && (
                <nav className="public-navbar-links" aria-label="Secciones de la tienda">
                    <NavLink to="/" end className={({ isActive }) => `public-navbar-link${isActive ? ' activo' : ''}`}>Catálogo</NavLink>
                    <NavLink to="/pedidos" className={({ isActive }) => `public-navbar-link${isActive ? ' activo' : ''}`}>Mis pedidos</NavLink>
                </nav>
            )}

            <div className="public-navbar-search">
                <div className="public-navbar-search-icon" />
                <input
                    type="text"
                    className="public-navbar-search-input"
                    placeholder="Buscar frutas, verduras..."
                />
            </div>

            <div className="public-navbar-actions">
                <Link to="/carrito" className="public-navbar-cart" aria-label={`Carrito, ${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'}`}>
                    <div className="public-navbar-cart-icon" />
                    <span className="public-navbar-cart-badge">{cantidad}</span>
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
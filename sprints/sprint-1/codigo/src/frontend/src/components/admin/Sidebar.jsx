// src/components/admin/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Para navegar entre pantallas
import '../../styles/variables.css';

function Sidebar() {
    return (
        <aside className="sidebar">
            {/* Logo y Marca */}
            <div className="sidebar-logo-container">
                <div className="sidebar-logo-icon">
                    <div className="sidebar-logo-inner"></div>
                </div>
                <div className="sidebar-brand">SAMIFRUBER</div>
            </div>

            {/* Navegación */}
            <nav className="sidebar-menu">
                {/* Usamos <Link> en lugar de <a> para el enrutador de React */}
                <Link to="/" className="menu-item">
                    <div className="menu-icon-placeholder"></div>
                    <span className="menu-item-text">Catalogo</span>
                </Link>

                {/* El menú activo */}
                <Link to="/admin/productos" className="menu-item active">
                    <div className="menu-icon-placeholder"></div>
                    <span className="menu-item-text">Productos</span>
                </Link>
            </nav>
        </aside>
    );
}

export default Sidebar;
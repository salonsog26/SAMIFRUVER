import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../../assets/logo-samifruver.png';
import '../../styles/variables.css';

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo-container">
                <img src={logo} alt="Samifruver" style={{ height: 36, width: 'auto' }} />
            </div>

            <nav className="sidebar-menu">
                <NavLink
                    to="/admin/productos"
                    end
                    className={({ isActive }) => `menu-item${isActive ? ' active' : ''}`}
                >
                    <div className="menu-icon-placeholder"></div>
                    <span className="menu-item-text">Catálogo</span>
                </NavLink>

                <NavLink
                    to="/admin/productos/nuevo"
                    className={({ isActive }) => `menu-item${isActive ? ' active' : ''}`}
                >
                    <div className="menu-icon-placeholder"></div>
                    <span className="menu-item-text">Agregar producto</span>
                </NavLink>
            </nav>
        </aside>
    );
}

export default Sidebar;
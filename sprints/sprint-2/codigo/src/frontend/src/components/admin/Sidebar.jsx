import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, PackagePlus, LogOut } from 'lucide-react';
import logo from '../../assets/logo-samifruver.png';
import { obtenerSesion, cerrarSesion } from '../../utils/auth';
import '../../styles/variables.css';

function Sidebar() {
    const navigate = useNavigate();
    const sesion = obtenerSesion();

    const iniciales = (sesion?.correo || 'AD')
        .split('@')[0]
        .slice(0, 2)
        .toUpperCase();

    const handleLogout = () => {
        cerrarSesion();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-top">
                <div className="sidebar-logo-container">
                    <img src={logo} alt="Samifruver" style={{ height: 36, width: 'auto' }} />
                </div>

                <nav className="sidebar-menu">
                    <NavLink
                        to="/admin/productos"
                        end
                        className={({ isActive }) => `menu-item${isActive ? ' active' : ''}`}
                    >
                        <LayoutGrid className="menu-icon" size={18} />
                        <span className="menu-item-text">Catálogo</span>
                    </NavLink>

                    <NavLink
                        to="/admin/productos/nuevo"
                        className={({ isActive }) => `menu-item${isActive ? ' active' : ''}`}
                    >
                        <PackagePlus className="menu-icon" size={18} />
                        <span className="menu-item-text">Agregar producto</span>
                    </NavLink>
                </nav>
            </div>

            <div className="sidebar-user-block">
                <div className="sidebar-user-info">
                    <div className="sidebar-avatar">{iniciales}</div>
                    <div>
                        <div className="sidebar-user-name">Administrador</div>
                        <div className="sidebar-user-role">{sesion?.correo || 'Sesión activa'}</div>
                    </div>
                </div>
                <button type="button" className="sidebar-logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;

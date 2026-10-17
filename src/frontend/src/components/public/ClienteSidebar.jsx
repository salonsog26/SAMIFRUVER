// src/components/public/ClienteSidebar.jsx — menú lateral del área "Mi cuenta" (cliente)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Heart, LogOut } from 'lucide-react';
import logo from '../../assets/logo-samifruver.png';
import { obtenerSesion, cerrarSesion } from '../../utils/auth';
import { iniciales } from './Navbar';
import '../../styles/variables.css';

// "Mis pedidos", "Direcciones" y "Favoritos" aparecen en el diseño pero aún no tienen pantalla.
const OPCIONES_PROXIMAMENTE = [
    { texto: 'Mis pedidos', Icono: Package },
    { texto: 'Direcciones', Icono: MapPin },
    { texto: 'Favoritos', Icono: Heart }
];

function ClienteSidebar({ nombre }) {
    const navigate = useNavigate();
    const sesion = obtenerSesion();
    const nombreMostrado = nombre || sesion?.nombre || 'Cliente';

    const salir = () => {
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
                    <span className="menu-item active" aria-current="page">
                        <User className="menu-icon" size={18} />
                        <span className="menu-item-text">Mi perfil</span>
                    </span>
                    {OPCIONES_PROXIMAMENTE.map(({ texto, Icono }) => (
                        <button key={texto} type="button" className="menu-item menu-item-boton" title="Próximamente" aria-disabled="true" onClick={(e) => e.preventDefault()}>
                            <Icono className="menu-icon" size={18} />
                            <span className="menu-item-text">{texto}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="sidebar-user-block">
                <div className="sidebar-user-info sidebar-user-card">
                    <div className="sidebar-avatar">{iniciales(nombreMostrado)}</div>
                    <div>
                        <div className="sidebar-user-name">{nombreMostrado}</div>
                        <div className="sidebar-user-role">Cliente</div>
                    </div>
                </div>
                <button type="button" className="sidebar-logout" onClick={salir}>
                    <LogOut size={18} />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}

export default ClienteSidebar;

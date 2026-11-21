// src/components/domiciliario/DomiciliarioLayout.jsx — E5: portal del domiciliario (header + sidebar + contenido)
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    Home, Package, History, User, CircleHelp, LogOut, Menu, Search, Bell, ChevronDown, X
} from 'lucide-react';
import logo from '../../assets/logo-samifruver.png';
import { obtenerSesion, cerrarSesion } from '../../utils/auth';
import Avatar from './Avatar';
import useMenuLateral from '../../utils/useMenuLateral';
import { DomiciliarioAvisosProvider, useDomiciliarioAvisos } from '../../context/DomiciliarioAvisosContext';
import '../../styles/variables.css';
import '../../styles/domicilios.css';

const MENU = [
    { to: '/domiciliario', texto: 'Inicio', Icono: Home, end: true },
    { to: '/domiciliario/pedidos', texto: 'Pedidos asignados', Icono: Package },
    { to: '/domiciliario/historial', texto: 'Historial de entregas', Icono: History },
    { to: '/domiciliario/perfil', texto: 'Mi perfil', Icono: User }
];

function DomiciliarioLayoutInterno() {
    const navigate = useNavigate();
    const sesion = obtenerSesion();
    const nombre = sesion?.nombre || 'Domiciliario';
    const { abierto, abrir, cerrar } = useMenuLateral();
    const { haySinLeer, marcarLeidos } = useDomiciliarioAvisos();
    const [busqueda, setBusqueda] = useState('');
    const [colapsado, setColapsado] = useState(false); // escritorio: oculta el sidebar

    // En móvil el menú es un panel que se desliza; en escritorio colapsa la columna.
    const alternarMenu = () => {
        if (window.innerWidth < 900) abrir();
        else setColapsado((c) => !c);
    };

    const buscar = (e) => {
        e.preventDefault();
        const q = busqueda.trim();
        navigate(q ? `/domiciliario/pedidos?busqueda=${encodeURIComponent(q)}` : '/domiciliario/pedidos');
    };

    const salir = () => {
        cerrarSesion();
        navigate('/login');
    };

    return (
        <div className="dom-layout">
            <header className="dom-header">
                <button type="button" className="dom-hamburguesa" aria-label="Abrir menú" aria-expanded={abierto || colapsado} onClick={alternarMenu}>
                    <Menu size={22} />
                </button>
                <NavLink to="/domiciliario/pedidos" className="dom-header-logo">
                    <img src={logo} alt="Samifruver" />
                </NavLink>
                <form className="dom-buscador" role="search" onSubmit={buscar}>
                    <Search size={16} aria-hidden="true" />
                    <input
                        type="search"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por número de pedido o dirección"
                        aria-label="Buscar por número de pedido o dirección"
                    />
                </form>
                <div className="dom-header-acciones">
                    <button type="button" className="dom-campana" aria-label={haySinLeer ? 'Avisos nuevos' : 'Sin avisos nuevos'} onClick={marcarLeidos}>
                        <Bell size={20} />
                        {haySinLeer && <span className="dom-campana-punto" aria-hidden="true" />}
                    </button>
                    <NavLink to="/domiciliario/perfil" className="dom-usuario" aria-label="Ir a mi perfil">
                        <Avatar nombre={nombre} foto={sesion?.foto} />
                        <span className="dom-usuario-texto">
                            <strong>{nombre.split(' ')[0]}</strong>
                            <span>Domiciliario</span>
                        </span>
                        <ChevronDown size={16} aria-hidden="true" />
                    </NavLink>
                </div>
            </header>

            {abierto && <div className="sidebar-backdrop" onClick={cerrar} />}

            <div className="dom-cuerpo">
                <aside className={`dom-sidebar${abierto ? ' abierto' : ''}${colapsado ? ' colapsado' : ''}`} aria-label="Menú del domiciliario">
                    <div className="dom-sidebar-logo">
                        <img src={logo} alt="" aria-hidden="true" />
                        <button type="button" className="sidebar-cerrar" aria-label="Cerrar menú" onClick={cerrar}>
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="dom-sidebar-menu">
                        <p className="dom-menu-etiqueta">Mi espacio</p>
                        {MENU.map(({ to, texto, Icono, end }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({ isActive }) => `dom-item${isActive ? ' activo' : ''}`}
                            >
                                <Icono size={18} aria-hidden="true" />
                                <span>{texto}</span>
                            </NavLink>
                        ))}
                    </nav>

                    <div className="dom-sidebar-abajo">
                        <button type="button" className="dom-item dom-item-suelto" title="Próximamente" aria-disabled="true" onClick={(e) => e.preventDefault()}>
                            <CircleHelp size={18} aria-hidden="true" />
                            <span>Centro de ayuda</span>
                        </button>
                        <div className="dom-sidebar-usuario">
                            <Avatar nombre={nombre} foto={sesion?.foto} className="sidebar-avatar" />
                            <div className="dom-sidebar-usuario-texto">
                                <span className="sidebar-user-name">{nombre}</span>
                                <span className="sidebar-user-role">Domiciliario</span>
                            </div>
                        </div>
                        <button type="button" className="sidebar-logout" onClick={salir}>
                            <LogOut size={16} />
                            Cerrar sesión
                        </button>
                    </div>
                </aside>

                <main className="dom-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

function DomiciliarioLayout() {
    return (
        <DomiciliarioAvisosProvider>
            <DomiciliarioLayoutInterno />
        </DomiciliarioAvisosProvider>
    );
}

export default DomiciliarioLayout;

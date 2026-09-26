// src/components/admin/TopBar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cerrarSesion } from '../../utils/auth';
import '../../styles/variables.css';

function TopBar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        cerrarSesion();
        navigate('/login');
    };

    return (
        <header className="topbar">
            <div className="topbar-title">Panel de Administrador</div>

            <div className="topbar-user" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="topbar-role">Administrador</div>
                <img className="topbar-avatar" src="https://placehold.co/40x40" alt="Avatar del administrador" />
                <button type="button" className="btn-logout" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </div>
        </header>
    );
}

export default TopBar;

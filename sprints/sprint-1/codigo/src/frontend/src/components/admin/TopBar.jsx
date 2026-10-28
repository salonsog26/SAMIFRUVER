// src/components/admin/TopBar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/variables.css';

function TopBar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
    };

    return (
        <header className="topbar">
            <div className="topbar-title">Panel de Administrador</div>

            <div className="topbar-user" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="topbar-role">Administrador</div>
                <img className="topbar-avatar" src="https://placehold.co/40x40" alt="Avatar del administrador" />
                <button
                    onClick={handleLogout}
                    style={{ background: 'transparent', border: '1px solid #E6DEC9', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: '#3E2723', fontFamily: 'Inter', fontSize: 13 }}
                >
                    Cerrar sesión
                </button>
            </div>
        </header>
    );
}

export default TopBar;
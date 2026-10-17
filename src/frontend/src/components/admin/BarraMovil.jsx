// src/components/admin/BarraMovil.jsx
// Barra superior con botón de menú: solo se ve en pantallas pequeñas (el menú lateral pasa a ser un panel deslizable).
import React from 'react';
import { Menu } from 'lucide-react';
import logo from '../../assets/logo-samifruver.png';
import '../../styles/variables.css';

function BarraMovil({ abierto, onAbrir }) {
    return (
        <div className="mobile-topbar">
            <button type="button" className="sidebar-toggle" aria-label="Abrir menú" aria-expanded={abierto} onClick={onAbrir}>
                <Menu size={22} />
            </button>
            <img src={logo} alt="" aria-hidden="true" style={{ height: 28, width: 'auto' }} />
        </div>
    );
}

export default BarraMovil;

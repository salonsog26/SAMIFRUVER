// src/components/public/PublicNavbar.jsx
import React from 'react';
import logo from '../../assets/logo-samifruver.png';
import '../../styles/variables.css';

function PublicNavbar({ textoEnlace = "← Volver al catálogo", rutaEnlace = "/" }) {
    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <img src={logo} alt="Samifruver" style={{ height: 36, width: 'auto' }} />
            <a href={rutaEnlace} style={{ color: '#20A34A', fontSize: 14, fontFamily: 'Inter', textDecoration: 'none' }}>
                {textoEnlace}
            </a>
        </div>
    );
}

export default PublicNavbar;
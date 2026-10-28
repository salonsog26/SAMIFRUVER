// src/components/public/PublicNavbar.jsx
import React from 'react';
import '../../styles/variables.css';

function PublicNavbar({ textoEnlace = "← Volver al catálogo", rutaEnlace = "/" }) {
    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, background: '#20A34A', borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: 14, height: 16, border: '1px solid white' }} />
                </div>
                <span style={{ color: '#10271B', fontSize: 20, fontFamily: 'Inter', fontWeight: 800 }}>SAMIFRUBER</span>
            </div>
            <a href={rutaEnlace} style={{ color: '#20A34A', fontSize: 14, fontFamily: 'Inter', textDecoration: 'none' }}>
                {textoEnlace}
            </a>
        </div>
    );
}

export default PublicNavbar;
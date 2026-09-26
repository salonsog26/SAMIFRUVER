// src/components/public/AuthHeroBanner.jsx
import React from 'react';
import logo from '../../assets/logo-samifruver.png';
import '../../styles/variables.css';

function AuthHeroBanner() {
    return (
        <div className="auth-hero-section">
            <img
                style={{ width: '100%', height: '100%', left: 0, top: 0, position: 'absolute', objectFit: 'cover' }}
                src="https://placehold.co/650x900"
                alt="Fondo agrícola"
            />
            <div style={{ width: '100%', height: '100%', left: 0, top: 0, position: 'absolute', background: 'linear-gradient(180deg, rgba(10, 42, 22, 0.05) 0%, rgba(10, 42, 22, 0.72) 100%)' }} />

            {/* Logo superior */}
            <div style={{ zIndex: 1 }}>
                <img src={logo} alt="Samifruver" style={{ height: 34, width: 'auto' }} />
            </div>

            {/* Texto institucional */}
            <div style={{ zIndex: 1, maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h1 style={{ color: 'white', fontSize: 38, fontFamily: 'Inter', fontWeight: 400, margin: 0, lineHeight: '42px' }}>
                    La frescura del campo, siempre cerca de ti.
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 16, fontFamily: 'Inter', margin: 0 }}>
                    Productos agrícolas seleccionados, directamente de nuestros productores.
                </p>
            </div>
        </div>
    );
}

export default AuthHeroBanner;
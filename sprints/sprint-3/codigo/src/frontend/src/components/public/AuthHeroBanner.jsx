// src/components/public/AuthHeroBanner.jsx
import React from 'react';
import logo from '../../assets/logo-samifruver.png';
import bannerLogin from '../../assets/banner-login.webp';
import '../../styles/variables.css';

// El texto cambia según la pantalla (Login / Registro), como en el diseño.
function AuthHeroBanner({
    titulo = 'La frescura del campo, siempre cerca de ti.',
    subtitulo = 'Productos agrícolas seleccionados, directamente de nuestros productores.'
}) {
    return (
        <div className="auth-hero-section">
            <img
                style={{ width: '100%', height: '100%', left: 0, top: 0, position: 'absolute', objectFit: 'cover' }}
                src={bannerLogin}
                alt="Fondo agrícola"
            />
            <div style={{ width: '100%', height: '100%', left: 0, top: 0, position: 'absolute', background: 'linear-gradient(180deg, rgba(10, 42, 22, 0.05) 0%, rgba(10, 42, 22, 0.72) 100%)' }} />

            <div style={{ zIndex: 1 }}>
                <img src={logo} alt="Samifruver" style={{ height: 34, width: 'auto' }} />
            </div>

            <div style={{ zIndex: 1, maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h1 style={{ color: 'white', fontSize: 38, fontFamily: 'Inter', fontWeight: 400, margin: 0, lineHeight: '42px' }}>
                    {titulo}
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 16, fontFamily: 'Inter', margin: 0 }}>
                    {subtitulo}
                </p>
            </div>
        </div>
    );
}

export default AuthHeroBanner;

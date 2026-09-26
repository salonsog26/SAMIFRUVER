// src/components/public/Footer.jsx
import React from 'react';
import logo from '../../assets/logo-samifruver.png';
import '../../styles/variables.css';

function Footer() {
    return (
        <footer className="public-footer">
            <div className="public-footer-brand">
                <img src={logo} alt="Samifruver" style={{ height: 28, width: 'auto' }} />
            </div>
            <div className="public-footer-copy">© 2026 Samifruver · Agricultura que nos une</div>
            <div className="public-footer-links">Contacto&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;Términos&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;Privacidad</div>
        </footer>
    );
}

export default Footer;
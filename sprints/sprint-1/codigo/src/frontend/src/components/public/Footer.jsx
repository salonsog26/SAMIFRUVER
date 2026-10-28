// src/components/public/Footer.jsx
import React from 'react';
import '../../styles/variables.css';

function Footer() {
    return (
        <footer className="public-footer">
            <div className="public-footer-brand">
                <div className="public-footer-logo">
                    <div className="public-footer-logo-inner" />
                </div>
                <span className="public-footer-title">SAMIFRUBER</span>
            </div>
            <div className="public-footer-copy">© 2026 SAMIFRUBER · Agricultura que nos une</div>
            <div className="public-footer-links">Contacto&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;Términos&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;Privacidad</div>
        </footer>
    );
}

export default Footer;
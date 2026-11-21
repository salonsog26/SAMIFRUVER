// src/components/domiciliario/Avatar.jsx — foto de perfil o iniciales si no hay foto
import React from 'react';
import { iniciales } from '../public/Navbar';

function Avatar({ nombre = '', foto = '', className = 'dom-avatar' }) {
    if (foto) {
        return <img src={foto} alt="" className={`${className} dom-avatar-foto`} />;
    }
    return <span className={className} aria-hidden="true">{iniciales(nombre)}</span>;
}

export default Avatar;

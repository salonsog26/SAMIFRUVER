import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import Navbar, { iniciales } from '../components/public/Navbar';
import { renderEnRutas, ponerSesion, SESION_CLIENTE, SESION_ADMIN } from './utils.jsx';

const montar = () => renderEnRutas([{ path: '/', element: <Navbar /> }], '/');

describe('Navbar del catálogo (E2-HU2)', () => {
    it('sin sesión: muestra "Iniciar Sesión" y "Registrarse"', () => {
        montar();
        expect(screen.getByRole('link', { name: 'Iniciar Sesión' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Registrarse' })).toBeInTheDocument();
    });
    it('cliente con sesión: muestra su nombre con iniciales, enlaza a /perfil y oculta los botones de acceso', () => {
        ponerSesion(SESION_CLIENTE);
        montar();
        const enlace = screen.getByRole('link', { name: 'Ir a mi perfil' });
        expect(enlace).toHaveAttribute('href', '/perfil');
        expect(screen.getByText('Ana')).toBeInTheDocument();
        expect(screen.getByText('AP')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Iniciar Sesión' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Registrarse' })).not.toBeInTheDocument();
    });
    it('administrador con sesión: su enlace va al panel de productos', () => {
        ponerSesion(SESION_ADMIN);
        montar();
        expect(screen.getByRole('link', { name: 'Ir al panel de administrador' })).toHaveAttribute('href', '/admin/productos');
    });
    it('iniciales(): dos letras, tolera nombres vacíos o con espacios', () => {
        expect(iniciales('maría gómez')).toBe('MG');
        expect(iniciales('  Ana  ')).toBe('A');
        expect(iniciales('')).toBe('US');
    });
});

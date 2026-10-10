// src/pages/public/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthHeroBanner from '../../components/public/AuthHeroBanner';
import PublicNavbar from '../../components/public/PublicNavbar';
import AuthInput from '../../components/forms/AuthInput';
import { guardarSesion } from '../../utils/auth';
import '../../styles/variables.css';

const API_URL = 'http://localhost:4000';

function Login() {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [credencialesInvalidas, setCredencialesInvalidas] = useState(false);
    const [errorGeneral, setErrorGeneral] = useState('');
    const [cargando, setCargando] = useState(false);

    const botonDeshabilitado = !correo.trim() || !contrasena.trim() || cargando;

    const manejarCambioCorreo = (e) => {
        setCorreo(e.target.value);
        setCredencialesInvalidas(false);
        setErrorGeneral('');
    };

    const manejarCambioContrasena = (e) => {
        setContrasena(e.target.value);
        setCredencialesInvalidas(false);
        setErrorGeneral('');
    };

    const manejarSubmit = async (e) => {
        e.preventDefault();
        if (botonDeshabilitado) return;

        setCargando(true);
        setErrorGeneral('');
        setCredencialesInvalidas(false);

        try {
            const respCliente = await fetch(`${API_URL}/api/clientes/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, password: contrasena }),
            });
            const dataCliente = await respCliente.json();

            if (respCliente.ok) {
                guardarSesion({ ...dataCliente.cliente, rol: 'cliente' });
                navigate('/');
                return;
            }

            const respAdmin = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, password: contrasena }),
            });
            const dataAdmin = await respAdmin.json();

            if (respAdmin.ok) {
                guardarSesion({ correo: dataAdmin.usuario.correo, nombre: 'Administrador', rol: 'admin' });
                navigate('/admin/productos');
                return;
            }

            setCredencialesInvalidas(true);
            setErrorGeneral('La información de inicio de sesión que ingresaste es incorrecta.');
        } catch (error) {
            setErrorGeneral('No se pudo conectar con el servidor. Intenta de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="auth-layout">
            <AuthHeroBanner />

            <div className="auth-form-section">
                <PublicNavbar textoEnlace="← Volver al catálogo" rutaEnlace="/" />

                <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h2 style={{ color: '#10271B', fontSize: 36, fontFamily: 'Inter', margin: 0 }}>Bienvenido de nuevo</h2>
                        <p style={{ color: '#68786F', fontSize: 16, fontFamily: 'Inter', margin: 0 }}>Ingresa tus datos para continuar comprando productos frescos.</p>
                    </div>

                    <form onSubmit={manejarSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
                        <AuthInput label="Correo electrónico" type="email" value={correo} onChange={manejarCambioCorreo} error={credencialesInvalidas} />
                        <AuthInput label="Contraseña" type="password" value={contrasena} onChange={manejarCambioContrasena} error={credencialesInvalidas} />

                        {errorGeneral && (
                            <p style={{ color: '#D92D20', fontSize: 14, fontFamily: 'Inter', margin: 0 }}>{errorGeneral}</p>
                        )}

                        <div style={{ textAlign: 'right' }}>
                            <a href="#forgot" style={{ color: '#20A34A', fontSize: 14, fontFamily: 'Inter', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
                        </div>

                        <button type="submit" className="btn-primary" disabled={botonDeshabilitado} style={{ width: '100%', height: 48 }}>
                            {cargando ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <span style={{ color: '#68786F', fontSize: 14, fontFamily: 'Inter' }}>¿No tienes una cuenta? </span>
                        <Link to="/registro" style={{ color: '#20A34A', fontSize: 14, fontFamily: 'Inter', fontWeight: 700, textDecoration: 'none' }}>Regístrate aquí</Link>
                    </div>
                </div>

                <div style={{ textAlign: 'center', width: '100%', color: '#68786F', fontSize: 12, fontFamily: 'Inter' }}>
                    Al continuar aceptas nuestros términos y política de privacidad.
                </div>
            </div>
        </div>
    );
}

export default Login;
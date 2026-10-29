// src/pages/public/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthHeroBanner from '../../components/public/AuthHeroBanner';
import PublicNavbar from '../../components/public/PublicNavbar';
import AuthInput from '../../components/forms/AuthInput';
import { login, MSJ_LOGIN_INCORRECTO } from '../../utils/auth';
import { validarCorreoLogin } from '../../utils/validaciones';
import '../../styles/variables.css';


function Login() {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [credencialesInvalidas, setCredencialesInvalidas] = useState(false);
    const [errorGeneral, setErrorGeneral] = useState('');
    const [errorCorreo, setErrorCorreo] = useState('');
    const [cargando, setCargando] = useState(false);

    const botonDeshabilitado = !correo.trim() || !contrasena.trim() || cargando;

    const manejarCambioCorreo = (e) => {
        setCorreo(e.target.value);
        setErrorCorreo('');
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

        const formatoCorreo = validarCorreoLogin(correo);
        if (formatoCorreo) { // correo con formato inválido: no se envía
            setErrorCorreo(formatoCorreo);
            return;
        }

        setCargando(true);
        setErrorGeneral('');
        setCredencialesInvalidas(false);

        const resultado = await login(correo, contrasena);
        setCargando(false);

        if (resultado.ok) {
            // replace: true evita que el Login quede en el historial del navegador,
            // así el botón "atrás" ya no puede volver a esta pantalla tras iniciar sesión.
            navigate(resultado.usuario.rol === 'admin' ? '/admin/productos' : '/', { replace: true });
            return;
        }
        if (resultado.red) {
            setErrorGeneral(resultado.mensaje);
        } else {
            setCredencialesInvalidas(true);
            setErrorGeneral(MSJ_LOGIN_INCORRECTO);
        }
    };

    return (
        <div className="auth-layout">
            <AuthHeroBanner />

            <div className="auth-form-section">
                <PublicNavbar textoEnlace="← Volver al catálogo" rutaEnlace="/" />

                <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h2 className="auth-titulo">Bienvenido de nuevo</h2>
                        <p style={{ color: '#68786F', fontSize: 16, fontFamily: 'Inter', margin: 0 }}>Ingresa tus datos para continuar comprando productos frescos.</p>
                    </div>

                    <form noValidate onSubmit={manejarSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
                        <AuthInput label="Correo electrónico" type="email" placeholder="nombre@correo.com" value={correo} onChange={manejarCambioCorreo} error={errorCorreo || credencialesInvalidas} autoComplete="email" />
                        <AuthInput label="Contraseña" type="password" value={contrasena} onChange={manejarCambioContrasena} error={credencialesInvalidas} autoComplete="current-password" />

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
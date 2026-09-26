// src/pages/public/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeroBanner from '../../components/public/AuthHeroBanner';
import PublicNavbar from '../../components/public/PublicNavbar';
import AuthInput from '../../components/forms/AuthInput';
import { login } from '../../utils/auth';
import '../../styles/variables.css';

function Login() {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [enviando, setEnviando] = useState(false);

    const correoValido = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

    const manejarSubmit = async (e) => {
        e.preventDefault();

        const nuevosErrores = {};
        if (!correo.trim()) nuevosErrores.correo = 'El correo es obligatorio';
        else if (!correoValido(correo)) nuevosErrores.correo = 'Correo no válido';
        if (!contrasena.trim()) nuevosErrores.contrasena = 'La contraseña es obligatoria';

        setErrores(nuevosErrores);
        setErrorGeneral('');
        if (Object.keys(nuevosErrores).length > 0) return;

        setEnviando(true);
        const resultado = await login(correo, contrasena);
        setEnviando(false);

        if (!resultado.ok) {
            setErrorGeneral(resultado.mensaje);
            return;
        }

        navigate('/admin/productos');
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
                        <AuthInput label="Correo electrónico" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errores.correo} />
                        <AuthInput label="Contraseña" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} error={errores.contrasena} />

                        {errorGeneral && <p style={{ color: '#D92D20', fontSize: 14, fontFamily: 'Inter', margin: 0 }}>{errorGeneral}</p>}

                        <div style={{ textAlign: 'right' }}>
                            <a href="#forgot" style={{ color: '#20A34A', fontSize: 14, fontFamily: 'Inter', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={enviando}
                            style={{ height: 48, background: '#20A34A', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontFamily: 'Inter', fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1 }}
                        >
                            {enviando ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <span style={{ color: '#68786F', fontSize: 14, fontFamily: 'Inter' }}>¿No tienes una cuenta? </span>
                        <span style={{ color: '#20A34A', fontSize: 14, fontFamily: 'Inter', fontWeight: 700, cursor: 'pointer' }}>Regístrate aquí</span>
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

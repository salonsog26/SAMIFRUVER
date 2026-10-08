// src/pages/public/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeroBanner from '../../components/public/AuthHeroBanner';
import PublicNavbar from '../../components/public/PublicNavbar';
import AuthInput from '../../components/forms/AuthInput';
import { login } from '../../utils/auth';
import '../../styles/variables.css';

const correoValido = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

function Login() {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [enviando, setEnviando] = useState(false);

    // El botón solo se habilita (y se pone verde) cuando ambos campos
    // tienen contenido real, sin contar espacios en blanco.
    const formValido = correo.trim().length > 0 && contrasena.trim().length > 0;

    const manejarSubmit = async (e) => {
        e.preventDefault();

        const correoLimpio = correo.trim();
        const contrasenaLimpia = contrasena.trim();

        const nuevosErrores = {};
        if (!correoLimpio) nuevosErrores.correo = 'El correo es obligatorio';
        else if (!correoValido(correoLimpio)) nuevosErrores.correo = 'Correo no válido';
        if (!contrasenaLimpia) nuevosErrores.contrasena = 'La contraseña es obligatoria';

        setErrores(nuevosErrores);
        setErrorGeneral('');
        if (Object.keys(nuevosErrores).length > 0) return;

        setEnviando(true);
        const resultado = await login(correoLimpio, contrasenaLimpia);
        setEnviando(false);

        if (!resultado.ok) {
            setErrorGeneral(resultado.mensaje);
            return;
        }

        navigate('/admin/productos');
    };

    const puedeEnviar = formValido && !enviando;

    return (
        <div className="auth-layout">
            <AuthHeroBanner />

            <div className="auth-form-section">
                <PublicNavbar textoEnlace="← Volver al catálogo" rutaEnlace="/" />

                <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h2 style={{ color: '#10271B', fontSize: 36, fontFamily: 'Inter', margin: 0 }}>Bienvenido de nuevo</h2>
                        <p style={{ color: '#68786F', fontSize: 16, fontFamily: 'Inter', margin: 0 }}>Ingresa tus datos para continuar gestionando el inventario.</p>
                    </div>

                    <form onSubmit={manejarSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
                        <AuthInput label="Correo electrónico" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errores.correo} />
                        <AuthInput label="Contraseña" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} error={errores.contrasena} />

                        {errorGeneral && <p style={{ color: '#D92D20', fontSize: 14, fontFamily: 'Inter', margin: 0 }}>{errorGeneral}</p>}

                        <button
                            type="submit"
                            className={`btn-login${puedeEnviar ? ' btn-login-activo' : ''}`}
                            disabled={!puedeEnviar}
                        >
                            {enviando ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>
                </div>

                <div style={{ textAlign: 'center', width: '100%', color: '#68786F', fontSize: 12, fontFamily: 'Inter' }}>
                    Acceso exclusivo para administradores de SAMIFRUVER.
                </div>
            </div>
        </div>
    );
}

export default Login;

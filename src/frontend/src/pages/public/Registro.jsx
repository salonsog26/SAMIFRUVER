// src/pages/public/Registro.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthHeroBanner from '../../components/public/AuthHeroBanner';
import PublicNavbar from '../../components/public/PublicNavbar';
import AuthInput from '../../components/forms/AuthInput';
import Alert from '../../components/ui/Alert';
import '../../styles/variables.css';

const API_URL = 'http://localhost:4000';

function Registro() {
    const navigate = useNavigate();

    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');

    const [errores, setErrores] = useState({});
    const [alerta, setAlerta] = useState(null);
    const [enviando, setEnviando] = useState(false);

    const correoValido = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

    const validar = () => {
        const nuevosErrores = {};

        if (!nombre.trim()) nuevosErrores.nombre = 'Este campo es obligatorio';

        if (!correo.trim()) nuevosErrores.correo = 'Este campo es obligatorio';
        else if (!correoValido(correo.trim())) nuevosErrores.correo = 'Ingresa un correo electrónico válido';

        if (!telefono.trim()) nuevosErrores.telefono = 'Este campo es obligatorio';
        else if (!/^[0-9]{7,15}$/.test(telefono.trim())) nuevosErrores.telefono = 'Ingresa un teléfono válido';

        if (!password) nuevosErrores.password = 'Este campo es obligatorio';
        else if (password.length < 8) nuevosErrores.password = 'La contraseña debe tener mínimo 8 caracteres';

        return nuevosErrores;
    };

    const manejarSubmit = async (e) => {
        e.preventDefault();
        if (enviando) return;

        const nuevosErrores = validar();
        setErrores(nuevosErrores);
        setAlerta(null);

        if (Object.keys(nuevosErrores).length > 0) {
            return; // Escenarios 3 y 4: no se envía, se queda en la página
        }

        setEnviando(true);
        try {
            const respuesta = await fetch(`${API_URL}/api/clientes/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, correo, telefono, password }),
            });
            const data = await respuesta.json();

            if (respuesta.status === 409) {
                // Escenario 1: cliente ya registrado
                setErrores({ correo: 'usuario ya existe' });
                setAlerta({ tipo: 'error', mensaje: 'usuario ya existe' });
                return;
            }

            if (!respuesta.ok) {
                setErrores(data.errores || {});
                setAlerta({ tipo: 'error', mensaje: data.mensaje || 'No se pudo completar el registro.' });
                return;
            }

            // Escenario 2: registro exitoso
            setAlerta({ tipo: 'exito', mensaje: 'Registro exitoso' });
            setTimeout(() => navigate('/login'), 1500);
        } catch (error) {
            setAlerta({ tipo: 'error', mensaje: 'No se pudo conectar con el servidor. Intenta de nuevo.' });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="auth-layout">
            <AuthHeroBanner />

            <div className="auth-form-section" style={{ position: 'relative' }}>
                <PublicNavbar textoEnlace="← Volver al catálogo" rutaEnlace="/" />

                {alerta && <Alert tipo={alerta.tipo} mensaje={alerta.mensaje} />}

                <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h2 style={{ color: '#10271B', fontSize: 36, fontFamily: 'Inter', margin: 0 }}>Crea tu cuenta en Samifruver</h2>
                        <p style={{ color: '#68786F', fontSize: 16, fontFamily: 'Inter', margin: 0 }}>Empieza a recibir lo mejor del campo en tu puerta.</p>
                    </div>

                    <form onSubmit={manejarSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
                        <AuthInput label="Nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} />
                        <AuthInput label="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errores.correo} />
                        <AuthInput label="Teléfono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} error={errores.telefono} />
                        <AuthInput label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errores.password} />
                        {!errores.password && (
                            <p style={{ color: '#68786F', fontSize: 12, fontFamily: 'Inter', margin: '-10px 0 0' }}>
                                Mínimo 8 caracteres
                            </p>
                        )}

                        <button type="submit" className="btn-primary" disabled={enviando} style={{ width: '100%', height: 48 }}>
                            {enviando ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <span style={{ color: '#68786F', fontSize: 14, fontFamily: 'Inter' }}>¿Ya tienes cuenta? </span>
                        <Link to="/login" style={{ color: '#20A34A', fontSize: 14, fontFamily: 'Inter', fontWeight: 700, textDecoration: 'none' }}>Inicia sesión aquí</Link>
                    </div>
                </div>

                <div style={{ textAlign: 'center', width: '100%', color: '#68786F', fontSize: 12, fontFamily: 'Inter' }}>
                    Al crear tu cuenta aceptas nuestros términos y política de privacidad.
                </div>
            </div>
        </div>
    );
}

export default Registro;
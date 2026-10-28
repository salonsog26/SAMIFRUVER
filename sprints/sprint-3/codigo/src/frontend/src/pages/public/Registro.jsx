// src/pages/public/Registro.jsx — E2-HU1 Registro de cliente
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthHeroBanner from '../../components/public/AuthHeroBanner';
import PublicNavbar from '../../components/public/PublicNavbar';
import AuthInput from '../../components/forms/AuthInput';
import Alert from '../../components/ui/Alert';
import InlineAlert from '../../components/ui/InlineAlert';
import { validarRegistro, normalizarTexto } from '../../utils/validaciones';
import { API_URL } from '../../utils/config';
import '../../styles/variables.css';

function Registro() {
    const navigate = useNavigate();

    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');

    const [errores, setErrores] = useState({});
    const [yaExiste, setYaExiste] = useState(false);   // aviso "El usuario ya existe"
    const [exito, setExito] = useState(false);          // aviso "Registro exitoso"
    const [errorGeneral, setErrorGeneral] = useState('');
    const [enviando, setEnviando] = useState(false);

    const cambiar = (setter, campo) => (e) => {
        setter(e.target.value);
        setErrores((prev) => ({ ...prev, [campo]: undefined }));
        setYaExiste(false);
        setErrorGeneral('');
    };

    const manejarSubmit = async (e) => {
        e.preventDefault();
        if (enviando) return;

        const nuevosErrores = validarRegistro({ nombre, correo, telefono, password });
        setErrores(nuevosErrores);
        setYaExiste(false);
        setErrorGeneral('');
        if (Object.keys(nuevosErrores).length > 0) return; // ESC3 y ESC4: no se envía

        setEnviando(true);
        try {
            const respuesta = await fetch(`${API_URL}/api/clientes/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: normalizarTexto(nombre),
                    correo: correo.trim(),
                    telefono: normalizarTexto(telefono),
                    password
                }),
            });
            const data = await respuesta.json();

            if (respuesta.status === 409) { // ESC1: cliente ya registrado
                setYaExiste(true);
                return;
            }
            if (!respuesta.ok) {
                setErrores(data.errores || {});
                if (!data.errores) setErrorGeneral(data.mensaje || 'No se pudo completar el registro.');
                return;
            }

            // ESC2: registro exitoso
            setExito(true);
            setTimeout(() => navigate('/login'), 1500);
        } catch (error) {
            setErrorGeneral('No se pudo conectar con el servidor. Intenta de nuevo.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="auth-layout">
            <AuthHeroBanner
                titulo="Cultivamos confianza, entregamos frescura."
                subtitulo="Productos agrícolas seleccionados, directamente de nuestros productores."
            />

            <div className="auth-form-section" style={{ position: 'relative' }}>
                <PublicNavbar textoEnlace="← Volver al catálogo" rutaEnlace="/" />

                {exito && <Alert tipo="exito" mensaje="Registro exitoso" />}

                <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h2 className="auth-titulo">Crea tu cuenta en SAMIFRUVER</h2>
                        <p style={{ color: '#68786F', fontSize: 16, fontFamily: 'Inter', margin: 0 }}>Empieza a recibir lo mejor del campo en tu puerta.</p>
                    </div>

                    {yaExiste && <InlineAlert mensaje="El usuario ya existe" />}
                    {errorGeneral && <InlineAlert mensaje={errorGeneral} />}

                    <form noValidate onSubmit={manejarSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
                        <AuthInput label="Nombre" type="text" placeholder="Escribe tu nombre" value={nombre} onChange={cambiar(setNombre, 'nombre')} error={errores.nombre} autoComplete="name" />
                        <AuthInput label="Correo" type="email" placeholder="nombre@correo.com" value={correo} onChange={cambiar(setCorreo, 'correo')} error={errores.correo} autoComplete="email" />
                        <AuthInput label="Teléfono" type="tel" placeholder="300 000 0000" value={telefono} onChange={cambiar(setTelefono, 'telefono')} error={errores.telefono} autoComplete="tel" />
                        <AuthInput label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={cambiar(setPassword, 'password')} error={errores.password} autoComplete="new-password" />

                        <button type="submit" className="btn-primary" disabled={enviando} style={{ width: '100%', height: 48 }}>
                            {enviando ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', width: '100%', color: '#68786F', fontSize: 14, fontFamily: 'Inter' }}>
                        ¿Ya tienes cuenta? <Link to="/login" className="auth-enlace-suave">Inicia sesión aquí</Link>
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

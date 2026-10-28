// src/pages/public/Perfil.jsx — E2-HU3 Editar perfil del cliente
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/public/Navbar';
import AuthInput from '../../components/forms/AuthInput';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { obtenerSesion, guardarSesion } from '../../utils/auth';
import { API_URL } from '../../utils/config';
import { validarPerfil } from '../../utils/validaciones';
import '../../styles/variables.css';

function Perfil() {
    const navigate = useNavigate();
    const [sesion] = useState(() => obtenerSesion());
    const [original, setOriginal] = useState({
        nombre: sesion?.nombre || '',
        correo: sesion?.correo || '',
        telefono: sesion?.telefono || ''
    });
    const [datos, setDatos] = useState(original);
    const [errores, setErrores] = useState({});
    const [alerta, setAlerta] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [confirmarSalida, setConfirmarSalida] = useState(false);

    const hayCambios = ['nombre', 'correo', 'telefono'].some(
        (c) => datos[c].trim() !== original[c]
    );

    const cambiar = (campo) => (e) => {
        setDatos({ ...datos, [campo]: e.target.value });
        setErrores({ ...errores, [campo]: undefined });
        setAlerta(null);
    };

    const guardar = async (e) => {
        e.preventDefault();
        if (enviando) return;
        setAlerta(null);

        const nuevosErrores = validarPerfil(datos);
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return; // ESC1: no se envía

        if (!hayCambios) { // ESC4: guardar sin cambios
            setAlerta({ tipo: 'advertencia', mensaje: 'No se ha realizado ningún cambio' });
            return;
        }

        setEnviando(true);
        try {
            const resp = await fetch(`${API_URL}/api/clientes/${sesion.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: datos.nombre, correo: datos.correo, telefono: datos.telefono })
            });
            const data = await resp.json();

            if (!resp.ok) { // ESC2: correo de otro usuario, u otros errores del servidor
                setErrores(data.errores || {});
                setAlerta({ tipo: 'error', mensaje: data.mensaje || 'No se pudo guardar.' });
                return;
            }

            // ESC6: guardado exitoso
            const actualizado = { nombre: data.cliente.nombre, correo: data.cliente.correo, telefono: data.cliente.telefono };
            guardarSesion({ ...sesion, ...actualizado });
            setOriginal(actualizado);
            setDatos(actualizado);
            setAlerta({ tipo: 'exito', mensaje: 'Cambios guardados correctamente' });
        } catch (error) {
            setAlerta({ tipo: 'error', mensaje: 'No se pudo conectar con el servidor. Intenta de nuevo.' });
        } finally {
            setEnviando(false);
        }
    };

    // ESC3 y ESC5: cancelar sin cambios sale directo; con cambios pide confirmación.
    const cancelar = () => {
        if (hayCambios) setConfirmarSalida(true);
        else navigate('/');
    };

    return (
        <div className="public-page">
            <Navbar cartCount={0} />
            {alerta && <Alert tipo={alerta.tipo} mensaje={alerta.mensaje} />}

            <main style={{ display: 'flex', justifyContent: 'center', padding: '48px 16px' }}>
                <form className="form-card" onSubmit={guardar} noValidate>
                    <h2 style={{ color: '#10271B', fontFamily: 'Inter', fontSize: 28, margin: 0 }}>Mi perfil</h2>
                    <p style={{ color: '#68786F', fontFamily: 'Inter', fontSize: 14, margin: 0 }}>
                        Actualiza tus datos de contacto.
                    </p>

                    <AuthInput label="Nombre" value={datos.nombre} onChange={cambiar('nombre')} error={errores.nombre} />
                    <AuthInput label="Correo" type="email" value={datos.correo} onChange={cambiar('correo')} error={errores.correo} />
                    <AuthInput label="Teléfono" type="tel" value={datos.telefono} onChange={cambiar('telefono')} error={errores.telefono} />

                    <div className="button-group">
                        <button type="submit" className="btn-primary" disabled={enviando}>
                            {enviando ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={cancelar}>Cancelar</button>
                    </div>
                </form>
            </main>

            {confirmarSalida && (
                <Modal
                    titulo="¿Salir sin guardar?"
                    mensaje="Tienes cambios sin guardar. Si sales ahora, se perderán."
                    textoConfirmar="Salir sin guardar"
                    onConfirm={() => navigate('/')}
                    onCancel={() => setConfirmarSalida(false)}
                />
            )}
        </div>
    );
}

export default Perfil;

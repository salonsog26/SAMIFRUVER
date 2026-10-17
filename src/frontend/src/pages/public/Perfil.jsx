// src/pages/public/Perfil.jsx — E2-HU3 Editar perfil del cliente
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClienteSidebar from '../../components/public/ClienteSidebar';
import ContentHeader from '../../components/admin/ContentHeader';
import AuthInput from '../../components/forms/AuthInput';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { obtenerSesion, guardarSesion } from '../../utils/auth';
import { API_URL } from '../../utils/config';
import { validarPerfil, normalizarTexto } from '../../utils/validaciones';
import '../../styles/variables.css';

const CAMPOS = ['nombre', 'correo', 'telefono', 'documento', 'direccion', 'ciudad'];

const desdeCliente = (c = {}) => ({
    nombre: c.nombre || '', correo: c.correo || '', telefono: c.telefono || '',
    documento: c.documento || '', direccion: c.direccion || '', ciudad: c.ciudad || ''
});
const limpio = (campo, valor) => (campo === 'correo' ? String(valor).trim().toLowerCase() : normalizarTexto(valor));

function Perfil() {
    const navigate = useNavigate();
    const [sesion] = useState(() => obtenerSesion());
    const [original, setOriginal] = useState(() => desdeCliente(sesion));
    const [datos, setDatos] = useState(original);
    const [errores, setErrores] = useState({});
    const [alerta, setAlerta] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [confirmarSalida, setConfirmarSalida] = useState(false);

    // Carga el perfil actualizado desde el servidor (documento, dirección y ciudad no vienen en la sesión).
    useEffect(() => {
        let cancelado = false;
        fetch(`${API_URL}/api/clientes/${sesion.id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelado || !data?.cliente) return;
                const fresco = desdeCliente(data.cliente);
                setOriginal(fresco);
                setDatos((actual) => (CAMPOS.every((c) => limpio(c, actual[c]) === limpio(c, original[c])) ? fresco : actual));
            })
            .catch(() => { /* se queda con los datos de la sesión */ });
        return () => { cancelado = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hayCambios = CAMPOS.some((c) => limpio(c, datos[c]) !== limpio(c, original[c]));

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
            const cuerpo = Object.fromEntries(CAMPOS.map((c) => [c, limpio(c, datos[c])]));
            const resp = await fetch(`${API_URL}/api/clientes/${sesion.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cuerpo)
            });
            const data = await resp.json();

            if (!resp.ok) {
                if (resp.status === 409) {
                    // ESC2: el correo pertenece a otro cliente
                    setAlerta({ tipo: 'error', mensaje: data.mensaje });
                } else {
                    setErrores(data.errores || {});
                    setAlerta({ tipo: 'error', mensaje: data.mensaje || 'No se pudo guardar.' });
                }
                return;
            }

            // ESC6: guardado exitoso
            const actualizado = desdeCliente(data.cliente);
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
        <div className="admin-layout">
            <ClienteSidebar nombre={original.nombre} />

            <main className="admin-main-container perfil-main">
                <ContentHeader migas={<>Mi cuenta <span className="breadcrumb-sep">/</span> <strong>Editar perfil</strong></>} />

                {alerta && <Alert tipo={alerta.tipo} mensaje={alerta.mensaje} className="alert-toast-bajo-topbar" />}

                <section className="perfil-content">
                    <div className="page-header">
                        <h1 className="page-title perfil-titulo">Tu información personal</h1>
                        <p className="page-subtitle perfil-subtitulo">Mantén tus datos actualizados para recibir tus pedidos sin contratiempos.</p>
                    </div>

                    <form className="perfil-card" onSubmit={guardar} noValidate>
                        <div className="perfil-card-header">
                            <div>
                                <h2 className="perfil-card-titulo">Editar perfil</h2>
                                <p className="perfil-card-subtitulo">Los campos marcados son necesarios para gestionar tu cuenta.</p>
                            </div>
                            <span className="badge-verificada"><span className="badge-verificada-punto" />Cuenta verificada</span>
                        </div>

                        <div className="perfil-grid">
                            <AuthInput label="Nombre" placeholder="Escribe tu nombre" value={datos.nombre} onChange={cambiar('nombre')} error={errores.nombre} autoComplete="name" />
                            <AuthInput label="Correo" type="email" placeholder="nombre@correo.com" value={datos.correo} onChange={cambiar('correo')} error={errores.correo} autoComplete="email" />
                            <AuthInput label="Teléfono" type="tel" placeholder="300 000 0000" value={datos.telefono} onChange={cambiar('telefono')} error={errores.telefono} autoComplete="tel" />
                            <AuthInput label="Documento" placeholder="1.023.456.789" value={datos.documento} onChange={cambiar('documento')} error={errores.documento} />
                            <AuthInput label="Dirección" placeholder="Carrera 18 # 72–26" value={datos.direccion} onChange={cambiar('direccion')} error={errores.direccion} autoComplete="street-address" />
                            <AuthInput label="Ciudad" placeholder="Bogotá, D. C." value={datos.ciudad} onChange={cambiar('ciudad')} error={errores.ciudad} />
                        </div>

                        <div className="perfil-acciones">
                            <button type="button" className="btn-secondary" onClick={cancelar}>Cancelar</button>
                            <button type="submit" className="btn-primary" disabled={enviando}>
                                {enviando ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </section>
            </main>

            {confirmarSalida && (
                <Modal
                    variante="advertencia"
                    titulo="¿Estás seguro que quieres salir sin guardar cambios?"
                    mensaje="La información que modificaste se perderá."
                    textoConfirmar="Aceptar"
                    onConfirm={() => navigate('/')}
                    onCancel={() => setConfirmarSalida(false)}
                />
            )}
        </div>
    );
}

export default Perfil;

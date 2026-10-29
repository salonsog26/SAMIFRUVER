// src/pages/public/Perfil.jsx — E2-HU3 Editar perfil del cliente
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
const MSJ_SIN_CAMBIOS = 'No se ha realizado ningún cambio';
const CLAVE_RECARGA = 'perfil_recarga_sin_cambios';

const desdeCliente = (c = {}) => ({
    nombre: c.nombre || '', correo: c.correo || '', telefono: c.telefono || '',
    documento: c.documento || '', direccion: c.direccion || '', ciudad: c.ciudad || ''
});
const limpio = (campo, valor) => (campo === 'correo' ? String(valor).trim().toLowerCase() : normalizarTexto(valor));

// E2-HU3 CA5: intercepta el botón "atrás" del navegador y la recarga de la página.
// - Con cambios: abre el modal Guardar / Descartar / Seguir editando (la recarga muestra el diálogo nativo).
// - Sin cambios: llama a onSinCambios (alerta "No se ha realizado ningún cambio").
function useConfirmarSalida(hayCambios, onSinCambios) {
    const [modalAbierto, setModalAbierto] = useState(false);
    const cambiosRef = useRef(hayCambios);
    const avisoRef = useRef(onSinCambios);
    const saliendoRef = useRef(false);

    useEffect(() => { cambiosRef.current = hayCambios; avisoRef.current = onSinCambios; });

    // Tras una recarga sin cambios: muestra el mensaje al volver a cargar la página
    useEffect(() => {
        try {
            if (sessionStorage.getItem(CLAVE_RECARGA)) {
                sessionStorage.removeItem(CLAVE_RECARGA);
                avisoRef.current?.();
            }
        } catch { /* sessionStorage no disponible */ }
    }, []);

    useEffect(() => {
        // Entrada extra en el historial para poder atrapar el botón atrás
        window.history.pushState(window.history.state, '', window.location.href);

        const alRetroceder = () => {
            if (saliendoRef.current) return;
            window.history.pushState(window.history.state, '', window.location.href); // nos quedamos aquí
            if (cambiosRef.current) setModalAbierto(true);
            else avisoRef.current?.();
        };

        const alRecargar = (e) => {
            if (saliendoRef.current) return;
            if (cambiosRef.current) {
                e.preventDefault();
                e.returnValue = ''; // diálogo nativo (su texto no es personalizable)
            } else {
                try { sessionStorage.setItem(CLAVE_RECARGA, '1'); } catch { /* ignorar */ }
            }
        };

        window.addEventListener('popstate', alRetroceder);
        window.addEventListener('beforeunload', alRecargar);
        return () => {
            window.removeEventListener('popstate', alRetroceder);
            window.removeEventListener('beforeunload', alRecargar);
        };
    }, []);

    // Sale de verdad: retrocede 2 entradas (la real + la extra)
    const salir = useCallback(() => {
        saliendoRef.current = true;
        setModalAbierto(false);
        window.history.go(-2);
    }, []);

    const seguirEditando = useCallback(() => setModalAbierto(false), []);

    // guardarFn debe devolver true si se guardó bien
    const guardarYSalir = useCallback(async (guardarFn) => {
        const ok = await guardarFn();
        if (ok) salir();
        else setModalAbierto(false);
    }, [salir]);

    return { modalAbierto, seguirEditando, descartarYSalir: salir, guardarYSalir };
}

const estiloFondo = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const estiloCaja = { background: '#fff', borderRadius: 12, padding: 24, width: 'min(92vw, 440px)', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Inter' };

// Modal del botón "atrás" con cambios sin guardar
function ModalCambiosSinGuardar({ abierto, onGuardar, onDescartar, onSeguir }) {
    if (!abierto) return null;
    return (
        <div style={estiloFondo} role="dialog" aria-modal="true">
            <div style={estiloCaja}>
                <h3 style={{ margin: 0 }}>Tienes cambios sin guardar</h3>
                <p style={{ margin: 0, color: '#68786F' }}>¿Quieres guardar los cambios o descartarlos antes de salir?</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button type="button" className="btn-secondary" onClick={onSeguir}>Seguir editando</button>
                    <button type="button" className="btn-secondary" onClick={onDescartar}>Descartar</button>
                    <button type="button" className="btn-primary" onClick={onGuardar}>Guardar</button>
                </div>
            </div>
        </div>
    );
}

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

    const {
        modalAbierto, seguirEditando, descartarYSalir, guardarYSalir
    } = useConfirmarSalida(hayCambios, () => setAlerta({ tipo: 'advertencia', mensaje: MSJ_SIN_CAMBIOS }));

    const cambiar = (campo) => (e) => {
        setDatos({ ...datos, [campo]: e.target.value });
        setErrores({ ...errores, [campo]: undefined });
        setAlerta(null);
    };

    // Devuelve true solo si los cambios se guardaron correctamente.
    const guardarCambios = async () => {
        if (enviando) return false;
        setAlerta(null);

        const nuevosErrores = validarPerfil(datos);
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return false; // ESC1: no se envía

        if (!hayCambios) { // ESC4: guardar sin cambios
            setAlerta({ tipo: 'advertencia', mensaje: MSJ_SIN_CAMBIOS });
            return false;
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
                return false;
            }

            // ESC6: guardado exitoso
            const actualizado = desdeCliente(data.cliente);
            guardarSesion({ ...sesion, ...actualizado });
            setOriginal(actualizado);
            setDatos(actualizado);
            setAlerta({ tipo: 'exito', mensaje: 'Cambios guardados correctamente' });
            return true;
        } catch (error) {
            setAlerta({ tipo: 'error', mensaje: 'No se pudo conectar con el servidor. Intenta de nuevo.' });
            return false;
        } finally {
            setEnviando(false);
        }
    };

    const guardar = (e) => {
        e.preventDefault();
        guardarCambios();
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

            {/* Botón "atrás" del navegador con cambios sin guardar */}
            <ModalCambiosSinGuardar
                abierto={modalAbierto}
                onSeguir={seguirEditando}
                onDescartar={descartarYSalir}
                onGuardar={() => guardarYSalir(guardarCambios)}
            />
        </div>
    );
}

export default Perfil;
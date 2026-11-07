// src/pages/public/MetodosPago.jsx — E4-HU3 Gestionar métodos de pago (tarjetas guardadas)
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CreditCard, Trash2, ShieldCheck, Banknote, Lock, Plus, TriangleAlert, X, ArrowLeft } from 'lucide-react';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import { Franja } from '../../components/pedidos/Estados';
import {
    listarMetodos, agregarMetodo, eliminarMetodo, validarTarjeta, marcaDe,
    formatearNumero, formatearVencimiento, formatearCvv,
    MARCAS, MSJ_AGREGADO, MSJ_ELIMINADO, MSJ_REVISA
} from '../../utils/pagos';
import { fechaCorta } from '../../utils/pedidos';
import '../../styles/variables.css';
import '../../styles/pedidos.css';

const VACIO = { titular: '', numero: '', vencimiento: '', cvv: '', predeterminada: false };
const MSJ_RED = 'No se pudo conectar con el servidor. Intenta de nuevo.';

// Ventana de confirmación antes de eliminar (E4-HU3, escenario 3: "y confirme la acción").
function ModalEliminar({ metodo, enviando, error, onVolver, onConfirmar }) {
    return (
        <div className="modal-overlay" onClick={enviando ? undefined : onVolver}>
            <div className="modal-content ped-modal" role="dialog" aria-modal="true" aria-labelledby="pag-modal-titulo" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="ped-modal-cerrar" aria-label="Cerrar" onClick={onVolver} disabled={enviando}><X size={18} /></button>
                <span className="ped-modal-icono" aria-hidden="true"><TriangleAlert size={26} /></span>
                <h2 id="pag-modal-titulo" className="ped-modal-titulo">¿Eliminar método de pago?</h2>
                <p className="modal-text">Dejarás de ver esta tarjeta como opción al pagar tus pedidos.</p>
                <p className="ped-modal-pedido">{MARCAS[metodo.marca] || metodo.marca} terminada en {metodo.ultimos4}</p>
                {error && <Franja tipo="error">{error}</Franja>}
                <div className="ped-modal-botones">
                    <button type="button" className="ped-boton ped-boton-secundario" onClick={onVolver} disabled={enviando}>Cancelar</button>
                    <button type="button" className="ped-boton ped-boton-peligro" onClick={onConfirmar} disabled={enviando}>
                        {enviando ? 'Eliminando…' : (error ? 'Reintentar' : 'Eliminar')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function MetodosPago() {
    const [params] = useSearchParams();
    const vieneDelCarrito = params.get('volver') === 'carrito';
    const [metodos, setMetodos] = useState(null);          // null = cargando
    const [aviso, setAviso] = useState(null);              // { tipo, texto, detalle }
    const [form, setForm] = useState(VACIO);
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [aEliminar, setAEliminar] = useState(null);
    const [errorEliminar, setErrorEliminar] = useState('');
    const [eliminando, setEliminando] = useState(false);

    useEffect(() => {
        let cancelado = false;
        listarMetodos().then((r) => {
            if (cancelado) return;
            if (r.ok) setMetodos(r.data.metodos || []);
            else { setMetodos([]); setAviso({ tipo: 'error', texto: r.mensaje || r.data.mensaje || 'No se pudieron cargar tus tarjetas.' }); }
        });
        return () => { cancelado = true; };
    }, []);

    const cambiar = (campo, valor) => {
        setForm((f) => ({ ...f, [campo]: valor }));
        if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }));
    };

    const guardar = async (e) => {
        e.preventDefault();
        if (guardando) return;
        setAviso(null);
        const locales = validarTarjeta(form);
        if (Object.keys(locales).length) {                 // ESC2: faltan datos o la tarjeta no es válida
            setErrores(locales);
            setAviso({ tipo: 'error', texto: MSJ_REVISA, detalle: 'No se ha agregado ninguna tarjeta nueva. Completa los campos indicados para continuar.' });
            return;
        }
        setGuardando(true);
        const r = await agregarMetodo({ titular: form.titular, numero: form.numero, vencimiento: form.vencimiento, cvv: form.cvv, predeterminada: form.predeterminada });
        setGuardando(false);
        if (r.ok) {                                         // ESC1: tarjeta guardada
            setMetodos(r.data.metodos || []);
            setForm(VACIO);
            setErrores({});
            setAviso({ tipo: 'exito', texto: r.data.mensaje || MSJ_AGREGADO, detalle: `Tu ${r.data.metodo.descripcion} ya está lista para tu próxima compra.` });
            return;
        }
        if (r.data?.errores) setErrores(r.data.errores);
        setAviso({
            tipo: 'error',
            texto: r.red ? MSJ_RED : (r.data.mensaje || MSJ_REVISA),
            detalle: r.data?.errores ? 'No se ha agregado ninguna tarjeta nueva. Completa los campos indicados para continuar.' : ''
        });
    };

    const confirmarEliminar = async () => {
        if (!aEliminar || eliminando) return;
        setEliminando(true);
        setErrorEliminar('');
        const r = await eliminarMetodo(aEliminar.id);
        setEliminando(false);
        if (r.ok) {                                         // ESC3: eliminada
            setMetodos(r.data.metodos || []);
            setAEliminar(null);
            setAviso({ tipo: 'exito', texto: r.data.mensaje || MSJ_ELIMINADO, detalle: 'La tarjeta ya no está guardada en tu cuenta. Puedes agregar una nueva cuando quieras.' });
            return;
        }
        setErrorEliminar(r.red ? MSJ_RED : (r.data.mensaje || 'No se pudo eliminar la tarjeta. Intenta de nuevo.'));
    };

    const marca = marcaDe(form.numero);
    const lista = metodos || [];

    return (
        <div className="public-page ped-pagina">
            <Navbar />
            <main className="ped-contenido">
                <nav className="ped-migas" aria-label="Ruta de navegación">Mi cuenta / Métodos de pago</nav>
                <div className="ped-encabezado">
                    <div>
                        <h1 className="ped-titulo">Tus métodos de pago</h1>
                        <p className="ped-subtitulo">Menos pasos al comprar, más tiempo para disfrutar de lo bueno.</p>
                    </div>
                    {vieneDelCarrito && (
                        <Link to="/carrito" className="ped-boton ped-boton-secundario"><ArrowLeft size={16} aria-hidden="true" /> Volver al carrito</Link>
                    )}
                </div>

                {aviso && (
                    <Franja tipo={aviso.tipo} onCerrar={() => setAviso(null)}>
                        <strong>{aviso.texto}</strong>
                        {aviso.detalle && <span className="pag-franja-detalle">{aviso.detalle}</span>}
                    </Franja>
                )}

                <div className="pag-columnas">
                    <div className="pag-columna">
                        <section className="ped-tarjeta" aria-label="Tus tarjetas guardadas">
                            <h2 className="ped-tarjeta-titulo">Tus tarjetas guardadas</h2>
                            <p className="ped-ayuda pag-contador">
                                {metodos === null ? 'Cargando…' : `${lista.length} ${lista.length === 1 ? 'tarjeta' : 'tarjetas'} · ${lista.length ? 'Tú eliges cómo pagar.' : 'Todo listo para empezar de nuevo.'}`}
                            </p>
                            {metodos !== null && lista.length === 0 && (
                                <div className="pag-vacio">
                                    <span className="pag-vacio-icono" aria-hidden="true"><CreditCard size={26} /></span>
                                    <strong>Aún no tienes tarjetas guardadas</strong>
                                    <p>Agrega una nueva tarjeta con el formulario para hacer tu próxima compra más fácil.</p>
                                    <a href="#pag-titular" className="ped-enlace-suave" onClick={(e) => { e.preventDefault(); document.getElementById('pag-titular')?.focus(); }}>Agregar mi primera tarjeta →</a>
                                </div>
                            )}
                            <ul className="pag-lista">
                                {lista.map((m) => (
                                    <li key={m.id} className="pag-tarjeta" data-metodo={m.id}>
                                        <div className="pag-tarjeta-cabecera">
                                            <span className="pag-marca">{m.marcaEtiqueta}</span>
                                            {m.predeterminada && <span className="pag-predeterminada">Predeterminada</span>}
                                        </div>
                                        <strong className="pag-tarjeta-nombre">{m.descripcion}</strong>
                                        <span className="pag-tarjeta-detalle">{m.titular} · Vence {m.vence}</span>
                                        <div className="pag-tarjeta-pie">
                                            <span>Agregada el {fechaCorta(m.creadoEn)}</span>
                                            <button type="button" className="ped-enlace-fuerte pag-eliminar" aria-label={`Eliminar ${m.descripcion}`} onClick={() => { setErrorEliminar(''); setAEliminar(m); }}>
                                                <Trash2 size={15} aria-hidden="true" /> Eliminar
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                        <div className="pag-nota-verde">
                            <ShieldCheck size={20} aria-hidden="true" />
                            <div><strong>Tu tranquilidad también cuenta</strong><p>Puedes agregar o eliminar tus tarjetas cuando quieras. Guardar una tarjeta no genera ningún cargo.</p></div>
                        </div>
                        <p className="ped-ayuda pag-efectivo"><Banknote size={16} aria-hidden="true" /> ¿Prefieres efectivo? Puedes elegirlo al finalizar tu pedido.</p>
                    </div>

                    <section className="ped-tarjeta" aria-label="Nueva tarjeta">
                        <h2 className="ped-tarjeta-titulo">Nueva Tarjeta</h2>
                        <p className="ped-ayuda">Guárdala una vez. Disfruta de compras más sencillas.</p>
                        <div className="pag-marcas" aria-label="Tarjetas aceptadas">
                            <span className={marca === 'visa' ? 'activa' : ''}>Visa</span>
                            <span className={marca === 'mastercard' ? 'activa' : ''}>Mastercard</span>
                            <small>Crédito y débito</small>
                        </div>
                        <form className="pag-form" onSubmit={guardar} noValidate aria-label="Agregar tarjeta">
                            <label htmlFor="pag-titular">Titular de la tarjeta</label>
                            <input id="pag-titular" type="text" autoComplete="cc-name" placeholder="Nombre y apellidos" value={form.titular}
                                onChange={(e) => cambiar('titular', e.target.value)} aria-invalid={Boolean(errores.titular)} aria-describedby={errores.titular ? 'pag-err-titular' : undefined} />
                            {errores.titular && <span id="pag-err-titular" className="form-error-text">{errores.titular}</span>}

                            <label htmlFor="pag-numero">Número de tarjeta</label>
                            <div className="pag-input-icono">
                                <input id="pag-numero" type="text" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={form.numero}
                                    onChange={(e) => cambiar('numero', formatearNumero(e.target.value))} aria-invalid={Boolean(errores.numero)} aria-describedby={errores.numero ? 'pag-err-numero' : undefined} />
                                <CreditCard size={18} aria-hidden="true" />
                            </div>
                            {errores.numero && <span id="pag-err-numero" className="form-error-text">{errores.numero}</span>}

                            <div className="pag-fila">
                                <div>
                                    <label htmlFor="pag-vence">Fecha de vencimiento</label>
                                    <input id="pag-vence" type="text" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={form.vencimiento}
                                        onChange={(e) => cambiar('vencimiento', formatearVencimiento(e.target.value))} aria-invalid={Boolean(errores.vencimiento)} aria-describedby={errores.vencimiento ? 'pag-err-vence' : undefined} />
                                    {errores.vencimiento && <span id="pag-err-vence" className="form-error-text">{errores.vencimiento}</span>}
                                </div>
                                <div>
                                    <label htmlFor="pag-cvv">Código de seguridad</label>
                                    <input id="pag-cvv" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="CVV" value={form.cvv}
                                        onChange={(e) => cambiar('cvv', formatearCvv(e.target.value))} aria-invalid={Boolean(errores.cvv)} aria-describedby={errores.cvv ? 'pag-err-cvv' : undefined} />
                                    {errores.cvv && <span id="pag-err-cvv" className="form-error-text">{errores.cvv}</span>}
                                </div>
                            </div>

                            <label className="pag-check">
                                <input type="checkbox" checked={form.predeterminada} onChange={(e) => setForm({ ...form, predeterminada: e.target.checked })} />
                                Usar como método de pago predeterminado
                            </label>
                            <button type="submit" className="ped-boton ped-boton-primario ped-boton-bloque" disabled={guardando}>
                                <Plus size={16} aria-hidden="true" /> {guardando ? 'Guardando…' : 'Agregar tarjeta'}
                            </button>
                            <p className="ped-nota pag-seguro"><Lock size={14} aria-hidden="true" /> Tus datos se transmiten cifrados. Samifruver no almacena el código de seguridad ni el número completo de tu tarjeta.</p>
                        </form>
                    </section>
                </div>
            </main>
            <Footer />
            {aEliminar && (
                <ModalEliminar metodo={aEliminar} enviando={eliminando} error={errorEliminar}
                    onVolver={() => setAEliminar(null)} onConfirmar={confirmarEliminar} />
            )}
        </div>
    );
}

export default MetodosPago;

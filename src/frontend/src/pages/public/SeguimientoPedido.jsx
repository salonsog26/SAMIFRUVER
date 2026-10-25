// src/pages/public/SeguimientoPedido.jsx — E3-HU1 Consultar pedido (seguimiento) y E3-HU4 Cancelar pedido
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapPin, TriangleAlert, X, Bike, PackageCheck, Check } from 'lucide-react';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import { Franja, InsigniaEstado, LineaSeguimiento, ListaProductos } from '../../components/pedidos/Estados';
import {
    obtenerPedido, cancelarPedido, formatoCOP, resumenCantidades, fechaLarga, fechaLargaHora, fechaCorta,
    fechaHoraCorta, hora, diaMes, minutosRestantes, etiquetaEstado
} from '../../utils/pedidos';
import '../../styles/variables.css';
import '../../styles/pedidos.css';

export const MSJ_NO_CANCELABLE = 'Este pedido ya no se puede cancelar porque está en camino o fue entregado';
export const MSJ_CANCELADO = 'Pedido cancelado correctamente';
export const MSJ_ERROR_CANCELAR = 'No se pudo cancelar el pedido. Inténtalo nuevamente';

const SUBTITULOS = {
    recibido: 'Cada paso, más cerca de tu mesa.',
    preparacion: 'Cada paso, más cerca de tu mesa.',
    en_camino: 'Tu mercado ya está en camino. Sigue su recorrido aproximado.',
    entregado: 'Gracias por llevar lo mejor de nuestro campo a tu hogar.'
};
const AVISOS = {
    recibido: 'Recibimos tu pedido. En un momento empezamos a prepararlo.',
    preparacion: 'Estamos preparando tu pedido. Te informaremos cuando se asigne un repartidor'
};
const FINALIZADOS = ['entregado', 'cancelado'];

// Mapa ilustrativo (no hay integración en tiempo real).
function MapaIlustrativo() {
    return (
        <div className="ped-mapa" role="img" aria-label="Mapa ilustrativo de la ruta del repartidor">
            <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <rect width="400" height="200" fill="#EAF3EC" />
                <g fill="#FFFFFF">
                    <rect x="30" y="20" width="140" height="22" rx="4" transform="rotate(-8 100 31)" />
                    <rect x="180" y="40" width="200" height="22" rx="4" transform="rotate(-8 280 51)" />
                    <rect x="20" y="110" width="150" height="22" rx="4" transform="rotate(-8 95 121)" />
                    <rect x="200" y="125" width="190" height="22" rx="4" transform="rotate(-8 295 136)" />
                </g>
                <rect x="40" y="130" width="80" height="50" rx="8" fill="#D8E6DB" />
                <polyline points="80,160 105,100 200,125 235,60 275,70" fill="none" stroke="#20A34A" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx="80" cy="160" r="14" fill="#20A34A" />
                <circle cx="290" cy="72" r="13" fill="#FFFFFF" stroke="#E0E8E2" />
                <circle cx="290" cy="72" r="5" fill="#20A34A" />
            </svg>
            <span className="ped-mapa-nota">Mapa ilustrativo · Ruta y ubicación aproximadas · Sin integración en tiempo real</span>
        </div>
    );
}

function ResumenCompra({ pedido, children }) {
    return (
        <section className="ped-tarjeta ped-resumen" aria-label="Resumen de compra">
            <h2 className="ped-tarjeta-titulo">Resumen de compra</h2>
            <p className="ped-resumen-cantidades">{resumenCantidades(pedido.productos, pedido.unidades)}</p>
            <div className="ped-resumen-fila"><span>Subtotal</span><span>{formatoCOP(pedido.subtotal)}</span></div>
            <div className="ped-resumen-fila"><span>Domicilio</span><span>{formatoCOP(pedido.domicilio)}</span></div>
            <div className="ped-resumen-total"><span>Total COP</span><strong>{formatoCOP(pedido.total)}</strong></div>
            {children || <p className="ped-resumen-seguro">Compra segura. Frescura garantizada.</p>}
        </section>
    );
}

function DetallesEntrega({ pedido }) {
    const d = pedido.direccion;
    return (
        <section className="ped-tarjeta" aria-label="Detalles de entrega">
            <h2 className="ped-tarjeta-titulo">Detalles de entrega</h2>
            <div className="ped-entrega">
                <MapPin size={20} aria-hidden="true" className="ped-entrega-icono" />
                <div>
                    <strong>{d.nombre} · {d.alias}</strong>
                    <span>{d.linea}</span>
                    <span>{d.ciudad}{d.telefono ? ` · ${d.telefono}` : ''}</span>
                </div>
            </div>
            <p className="ped-entrega-pago">{pedido.metodoPago === 'tarjeta' ? `Pagado con ${pedido.pagoDetalle}` : 'Pagado con Mercado Pago'}</p>
        </section>
    );
}

// Ventana de confirmación (E3-HU4). Si falla, muestra el error dentro y permite "Reintentar".
function ModalCancelar({ pedido, error, enviando, onVolver, onConfirmar }) {
    return (
        <div className="modal-overlay" onClick={enviando ? undefined : onVolver}>
            <div className="modal-content ped-modal" role="dialog" aria-modal="true" aria-labelledby="ped-modal-titulo" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="ped-modal-cerrar" aria-label="Cerrar" onClick={onVolver} disabled={enviando}><X size={18} /></button>
                <span className="ped-modal-icono" aria-hidden="true"><TriangleAlert size={26} /></span>
                <h2 id="ped-modal-titulo" className="ped-modal-titulo">¿Cancelar pedido?</h2>
                <p className="modal-text">¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer</p>
                <p className="ped-modal-pedido">Pedido #{pedido.numero} · Total pagado: {formatoCOP(pedido.total)}</p>
                {error && (
                    <>
                        <Franja tipo="error">{error.mensaje}</Franja>
                        {error.conserva && <p className="ped-modal-nota">Tu pedido sigue {etiquetaEstado(pedido.estado)}. No se han aplicado cambios.</p>}
                    </>
                )}
                <div className="ped-modal-botones">
                    <button type="button" className="ped-boton ped-boton-secundario" onClick={onVolver} disabled={enviando}>Volver</button>
                    {(!error || error.reintentar) && (
                        <button type="button" className="ped-boton ped-boton-peligro" onClick={onConfirmar} disabled={enviando}>
                            {enviando ? 'Cancelando…' : error ? 'Reintentar' : 'Sí, cancelar pedido'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function SeguimientoPedido() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [errorCarga, setErrorCarga] = useState('');
    const [modal, setModal] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [errorModal, setErrorModal] = useState(null);
    const [recienCancelado, setRecienCancelado] = useState(false);

    const cargar = useCallback(async () => {
        const r = await obtenerPedido(id);
        if (r.ok) { setPedido(r.data.pedido); setErrorCarga(''); return r.data.pedido; }
        if (r.status === 404) setErrorCarga('Pedido no encontrado');
        else setErrorCarga((p) => p || r.mensaje || r.data.mensaje || 'No se pudo cargar el pedido.');
        return null;
    }, [id]);

    useEffect(() => { cargar(); }, [cargar]);

    // Mientras el pedido no termine, se actualiza solo cada 20 s (así el cliente ve los cambios de estado).
    useEffect(() => {
        if (!pedido || FINALIZADOS.includes(pedido.estado)) return undefined;
        const t = setInterval(cargar, 20000);
        return () => clearInterval(t);
    }, [pedido, cargar]);

    const confirmarCancelacion = async () => {
        if (enviando) return;
        setEnviando(true);
        setErrorModal(null);
        const r = await cancelarPedido(pedido.id);
        setEnviando(false);
        if (r.ok && r.data.pedido) {                 // ESC1: cancelado
            setPedido(r.data.pedido);
            setModal(false);
            setRecienCancelado(true);
            return;
        }
        if (r.status === 409) {                      // el pedido cambió de estado mientras tanto
            setErrorModal({ mensaje: r.data.mensaje || MSJ_NO_CANCELABLE, reintentar: false, conserva: false });
            cargar();
            return;
        }
        setErrorModal({ mensaje: MSJ_ERROR_CANCELAR, reintentar: true, conserva: true });   // ESC3: fallo de conexión o servidor
    };

    const volver = () => { setModal(false); setErrorModal(null); };

    if (!pedido) {
        return (
            <div className="public-page ped-pagina">
                <Navbar />
                <main className="ped-contenido">
                    {errorCarga ? (
                        <>
                            <Franja tipo="error">{errorCarga}</Franja>
                            <Link to="/pedidos" className="ped-boton ped-boton-secundario">Volver a mis pedidos</Link>
                        </>
                    ) : <p className="ped-cargando">Cargando tu pedido…</p>}
                </main>
                <Footer />
            </div>
        );
    }

    const { estado } = pedido;

    // ---------------------------------------------------------- pedido cancelado (detalle)
    if (estado === 'cancelado') {
        const medio = pedido.metodoPago === 'tarjeta' ? `a tu tarjeta ${pedido.pagoDetalle}` : 'a tu cuenta de Mercado Pago';
        return (
            <div className="public-page ped-pagina">
                <Navbar />
                <main className="ped-contenido">
                    <nav className="ped-migas" aria-label="Ruta de navegación">Mi cuenta / Mis pedidos</nav>
                    <div className="ped-encabezado">
                        <h1 className="ped-titulo">Detalle del pedido</h1>
                        <InsigniaEstado estado={estado} />
                    </div>
                    <p className="ped-subtitulo">La cancelación quedó registrada en tu historial.</p>
                    <div className="ped-columnas ped-columnas-carrito">
                        <div className="ped-columna-principal">
                            <Franja tipo="exito">{MSJ_CANCELADO}</Franja>
                            {pedido.devolucionIniciada && (
                                <section className="ped-tarjeta" aria-label="Devolución">
                                    <h2 className="ped-tarjeta-titulo ped-titulo-medio">Devolución iniciada</h2>
                                    <p className="ped-texto">Iniciamos la devolución de {formatoCOP(pedido.total)} COP {medio}. El abono está pendiente y depende de los plazos de tu banco.</p>
                                    <p className="ped-texto-ok"><Check size={16} aria-hidden="true" /> Las unidades del pedido se restituyeron al inventario.</p>
                                </section>
                            )}
                            <ListaProductos items={pedido.items} />
                            <section className="ped-tarjeta" aria-label="En tu historial de pedidos">
                                <h2 className="ped-tarjeta-titulo ped-titulo-medio">En tu historial de pedidos</h2>
                                <div className="ped-fila-historial">
                                    <span>#{pedido.numero}</span>
                                    <span>{fechaHoraCorta(pedido.creadoEn)}</span>
                                    <span>{formatoCOP(pedido.total)} COP</span>
                                    <InsigniaEstado estado={estado} />
                                    <Link to="/pedidos">Ver detalle →</Link>
                                </div>
                            </section>
                        </div>
                        <aside className="ped-columna-lateral">
                            <section className="ped-tarjeta ped-resumen">
                                <h2 className="ped-tarjeta-titulo ped-titulo-medio">Pedido #{pedido.numero}</h2>
                                <p className="ped-resumen-cantidades">{fechaLarga(pedido.creadoEn)} · Cancelado a las {hora(pedido.canceladoEn)}</p>
                                <p className="ped-resumen-etiqueta">Total pagado</p>
                                <strong className="ped-resumen-grande">{formatoCOP(pedido.total)}</strong>
                                <p className="ped-resumen-cantidades">{pedido.pagoDetalle}{pedido.devolucionIniciada ? ' · Devolución iniciada' : ''}</p>
                            </section>
                            <Link to="/pedidos" className="ped-boton ped-boton-primario ped-boton-bloque">Ver historial de pedidos</Link>
                            <Link to="/" className="ped-boton ped-boton-secundario ped-boton-bloque">Seguir comprando</Link>
                        </aside>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // ---------------------------------------------------------- seguimiento (recibido, preparación, en camino, entregado)
    const enCamino = estado === 'en_camino';
    const entregado = estado === 'entregado';
    const llegada = pedido.llegadaEstimada;
    const puedeCancelar = pedido.puedeCancelar;

    const botonCancelar = (
        <>
            <button type="button" className="ped-boton ped-boton-peligro ped-boton-bloque" disabled={!puedeCancelar} onClick={() => setModal(true)}>
                Cancelar pedido
            </button>
            {!puedeCancelar && <p className="ped-nota ped-nota-info" role="status">{MSJ_NO_CANCELABLE}</p>}
        </>
    );

    return (
        <div className="public-page ped-pagina">
            <Navbar />
            <main className="ped-contenido">
                <nav className="ped-migas" aria-label="Ruta de navegación">Mi cuenta / Mis pedidos</nav>
                <h1 className="ped-titulo">Seguimiento de pedido</h1>
                <p className="ped-subtitulo">{SUBTITULOS[estado]}</p>
                <div className="ped-encabezado ped-encabezado-pedido">
                    <div>
                        <p className="ped-numero">Pedido #{pedido.numero}</p>
                        <p className="ped-fecha">{fechaLargaHora(pedido.creadoEn)}</p>
                    </div>
                    <InsigniaEstado estado={estado} />
                </div>

                {recienCancelado && <Franja tipo="exito" onCerrar={() => setRecienCancelado(false)}>{MSJ_CANCELADO}</Franja>}
                {entregado && <Franja tipo="exito">¡Tu pedido ha sido entregado!</Franja>}

                <LineaSeguimiento
                    etapas={pedido.etapas}
                    fecha={fechaCorta(pedido.creadoEn)}
                    nota={entregado ? 'Proceso completado' : undefined}
                />

                {AVISOS[estado] && <Franja tipo="info">{AVISOS[estado]}</Franja>}
                {!puedeCancelar && <Franja tipo="info">{MSJ_NO_CANCELABLE}</Franja>}

                {entregado && (
                    <div className="ped-entregado-banda">
                        <PackageCheck size={26} aria-hidden="true" />
                        <div>
                            <strong>Entrega completada · {diaMes(pedido.entregadoEn)}, {hora(pedido.entregadoEn)}</strong>
                            <span>Recibido por {pedido.direccion.nombre} en la dirección seleccionada.</span>
                        </div>
                    </div>
                )}

                <div className={`ped-columnas ped-columnas-seguimiento${enCamino ? ' con-mapa' : ''}`}>
                    {enCamino && (
                        <div className="ped-columna-mapa">
                            <div className="ped-llegada">
                                <h2 className="ped-tarjeta-titulo ped-titulo-medio">Llegamos pronto</h2>
                                {llegada && <span>Hoy, {hora(llegada.desde)}–{hora(llegada.hasta)} · {minutosRestantes(llegada)}</span>}
                            </div>
                            <MapaIlustrativo />
                            {pedido.repartidor && (
                                <section className="ped-tarjeta" aria-label="Tu repartidor">
                                    <h2 className="ped-tarjeta-titulo">Tu repartidor</h2>
                                    <div className="ped-repartidor">
                                        <span className="ped-repartidor-icono" aria-hidden="true"><Bike size={22} /></span>
                                        <div>
                                            <strong>{pedido.repartidor.nombre}</strong>
                                            <span>{pedido.repartidor.vehiculo} · Repartidor asignado</span>
                                        </div>
                                    </div>
                                    <p className="ped-repartidor-contacto">Contacto: {pedido.repartidor.telefono}</p>
                                </section>
                            )}
                        </div>
                    )}
                    <div className="ped-columna-principal">
                        <ListaProductos items={pedido.items} />
                        {(enCamino || entregado) && <DetallesEntrega pedido={pedido} />}
                    </div>
                    {!enCamino && !entregado && (
                        <div className="ped-columna-media"><DetallesEntrega pedido={pedido} /></div>
                    )}
                    <aside className="ped-columna-lateral">
                        <ResumenCompra pedido={pedido} />
                        {botonCancelar}
                        {entregado
                            ? <Link to="/" className="ped-boton ped-boton-primario ped-boton-bloque">Seguir comprando</Link>
                            : <button type="button" className="ped-boton ped-boton-secundario ped-boton-bloque" onClick={() => navigate('/pedidos')}>Volver a mis pedidos</button>}
                    </aside>
                </div>
            </main>
            {modal && <ModalCancelar pedido={pedido} error={errorModal} enviando={enviando} onVolver={volver} onConfirmar={confirmarCancelacion} />}
            <Footer />
        </div>
    );
}

export default SeguimientoPedido;

// src/pages/domiciliario/DetallePedido.jsx — E5-HU1 (iniciar/confirmar entrega) y E5-HU3 (información del pedido)
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Phone, Check, Info, X } from 'lucide-react';
import { Franja, ListaProductos } from '../../components/pedidos/Estados';
import { formatoCOP, etiquetaEstado } from '../../utils/pedidos';
import {
    obtenerPedidoDomiciliario, iniciarEntregaDomiciliario, confirmarEntregaDomiciliario,
    hora12, fechaLargaDom, enlaceTel,
    MSJ_ESTADO_OK, MSJ_ENTREGADO_OK, MSJ_ERROR_ESTADO, MSJ_CONTACTO,
    ETIQUETA_PAGO, ETIQUETA_PAGO_ESTADO
} from '../../utils/domicilios';
import Avatar from '../../components/domiciliario/Avatar';
import '../../styles/variables.css';
import '../../styles/pedidos.css';
import '../../styles/domicilios.css';

const ETAPAS_DOM = [
    { clave: 'recibido', etiqueta: 'Pedido recibido' },
    { clave: 'preparacion', etiqueta: 'En preparación' },
    { clave: 'en_camino', etiqueta: 'En camino' },
    { clave: 'entregado', etiqueta: 'Entregado' }
];

const TONO_PAGO = { aprobado: 'entregado', pendiente: 'preparacion', recibido: 'entregado' };

const SELECTOR_FOCO = 'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Foco inicial dentro del diálogo y Tab/Shift+Tab dentro de él; al cerrar devuelve el foco.
function useFocoModal() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const anterior = document.activeElement;
        const primerFoco = el.querySelector(SELECTOR_FOCO);
        (primerFoco || el).focus();
        const alTeclear = (e) => {
            if (e.key !== 'Tab') return;
            const focos = [...el.querySelectorAll(SELECTOR_FOCO)];
            if (!focos.length) return;
            const primero = focos[0];
            const ultimo = focos[focos.length - 1];
            if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
            else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
        };
        el.addEventListener('keydown', alTeclear);
        return () => {
            el.removeEventListener('keydown', alTeclear);
            if (anterior instanceof HTMLElement) anterior.focus();
        };
    }, []);
    return ref;
}

function StepperEstado({ pedido }) {
    const porClave = Object.fromEntries((pedido.etapas || []).map((e) => [e.clave, e]));
    return (
        <section className="ped-tarjeta ped-linea" aria-label="Estado del pedido">
            <div className="dom-stepper-cabecera">
                <h2 className="ped-tarjeta-titulo">Estado del pedido</h2>
                <span className="dom-stepper-fecha">{fechaLargaDom(pedido.creadoEn)}</span>
            </div>
            <ol className="ped-etapas">
                {ETAPAS_DOM.map((e, i) => {
                    const etapa = porClave[e.clave];
                    const hecha = Boolean(etapa?.completada);
                    return (
                        <li key={e.clave} className={`ped-etapa${hecha ? ' hecha' : ''}`} data-etapa={e.clave}>
                            <span className="ped-etapa-marca" aria-hidden="true">{hecha ? <Check size={16} /> : <span className="ped-etapa-punto" />}</span>
                            <span className="ped-etapa-nombre">{e.etiqueta}</span>
                            <span className="ped-etapa-hora">{hecha ? hora12(etapa.hora) : 'Pendiente'}</span>
                            <span className="ped-sr">{hecha ? ' completado' : ' pendiente'}</span>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

function MapaUbicacion({ ciudad }) {
    return (
        <div className="dom-mapa" role="img" aria-label="Ubicación aproximada de la entrega">
            <MapPin size={30} aria-hidden="true" />
            <span>{ciudad ? `Ubicación aproximada · ${ciudad}` : 'Ubicación aproximada'}</span>
        </div>
    );
}

function ResumenPago({ pedido }) {
    const efectivo = pedido.metodoPago === 'efectivo';
    const pendiente = efectivo && pedido.pagoEstado === 'pendiente';
    const recibido = efectivo && pedido.pagoEstado === 'recibido';
    return (
        <section className="ped-tarjeta" aria-label="Resumen del pago">
            <h2 className="ped-tarjeta-titulo">Resumen del pago</h2>
            <div className="dom-pago-fila"><span>Subtotal</span><strong>{formatoCOP(pedido.subtotal)}</strong></div>
            <div className="dom-pago-fila"><span>Domicilio</span><strong>{formatoCOP(pedido.domicilio)}</strong></div>
            <div className="dom-pago-linea" />
            <div className="dom-pago-total"><span>Total</span><strong>{formatoCOP(pedido.total)} COP</strong></div>
            <div className="dom-pago-metodo">
                <span>Método: {ETIQUETA_PAGO[pedido.metodoPago] || pedido.metodoPago}{pedido.pagoDetalle ? ` · ${pedido.pagoDetalle}` : ''}</span>
                <span className={`dom-estado dom-estado-${TONO_PAGO[pedido.pagoEstado] || 'entregado'}`}>
                    {ETIQUETA_PAGO_ESTADO[pedido.pagoEstado] || pedido.pagoEstado}
                </span>
            </div>
            {pendiente && (
                <p className="dom-pago-aviso warn">
                    <Info size={16} aria-hidden="true" />
                    <span><strong>Pago en efectivo: cobrar {formatoCOP(pedido.total)} COP al entregar</strong></span>
                </p>
            )}
            {recibido && (
                <p className="dom-pago-aviso ok">
                    <Check size={16} aria-hidden="true" />
                    <span>Pago en efectivo recibido</span>
                </p>
            )}
            {!efectivo && (
                <p className="dom-pago-aviso ok">
                    <Check size={16} aria-hidden="true" />
                    <span>Este pedido ya fue pagado. No debes realizar ningún cobro</span>
                </p>
            )}
        </section>
    );
}

function ModalConfirmarEntrega({ pedido, enviando, onCerrar, onConfirmar }) {
    const dialogoRef = useFocoModal();
    return (
        <div className="modal-overlay" onClick={enviando ? undefined : onCerrar}>
            <div ref={dialogoRef} className="modal-content ped-modal dom-modal" role="dialog" aria-modal="true" aria-labelledby="dom-modal-entrega" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
                <button type="button" className="dom-modal-cerrar" aria-label="Cerrar" onClick={onCerrar} disabled={enviando}><X size={18} /></button>
                <span className="dom-modal-icono-ok" aria-hidden="true"><Check size={26} /></span>
                <h2 id="dom-modal-entrega" className="ped-modal-titulo">¿Confirmas que entregaste el pedido #{pedido.numero}?</h2>
                <p className="modal-text">Confirma solo cuando el cliente haya recibido todos los productos y hayas recibido el pago en efectivo.</p>
                <div className="dom-modal-botones">
                    <button type="button" className="ped-boton ped-boton-secundario" onClick={onCerrar} disabled={enviando}>Cancelar</button>
                    <button type="button" className="ped-boton ped-boton-primario" onClick={onConfirmar} disabled={enviando}>
                        {enviando ? 'Confirmando…' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ModalLlamar({ pedido, onCerrar }) {
    const dialogoRef = useFocoModal();
    const nombre = pedido.clienteNombre || pedido.direccion?.nombre || 'Cliente';
    const telefono = pedido.clienteTelefono || pedido.direccion?.telefono || '';
    const tel = enlaceTel(telefono);
    return (
        <div className="modal-overlay" onClick={onCerrar}>
            <div ref={dialogoRef} className="modal-content ped-modal dom-modal" role="dialog" aria-modal="true" aria-labelledby="dom-modal-llamar" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
                <button type="button" className="dom-modal-cerrar" aria-label="Cerrar" onClick={onCerrar}><X size={18} /></button>
                <Avatar nombre={nombre} foto={pedido.clienteFoto} className="dom-modal-avatar" />
                <h2 id="dom-modal-llamar" className="dom-modal-nombre">Contactar al cliente</h2>
                <p className="dom-modal-nombre" style={{ fontSize: 18 }}>{nombre}</p>
                <p className="dom-modal-telefono">{telefono || 'Sin teléfono registrado'}</p>
                <p className="dom-modal-texto">{MSJ_CONTACTO}</p>
                <div className="dom-modal-botones">
                    <button type="button" className="ped-boton ped-boton-secundario" onClick={onCerrar}>Cancelar</button>
                    {tel ? (
                        <a className="ped-boton ped-boton-primario" href={tel}>
                            <Phone size={16} aria-hidden="true" /> Llamar
                        </a>
                    ) : (
                        <button type="button" className="ped-boton ped-boton-primario" disabled>Llamar</button>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetallePedido() {
    const { id } = useParams();
    const [pedido, setPedido] = useState(null);
    const [errorCarga, setErrorCarga] = useState('');
    const [aviso, setAviso] = useState(null);       // { tipo: 'exito'|'error'|'warning', texto }
    const [modalEntrega, setModalEntrega] = useState(false);
    const [modalLlamar, setModalLlamar] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const cargar = useCallback(async () => {
        const r = await obtenerPedidoDomiciliario(id);
        if (r.ok) { setPedido(r.data.pedido); setErrorCarga(''); return; }
        setErrorCarga(r.data.mensaje || r.mensaje || 'No se pudo cargar el pedido.');
    }, [id]);

    useEffect(() => { cargar(); }, [cargar]);

    // Esc cierra los modales.
    useEffect(() => {
        if (!modalEntrega && !modalLlamar) return undefined;
        const alTeclear = (e) => { if (e.key === 'Escape' && !enviando) { setModalEntrega(false); setModalLlamar(false); } };
        document.addEventListener('keydown', alTeclear);
        return () => document.removeEventListener('keydown', alTeclear);
    }, [modalEntrega, modalLlamar, enviando]);

    const falloEstado = (r) => (r.red || r.status >= 500 ? MSJ_ERROR_ESTADO : (r.data.mensaje || MSJ_ERROR_ESTADO));

    const iniciar = async () => {
        if (enviando) return;
        setEnviando(true);
        setAviso(null);
        const r = await iniciarEntregaDomiciliario(pedido.id);
        setEnviando(false);
        if (r.ok && r.data.pedido) {
            setPedido(r.data.pedido);
            setAviso({ tipo: 'exito', texto: MSJ_ESTADO_OK });
        } else {
            setAviso({ tipo: 'error', texto: falloEstado(r) });
        }
    };

    const confirmar = async () => {
        if (enviando) return;
        setEnviando(true);
        setAviso(null);
        const r = await confirmarEntregaDomiciliario(pedido.id);
        setEnviando(false);
        if (r.ok && r.data.pedido) {
            setPedido(r.data.pedido);
            setModalEntrega(false);
            setAviso({ tipo: 'exito', texto: MSJ_ENTREGADO_OK });
        } else {
            setModalEntrega(false);
            setAviso({ tipo: 'error', texto: falloEstado(r) });
        }
    };

    if (!pedido) {
        return (
            <div className="dom-pagina">
                <nav className="dom-migas" aria-label="Ruta de navegación">
                    <Link to="/domiciliario/pedidos">Pedidos asignados</Link> / Detalle del pedido
                </nav>
                {errorCarga ? (
                    <>
                        <Franja tipo="error">{errorCarga}</Franja>
                        <Link to="/domiciliario/pedidos" className="ped-boton ped-boton-secundario" style={{ marginTop: 16 }}>Volver a mis pedidos</Link>
                    </>
                ) : <p className="dom-cargando">Cargando el pedido…</p>}
            </div>
        );
    }

    const { estado } = pedido;
    const d = pedido.direccion || {};
    const nombreCliente = pedido.clienteNombre || d.nombre || 'Cliente';
    const telefonoCliente = pedido.clienteTelefono || d.telefono || '';
    const zona = [d.alias && d.alias !== 'Casa' ? d.alias : null, d.ciudad].filter(Boolean).join(' · ');
    const esEfectivo = pedido.metodoPago === 'efectivo';
    const puedeIniciar = estado === 'preparacion';
    const puedeConfirmar = estado === 'en_camino';
    const finalizado = estado === 'entregado' || estado === 'cancelado';
    // Vista previa antes de salir (mockup "Detalle del pedido"): stepper compacto a la izquierda
    // y "Resumen del pago" a la derecha. En el flujo de entrega el stepper va a ancho completo.
    const esRevision = estado === 'preparacion';
    const tituloPagina = esRevision ? 'Detalle del pedido' : 'Detalle del pedido asignado';
    const textoCargo = esEfectivo
        ? (pedido.pagoEstado === 'recibido' ? 'Pago en efectivo recibido' : 'Pago en efectivo · Cobrar al entregar')
        : 'Pagado por adelantado · No debes realizar ningún cobro';

    return (
        <div className="dom-pagina">
            <nav className="dom-migas" aria-label="Ruta de navegación">
                <Link to="/domiciliario">Inicio</Link> / <Link to="/domiciliario/pedidos">Pedidos asignados</Link> / Detalle del pedido
            </nav>

            <div className="dom-encabezado">
                <div>
                    <h1 className="dom-titulo">{tituloPagina}</h1>
                    <p className="dom-subtitulo" style={{ marginBottom: 0 }}>
                        Pedido #{pedido.numero} · {fechaLargaDom(pedido.creadoEn)} · Entrega estimada: {pedido.entregaEstimada ? hora12(pedido.entregaEstimada) : 'Por confirmar'}
                    </p>
                </div>
                <span className={`dom-estado dom-estado-${estado}`}>{etiquetaEstado(estado)}</span>
            </div>

            {aviso && <div style={{ marginTop: 14 }}><Franja tipo={aviso.tipo} onCerrar={() => setAviso(null)}>{aviso.texto}</Franja></div>}
            {estado === 'cancelado' && (
                <div style={{ marginTop: 14 }}>
                    <Franja tipo="warning">Este pedido fue cancelado por el cliente y no se puede entregar.</Franja>
                </div>
            )}
            {estado === 'preparacion' && (
                <div style={{ marginTop: 14 }}>
                    <Franja tipo="warning">Primero debes iniciar la entrega para poder confirmarla</Franja>
                </div>
            )}

            {!esRevision && <div style={{ marginTop: 16 }}><StepperEstado pedido={pedido} /></div>}

            <div className="dom-columnas" style={{ marginTop: 16 }}>
                <div className="dom-columna">
                    <ListaProductos items={pedido.items || []} />
                    {esRevision ? (
                        <>
                            <StepperEstado pedido={pedido} />
                            <div className="dom-caja-info">
                                <Info size={18} aria-hidden="true" />
                                <div>
                                    <strong>Antes de iniciar tu entrega</strong>
                                    Verifica los {pedido.productos} productos, revisa la dirección y consulta el método de pago antes de salir.
                                </div>
                            </div>
                        </>
                    ) : (
                        <section className="ped-tarjeta" aria-label="Total del pedido">
                            <h2 className="ped-tarjeta-titulo">Total del pedido</h2>
                            <div className="dom-total-fila"><span>Subtotal</span><span>{formatoCOP(pedido.subtotal)}</span></div>
                            <div className="dom-total-fila"><span>Domicilio</span><span>{formatoCOP(pedido.domicilio)}</span></div>
                            <div className="dom-total-linea" />
                            <div className="dom-total-grande"><span>Total</span><strong>{formatoCOP(pedido.total)}</strong></div>
                            <p className="dom-total-nota">Incluye {formatoCOP(pedido.domicilio)} COP de domicilio</p>
                        </section>
                    )}
                </div>

                <div className="dom-columna">
                    <section className="ped-tarjeta" aria-label="Datos de entrega">
                        <h2 className="ped-tarjeta-titulo">Datos de entrega</h2>
                        <div className="dom-dato">
                            <MapPin size={18} aria-hidden="true" />
                            <div>
                                <strong>{d.linea}</strong>
                                {zona && <span>{zona}</span>}
                            </div>
                        </div>
                        <MapaUbicacion ciudad={d.ciudad} />
                        {d.indicaciones && <p className="dom-total-nota" style={{ marginTop: 10 }}>Indicaciones: {d.indicaciones}</p>}
                    </section>

                    <section className="ped-tarjeta" aria-label="Datos del cliente">
                        <h2 className="ped-tarjeta-titulo">Datos del cliente</h2>
                        <div className="dom-cliente">
                            <Avatar nombre={nombreCliente} foto={pedido.clienteFoto} />
                            <div>
                                <strong>{nombreCliente}</strong>
                                <span>{telefonoCliente || 'Sin teléfono'}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="ped-boton ped-boton-secundario ped-boton-bloque"
                            style={{ marginTop: 14 }}
                            onClick={() => setModalLlamar(true)}
                        >
                            <Phone size={16} aria-hidden="true" /> Llamar
                        </button>
                    </section>

                    <ResumenPago pedido={pedido} />
                </div>
            </div>

            <div className="dom-acciones">
                <span className="dom-acciones-texto">{textoCargo}</span>
                <div className="dom-acciones-botones">
                    {puedeIniciar ? (
                        <button type="button" className="ped-boton ped-boton-primario" onClick={iniciar} disabled={enviando}>
                            {enviando ? 'Actualizando…' : 'Iniciar entrega'}
                        </button>
                    ) : (
                        <button type="button" className="dom-boton-deshabilitado-grande" disabled>Iniciar entrega</button>
                    )}
                    {puedeConfirmar ? (
                        <button type="button" className="ped-boton ped-boton-primario" onClick={() => setModalEntrega(true)} disabled={enviando}>
                            Confirmar entrega
                        </button>
                    ) : (
                        <button type="button" className="dom-boton-deshabilitado-grande" disabled>Confirmar entrega</button>
                    )}
                    {finalizado && <Link to="/domiciliario/pedidos" className="ped-boton ped-boton-secundario">Volver a mis pedidos</Link>}
                </div>
            </div>
            {modalEntrega && <ModalConfirmarEntrega pedido={pedido} enviando={enviando} onCerrar={() => setModalEntrega(false)} onConfirmar={confirmar} />}
            {modalLlamar && <ModalLlamar pedido={pedido} onCerrar={() => setModalLlamar(false)} />}
        </div>
    );
}

export default DetallePedido;

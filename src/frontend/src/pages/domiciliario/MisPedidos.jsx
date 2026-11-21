// src/pages/domiciliario/MisPedidos.jsx — E5-HU2 Consultar pedidos asignados
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, Truck, PackageCheck, MapPin, Clock, ArrowRight, Bike, X, Info, CircleCheck, TriangleAlert } from 'lucide-react';
import { Franja } from '../../components/pedidos/Estados';
import {
    listarPedidosDomiciliario, hora12,
    MSJ_NUEVO_PEDIDO, MSJ_NUEVO_DETALLE, MSJ_PEDIDO_CANCELADO,
    MSJ_SIN_PEDIDOS, MSJ_SIN_PEDIDOS_DETALLE, MSJ_DISPONIBLE
} from '../../utils/domicilios';
import { etiquetaEstado } from '../../utils/pedidos';
import { useDomiciliarioAvisos } from '../../context/DomiciliarioAvisosContext';
import '../../styles/variables.css';
import '../../styles/pedidos.css';
import '../../styles/domicilios.css';

const intervaloPoll = () => Number(import.meta.env.VITE_DOMICILIARIO_POLL_MS) || 15000; // sondeo: detecta pedidos nuevos y cancelaciones
const DURACION_TOAST_MS = 6000;

const ESTADOS_PENDIENTES = ['preparacion', 'en_camino'];

function Coincidencia({ pedido, termino }) {
    if (!termino) return true;
    const q = termino.toLowerCase();
    const d = pedido.direccion || {};
    return [pedido.numero, d.linea, d.ciudad, d.alias]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
}

function MisPedidos() {
    const [searchParams] = useSearchParams();
    const termino = (searchParams.get('busqueda') || '').trim();
    const [pedidos, setPedidos] = useState(null);   // null = cargando
    const [resumen, setResumen] = useState({ porRecoger: 0, enCamino: 0, entregadosHoy: 0 });
    const [error, setError] = useState('');
    const [nuevos, setNuevos] = useState(() => new Set());
    const [toasts, setToasts] = useState([]);
    const conocidos = useRef(null);                // Map(id → estado) de la última carga
    const { agregarAviso } = useDomiciliarioAvisos();

    const agregarToast = useCallback((tipo, pedido) => {
        const id = `${pedido.id}-${Date.now()}`;
        setToasts((prev) => [...prev, { id, tipo, pedido }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), DURACION_TOAST_MS);
    }, []);

    const cargar = useCallback(async () => {
        const r = await listarPedidosDomiciliario('activos');
        if (!r.ok) {
            setError(r.data.mensaje || r.mensaje || 'No se pudo cargar tus pedidos asignados.');
            setPedidos([]);
            return;
        }
        const lista = r.data.pedidos || [];
        setPedidos(lista);
        setResumen(r.data.resumen || {});
        setError('');

        const mapa = new Map(lista.map((p) => [p.id, p.estado]));
        if (conocidos.current !== null) {
            for (const p of lista) {
                const antes = conocidos.current.get(p.id);
                if (antes === undefined && p.estado !== 'cancelado') {
                    setNuevos((s) => new Set(s).add(p.id));
                    agregarToast('nuevo', p);
                    agregarAviso({ tipo: 'nuevo', titulo: MSJ_NUEVO_PEDIDO, detalle: `#${p.numero}`, texto: MSJ_NUEVO_DETALLE, pedidoId: p.id });
                } else if (ESTADOS_PENDIENTES.includes(antes) && p.estado === 'cancelado') {
                    agregarToast('cancelado', p);
                    agregarAviso({ tipo: 'cancelado', titulo: 'Pedido cancelado', detalle: `#${p.numero}`, texto: 'El cliente canceló el pedido. Fue retirado de tus entregas pendientes', pedidoId: p.id });
                }
            }
        }
        conocidos.current = mapa;
    }, [agregarAviso, agregarToast]);

    useEffect(() => { cargar(); }, [cargar]);
    useEffect(() => {
        const t = setInterval(cargar, intervaloPoll());
        return () => clearInterval(t);
    }, [cargar]);

    const marcarVisto = (id) => setNuevos((s) => { const n = new Set(s); n.delete(id); return n; });

    const lista = pedidos || [];
    const cancelados = lista.filter((p) => p.estado === 'cancelado');
    const visibles = lista.filter((p) => Coincidencia({ pedido: p, termino }));
    const sinPedidos = pedidos !== null && lista.length === 0 && !error;
    const filtradosVacios = pedidos !== null && !sinPedidos && visibles.length === 0;

    return (
        <div className="dom-pagina">
            <nav className="dom-migas" aria-label="Ruta de navegación">
                <Link to="/domiciliario">Inicio</Link> / Pedidos asignados
            </nav>
            <h1 className="dom-titulo">Mis pedidos asignados</h1>
            <p className="dom-subtitulo">Gestiona tus entregas de hoy y consulta la información de cada pedido.</p>

            <div className="dom-stats" role="list" aria-label="Resumen de entregas">
                <div className="dom-stat" role="listitem">
                    <span className="dom-stat-icono warn"><Package size={20} /></span>
                    <span className="dom-stat-texto">
                        <span className="dom-stat-etiqueta">Por recoger</span>
                        <span className="dom-stat-numero">{resumen.porRecoger ?? 0}</span>
                    </span>
                </div>
                <div className="dom-stat" role="listitem">
                    <span className="dom-stat-icono info"><Truck size={20} /></span>
                    <span className="dom-stat-texto">
                        <span className="dom-stat-etiqueta">En camino</span>
                        <span className="dom-stat-numero">{resumen.enCamino ?? 0}</span>
                    </span>
                </div>
                <div className="dom-stat" role="listitem">
                    <span className="dom-stat-icono ok"><PackageCheck size={20} /></span>
                    <span className="dom-stat-texto">
                        <span className="dom-stat-etiqueta">Entregados hoy</span>
                        <span className="dom-stat-numero">{resumen.entregadosHoy ?? 0}</span>
                    </span>
                </div>
            </div>

            {error && <Franja tipo="error">{error}</Franja>}
            {cancelados.map((p) => (
                <Franja key={`cancelado-${p.id}`} tipo="warning">{MSJ_PEDIDO_CANCELADO(`#${p.numero}`)}</Franja>
            ))}

            {pedidos === null && !error && <p className="dom-cargando">Cargando tus pedidos asignados…</p>}

            {sinPedidos && (
                <section className="dom-seccion" aria-label="Tu jornada de entregas">
                    <div className="dom-seccion-cabecera"><h2>Tu jornada de entregas</h2></div>
                    <div className="dom-vacio">
                        <span className="dom-vacio-icono"><Bike size={44} strokeWidth={1.6} /></span>
                        <h2 className="dom-vacio-titulo">{MSJ_SIN_PEDIDOS}</h2>
                        <p className="dom-vacio-texto">{MSJ_SIN_PEDIDOS_DETALLE}</p>
                        <span className="dom-vacio-pildora">{MSJ_DISPONIBLE}</span>
                    </div>
                </section>
            )}

            {pedidos && !sinPedidos && (
                <section className="dom-seccion" aria-label="Entregas">
                    <div className="dom-seccion-cabecera">
                        <h2>{cancelados.length > 0 ? 'Pedidos del día' : 'Entregas pendientes'}</h2>
                        {!cancelados.length && <span className="dom-seccion-nota">Ordenadas por hora estimada de entrega</span>}
                    </div>

                    {filtradosVacios ? (
                        <p className="ped-tabla-vacia">Ningún pedido coincide con la búsqueda.</p>
                    ) : (
                        <div className="dom-lista">
                            {visibles.map((p) => {
                                const cancelado = p.estado === 'cancelado';
                                const zona = [p.direccion?.alias && p.direccion.alias !== 'Casa' ? p.direccion.alias : null, p.direccion?.ciudad]
                                    .filter(Boolean).join(' · ');
                                return (
                                    <article
                                        key={p.id}
                                        className={`dom-pedido${cancelado ? ' dom-pedido-cancelado' : ''}${nuevos.has(p.id) ? ' nuevo' : ''}`}
                                        data-pedido={p.numero}
                                    >
                                        <div className="dom-pedido-celda-num">
                                            <span className="dom-pedido-num">#{p.numero}</span>
                                            <span className="dom-pedido-badges">
                                                <span className={`dom-estado dom-estado-${p.estado}`}>{etiquetaEstado(p.estado)}</span>
                                                {nuevos.has(p.id) && <span className="dom-estado dom-estado-nuevo">Nuevo</span>}
                                            </span>
                                        </div>
                                        <div className="dom-pedido-dir">
                                            <MapPin size={18} aria-hidden="true" />
                                            <span className="dom-pedido-dir-texto">
                                                <span className="dom-pedido-dir-linea">{p.direccion?.linea}</span>
                                                {zona && <span className="dom-pedido-dir-zona">{zona}</span>}
                                            </span>
                                        </div>
                                        <div className="dom-pedido-hora">
                                            <span className="dom-pedido-hora-label">Entrega estimada</span>
                                            <span className="dom-pedido-hora-valor">
                                                <Clock size={15} aria-hidden="true" />
                                                {p.entregaEstimada ? hora12(p.entregaEstimada) : 'Por confirmar'}
                                            </span>
                                        </div>
                                        <div className="dom-pedido-accion">
                                            {cancelado ? (
                                                <button type="button" className="dom-boton-deshabilitado" disabled title="El pedido fue cancelado">
                                                    Iniciar entrega
                                                </button>
                                            ) : (
                                                <Link
                                                    to={`/domiciliario/pedidos/${p.id}`}
                                                    className="dom-ver-detalle"
                                                    onClick={() => marcarVisto(p.id)}
                                                    aria-label={`Ver detalle del pedido ${p.numero}`}
                                                >
                                                    Ver detalle <ArrowRight size={15} aria-hidden="true" />
                                                </Link>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {!filtradosVacios && (
                        <p className="dom-nota">
                            <Info size={16} aria-hidden="true" />
                            Revisa las indicaciones del cliente antes de iniciar cada entrega.
                        </p>
                    )}
                </section>
            )}

            <div className="dom-toasts" aria-live="polite">
                {toasts.map((t) => {
                    const Icono = t.tipo === 'nuevo' ? CircleCheck : TriangleAlert;
                    return (
                        <div key={t.id} className="dom-toast" role="status">
                            <span className="dom-toast-icono"><Icono size={20} /></span>
                            <span className="dom-toast-cuerpo">
                                <span className="dom-toast-titulo">
                                    {t.tipo === 'nuevo' ? MSJ_NUEVO_PEDIDO : 'Pedido cancelado'}
                                </span>
                                <span className="dom-toast-id">#{t.pedido.numero}</span>
                                <span className="dom-toast-texto">
                                    {t.tipo === 'nuevo' ? MSJ_NUEVO_DETALLE : 'El cliente canceló el pedido. Fue retirado de tus entregas pendientes'}
                                </span>
                            </span>
                            <button
                                type="button"
                                className="dom-toast-cerrar"
                                aria-label="Cerrar aviso"
                                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default MisPedidos;

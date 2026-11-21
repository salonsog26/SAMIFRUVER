// src/pages/domiciliario/HistorialEntregas.jsx — E5: historial de entregas del domiciliario
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Franja } from '../../components/pedidos/Estados';
import { listarPedidosDomiciliario } from '../../utils/domicilios';
import { formatoCOP, etiquetaEstado, fechaHoraCorta } from '../../utils/pedidos';
import '../../styles/variables.css';
import '../../styles/pedidos.css';
import '../../styles/domicilios.css';

const fechaCierre = (p) => p.entregadoEn || p.canceladoEn || p.creadoEn;

function HistorialEntregas() {
    const [pedidos, setPedidos] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelado = false;
        listarPedidosDomiciliario('historial').then((r) => {
            if (cancelado) return;
            if (r.ok) setPedidos(r.data.pedidos || []);
            else { setError(r.data.mensaje || r.mensaje || 'No se pudo cargar el historial.'); setPedidos([]); }
        });
        return () => { cancelado = true; };
    }, []);

    return (
        <div className="dom-pagina">
            <nav className="dom-migas" aria-label="Ruta de navegación">
                <Link to="/domiciliario">Inicio</Link> / Historial de entregas
            </nav>
            <h1 className="dom-titulo">Historial de entregas</h1>
            <p className="dom-subtitulo">Consulta los pedidos que ya entregaste o que fueron cancelados.</p>

            {error && <Franja tipo="error">{error}</Franja>}
            {pedidos === null && !error && <p className="dom-cargando">Cargando el historial…</p>}

            {pedidos && pedidos.length === 0 && !error && (
                <div className="dom-vacio">
                    <h2 className="dom-vacio-titulo">Sin entregas registradas</h2>
                    <p className="dom-vacio-texto">Cuando completes entregas aparecerán aquí.</p>
                </div>
            )}

            {pedidos && pedidos.length > 0 && (
                <div className="dom-tabla" role="table" aria-label="Historial de entregas">
                    <div className="dom-tabla-cabecera" role="row">
                        <span role="columnheader">Pedido</span>
                        <span role="columnheader">Dirección</span>
                        <span role="columnheader">Fecha</span>
                        <span role="columnheader">Total</span>
                        <span role="columnheader" className="ped-sr">Acciones</span>
                    </div>
                    {pedidos.map((p) => (
                        <div key={p.id} className="dom-tabla-fila" role="row" data-pedido={p.numero}>
                            <span role="cell" className="dom-celda-num">
                                #{p.numero}
                                <span className={`dom-estado dom-estado-${p.estado}`} style={{ marginLeft: 8 }}>{etiquetaEstado(p.estado)}</span>
                            </span>
                            <span role="cell">{p.direccion?.linea}{p.direccion?.ciudad ? ` · ${p.direccion.ciudad}` : ''}</span>
                            <span role="cell">{fechaHoraCorta(fechaCierre(p))}</span>
                            <span role="cell" className="dom-celda-total">{formatoCOP(p.total)}</span>
                            <span role="cell">
                                <Link to={`/domiciliario/pedidos/${p.id}`} className="dom-ver-detalle">
                                    Ver detalle <ArrowRight size={15} aria-hidden="true" />
                                </Link>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default HistorialEntregas;

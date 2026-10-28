// src/pages/public/Pedidos.jsx — E3-HU3 Historial de pedidos
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import { EstadoVacio, Franja, InsigniaEstado } from '../../components/pedidos/Estados';
import { listarPedidos, formatoCOP, fechaHoraCorta, ESTADOS } from '../../utils/pedidos';
import '../../styles/variables.css';
import '../../styles/pedidos.css';

function Pedidos() {
    const navigate = useNavigate();
    const [pedidos, setPedidos] = useState(null);     // null = cargando
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState('todos');

    useEffect(() => {
        let cancelado = false;
        listarPedidos().then((r) => {
            if (cancelado) return;
            if (r.ok) setPedidos(r.data.pedidos || []);
            else { setError(r.mensaje || r.data.mensaje || 'No se pudo cargar tu historial.'); setPedidos([]); }
        });
        return () => { cancelado = true; };
    }, []);

    const sinPedidos = pedidos !== null && pedidos.length === 0 && !error;
    const visibles = (pedidos || []).filter((p) => filtro === 'todos' || p.estado === filtro);

    return (
        <div className="public-page ped-pagina">
            <Navbar />
            <main className="ped-contenido">
                <nav className="ped-migas" aria-label="Ruta de navegación">Mi cuenta / Historial de pedidos</nav>
                <h1 className="ped-titulo">Historial de pedidos</h1>
                <p className="ped-subtitulo">
                    {sinPedidos ? 'Tus próximas compras tendrán un lugar aquí.' : 'Consulta tus compras, sigue tus entregas y revisa cada detalle.'}
                </p>

                <nav className="ped-pestanas" aria-label="Mi cuenta">
                    <Link to="/perfil">Mi perfil</Link>
                    <span className="ped-pestana-pronto" aria-disabled="true" title="Próximamente">Mis direcciones</span>
                    <span className="activa" aria-current="page">Historial de pedidos</span>
                </nav>

                {error && <Franja tipo="error">{error}</Franja>}
                {pedidos === null && <p className="ped-cargando">Cargando tus pedidos…</p>}

                {sinPedidos && (
                    <EstadoVacio titulo="Aún no has realizado pedidos" texto="Descubre frutas y verduras frescas de nuestra tierra. Tu próxima buena comida empieza aquí." textoBoton="Ir a Inicio" to="/" />
                )}

                {pedidos && pedidos.length > 0 && (
                    <>
                        <div className="ped-historial-cabecera">
                            <h2 className="ped-seccion-titulo">Tus pedidos</h2>
                            <label className="ped-filtro">
                                <span className="ped-sr">Filtrar por estado</span>
                                <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por estado">
                                    <option value="todos">Todos los estados</option>
                                    {Object.entries(ESTADOS).map(([clave, e]) => <option key={clave} value={clave}>{e.etiqueta}</option>)}
                                </select>
                                <ChevronDown size={16} aria-hidden="true" />
                            </label>
                        </div>

                        <div className="ped-tabla" role="table" aria-label="Tus pedidos">
                            <div className="ped-tabla-cabecera" role="row">
                                <span role="columnheader">Pedido</span>
                                <span role="columnheader">Fecha de compra</span>
                                <span role="columnheader">Total COP</span>
                                <span role="columnheader">Estado</span>
                                <span role="columnheader" className="ped-sr">Acciones</span>
                            </div>
                            {visibles.length === 0 ? (
                                <p className="ped-tabla-vacia">No tienes pedidos con este estado.</p>
                            ) : visibles.map((p) => (
                                <div key={p.id} className="ped-tabla-fila" role="row" data-pedido={p.numero} onClick={() => navigate(`/pedidos/${p.id}`)}>
                                    <span role="cell" className="ped-celda-numero">#{p.numero}</span>
                                    <span role="cell" className="ped-celda-fecha">{fechaHoraCorta(p.creadoEn)}</span>
                                    <span role="cell" className="ped-celda-total">{formatoCOP(p.total)}</span>
                                    <span role="cell"><InsigniaEstado estado={p.estado} /></span>
                                    <span role="cell" className="ped-celda-accion">
                                        <Link to={`/pedidos/${p.id}`} onClick={(e) => e.stopPropagation()} aria-label={`Ver pedido ${p.numero}`}>Ver pedido <ArrowRight size={16} aria-hidden="true" /></Link>
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="ped-tabla-pie">
                            <span>Mostrando {visibles.length} de {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'} · Más recientes primero</span>
                            <span>Página 1 de 1</span>
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default Pedidos;

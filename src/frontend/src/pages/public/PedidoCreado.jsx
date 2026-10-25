// src/pages/public/PedidoCreado.jsx — confirmación después de "Realizar pedido" (E3-HU2, escenario 1)
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import { Franja, InsigniaEstado } from '../../components/pedidos/Estados';
import { obtenerPedido, formatoCOP, resumenCantidades } from '../../utils/pedidos';
import '../../styles/variables.css';
import '../../styles/pedidos.css';

function PedidoCreado() {
    const { id } = useParams();
    const [pedido, setPedido] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelado = false;
        obtenerPedido(id).then((r) => {
            if (cancelado) return;
            if (r.ok) setPedido(r.data.pedido);
            else setError(r.status === 404 ? 'No encontramos este pedido.' : (r.mensaje || r.data.mensaje || 'No se pudo cargar el pedido.'));
        });
        return () => { cancelado = true; };
    }, [id]);

    return (
        <div className="public-page ped-pagina">
            <Navbar />
            <main className="ped-contenido">
                {error && <Franja tipo="error">{error}</Franja>}
                {!pedido && !error && <p className="ped-cargando">Cargando tu pedido…</p>}
                {pedido && (
                    <>
                        <Franja tipo="exito">Tu pedido #{pedido.numero} fue creado correctamente. Tu carrito está vacío.</Franja>
                        <section className="ped-tarjeta ped-confirmacion" aria-label="Pedido creado">
                            <span className="ped-confirmacion-check" aria-hidden="true"><Check size={36} /></span>
                            <h1 className="ped-confirmacion-titulo">Pedido creado exitosamente</h1>
                            <p className="ped-confirmacion-numero">Pedido #{pedido.numero}</p>
                            <InsigniaEstado estado={pedido.estado} />
                            <p className="ped-confirmacion-detalle">
                                {resumenCantidades(pedido.productos, pedido.unidades)} · Total: {formatoCOP(pedido.total)} COP<br />
                                {pedido.direccion.alias} · {pedido.direccion.linea}, {pedido.direccion.ciudad}<br />
                                {pedido.metodoPago === 'tarjeta' ? `Pago aprobado con ${pedido.pagoDetalle}` : 'Pago aprobado con Mercado Pago'}
                            </p>
                            <div className="ped-confirmacion-botones">
                                <Link to={`/pedidos/${pedido.id}`} className="ped-boton ped-boton-primario">Ver seguimiento</Link>
                                <Link to="/" className="ped-boton ped-boton-secundario">Seguir comprando</Link>
                            </div>
                            <p className="ped-nota ped-centrado">Tu carrito quedó vacío · 0 productos</p>
                        </section>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default PedidoCreado;

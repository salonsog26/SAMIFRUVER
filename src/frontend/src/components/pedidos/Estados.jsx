// src/components/pedidos/Estados.jsx — piezas visuales compartidas por las pantallas de pedidos (Épica 3)
import React from 'react';
import { Check, CircleAlert, Info, X, ShoppingBasket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ETAPAS, etiquetaEstado, tonoEstado, hora, formatoCOP, etiquetaPago, tonoPago, fechaHoraCorta } from '../../utils/pedidos';
import { resolverImagen, alFallarImagen } from '../../utils/imagenes';
import '../../styles/pedidos.css';

// Etiqueta de color: "● En preparación"
export function InsigniaEstado({ estado }) {
    return (
        <span className={`ped-insignia ped-insignia-${tonoEstado(estado)}`} data-estado={estado}>
            <span className="ped-insignia-punto" aria-hidden="true" />
            {etiquetaEstado(estado)}
        </span>
    );
}

// Franja de aviso a todo el ancho. tipo: 'info' | 'exito' | 'error' | 'aviso' (ámbar). Con onCerrar muestra la X.
export function Franja({ tipo = 'info', children, onCerrar, className = '' }) {
    const Icono = tipo === 'error' ? CircleAlert : tipo === 'exito' ? Check : Info;   // 'aviso' y 'info' usan el ícono de información
    return (
        <div className={`ped-franja ped-franja-${tipo} ${className}`.trim()} role={tipo === 'error' ? 'alert' : 'status'}>
            <Icono size={20} aria-hidden="true" />
            <span className="ped-franja-texto">{children}</span>
            {onCerrar && (
                <button type="button" className="ped-franja-cerrar" aria-label="Cerrar aviso" onClick={onCerrar}><X size={18} /></button>
            )}
        </div>
    );
}

// Etiqueta del estado del pago (Épica 4): "● Aprobado", "● Pendiente", "● Devolución en proceso"...
export function InsigniaPago({ estado }) {
    return (
        <span className={`ped-insignia ped-insignia-${tonoPago(estado)}`} data-pago={estado}>
            <span className="ped-insignia-punto" aria-hidden="true" />
            Estado: {etiquetaPago(estado)}
        </span>
    );
}

// Franja con el mensaje del estado del pago de un pedido (E4-HU2).
export function FranjaPago({ pedido }) {
    const { pago } = pedido;
    if (!pago) return null;
    const total = `${formatoCOP(pago.total)} COP`;
    if (pago.estado === 'aprobado') {
        return <Franja tipo="exito"><strong>Tu pago está aprobado</strong><span className="pag-franja-detalle">Hemos recibido los {total} de tu compra.</span></Franja>;
    }
    if (pago.estado === 'pendiente') {
        return <Franja tipo="aviso"><strong>Estado: Pago Pendiente.</strong><span className="pag-franja-detalle">El pago se realiza al recibir el pedido. Ten listo el importe exacto de {total}.</span></Franja>;
    }
    if (pago.estado === 'devolucion_en_proceso') {
        return <Franja tipo="info"><strong>Estamos gestionando tu devolución</strong><span className="pag-franja-detalle">Hemos recibido tu solicitud de cancelación. El reintegro de {total} está en proceso; todavía no se ha abonado.</span></Franja>;
    }
    if (pago.estado === 'devuelto') {
        return <Franja tipo="exito"><strong>Devolución completada</strong><span className="pag-franja-detalle">Reintegramos {total} a tu tarjeta {pago.detalle.replace(/^.* terminada en /, '···· ')}.</span></Franja>;
    }
    return <Franja tipo="info"><strong>Sin cobro</strong><span className="pag-franja-detalle">Cancelaste el pedido antes de pagarlo, así que no se realizó ningún cargo.</span></Franja>;
}

// "Resumen del pago" (E4-HU2): estado, desglose, método, fecha, referencia y, si aplica, el total a reintegrar.
export function ResumenPago({ pedido, compacto = false }) {
    const { pago } = pedido;
    if (!pago) return null;
    const dev = pago.devolucion;
    return (
        <section className="ped-tarjeta pag-resumen" aria-label="Resumen del pago">
            <h2 className="ped-tarjeta-titulo ped-titulo-medio">Resumen del pago</h2>
            <div><InsigniaPago estado={pago.estado} /></div>
            {!compacto && (
                <>
                    <div className="ped-resumen-fila"><span>Subtotal · {pedido.productos} {pedido.productos === 1 ? 'producto' : 'productos'}</span><span>{formatoCOP(pedido.subtotal)}</span></div>
                    <div className="ped-resumen-fila"><span>Domicilio</span><span>{formatoCOP(pedido.domicilio)}</span></div>
                </>
            )}
            <div className="ped-resumen-total"><span>{pago.estado === 'pendiente' ? 'Total a pagar' : 'Total'}</span><strong>{formatoCOP(pago.total)} COP</strong></div>
            <dl>
                <div><dt>Método de pago</dt><dd>{pago.metodo === 'efectivo' ? 'Efectivo al recibir' : pago.detalle}</dd></div>
                {pago.pagadoEn && <div><dt>Fecha del pago original</dt><dd>{fechaHoraCorta(pago.pagadoEn)}</dd></div>}
                {pago.referencia && <div><dt>Referencia de transacción</dt><dd>{pago.referencia}</dd></div>}
                {dev && dev.referencia && <div><dt>Referencia de devolución</dt><dd>{dev.referencia}</dd></div>}
            </dl>
            {dev && (
                <div className="pag-reintegro">
                    <span>{dev.estado === 'devuelto' ? 'Total reintegrado' : 'Total a reintegrar'}</span>
                    <strong>{formatoCOP(dev.monto)} COP</strong>
                    <p>{dev.estado === 'devuelto'
                        ? `Se abonó en la tarjeta original${dev.devueltoEn ? ` el ${fechaHoraCorta(dev.devueltoEn)}` : ''}.`
                        : 'Se abonará en la tarjeta original. El reintegro aún no se ha completado.'}</p>
                </div>
            )}
        </section>
    );
}

// Línea "Así va tu pedido": 4 etapas con check y hora cuando están completadas.
export function LineaSeguimiento({ etapas, fecha, nota }) {
    const porClave = Object.fromEntries(etapas.map((e) => [e.clave, e]));
    const ultima = ETAPAS.reduce((n, e, i) => (porClave[e.clave]?.completada ? i : n), -1);
    return (
        <section className="ped-tarjeta ped-linea" aria-label="Así va tu pedido">
            <div className="ped-linea-cabecera">
                <h2 className="ped-tarjeta-titulo">Así va tu pedido</h2>
                <span className="ped-linea-fecha">{fecha}{nota ? ` · ${nota}` : ''}</span>
            </div>
            <ol className="ped-etapas">
                {ETAPAS.map((e, i) => {
                    const hecha = Boolean(porClave[e.clave]?.completada);
                    return (
                        <li key={e.clave} className={`ped-etapa${hecha ? ' hecha' : ''}${i < ultima ? ' con-tramo' : ''}`} data-etapa={e.clave} data-completada={hecha}>
                            <span className="ped-etapa-marca" aria-hidden="true">{hecha ? <Check size={16} /> : <span className="ped-etapa-punto" />}</span>
                            <span className="ped-etapa-nombre">{e.etiqueta}</span>
                            <span className="ped-etapa-hora">{hecha ? hora(porClave[e.clave].hora) : e.pendiente}</span>
                            <span className="ped-sr">{hecha ? ' completado' : ' pendiente'}</span>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

export function ListaProductos({ items }) {
    return (
        <section className="ped-tarjeta" aria-label="Productos del pedido">
            <h2 className="ped-tarjeta-titulo">Productos del pedido</h2>
            <ul className="ped-productos">
                {items.map((i) => (
                    <li key={i.id} className="ped-producto">
                        <img src={resolverImagen(i.imagen)} alt="" className="ped-producto-img" onError={alFallarImagen} />
                        <div className="ped-producto-info">
                            <span className="ped-producto-nombre">{i.nombre}</span>
                            <span className="ped-producto-detalle">{i.unidad === 'unidad' ? 'Unidad' : 'Libra'} · {formatoCOP(i.precioUnitario)} / {i.unidad}</span>
                        </div>
                        <span className="ped-producto-cant">× {i.cantidad}</span>
                        <span className="ped-producto-total">{formatoCOP(i.subtotal)}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

// Ilustración de carrito vacío / sin pedidos
export function IconoCanasta() {
    return (
        <span className="ped-vacio-icono" aria-hidden="true"><ShoppingBasket size={44} strokeWidth={1.6} /></span>
    );
}

export function EstadoVacio({ titulo, texto, textoBoton, to }) {
    return (
        <div className="ped-tarjeta ped-vacio">
            <IconoCanasta />
            <h2 className="ped-vacio-titulo">{titulo}</h2>
            <p className="ped-vacio-texto">{texto}</p>
            <Link to={to} className="ped-boton ped-boton-primario">{textoBoton}</Link>
        </div>
    );
}

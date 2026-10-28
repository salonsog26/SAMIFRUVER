// src/components/pedidos/Estados.jsx — piezas visuales compartidas por las pantallas de pedidos (Épica 3)
import React from 'react';
import { Check, CircleAlert, Info, X, ShoppingBasket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ETAPAS, etiquetaEstado, tonoEstado, hora, formatoCOP } from '../../utils/pedidos';
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

// Franja de aviso a todo el ancho. tipo: 'info' | 'exito' | 'error'. Con onCerrar muestra la X.
export function Franja({ tipo = 'info', children, onCerrar, className = '' }) {
    const Icono = tipo === 'error' ? CircleAlert : tipo === 'exito' ? Check : Info;
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

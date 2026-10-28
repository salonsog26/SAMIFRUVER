// src/pages/public/Carrito.jsx — E3-HU2 Crear pedido (carrito, dirección, método de pago y "Realizar pedido")
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, MapPin, CircleCheck, Circle } from 'lucide-react';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import { EstadoVacio, Franja } from '../../components/pedidos/Estados';
import { useCarrito, cambiarCantidad, eliminarDelCarrito, vaciarCarrito, sincronizarConCatalogo, MSJ_SIN_STOCK } from '../../utils/carrito';
import { crearPedido, formatoCOP, precioPorUnidad, resumenCantidades } from '../../utils/pedidos';
import { obtenerSesion } from '../../utils/auth';
import { API_URL } from '../../utils/config';
import { resolverImagen, alFallarImagen } from '../../utils/imagenes';
import '../../styles/variables.css';
import '../../styles/pedidos.css';

export const MSJ_CARRITO_VACIO = 'No puedes realizar un pedido sin productos. Agrega al menos un producto a tu carrito.';
export const MSJ_SIN_PAGO = 'Selección de método de pago es obligatorio';
export const MSJ_SIN_DIRECCION = 'Selecciona o agrega una dirección de entrega.';
const MSJ_RED = 'No se pudo conectar con el servidor. Intenta de nuevo.';

const METODOS = [
    { clave: 'tarjeta', titulo: 'Tarjeta', detalle: 'Visa ···· 4242' },
    { clave: 'mercadopago', titulo: 'Mercado Pago', detalle: 'Paga con tu cuenta' }
];

const direccionDePerfil = (c) => (c && c.direccion && c.ciudad
    ? { alias: 'Casa', nombre: c.nombre, linea: c.direccion, ciudad: c.ciudad, telefono: c.telefono || '', origen: 'perfil' }
    : null);

const validarDireccion = ({ linea, ciudad, telefono }) => {
    const errores = {};
    if (String(linea || '').trim().length < 5) errores.linea = 'Ingresa una dirección válida';
    if (String(ciudad || '').trim().length < 2) errores.ciudad = 'Ingresa la ciudad';
    const t = String(telefono || '').trim();
    if (t && !/^\+?[0-9 ]{7,15}$/.test(t)) errores.telefono = 'Ingresa un teléfono válido';
    return errores;
};

function Carrito() {
    const navigate = useNavigate();
    const sesion = obtenerSesion();
    const { items, productos, unidades, subtotal, domicilio, total } = useCarrito();

    const [perfil, setPerfil] = useState(null);                 // dirección guardada en el perfil (Épica 2)
    const [perfilListo, setPerfilListo] = useState(false);       // ya terminó de consultarse el perfil (con o sin dirección)
    const [direccion, setDireccion] = useState(null);           // dirección elegida para ESTE pedido
    const [editando, setEditando] = useState(false);
    const [borrador, setBorrador] = useState({ linea: '', ciudad: '', telefono: '' });
    const [erroresDir, setErroresDir] = useState({});
    const [metodo, setMetodo] = useState('');
    const [errorPago, setErrorPago] = useState(false);
    const [errorDireccion, setErrorDireccion] = useState(false);
    const [aviso, setAviso] = useState(null);                   // { tipo, texto } franja superior
    const [topes, setTopes] = useState({});                     // productoId → true cuando se intentó pasar del stock
    const [enviando, setEnviando] = useState(false);
    const [ultimoTope, setUltimoTope] = useState(null);

    // Al abrir: actualiza stock/precios con el catálogo y trae la dirección del perfil.
    useEffect(() => {
        let cancelado = false;
        fetch(`${API_URL}/api/productos`)
            .then((r) => (r.ok ? r.json() : null))
            .then((lista) => {
                if (cancelado || !Array.isArray(lista)) return;
                const quitados = sincronizarConCatalogo(lista);
                if (quitados.length) setAviso({ tipo: 'info', texto: `Quitamos de tu carrito lo que ya no está disponible: ${quitados.join(', ')}.` });
            })
            .catch(() => { /* sin conexión: se usa lo guardado */ });
        fetch(`${API_URL}/api/clientes/${sesion.id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelado) return;
                const d = direccionDePerfil(data?.cliente);
                setPerfil(d);
                setDireccion((actual) => actual || d);
                setPerfilListo(true);
            })
            .catch(() => { if (!cancelado) setPerfilListo(true); /* el cliente puede escribir la dirección a mano */ });
        return () => { cancelado = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const vacio = items.length === 0;

    const masUno = (item) => {
        const r = cambiarCantidad(item.productoId, +1);
        if (!r.ok && r.mensaje) {
            setTopes((t) => ({ ...t, [item.productoId]: true }));
            setUltimoTope(item);
        } else {
            setTopes((t) => ({ ...t, [item.productoId]: false }));
            setUltimoTope(null);
        }
    };
    const menosUno = (item) => {
        cambiarCantidad(item.productoId, -1);
        setTopes((t) => ({ ...t, [item.productoId]: false }));
    };
    const quitar = (item) => {
        eliminarDelCarrito(item.productoId);
        setTopes((t) => ({ ...t, [item.productoId]: false }));
        if (ultimoTope?.productoId === item.productoId) setUltimoTope(null);
    };

    const abrirFormulario = () => {
        setBorrador({ linea: '', ciudad: '', telefono: sesion?.telefono || '' });
        setErroresDir({});
        setEditando(true);
    };
    const usarDireccion = (e) => {
        e.preventDefault();
        const errores = validarDireccion(borrador);
        setErroresDir(errores);
        if (Object.keys(errores).length) return;
        setDireccion({
            alias: 'Otra dirección', nombre: sesion?.nombre || '',
            linea: borrador.linea.trim().replace(/\s+/g, ' '), ciudad: borrador.ciudad.trim().replace(/\s+/g, ' '),
            telefono: borrador.telefono.trim(), origen: 'nueva'
        });
        setEditando(false);
        setErrorDireccion(false);
        setAviso(null);
    };

    const realizarPedido = async () => {
        if (enviando) return;
        setAviso(null);
        if (vacio) { setAviso({ tipo: 'info', texto: MSJ_CARRITO_VACIO }); return; }
        if (!metodo) {                                          // ESC3: sin método de pago
            setErrorPago(true);
            setAviso({ tipo: 'error', texto: MSJ_SIN_PAGO });
            return;
        }
        if (!direccion) {
            setErrorDireccion(true);
            setAviso({ tipo: 'error', texto: MSJ_SIN_DIRECCION });
            return;
        }

        setEnviando(true);
        const r = await crearPedido({
            items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
            direccion: { alias: direccion.alias, nombre: direccion.nombre, linea: direccion.linea, ciudad: direccion.ciudad, telefono: direccion.telefono },
            metodoPago: metodo
        });
        setEnviando(false);

        if (r.ok && r.data.pedido) {                            // ESC1: pedido creado → se vacía el carrito
            vaciarCarrito();
            navigate(`/pedido-creado/${r.data.pedido.id}`);
            return;
        }
        setAviso({ tipo: 'error', texto: r.red ? MSJ_RED : (r.data.mensaje || 'No se pudo crear el pedido. Intenta de nuevo.') });
        if (r.status === 409 || r.status === 400) {
            // El stock pudo cambiar mientras tanto: se actualiza el carrito para que vea lo disponible.
            fetch(`${API_URL}/api/productos`).then((x) => x.json()).then((l) => sincronizarConCatalogo(l)).catch(() => {});
        }
    };

    return (
        <div className="public-page ped-pagina">
            <Navbar />
            <main className="ped-contenido">
                <nav className="ped-migas" aria-label="Ruta de navegación"><Link to="/">Catálogo</Link> / Mi carrito</nav>
                <div className="ped-encabezado">
                    <div>
                        <h1 className="ped-titulo">Mi carrito</h1>
                        <p className="ped-subtitulo">
                            {vacio ? 'Aquí encontrarás los productos que elijas para tu próximo mercado.'
                                : 'Tu selección fresca está lista. Confirma los detalles de tu compra.'}
                        </p>
                    </div>
                </div>

                {aviso && <Franja tipo={aviso.tipo} onCerrar={() => setAviso(null)}>{aviso.texto}</Franja>}

                <div className="ped-columnas ped-columnas-carrito">
                    <div className="ped-columna-principal">
                        {vacio ? (
                            <>
                                <EstadoVacio titulo="Tu carrito está vacío" texto="Descubre frutas y verduras frescas de nuestra tierra. Tu próxima buena comida empieza aquí." textoBoton="Explorar productos" to="/" />
                                <Franja tipo="info">{MSJ_CARRITO_VACIO}</Franja>
                            </>
                        ) : (
                            <>
                                <section className="ped-tarjeta" aria-label="Productos en tu carrito">
                                    <h2 className="ped-tarjeta-titulo">Productos en tu carrito</h2>
                                    <ul className="ped-carrito-lista">
                                        {items.map((i) => {
                                            const enTope = i.cantidad >= i.stock;
                                            return (
                                                <li key={i.productoId} className="ped-carrito-item" data-producto={i.productoId}>
                                                    <div className="ped-carrito-fila">
                                                        <img src={resolverImagen(i.imagen)} alt="" className="ped-producto-img ped-producto-img-grande" onError={alFallarImagen} />
                                                        <div className="ped-producto-info">
                                                            <span className="ped-producto-nombre">{i.nombre}</span>
                                                            <span className="ped-producto-detalle">{precioPorUnidad(i.precio, i.unidad)}</span>
                                                            {enTope && <span className="ped-aviso-stock">Disponible: {i.stock} {i.unidad} · Máximo: {i.stock}</span>}
                                                        </div>
                                                        <div className="ped-cantidad" role="group" aria-label={`Cantidad de ${i.nombre}`}>
                                                            <button type="button" aria-label={`Quitar una unidad de ${i.nombre}`} disabled={i.cantidad <= 1} onClick={() => menosUno(i)}><Minus size={16} /></button>
                                                            <output aria-label={`Cantidad de ${i.nombre}: ${i.cantidad}`}>{i.cantidad}</output>
                                                            <button type="button" aria-label={`Agregar una unidad de ${i.nombre}`} className={enTope ? 'tope' : ''} aria-disabled={enTope} onClick={() => masUno(i)}><Plus size={16} /></button>
                                                        </div>
                                                        <div className="ped-carrito-precio">
                                                            <strong>{formatoCOP(i.precio * i.cantidad)}</strong>
                                                            <button type="button" className="ped-enlace-suave" aria-label={`Eliminar ${i.nombre} del carrito`} onClick={() => quitar(i)}>Eliminar</button>
                                                        </div>
                                                    </div>
                                                    {topes[i.productoId] && <Franja tipo="info">{MSJ_SIN_STOCK}</Franja>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>

                                <div className="ped-dos-tarjetas">
                                    <section className="ped-tarjeta" aria-label="Dirección de entrega">
                                        <h2 className="ped-tarjeta-titulo">Dirección de entrega</h2>
                                        {direccion && !editando && (
                                            <div className={`ped-opcion seleccionada${errorDireccion ? ' con-error' : ''}`}>
                                                <CircleCheck size={22} aria-hidden="true" className="ped-opcion-icono" />
                                                <div className="ped-opcion-texto">
                                                    <strong>{direccion.alias} · {direccion.nombre}</strong>
                                                    <span>{direccion.linea} · {direccion.ciudad}</span>
                                                </div>
                                                <button type="button" className="ped-enlace-fuerte" onClick={abrirFormulario}>Cambiar</button>
                                            </div>
                                        )}
                                        {(editando || (perfilListo && !direccion)) && (
                                            <form className="ped-form-direccion" onSubmit={usarDireccion} noValidate aria-label="Nueva dirección de entrega">
                                                {!direccion && !editando && (
                                                    <p className="ped-ayuda">No tienes una dirección guardada. Agrega la dirección donde quieres recibir tu pedido.</p>
                                                )}
                                                <label>Dirección
                                                    <input type="text" value={borrador.linea} placeholder="Calle 95 # 15-42, apto. 302" onChange={(e) => setBorrador({ ...borrador, linea: e.target.value })} aria-invalid={Boolean(erroresDir.linea)} />
                                                    {erroresDir.linea && <span className="form-error-text">{erroresDir.linea}</span>}
                                                </label>
                                                <label>Ciudad
                                                    <input type="text" value={borrador.ciudad} placeholder="Bogotá" onChange={(e) => setBorrador({ ...borrador, ciudad: e.target.value })} aria-invalid={Boolean(erroresDir.ciudad)} />
                                                    {erroresDir.ciudad && <span className="form-error-text">{erroresDir.ciudad}</span>}
                                                </label>
                                                <label>Teléfono de contacto
                                                    <input type="text" inputMode="tel" value={borrador.telefono} placeholder="310 555 0182" onChange={(e) => setBorrador({ ...borrador, telefono: e.target.value })} aria-invalid={Boolean(erroresDir.telefono)} />
                                                    {erroresDir.telefono && <span className="form-error-text">{erroresDir.telefono}</span>}
                                                </label>
                                                <div className="ped-form-botones">
                                                    <button type="submit" className="ped-boton ped-boton-primario">Usar esta dirección</button>
                                                    {(direccion || perfil) && (
                                                        <button type="button" className="ped-boton ped-boton-secundario" onClick={() => { setEditando(false); if (!direccion && perfil) setDireccion(perfil); }}>Cancelar</button>
                                                    )}
                                                </div>
                                            </form>
                                        )}
                                        {!editando && direccion && (
                                            <button type="button" className="ped-enlace-fuerte ped-agregar-dir" onClick={abrirFormulario}>+ Agregar otra dirección</button>
                                        )}
                                        {errorDireccion && <span className="form-error-text">{MSJ_SIN_DIRECCION}</span>}
                                    </section>

                                    <section className={`ped-tarjeta${errorPago ? ' con-error' : ''}`} aria-label="Método de pago">
                                        <h2 className="ped-tarjeta-titulo">Método de pago</h2>
                                        <div className="ped-opciones" role="radiogroup" aria-label="Método de pago" aria-invalid={errorPago}>
                                            {METODOS.map((m) => (
                                                <button
                                                    key={m.clave} type="button" role="radio" aria-checked={metodo === m.clave}
                                                    className={`ped-opcion${metodo === m.clave ? ' seleccionada' : ''}`}
                                                    onClick={() => { setMetodo(m.clave); setErrorPago(false); setAviso((a) => (a?.texto === MSJ_SIN_PAGO ? null : a)); }}
                                                >
                                                    {metodo === m.clave ? <CircleCheck size={22} aria-hidden="true" className="ped-opcion-icono" /> : <Circle size={22} aria-hidden="true" className="ped-opcion-icono vacio" />}
                                                    <span className="ped-opcion-texto"><strong>{m.titulo}</strong><span>{m.detalle}</span></span>
                                                </button>
                                            ))}
                                        </div>
                                        {errorPago && <span className="form-error-text ped-error-pago">Selecciona una opción para continuar.</span>}
                                    </section>
                                </div>
                            </>
                        )}
                    </div>

                    <aside className="ped-columna-lateral" aria-label="Resumen de compra">
                        <section className="ped-tarjeta ped-resumen">
                            <h2 className="ped-tarjeta-titulo">Resumen de compra</h2>
                            {vacio ? (
                                <>
                                    <div className="ped-resumen-fila"><span>Subtotal · 0 productos</span><span>$ 0</span></div>
                                    <div className="ped-resumen-total"><span>Total COP</span><strong>$ 0</strong></div>
                                </>
                            ) : (
                                <>
                                    <p className="ped-resumen-cantidades">{resumenCantidades(productos, unidades)}</p>
                                    <div className="ped-resumen-fila"><span>Subtotal</span><span>{formatoCOP(subtotal)}</span></div>
                                    <div className="ped-resumen-fila"><span>Domicilio</span><span>{formatoCOP(domicilio)}</span></div>
                                    <div className="ped-resumen-total"><span>Total COP</span><strong>{formatoCOP(total)}</strong></div>
                                    <p className="ped-resumen-seguro">Compra segura. Frescura garantizada.</p>
                                </>
                            )}
                        </section>
                        <button type="button" className="ped-boton ped-boton-primario ped-boton-bloque" disabled={vacio || enviando} onClick={realizarPedido}>
                            {enviando ? 'Creando pedido…' : 'Realizar pedido'}
                        </button>
                        {vacio
                            ? <p className="ped-nota">El costo de entrega se calculará cuando agregues productos.</p>
                            : ultimoTope
                                ? <p className="ped-nota">El total corresponde a las {ultimoTope.stock} {ultimoTope.unidad} de {ultimoTope.nombre} disponibles. El intento de agregar otra unidad no modificó tu compra.</p>
                                : <p className="ped-nota">Al realizar tu pedido aceptas nuestros términos y condiciones. El domicilio está incluido en el total.</p>}
                        {!vacio && <Link to="/" className="ped-boton ped-boton-secundario ped-boton-bloque">Continuar comprando</Link>}
                    </aside>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default Carrito;

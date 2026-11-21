// src/pages/domiciliario/PerfilDomiciliario.jsx — E5: perfil del domiciliario
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, Mail, Phone, LogOut, PackageCheck, Truck, Package } from 'lucide-react';
import { Franja } from '../../components/pedidos/Estados';
import { obtenerPerfilDomiciliario, listarPedidosDomiciliario } from '../../utils/domicilios';
import { obtenerSesion, cerrarSesion } from '../../utils/auth';
import Avatar from '../../components/domiciliario/Avatar';
import '../../styles/variables.css';
import '../../styles/pedidos.css';
import '../../styles/domicilios.css';

function PerfilDomiciliario() {
    const navigate = useNavigate();
    const sesion = obtenerSesion();
    const [perfil, setPerfil] = useState(null);
    const [resumen, setResumen] = useState({ porRecoger: 0, enCamino: 0, entregadosHoy: 0 });
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelado = false;
        obtenerPerfilDomiciliario().then((r) => {
            if (cancelado) return;
            if (r.ok) setPerfil(r.data.domiciliario);
            else setError(r.data.mensaje || r.mensaje || 'No se pudo cargar tu perfil.');
        });
        listarPedidosDomiciliario('activos').then((r) => {
            if (!cancelado && r.ok) setResumen(r.data.resumen || {});
        });
        return () => { cancelado = true; };
    }, []);

    const datos = perfil || sesion || {};
    const nombre = datos.nombre || 'Domiciliario';

    const salir = () => {
        cerrarSesion();
        navigate('/login');
    };

    const actividad = [
        { etiqueta: 'Por recoger', valor: resumen.porRecoger ?? 0, Icono: Package },
        { etiqueta: 'En camino', valor: resumen.enCamino ?? 0, Icono: Truck },
        { etiqueta: 'Entregados hoy', valor: resumen.entregadosHoy ?? 0, Icono: PackageCheck }
    ];

    return (
        <div className="dom-pagina">
            <nav className="dom-migas" aria-label="Ruta de navegación">Inicio / Mi perfil</nav>
            <h1 className="dom-titulo">Mi perfil</h1>
            <p className="dom-subtitulo">Tus datos de domiciliario y tu actividad del día.</p>

            {error && <Franja tipo="error">{error}</Franja>}

            <section className="dom-perfil-hero" aria-label="Datos principales">
                <Avatar nombre={nombre} foto={datos.foto} className="dom-perfil-avatar" />
                <div className="dom-perfil-hero-texto">
                    <h2>{nombre}</h2>
                    <span className="dom-perfil-rol">Domiciliario</span>
                    <p><Bike size={15} aria-hidden="true" /> {datos.vehiculo || 'Vehículo no registrado'}</p>
                </div>
                <Link to="/domiciliario/pedidos" className="ped-boton ped-boton-secundario">Ver mis pedidos</Link>
            </section>

            <div className="dom-perfil-grid">
                <section className="ped-tarjeta" aria-label="Datos de contacto">
                    <h2 className="ped-tarjeta-titulo">Datos de contacto</h2>
                    <div className="dom-perfil-dato">
                        <Mail size={16} aria-hidden="true" />
                        <div><span>Correo</span><strong>{datos.correo || '—'}</strong></div>
                    </div>
                    <div className="dom-perfil-dato">
                        <Phone size={16} aria-hidden="true" />
                        <div><span>Teléfono</span><strong>{datos.telefono || '—'}</strong></div>
                    </div>
                    <div className="dom-perfil-dato">
                        <Bike size={16} aria-hidden="true" />
                        <div><span>Vehículo</span><strong>{datos.vehiculo || '—'}</strong></div>
                    </div>
                    <div className="dom-perfil-dato">
                        <PackageCheck size={16} aria-hidden="true" />
                        <div><span>Rol</span><strong>Domiciliario</strong></div>
                    </div>
                </section>

                <section className="ped-tarjeta" aria-label="Actividad de hoy">
                    <h2 className="ped-tarjeta-titulo">Tu actividad de hoy</h2>
                    <div className="dom-perfil-actividad">
                        {actividad.map(({ etiqueta, valor, Icono }) => (
                            <div key={etiqueta} className="dom-perfil-stat">
                                <span className="dom-perfil-stat-icono"><Icono size={18} /></span>
                                <span className="dom-perfil-stat-numero">{valor}</span>
                                <span className="dom-perfil-stat-etiqueta">{etiqueta}</span>
                            </div>
                        ))}
                    </div>
                    <p className="dom-total-nota" style={{ marginTop: 12 }}>
                        Estos números se actualizan solos mientras tienes esta página abierta.
                    </p>
                </section>
            </div>

            <section className="ped-tarjeta dom-perfil-sesion" aria-label="Sesión">
                <div>
                    <strong>Cerrar sesión</strong>
                    <p className="dom-total-nota" style={{ margin: 0 }}>Sal del portal del domiciliario en este dispositivo.</p>
                </div>
                <button type="button" className="ped-boton ped-boton-peligro" onClick={salir}>
                    <LogOut size={16} aria-hidden="true" /> Cerrar sesión
                </button>
            </section>
        </div>
    );
}

export default PerfilDomiciliario;

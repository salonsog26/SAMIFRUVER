import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';
import ProductTable from '../../components/admin/ProductTable';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { useProductos } from '../../context/ProductosContext';
import '../../styles/variables.css';

function ConsultarProductos() {
    const { productos, cargando, errorCarga, eliminarProducto } = useProductos();
    const location = useLocation();
    const navigate = useNavigate();

    const [busqueda, setBusqueda] = useState('');
    const [alerta, setAlerta] = useState(location.state?.alerta || null);
    const [productoAEliminar, setProductoAEliminar] = useState(null);

    useEffect(() => {
        if (location.state?.alerta) {
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const termino = busqueda.trim().toLowerCase();
    const resultados = termino
        ? productos.filter((producto) => producto.nombre.toLowerCase().includes(termino))
        : productos;

    const confirmarEliminar = async () => {
        try {
            await eliminarProducto(productoAEliminar.id);
            setAlerta({ tipo: 'exito', mensaje: 'Producto eliminado del catálogo' });
        } catch (error) {
            setAlerta({ tipo: 'error', mensaje: error.message });
        } finally {
            setProductoAEliminar(null);
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar />

            <main className="admin-main-container" style={{ position: 'relative' }}>
                <TopBar />

                {alerta && <Alert tipo={alerta.tipo} mensaje={alerta.mensaje} />}
                {errorCarga && <Alert tipo="error" mensaje={errorCarga} />}

                <section className="page-content">
                    <div className="page-header-row">
                        <div className="page-header">
                            <h1 className="page-title">Catálogo de productos</h1>
                            <p className="page-subtitle">
                                Busca un producto por nombre para ver stock, precio y estado. Desde aquí puedes actualizarlo o eliminarlo.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => navigate('/admin/productos/nuevo')}
                        >
                            Agregar producto
                        </button>
                    </div>

                    <div className={`search-container${termino ? ' search-container-active' : ''}`}>
                        <div className="search-icon-placeholder"></div>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar por nombre. Ej. Champiñón..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    {cargando ? (
                        <p style={{ color: '#8D6E63' }}>Cargando inventario...</p>
                    ) : resultados.length > 0 ? (
                        <ProductTable
                            productos={resultados}
                            onEliminar={setProductoAEliminar}
                        />
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon-bg">
                                <div className="empty-state-icon"></div>
                            </div>
                            <div className="empty-state-text-container">
                                <h2 className="empty-state-title">No existen coincidencias en el catálogo</h2>
                                <p className="empty-state-desc">
                                    Prueba buscando con palabras clave diferentes o verifica la ortografía del término.
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {productoAEliminar && (
                    <Modal
                        titulo="Eliminar producto"
                        mensaje={`¿Deseas eliminar "${productoAEliminar.nombre}" del catálogo? Esta acción no se puede deshacer.`}
                        textoConfirmar="Eliminar producto"
                        onConfirm={confirmarEliminar}
                        onCancel={() => setProductoAEliminar(null)}
                    />
                )}
            </main>
        </div>
    );
}

export default ConsultarProductos;

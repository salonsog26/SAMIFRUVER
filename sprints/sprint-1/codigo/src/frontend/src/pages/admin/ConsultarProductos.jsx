// src/pages/admin/ConsultarProductos.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';
import ProductTable from '../../components/admin/ProductTable';
import '../../styles/variables.css';

function ConsultarProductos() {
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Cargar productos del backend al montar el componente
    const obtenerInventario = async () => {
        try {
            const respuesta = await fetch('http://localhost:4000/api/productos');
            const data = await respuesta.json();
            setProductos(data);
            setCargando(false);
        } catch (error) {
            console.error('Error al cargar inventario:', error);
            setCargando(false);
        }
    };

    useEffect(() => {
        obtenerInventario();
    }, []);

    const eliminarProductoAPI = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

        try {
            const respuesta = await fetch(`http://localhost:4000/api/productos/${id}`, {
                method: 'DELETE'
            });
            if (respuesta.ok) {
                setProductos(productos.filter(p => p.id !== id));
            } else {
                alert('No se pudo eliminar el producto');
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    };

    const handleEditar = (id) => {
        navigate(`/admin/productos/editar/${id}`);
    };

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main-container">
                <TopBar />

                <section className="page-content">
                    <div className="page-header-row">
                        <div className="page-header">
                            <h1 className="page-title">Gestión de Inventario</h1>
                            <p className="page-subtitle">Administra los productos disponibles en SAMIFRUBER.</p>
                        </div>
                        <Link to="/admin/productos/nuevo" className="btn-primary-nav">
                            + Nuevo Producto
                        </Link>
                    </div>

                    {cargando ? (
                        <p style={{ color: '#8D6E63' }}>Cargando inventario...</p>
                    ) : (
                        <ProductTable
                            productos={productos}
                            onEditar={handleEditar}
                            onEliminar={eliminarProductoAPI}
                        />
                    )}
                </section>
            </main>
        </div>
    );
}

export default ConsultarProductos;

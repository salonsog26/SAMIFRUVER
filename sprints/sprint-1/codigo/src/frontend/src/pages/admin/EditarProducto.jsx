// src/pages/admin/EditarProducto.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';
import ProductForm from '../../components/forms/ProductForm';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import '../../styles/variables.css';

function EditarProducto() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nombre: '',
        precio: '',
        categoria: '',
        stock: ''
    });

    const [datosOriginales, setDatosOriginales] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [estadoEdicion, setEstadoEdicion] = useState(null); // 'exito' | 'advertencia' | 'error' | null
    const [mostrarModalDescarte, setMostrarModalDescarte] = useState(false);

    // 1. Cargar los datos reales del producto a editar
    useEffect(() => {
        fetch('http://localhost:4000/api/productos')
            .then((res) => res.json())
            .then((productos) => {
                const producto = productos.find((p) => p.id === Number(id));
                if (producto) {
                    setFormData(producto);
                    setDatosOriginales(producto);
                } else {
                    setEstadoEdicion('error');
                }
                setCargando(false);
            })
            .catch(() => {
                setEstadoEdicion('error');
                setCargando(false);
            });
    }, [id]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // 2. Enviar los cambios al backend mediante PUT
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Si no hubo ningún cambio respecto a los datos originales, avisamos y no llamamos al backend
        const sinCambios = datosOriginales && Object.keys(formData).every(
            (campo) => String(formData[campo]) === String(datosOriginales[campo])
        );
        if (sinCambios) {
            setEstadoEdicion('advertencia');
            return;
        }

        try {
            const respuesta = await fetch(`http://localhost:4000/api/productos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (respuesta.ok) {
                setEstadoEdicion('exito');
                setTimeout(() => {
                    navigate('/admin/productos'); // Regresa al listado para ver el cambio reflejado
                }, 1200);
            } else {
                setEstadoEdicion('error');
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            setEstadoEdicion('error');
        }
    };

    const handleCancelar = () => {
        const hayCambios = datosOriginales && !Object.keys(formData).every(
            (campo) => String(formData[campo]) === String(datosOriginales[campo])
        );

        if (hayCambios) {
            setMostrarModalDescarte(true);
        } else {
            navigate('/admin/productos');
        }
    };

    const handleConfirmarDescarte = () => {
        setFormData(datosOriginales);
        setMostrarModalDescarte(false);
        navigate('/admin/productos');
    };

    if (cargando) {
        return (
            <div className="admin-layout">
                <Sidebar />
                <main className="admin-main-container">
                    <TopBar />
                    <section className="page-content">
                        <p style={{ color: '#8D6E63' }}>Cargando producto...</p>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main-container">
                <TopBar />

                {estadoEdicion === 'exito' && (
                    <Alert tipo="exito" mensaje="Información del producto actualizada correctamente" />
                )}
                {estadoEdicion === 'advertencia' && (
                    <Alert tipo="advertencia" mensaje="No se detectaron cambios. Se mantiene la información intacta" />
                )}
                {estadoEdicion === 'error' && (
                    <Alert tipo="error" mensaje="Hubo un error al actualizar el producto." />
                )}

                <section className="page-content">
                    <div className="page-header">
                        <h1 className="page-title">Editar Producto</h1>
                        <p className="page-subtitle">Modifica los detalles del producto agrícola seleccionado en el inventario.</p>
                    </div>

                    <ProductForm
                        modoEdicion={true}
                        formData={formData}
                        onChange={handleChange}
                        onSubmit={handleSubmit}
                        onCancel={handleCancelar}
                    />
                </section>

                {mostrarModalDescarte && (
                    <Modal
                        titulo="Confirmar Descarte"
                        mensaje="¿Deseas descartar las modificaciones y mantener los datos originales?"
                        textoConfirmar="Descartar Cambios"
                        onConfirm={handleConfirmarDescarte}
                        onCancel={() => setMostrarModalDescarte(false)}
                    />
                )}
            </main>
        </div>
    );
}

export default EditarProducto;
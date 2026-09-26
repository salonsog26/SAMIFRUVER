import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';
import ProductForm from '../../components/forms/ProductForm';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { useProductos, validarProducto } from '../../context/ProductosContext';
import '../../styles/variables.css';

function EditarProducto() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { obtenerPorId, actualizarProducto, cargando } = useProductos();

    const producto = obtenerPorId(id);

    const [errores, setErrores] = useState({});
    const [alerta, setAlerta] = useState(null);
    const [datosPendientes, setDatosPendientes] = useState(null);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        setErrores({});
        setAlerta(null);
        setDatosPendientes(null);
    }, [id]);

    const sonIguales = (a, b) =>
        a.nombre.trim() === b.nombre.trim() &&
        String(a.precio) === String(b.precio) &&
        a.categoria === b.categoria &&
        String(a.stock) === String(b.stock) &&
        (a.unidad || 'lb') === (b.unidad || 'lb');

    const manejarGuardar = async (datosFormulario) => {
        const nuevosErrores = validarProducto(datosFormulario);
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) {
            setAlerta({ tipo: 'error', mensaje: 'Completa todos los campos antes de guardar.' });
            return;
        }

        if (sonIguales(producto, datosFormulario)) {
            setAlerta({
                tipo: 'advertencia',
                mensaje: 'No se detectaron cambios. La información del producto se mantiene igual.',
            });
            return;
        }

        setGuardando(true);
        try {
            await actualizarProducto(id, datosFormulario);
            navigate('/admin/productos', {
                state: {
                    alerta: {
                        tipo: 'exito',
                        mensaje: 'Información del producto actualizada correctamente',
                    },
                },
            });
        } catch (error) {
            setAlerta({ tipo: 'error', mensaje: error.message });
            setGuardando(false);
        }
    };

    const manejarCancelar = (datosFormulario) => {
        if (sonIguales(producto, datosFormulario)) {
            navigate('/admin/productos');
        } else {
            setDatosPendientes(datosFormulario);
        }
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

    if (!producto) {
        return (
            <div className="admin-layout">
                <Sidebar />
                <main className="admin-main-container">
                    <TopBar />
                    <section className="page-content">
                        <div className="empty-state">
                            <div className="empty-state-text-container">
                                <h2 className="empty-state-title">Producto no encontrado</h2>
                                <p className="empty-state-desc">
                                    El producto que intentas editar no existe en el catálogo.
                                </p>
                            </div>
                            <button type="button" className="btn-primary" onClick={() => navigate('/admin/productos')}>
                                Volver al catálogo
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main-container" style={{ position: 'relative' }}>
                <TopBar />

                {alerta && <Alert tipo={alerta.tipo} mensaje={alerta.mensaje} />}

                <section className="page-content">
                    <div className="page-header">
                        <h1 className="page-title">Actualizar producto</h1>
                        <p className="page-subtitle">
                            Modifica los datos de {producto.nombre}. Al guardar, volverás al catálogo con la información actualizada.
                        </p>
                    </div>

                    <ProductForm
                        key={producto.id}
                        modoEdicion={true}
                        datosIniciales={producto}
                        errores={errores}
                        onSubmit={manejarGuardar}
                        onCancel={manejarCancelar}
                    />
                </section>

                {datosPendientes && (
                    <Modal
                        titulo="Confirmar descarte"
                        mensaje="¿Desea descartar las modificaciones y mantener los datos originales?"
                        textoConfirmar="Descartar cambios"
                        onConfirm={() => navigate('/admin/productos')}
                        onCancel={() => setDatosPendientes(null)}
                    />
                )}
            </main>
        </div>
    );
}

export default EditarProducto;

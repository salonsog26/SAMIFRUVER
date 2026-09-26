import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';
import ProductForm from '../../components/forms/ProductForm';
import Alert from '../../components/ui/Alert';
import { useProductos, validarProducto } from '../../context/ProductosContext';
import '../../styles/variables.css';

function RegistrarProducto() {
    const navigate = useNavigate();
    const { productos, agregarProducto } = useProductos();
    const [errores, setErrores] = useState({});
    const [alerta, setAlerta] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const manejarGuardar = async (datosFormulario) => {
        const nuevosErrores = validarProducto(datosFormulario);
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) {
            setAlerta({ tipo: 'error', mensaje: 'Completa todos los campos antes de guardar.' });
            return;
        }

        const nombre = datosFormulario.nombre.trim().toLowerCase();
        const duplicado = productos.some((producto) => producto.nombre.trim().toLowerCase() === nombre);
        if (duplicado) {
            setAlerta({ tipo: 'error', mensaje: 'El producto ya existe. No se permite registro duplicado' });
            return;
        }

        setGuardando(true);
        try {
            await agregarProducto(datosFormulario);
            navigate('/admin/productos', {
                state: {
                    alerta: { tipo: 'exito', mensaje: 'Producto registrado exitosamente' },
                },
            });
        } catch (error) {
            setAlerta({ tipo: 'error', mensaje: error.message });
            setGuardando(false);
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main-container">
                <TopBar />

                {alerta && <Alert tipo={alerta.tipo} mensaje={alerta.mensaje} />}

                <section className="page-content">
                    <div className="page-header">
                        <h1 className="page-title">Registrar producto</h1>
                        <p className="page-subtitle">Agrega un nuevo producto agrícola al inventario. Al guardar, aparece en el catálogo.</p>
                    </div>

                    <ProductForm
                        modoEdicion={false}
                        datosIniciales={{}}
                        errores={errores}
                        onSubmit={manejarGuardar}
                        onCancel={() => navigate('/admin/productos')}
                    />
                </section>
            </main>
        </div>
    );
}

export default RegistrarProducto;


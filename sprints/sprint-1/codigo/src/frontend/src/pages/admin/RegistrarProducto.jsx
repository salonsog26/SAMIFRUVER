// src/pages/admin/RegistrarProducto.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';
import ProductForm from '../../components/forms/ProductForm';
import Alert from '../../components/ui/Alert';
import '../../styles/variables.css';

function RegistrarProducto() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nombre: '',
        precio: '',
        categoria: '',
        stock: ''
    });

    const [estadoRegistro, setEstadoRegistro] = useState(null); // 'exito' | 'error' | null

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Enviar datos al backend mediante POST
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const respuesta = await fetch('http://localhost:4000/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (respuesta.ok) {
                setEstadoRegistro('exito');
                setTimeout(() => {
                    navigate('/admin/productos'); // Regresa al listado para ver el cambio reflejado
                }, 1200);
            } else {
                setEstadoRegistro('error');
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            setEstadoRegistro('error');
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-main-container">
                <TopBar />

                {estadoRegistro === 'exito' && (
                    <Alert tipo="exito" mensaje="Producto registrado con éxito" />
                )}
                {estadoRegistro === 'error' && (
                    <Alert tipo="error" mensaje="Hubo un error al registrar el producto." />
                )}

                <section className="page-content">
                    <div className="page-header">
                        <h1 className="page-title">Registrar Producto</h1>
                        <p className="page-subtitle">Agrega un nuevo producto agrícola al inventario de distribución.</p>
                    </div>

                    <ProductForm
                        formData={formData}
                        onChange={handleChange}
                        onSubmit={handleSubmit}
                        onCancel={() => navigate('/admin/productos')}
                    />
                </section>
            </main>
        </div>
    );
}

export default RegistrarProducto;


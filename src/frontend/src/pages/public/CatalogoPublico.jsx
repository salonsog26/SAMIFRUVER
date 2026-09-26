// src/pages/public/CatalogoPublico.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import ProductCard from '../../components/public/ProductCard';
import '../../styles/variables.css';

function CatalogoPublico() {

    const [productosDestacados, setProductosDestacados] = useState([]);
    const [cargando, setCargando] = useState(true);


    useEffect(() => {
        fetch('http://localhost:4000/api/productos')
            .then((res) => res.json())
            .then((data) => {

                const productosMapeados = data.map(prod => ({
                    nombre: prod.nombre,
                    categoria: prod.categoria,
                    precio: `$${prod.precio.toLocaleString()} COP`,
                    unidad: prod.unidad || 'lb',
                    imagen: prod.imagen || 'https://placehold.co/280x220'
                }));
                setProductosDestacados(productosMapeados);
                setCargando(false);
            })
            .catch((error) => {
                console.error('Error al conectar con el backend:', error);
                setCargando(false);
            });
    }, []);

    return (
        <div className="public-page">
            <Navbar cartCount={0} />

            {/* Hero */}
            <section className="public-hero">
                <img
                    src="https://placehold.co/1200x340"
                    alt="Cosecha local"
                    className="public-hero-image"
                />
                <div className="public-hero-overlay" />
                <div className="public-hero-content">
                    <span className="public-hero-tag">COSECHA LOCAL · CALIDAD REAL</span>
                    <h1 className="public-hero-title">Del campo a tu puerta.<br />Frescura garantizada</h1>
                </div>
            </section>

            {/* Sección de productos */}
            <section className="public-products-section">
                <div className="public-products-header">
                    <div>
                        <h2 className="public-products-title">Productos frescos</h2>
                        <p className="public-products-subtitle">Seleccionados para tu mesa, directo de la cosecha.</p>
                    </div>
                    <a href="#todos" className="public-products-link">Ver todos los productos →</a>
                </div>

                {cargando ? (
                    <p style={{ padding: '20px', fontFamily: 'Inter', color: '#8D6E63' }}>Cargando productos de la cosecha...</p>
                ) : (
                    <div className="public-products-grid">
                        {productosDestacados.map((producto, index) => (
                            <ProductCard key={index} {...producto} />
                        ))}
                    </div>
                )}
            </section>

            <Footer />
        </div>
    );
}

export default CatalogoPublico;
// src/routes/AppRouter.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import CatalogoPublico from '../pages/public/CatalogoPublico';
import Login from '../pages/public/Login';

import ConsultarProductos from '../pages/admin/ConsultarProductos';
import RegistrarProducto from '../pages/admin/RegistrarProducto';
import EditarProducto from '../pages/admin/EditarProducto';

import RutaProtegida from './RutaProtegida';

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Catálogo principal (Puerta de entrada) */}
                <Route path="/" element={<CatalogoPublico />} />

                {/* Formularios de acceso */}
                <Route path="/login" element={<Login />} />

                {/* Vistas del Administrador (protegidas: requieren sesión iniciada) */}
                <Route
                    path="/admin/productos"
                    element={
                        <RutaProtegida>
                            <ConsultarProductos />
                        </RutaProtegida>
                    }
                />
                <Route
                    path="/admin/productos/nuevo"
                    element={
                        <RutaProtegida>
                            <RegistrarProducto />
                        </RutaProtegida>
                    }
                />
                <Route
                    path="/admin/productos/editar/:id"
                    element={
                        <RutaProtegida>
                            <EditarProducto />
                        </RutaProtegida>
                    }
                />

                {/* Atrapa cualquier URL mal escrita y muestra un mensaje amigable */}
                <Route path="*" element={<div style={{ textAlign: 'center', marginTop: '50px' }}><h2>404 - Página no encontrada</h2></div>} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;

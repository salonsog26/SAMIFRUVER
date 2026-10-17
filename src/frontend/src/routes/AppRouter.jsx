// src/routes/AppRouter.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import CatalogoPublico from '../pages/public/CatalogoPublico';
import Login from '../pages/public/Login';
import Registro from '../pages/public/Registro';
import Perfil from '../pages/public/Perfil';

import ConsultarProductos from '../pages/admin/ConsultarProductos';
import RegistrarProducto from '../pages/admin/RegistrarProducto';
import EditarProducto from '../pages/admin/EditarProducto';

import RutaProtegida from './RutaProtegida';

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<CatalogoPublico />} />

                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />

                <Route path="/perfil" element={<RutaProtegida rolRequerido="cliente"><Perfil /></RutaProtegida>} />

                <Route path="/admin/dashboard" element={<Navigate to="/admin/productos" replace />} />
                <Route path="/admin/productos" element={<RutaProtegida rolRequerido="admin"><ConsultarProductos /></RutaProtegida>} />
                <Route path="/admin/productos/nuevo" element={<RutaProtegida rolRequerido="admin"><RegistrarProducto /></RutaProtegida>} />
                <Route path="/admin/productos/editar/:id" element={<RutaProtegida rolRequerido="admin"><EditarProducto /></RutaProtegida>} />

                <Route path="*" element={<div style={{ textAlign: 'center', marginTop: '50px' }}><h2>404 - Página no encontrada</h2></div>} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;
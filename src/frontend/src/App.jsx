import React from 'react';
import AppRouter from './routes/AppRouter';
import { ProductosProvider } from './context/ProductosContext';

function App() {
    return (
        <ProductosProvider>
            <AppRouter />
        </ProductosProvider>
    );
}

export default App;
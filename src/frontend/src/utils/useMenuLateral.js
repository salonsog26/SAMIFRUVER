// src/utils/useMenuLateral.js — estado del menú lateral deslizable en móvil
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function useMenuLateral() {
    const [abierto, setAbierto] = useState(false);
    const { pathname } = useLocation();

    // Se cierra al cambiar de página y con la tecla Escape.
    useEffect(() => { setAbierto(false); }, [pathname]);
    useEffect(() => {
        if (!abierto) return undefined;
        const alTeclear = (e) => { if (e.key === 'Escape') setAbierto(false); };
        document.addEventListener('keydown', alTeclear);
        return () => document.removeEventListener('keydown', alTeclear);
    }, [abierto]);

    return { abierto, abrir: () => setAbierto(true), cerrar: () => setAbierto(false) };
}

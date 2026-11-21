// src/context/DomiciliarioAvisosContext.jsx — avisos del portal del domiciliario (pedido nuevo / cancelado)
// La campana del header muestra un punto verde mientras haya avisos sin leer.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const DomiciliarioAvisosContext = createContext(null);

export function DomiciliarioAvisosProvider({ children }) {
    const [avisos, setAvisos] = useState([]);

    const agregarAviso = useCallback((aviso) => {
        setAvisos((prev) => [{ ...aviso, id: `${Date.now()}-${Math.random()}`, leido: false }, ...prev].slice(0, 20));
    }, []);

    const marcarLeidos = useCallback(() => {
        setAvisos((prev) => prev.map((a) => ({ ...a, leido: true })));
    }, []);

    const valor = useMemo(() => ({
        avisos,
        haySinLeer: avisos.some((a) => !a.leido),
        agregarAviso,
        marcarLeidos
    }), [avisos, agregarAviso, marcarLeidos]);

    return <DomiciliarioAvisosContext.Provider value={valor}>{children}</DomiciliarioAvisosContext.Provider>;
}

export function useDomiciliarioAvisos() {
    const ctx = useContext(DomiciliarioAvisosContext);
    if (!ctx) throw new Error('useDomiciliarioAvisos debe usarse dentro de DomiciliarioAvisosProvider');
    return ctx;
}

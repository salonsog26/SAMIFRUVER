import { createContext, useContext } from 'react';

/**
 * Estado de visualización compartido con los nodos personalizados,
 * para no tener que reescribir los nodos (y perder sus posiciones) al cambiar de vista.
 */
export const MapContext = createContext({
  mode: 'business', // 'business' = Vista No-Técnica | 'technical' = Vista Técnica
  selectedId: null,
  relatedIds: new Set(),
  currentUser: null, // integrante elegido al entrar
  repoStatus: null, // contenido de public/repo-status.json (o null)
});

export const useMapContext = () => useContext(MapContext);

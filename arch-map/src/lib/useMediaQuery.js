import { useEffect, useState } from 'react';

/** true mientras la media query se cumpla; se actualiza al rotar o redimensionar. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * Tres formatos de pantalla:
 *  - phone   (< 640 px): panel como hoja inferior
 *  - tablet  (640–1023 px): panel como cajón lateral sobre el mapa
 *  - desktop (≥ 1024 px): panel fijo a la derecha
 */
export function useLayout() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTabletUp = useMediaQuery('(min-width: 640px)');
  if (isDesktop) return 'desktop';
  return isTabletUp ? 'tablet' : 'phone';
}

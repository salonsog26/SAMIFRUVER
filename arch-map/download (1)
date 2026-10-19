import { useEffect, useState } from 'react';

const DAY = 24 * 60 * 60 * 1000;
const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

/** "hace 3 días", "ayer", "hace 2 horas"… */
export function timeAgo(isoDate) {
  if (!isoDate) return '';
  const diff = new Date(isoDate).getTime() - Date.now();
  const abs = Math.abs(diff);
  if (abs < 60 * 1000) return 'hace un momento';
  if (abs < 60 * 60 * 1000) return rtf.format(Math.round(diff / 60000), 'minute');
  if (abs < DAY) return rtf.format(Math.round(diff / 3600000), 'hour');
  if (abs < 30 * DAY) return rtf.format(Math.round(diff / DAY), 'day');
  if (abs < 365 * DAY) return rtf.format(Math.round(diff / (30 * DAY)), 'month');
  return rtf.format(Math.round(diff / (365 * DAY)), 'year');
}

/** ¿Hubo cambios en esa carpeta en los últimos `days` días? */
export const isRecent = (isoDate, days = 7) =>
  Boolean(isoDate) && Date.now() - new Date(isoDate).getTime() < days * DAY;

/**
 * Carga public/repo-status.json (lo genera scripts/sync-repo.mjs en cada dev/build).
 * Si no existe, devuelve null y el mapa funciona sin datos de actividad.
 */
export function useRepoStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}repo-status.json`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && setStatus(data))
      .catch(() => !cancelled && setStatus(null));
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

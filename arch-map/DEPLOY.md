// Utilidades del equipo: nombre a mostrar, saludo, avatar y usuario guardado en la sesión.

const STORAGE_KEY = 'samifruver-map:user';

const AVATAR_COLORS = [
  'bg-amber-100 text-amber-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
  'bg-emerald-100 text-emerald-800',
  'bg-rose-100 text-rose-800',
];

/** Apodo si existe; si no, el primer nombre. */
export const displayName = (member) => member.nickname || member.name.split(' ')[0];

/** "Bienvenido, Les" · "Bienvenida, Micolita" · "Bienvenido, Samuel" */
export const greetingText = (member) => `${member.greeting || 'Bienvenido'}, ${displayName(member)}`;

export const initials = (member) =>
  member.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export const avatarColor = (team, member) => AVATAR_COLORS[team.indexOf(member) % AVATAR_COLORS.length];

/** Módulos cuyo responsable es este integrante. */
export const ownedModules = (architecture, member) =>
  member ? architecture.nodes.filter((n) => n.owner === member.name) : [];

/* La selección vive en sessionStorage: se pide al abrir el mapa y se recuerda al recargar la pestaña. */
export function loadUserId() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveUserId(id) {
  try {
    if (id) sessionStorage.setItem(STORAGE_KEY, id);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* almacenamiento no disponible: la app funciona igual */
  }
}

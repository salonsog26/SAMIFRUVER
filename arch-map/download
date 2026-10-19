// Paleta por capa. Las clases van completas (no interpoladas) para que Tailwind las detecte.
export const LAYERS = {
  negocio: {
    label: 'Negocio',
    dot: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-800',
    lane: 'bg-amber-50/70 border-amber-200/80',
    laneText: 'text-amber-700',
    minimap: '#f59e0b',
  },
  frontend: {
    label: 'Frontend',
    dot: 'bg-sky-500',
    chip: 'bg-sky-100 text-sky-800',
    lane: 'bg-sky-50/70 border-sky-200/80',
    laneText: 'text-sky-700',
    minimap: '#0ea5e9',
  },
  backend: {
    label: 'Backend',
    dot: 'bg-violet-500',
    chip: 'bg-violet-100 text-violet-800',
    lane: 'bg-violet-50/70 border-violet-200/80',
    laneText: 'text-violet-700',
    minimap: '#8b5cf6',
  },
  datos: {
    label: 'Datos',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-100 text-emerald-800',
    lane: 'bg-emerald-50/70 border-emerald-200/80',
    laneText: 'text-emerald-700',
    minimap: '#10b981',
  },
  calidad: {
    label: 'Calidad',
    dot: 'bg-slate-500',
    chip: 'bg-slate-200 text-slate-700',
    lane: 'bg-slate-100/70 border-slate-200',
    laneText: 'text-slate-600',
    minimap: '#64748b',
  },
};

// Lanes del JSON → capa (para reutilizar colores)
export const LANE_LAYER = {
  amber: 'negocio',
  sky: 'frontend',
  violet: 'backend',
  emerald: 'datos',
  slate: 'calidad',
};

// Estilo de cada tipo de relación
export const EDGE_KINDS = {
  flujo: { label: 'Flujo de negocio', color: '#d97706', dashed: false, animated: false, width: 2.25 },
  implementa: { label: 'Se implementa en', color: '#a8a29e', dashed: true, animated: false, width: 1.5 },
  dependencia: { label: 'Depende de', color: '#78716c', dashed: false, animated: false, width: 1.5 },
  api: { label: 'Llamada HTTP / datos', color: '#0284c7', dashed: true, animated: true, width: 1.75 },
  prueba: { label: 'Prueba', color: '#64748b', dashed: true, animated: false, width: 1.25 },
};

export const STATUS = {
  implementado: { label: 'Implementado', chip: 'bg-emerald-100 text-emerald-800' },
  planeado: { label: 'Planeado', chip: 'bg-stone-200 text-stone-600' },
};

export const TYPE_LABEL = {
  business: 'Negocio',
  technical: 'Técnico',
};

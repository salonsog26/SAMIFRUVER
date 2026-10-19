import { ArrowLeftRight, Briefcase, CodeXml, Info, Network } from 'lucide-react';
import { avatarColor, displayName, initials } from '../lib/team';

const OPTIONS = [
  { value: 'business', label: 'Vista No-Técnica', short: 'No técnica', icon: Briefcase },
  { value: 'technical', label: 'Vista Técnica', short: 'Técnica', icon: CodeXml },
];

/**
 * Barra superior: título, toggle de vista y usuario.
 * En celular se compacta: solo el logo, etiquetas cortas y el avatar (que también cambia de usuario).
 */
export default function TopBar({
  project,
  repo,
  mode,
  onModeChange,
  stats,
  team,
  currentUser,
  onSwitchUser,
  onOpenOverview, // solo en celular/tablet: abre el resumen del proyecto
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-stone-200 bg-white px-3 sm:h-16 sm:gap-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white">
          <Network className="h-[18px] w-[18px]" />
        </div>
        <div className="hidden min-w-0 leading-tight sm:block">
          <h1 className="truncate text-[15px] font-semibold text-stone-900">{project}</h1>
          <a
            href={repo}
            target="_blank"
            rel="noreferrer"
            className="hidden text-xs text-stone-500 hover:text-stone-800 hover:underline lg:block"
          >
            Mapa interactivo de arquitectura
          </a>
        </div>
      </div>

      {/* Toggle de vista */}
      <div
        role="radiogroup"
        aria-label="Tipo de vista"
        className="mx-auto flex shrink-0 rounded-xl border border-stone-200 bg-stone-100 p-1"
      >
        {OPTIONS.map(({ value, label, short, icon: Icon }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={label}
              onClick={() => onModeChange(value)}
              className={[
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:gap-2 sm:px-3.5 sm:text-sm',
                active ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800',
              ].join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="hidden items-center gap-4 text-xs text-stone-500 xl:flex">
        <span>
          <strong className="font-semibold text-stone-800">{stats.modules}</strong> módulos
        </span>
        <span>
          <strong className="font-semibold text-stone-800">{stats.implemented}</strong> implementados
        </span>
        <span>
          <strong className="font-semibold text-stone-800">{stats.planned}</strong> planeados
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2.5 sm:border-l sm:border-stone-200 sm:pl-4">
        {onOpenOverview && (
          <button
            type="button"
            onClick={onOpenOverview}
            aria-label="Resumen del proyecto"
            title="Resumen del proyecto"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
          >
            <Info className="h-[18px] w-[18px]" />
          </button>
        )}

        {currentUser && (
          <>
            {/* En celular el avatar es el botón para cambiar de usuario */}
            <button
              type="button"
              onClick={onSwitchUser}
              aria-label={`${currentUser.name}. Cambiar de usuario`}
              title={`${currentUser.name} · ${currentUser.role}`}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:pointer-events-none ${avatarColor(team, currentUser)}`}
            >
              {initials(currentUser)}
            </button>
            <span className="hidden text-sm text-stone-700 lg:inline">
              Hola, <strong className="font-semibold text-stone-900">{displayName(currentUser)}</strong>
            </span>
            <button
              type="button"
              onClick={onSwitchUser}
              title="Cambiar de usuario"
              aria-label="Cambiar de usuario"
              className="hidden rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 sm:block"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

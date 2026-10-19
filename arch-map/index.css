import { ArrowLeftRight, Briefcase, CodeXml, Network } from 'lucide-react';
import { avatarColor, displayName, initials } from '../lib/team';

const OPTIONS = [
  { value: 'business', label: 'Vista No-Técnica', icon: Briefcase },
  { value: 'technical', label: 'Vista Técnica', icon: CodeXml },
];

/** Barra superior: título del proyecto y el toggle de vista. */
export default function TopBar({ project, repo, mode, onModeChange, stats, team, currentUser, onSwitchUser }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-stone-200 bg-white px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-900 text-white">
          <Network className="h-[18px] w-[18px]" />
        </div>
        <div className="leading-tight">
          <h1 className="text-[15px] font-semibold text-stone-900">{project}</h1>
          <a
            href={repo}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-stone-500 hover:text-stone-800 hover:underline"
          >
            Mapa interactivo de arquitectura
          </a>
        </div>
      </div>

      {/* Toggle de vista */}
      <div
        role="radiogroup"
        aria-label="Tipo de vista"
        className="mx-auto flex rounded-xl border border-stone-200 bg-stone-100 p-1"
      >
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onModeChange(value)}
              className={[
                'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition',
                active ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="hidden items-center gap-4 text-xs text-stone-500 lg:flex">
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

      {currentUser && (
        <div className="flex items-center gap-2.5 border-l border-stone-200 pl-4">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(team, currentUser)}`}
            title={`${currentUser.name} · ${currentUser.role}`}
          >
            {initials(currentUser)}
          </span>
          <span className="hidden text-sm text-stone-700 md:inline">
            Hola, <strong className="font-semibold text-stone-900">{displayName(currentUser)}</strong>
          </span>
          <button
            type="button"
            onClick={onSwitchUser}
            title="Cambiar de usuario"
            aria-label="Cambiar de usuario"
            className="rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </header>
  );
}

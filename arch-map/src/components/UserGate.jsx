import { useEffect } from 'react';
import { ArrowRight, Network } from 'lucide-react';
import { avatarColor, displayName, greetingText, initials, ownedModules } from '../lib/team';

/** Pantalla inicial: elegir quién está usando el mapa. */
export function UserPicker({ team, project, onSelect }) {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-stone-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-900 text-white shadow-sm">
            <Network className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
            {project} · Mapa de arquitectura
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-stone-900">¿Quién eres?</h1>
          <p className="mt-2 text-sm text-stone-500">Elige tu nombre para entrar al mapa.</p>
        </div>

        <ul className="space-y-2">
          {team.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => onSelect(member.id)}
                className="group flex w-full items-center gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarColor(team, member)}`}
                >
                  {initials(member)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-stone-900">{member.name}</span>
                  <span className="block text-xs text-stone-500">{member.role}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-stone-700" />
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-xs text-stone-400">
          Solo personaliza la vista; no es un inicio de sesión.
        </p>
      </div>
    </div>
  );
}

/** Mensaje de bienvenida que aparece unos segundos sobre el mapa. */
export function WelcomeOverlay({ member, architecture, onDone }) {
  const count = ownedModules(architecture, member).length;

  useEffect(() => {
    const timer = setTimeout(onDone, 2400);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      role="status"
      onClick={onDone}
      className="welcome-overlay fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-stone-50/85 backdrop-blur-sm"
    >
      <div className="welcome-card px-6 text-center">
        <p className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          ¡{greetingText(member)}!
        </p>
        <p className="mt-4 text-sm text-stone-500 sm:text-base">
          {count > 0
            ? `Tienes ${count} ${count === 1 ? 'módulo' : 'módulos'} a cargo en el mapa, ${displayName(member)}.`
            : 'Explora la arquitectura de SAMIFRUVER.'}
        </p>
        <p className="mt-8 text-xs text-stone-400">Clic para continuar</p>
      </div>
    </div>
  );
}

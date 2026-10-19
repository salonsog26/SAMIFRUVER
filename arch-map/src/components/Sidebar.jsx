import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  ExternalLink,
  FolderGit2,
  FolderPlus,
  FolderX,
  GitCommitHorizontal,
  Layers,
  MousePointerClick,
  RefreshCw,
  User,
  Users,
  X,
} from 'lucide-react';
import { EDGE_KINDS, LAYERS, STATUS, TYPE_LABEL } from '../lib/theme';
import { getConnections } from '../lib/buildGraph';
import { timeAgo } from '../lib/repoStatus';

function Chip({ className, children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}>
      {children}
    </span>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{children}</h3>
  );
}

/* ---------- Estado de sincronización con el repositorio ---------- */
function RepoStatusCard({ architecture, repoStatus, mode }) {
  const isTechnical = mode === 'technical';

  if (!repoStatus || repoStatus.error) {
    return (
      <div className="flex gap-3 rounded-xl border border-stone-200 p-4 text-sm text-stone-500">
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
        <p>
          {repoStatus?.error
            ? 'No se pudo leer el repositorio en el último despliegue. El mapa muestra la estructura guardada.'
            : 'Aún no hay datos de actividad del repositorio.'}
          {isTechnical && (
            <span className="mt-1 block font-mono text-xs text-stone-400">
              {repoStatus?.error ?? 'Se generan con npm run sync (corre solo en dev y build).'}
            </span>
          )}
        </p>
      </div>
    );
  }

  const labelOf = (id) => architecture.nodes.find((n) => n.id === id)?.label ?? id;
  const { head, missing, unmapped } = repoStatus;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-stone-200 p-4">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <RefreshCw className="h-3.5 w-3.5" />
          Sincronizado {timeAgo(repoStatus.generatedAt)}
          {isTechnical && <span className="ml-auto font-mono text-[11px]">{repoStatus.source}</span>}
        </div>
        {head && (
          <a
            href={head.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block rounded-lg bg-stone-50 px-3 py-2 transition hover:bg-stone-100"
          >
            <span className="block truncate text-sm font-medium text-stone-800">{head.message}</span>
            <span className="mt-0.5 block text-xs text-stone-500">
              Último cambio del repo · {head.author} · {timeAgo(head.date)}
              {isTechnical && <span className="font-mono"> · {head.sha.slice(0, 7)}</span>}
            </span>
          </a>
        )}
      </div>

      {missing.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <div className="flex items-center gap-2 font-medium">
            <FolderX className="h-4 w-4" />
            {missing.length === 1 ? 'Un módulo apunta' : `${missing.length} módulos apuntan`} a una carpeta que ya no
            existe
          </div>
          <ul className="mt-2 list-inside list-disc text-xs">
            {missing.map((id) => (
              <li key={id}>{labelOf(id)}</li>
            ))}
          </ul>
        </div>
      )}

      {unmapped.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <FolderPlus className="h-4 w-4" />
            {unmapped.length === 1
              ? 'Hay una carpeta nueva que aún no está en el mapa'
              : `Hay ${unmapped.length} carpetas nuevas que aún no están en el mapa`}
          </div>
          <ul className="mt-2 space-y-0.5 font-mono text-xs">
            {unmapped.map((path) => (
              <li key={path}>{path}</li>
            ))}
          </ul>
        </div>
      )}

      {missing.length === 0 && unmapped.length === 0 && (
        <p className="flex items-center gap-2 px-1 text-xs text-emerald-700">
          <CircleCheck className="h-3.5 w-3.5" />
          El mapa coincide con la estructura del repositorio.
        </p>
      )}
    </div>
  );
}

/* ---------- Estado vacío: resumen del proyecto ---------- */
function Overview({ architecture, mode, currentUser, repoStatus }) {
  const { meta } = architecture;

  return (
    <div className="space-y-7 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{meta.project}</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{meta.summary}</p>
      </div>

      <div>
        <SectionTitle>Estado del repositorio</SectionTitle>
        <RepoStatusCard architecture={architecture} repoStatus={repoStatus} mode={mode} />
      </div>

      <div className="flex gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
        <p>
          Toca o haz clic en un módulo para ver su detalle. Puedes arrastrar los módulos y hacer zoom con la
          rueda del mouse o pellizcando la pantalla.
        </p>
      </div>

      {mode === 'technical' && (
        <div>
          <SectionTitle>Stack tecnológico</SectionTitle>
          <dl className="space-y-2.5 text-sm">
            {Object.entries(meta.stack).map(([area, items]) => (
              <div key={area}>
                <dt className="text-xs font-medium text-stone-500">{area}</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <Chip key={item} className="bg-stone-100 text-stone-700">
                      {item}
                    </Chip>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div>
        <SectionTitle>Capas</SectionTitle>
        <ul className="grid grid-cols-2 gap-2 text-sm text-stone-600">
          {Object.entries(LAYERS).map(([key, layer]) => (
            <li key={key} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${layer.dot}`} />
              {layer.label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <SectionTitle>Relaciones</SectionTitle>
        <ul className="space-y-2 text-sm text-stone-600">
          {Object.entries(EDGE_KINDS).map(([key, kind]) => (
            <li key={key} className="flex items-center gap-3">
              <svg width="34" height="8" aria-hidden="true">
                <line
                  x1="0"
                  y1="4"
                  x2="34"
                  y2="4"
                  stroke={kind.color}
                  strokeWidth="2"
                  strokeDasharray={kind.dashed ? '5 3' : undefined}
                />
              </svg>
              {kind.label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <SectionTitle>Equipo</SectionTitle>
        <ul className="space-y-2">
          {meta.team.map((member) => (
            <li key={member.name} className="flex items-center justify-between gap-3 text-sm">
              <span className={member.id === currentUser?.id ? 'font-semibold text-stone-900' : 'text-stone-800'}>
                {member.name}
                {member.id === currentUser?.id && <span className="font-normal text-stone-400"> (tú)</span>}
              </span>
              <span className="text-xs text-stone-500">{member.role}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-stone-400">{meta.ownershipNote}</p>
      </div>
    </div>
  );
}

/* ---------- Lista de conexiones (clic para navegar) ---------- */
function ConnectionList({ title, icon: Icon, edges, field, nodesById, mode, onSelect }) {
  if (edges.length === 0) return null;

  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <ul className="space-y-1.5">
        {edges.map((edge) => {
          const other = nodesById.get(edge[field]);
          if (!other) return null;
          const kind = EDGE_KINDS[edge.kind];
          const text = mode === 'technical' ? edge.techLabel ?? edge.label : edge.label;
          return (
            <li key={edge.id}>
              <button
                type="button"
                onClick={() => onSelect(other.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-stone-200 px-3 py-2 text-left transition hover:border-stone-300 hover:bg-stone-50"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: kind?.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-stone-800">{other.label}</span>
                  <span
                    className={`block truncate text-xs text-stone-500 ${mode === 'technical' ? 'font-mono' : ''}`}
                  >
                    {text}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Detalle del módulo seleccionado ---------- */
function NodeDetail({ node, architecture, mode, currentUser, repoStatus, onSelect, onClose }) {
  const repo = repoStatus?.nodes?.[node.id];
  const isMine = currentUser?.name === node.owner;
  const layer = LAYERS[node.layer] ?? LAYERS.calidad;
  const status = STATUS[node.status] ?? STATUS.implementado;
  const nodesById = new Map(architecture.nodes.map((n) => [n.id, n]));
  const { incoming, outgoing } = getConnections(architecture, node.id);
  const isTechnical = mode === 'technical';

  return (
    <div className="space-y-6 p-5 sm:p-6">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <Chip className={layer.chip}>{layer.label}</Chip>
            {TYPE_LABEL[node.type] !== layer.label && (
              <Chip className="bg-stone-100 text-stone-700">{TYPE_LABEL[node.type]}</Chip>
            )}
            <Chip className={status.chip}>{status.label}</Chip>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle"
              className="-mr-2 -mt-1 rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <h2 className="mt-3 text-xl font-semibold leading-tight text-stone-900">{node.label}</h2>
      </div>

      <div>
        <SectionTitle>{isTechnical ? 'Qué hace en el código' : 'Qué es'}</SectionTitle>
        <p className="text-[14.5px] leading-relaxed text-stone-700">
          {isTechnical ? node.techDesc : node.description}
        </p>
      </div>

      {isTechnical && (
        <div className="space-y-2.5">
          <SectionTitle>Ubicación en el repositorio</SectionTitle>
          <div className="flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2">
            <FolderGit2 className="h-4 w-4 shrink-0 text-stone-500" />
            <code className="truncate font-mono text-xs text-stone-700">{node.path}</code>
          </div>
          <a
            href={node.githubLink}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Ver en GitHub
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      {repo && !repo.exists && (
        <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <FolderX className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Esta carpeta ya no existe en el repositorio. Hay que actualizar este módulo en{' '}
            <code className="font-mono text-xs">architecture.json</code>.
          </p>
        </div>
      )}

      {repo?.lastCommit && (
        <div>
          <SectionTitle>Última actualización</SectionTitle>
          <a
            href={repo.lastCommit.url}
            target="_blank"
            rel="noreferrer"
            className="flex gap-3 rounded-xl border border-stone-200 p-3 transition hover:border-stone-300 hover:bg-stone-50"
          >
            <GitCommitHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
            <span className="min-w-0 leading-snug">
              {isTechnical ? (
                <>
                  <span className="line-clamp-2 text-sm font-medium text-stone-800">{repo.lastCommit.message}</span>
                  <span className="mt-0.5 block text-xs text-stone-500">
                    <span className="font-mono">{repo.lastCommit.sha.slice(0, 7)}</span> · {repo.lastCommit.author} ·{' '}
                    {timeAgo(repo.lastCommit.date)}
                  </span>
                </>
              ) : (
                <span className="text-sm text-stone-700">
                  Cambió {timeAgo(repo.lastCommit.date)}, por{' '}
                  <strong className="font-medium text-stone-900">{repo.lastCommit.author}</strong>
                </span>
              )}
            </span>
          </a>
        </div>
      )}

      <div>
        <SectionTitle>Responsable</SectionTitle>
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500">
            <User className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium text-stone-900">
              {node.owner}
              {isMine && <span className="font-normal text-stone-400"> (tú)</span>}
            </div>
            <div className="text-xs text-stone-500">{node.ownerRole}</div>
          </div>
        </div>
      </div>

      <ConnectionList
        title="Recibe de"
        icon={ArrowLeft}
        edges={incoming}
        field="source"
        nodesById={nodesById}
        mode={mode}
        onSelect={onSelect}
      />
      <ConnectionList
        title="Conecta con"
        icon={ArrowRight}
        edges={outgoing}
        field="target"
        nodesById={nodesById}
        mode={mode}
        onSelect={onSelect}
      />
    </div>
  );
}

/** Panel lateral derecho. */
const VARIANT_CLASS = {
  // Escritorio: columna fija a la derecha
  docked: 'w-[380px] shrink-0 border-l',
  // Tablet: cajón que se superpone al mapa por la derecha
  drawer: 'panel-drawer absolute inset-y-0 right-0 z-20 w-[min(380px,85vw)] border-l shadow-2xl',
  // Celular: hoja que sube desde abajo
  sheet:
    'panel-sheet fixed inset-x-0 bottom-0 z-30 max-h-[62dvh] rounded-t-2xl border-t shadow-[0_-12px_40px_rgba(28,25,23,0.18)] pb-[env(safe-area-inset-bottom)]',
};

/** Panel de información. `variant` cambia según el tamaño de pantalla. */
export default function Sidebar({
  architecture,
  selectedNode,
  mode,
  currentUser,
  repoStatus,
  onSelect,
  onClose,
  variant = 'docked',
}) {
  const floating = variant !== 'docked';

  return (
    <aside
      className={`flex flex-col border-stone-200 bg-white ${VARIANT_CLASS[variant]}`}
      aria-label={selectedNode ? 'Detalle del módulo' : 'Resumen del proyecto'}
    >
      {variant === 'sheet' && (
        <div className="flex shrink-0 justify-center pt-2" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-stone-300" />
        </div>
      )}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-stone-100 px-5 text-xs font-medium text-stone-500 sm:px-6">
        {selectedNode ? <Layers className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
        {selectedNode ? 'Detalle del módulo' : 'Resumen del proyecto'}
        <span className="ml-auto rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">
          {mode === 'technical' ? 'Vista Técnica' : 'Vista No-Técnica'}
        </span>
        {floating && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="-mr-2 flex h-8 w-8 items-center justify-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {selectedNode ? (
          <NodeDetail
            key={selectedNode.id}
            node={selectedNode}
            architecture={architecture}
            mode={mode}
            currentUser={currentUser}
            repoStatus={repoStatus}
            onSelect={onSelect}
            onClose={floating ? null : onClose}
          />
        ) : (
          <Overview architecture={architecture} mode={mode} currentUser={currentUser} repoStatus={repoStatus} />
        )}
      </div>
    </aside>
  );
}

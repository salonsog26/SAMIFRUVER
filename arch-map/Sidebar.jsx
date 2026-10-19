import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Briefcase, CodeXml, TriangleAlert } from 'lucide-react';
import { useMapContext } from '../context/MapContext';
import { isRecent, timeAgo } from '../lib/repoStatus';
import { LAYERS } from '../lib/theme';
import { NODE_WIDTH } from '../lib/buildGraph';

// Handles invisibles en los cuatro lados: solo sirven de anclaje para las flechas.
const HANDLE_CLASS = '!h-2 !w-2 !min-h-0 !min-w-0 !border-0 !bg-transparent';

function ModuleNode({ id, data }) {
  const { mode, selectedId, relatedIds, currentUser, repoStatus } = useMapContext();
  const layer = LAYERS[data.layer] ?? LAYERS.calidad;
  const repo = repoStatus?.nodes?.[id];
  const recent = isRecent(repo?.lastCommit?.date);
  const isMine = currentUser?.name === data.owner;

  const isSelected = selectedId === id;
  const isDimmed = Boolean(selectedId) && !relatedIds.has(id);
  const isPlanned = data.status === 'planeado';
  const TypeIcon = data.type === 'business' ? Briefcase : CodeXml;

  return (
    <div
      style={{ width: NODE_WIDTH }}
      className={[
        'group relative cursor-pointer rounded-xl border bg-white px-3.5 py-3 text-left shadow-sm transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-md',
        isPlanned ? 'border-dashed border-stone-300 bg-white/80' : 'border-stone-200',
        isSelected ? 'ring-2 ring-stone-900 ring-offset-2 ring-offset-stone-50 shadow-lg' : '',
        isDimmed ? 'opacity-35' : 'opacity-100',
      ].join(' ')}
    >
      <Handle id="t-top" type="target" position={Position.Top} className={HANDLE_CLASS} />
      <Handle id="t-left" type="target" position={Position.Left} className={HANDLE_CLASS} />
      <Handle id="t-right" type="target" position={Position.Right} className={HANDLE_CLASS} />
      <Handle id="t-bottom" type="target" position={Position.Bottom} className={HANDLE_CLASS} />

      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${layer.dot}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          {layer.label}
        </span>
        {isMine && (
          <span className="rounded-full bg-stone-900 px-1.5 py-px text-[9.5px] font-semibold text-white">Tú</span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          {repo && !repo.exists && (
            <TriangleAlert className="h-3.5 w-3.5 text-rose-500" aria-label="La carpeta ya no existe en el repositorio" />
          )}
          {recent && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              title={`Cambios recientes (${timeAgo(repo.lastCommit.date)})`}
            />
          )}
          <TypeIcon className="h-3.5 w-3.5 text-stone-400" aria-label={data.type} />
        </span>
      </div>

      <div className="mt-1.5 flex items-start gap-2">
        <h3 className="text-[13.5px] font-semibold leading-snug text-stone-900">{data.label}</h3>
        {isPlanned && (
          <span className="mt-0.5 shrink-0 rounded-full bg-stone-100 px-1.5 py-px text-[9.5px] font-medium text-stone-500">
            Planeado
          </span>
        )}
      </div>

      {mode === 'technical' ? (
        <code className="mt-1.5 block truncate font-mono text-[11px] text-stone-500" title={data.path}>
          {data.path}
        </code>
      ) : (
        <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-stone-500">{data.description}</p>
      )}

      <Handle id="s-top" type="source" position={Position.Top} className={HANDLE_CLASS} />
      <Handle id="s-left" type="source" position={Position.Left} className={HANDLE_CLASS} />
      <Handle id="s-right" type="source" position={Position.Right} className={HANDLE_CLASS} />
      <Handle id="s-bottom" type="source" position={Position.Bottom} className={HANDLE_CLASS} />
    </div>
  );
}

export default memo(ModuleNode);

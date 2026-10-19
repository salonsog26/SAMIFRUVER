import { memo } from 'react';
import { LAYERS, LANE_LAYER } from '../lib/theme';

/** Franja de fondo que agrupa visualmente una capa (no se arrastra ni se selecciona). */
function LaneNode({ data, width, height }) {
  const layer = LAYERS[LANE_LAYER[data.color]] ?? LAYERS.calidad;

  return (
    <div style={{ width, height }} className={`relative rounded-2xl border ${layer.lane}`}>
      <span
        className={`absolute left-5 top-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${layer.laneText}`}
      >
        {data.label}
      </span>
    </div>
  );
}

export default memo(LaneNode);

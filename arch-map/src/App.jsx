import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';

import architecture from './data/architecture.json';
import ModuleNode from './components/ModuleNode';
import LaneNode from './components/LaneNode';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { UserPicker, WelcomeOverlay } from './components/UserGate';
import { MapContext } from './context/MapContext';
import { NODE_WIDTH, buildEdges, buildInitialNodes } from './lib/buildGraph';
import { useRepoStatus } from './lib/repoStatus';
import { loadUserId, saveUserId } from './lib/team';
import { useLayout } from './lib/useMediaQuery';
import { LAYERS } from './lib/theme';

// Fuera del componente: se registran una sola vez (recomendación de React Flow).
const nodeTypes = { module: ModuleNode, lane: LaneNode };
const initialNodes = buildInitialNodes(architecture);
const team = architecture.meta.team;

const stats = {
  modules: architecture.nodes.length,
  implemented: architecture.nodes.filter((n) => n.status === 'implementado').length,
  planned: architecture.nodes.filter((n) => n.status === 'planeado').length,
};

function ArchitectureMap({ currentUser, onSwitchUser }) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [mode, setMode] = useState('business'); // 'business' | 'technical'
  const [selectedId, setSelectedId] = useState(null);
  const [overviewOpen, setOverviewOpen] = useState(false); // solo celular/tablet
  const repoStatus = useRepoStatus();
  const layout = useLayout(); // 'phone' | 'tablet' | 'desktop'
  const isDesktop = layout === 'desktop';
  const { setCenter, getZoom } = useReactFlow();

  // Los edges se recalculan con la posición actual de los nodos, la vista y la selección.
  const edges = useMemo(
    () => buildEdges({ architecture, nodes, mode, selectedId }),
    [nodes, mode, selectedId]
  );

  // Nodo seleccionado + sus vecinos directos (para atenuar el resto).
  const relatedIds = useMemo(() => {
    if (!selectedId) return new Set();
    const ids = new Set([selectedId]);
    architecture.edges.forEach((e) => {
      if (e.source === selectedId) ids.add(e.target);
      if (e.target === selectedId) ids.add(e.source);
    });
    return ids;
  }, [selectedId]);

  const selectedNode = useMemo(
    () => architecture.nodes.find((n) => n.id === selectedId) ?? null,
    [selectedId]
  );

  const contextValue = useMemo(
    () => ({ mode, selectedId, relatedIds, currentUser, repoStatus }),
    [mode, selectedId, relatedIds, currentUser, repoStatus]
  );

  /**
   * Centra la cámara en un módulo. En celular/tablet lo desplaza hacia la zona que
   * no tapa el panel (arriba de la hoja inferior, o a la izquierda del cajón).
   */
  const focusNode = useCallback(
    (id) => {
      const target = nodes.find((n) => n.id === id);
      if (!target) return;
      const zoom = Math.max(getZoom(), 0.85);
      let x = target.position.x + NODE_WIDTH / 2;
      let y = target.position.y + 50;
      if (layout === 'phone') y += (window.innerHeight * 0.62) / 2 / zoom;
      if (layout === 'tablet') x += Math.min(380, window.innerWidth * 0.85) / 2 / zoom;
      setCenter(x, y, { zoom, duration: 450 });
    },
    [nodes, getZoom, setCenter, layout]
  );

  const onNodeClick = useCallback(
    (_, node) => {
      if (node.type !== 'module') return;
      setSelectedId(node.id);
      setOverviewOpen(false);
      if (!isDesktop) focusNode(node.id); // en pantallas pequeñas el nodo se ve diminuto: acercar
    },
    [isDesktop, focusNode]
  );

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setOverviewOpen(false);
  }, []);

  // Selección desde el panel: además centra la cámara en el módulo.
  const selectAndFocus = useCallback(
    (id) => {
      setSelectedId(id);
      focusNode(id);
    },
    [focusNode]
  );

  const openOverview = useCallback(() => {
    setSelectedId(null);
    setOverviewOpen((open) => !open);
  }, []);

  const panelVisible = isDesktop || Boolean(selectedId) || overviewOpen;
  const panelVariant = { desktop: 'docked', tablet: 'drawer', phone: 'sheet' }[layout];

  // Escape cierra el detalle
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && clearSelection();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearSelection]);

  const sidebar = (variant) => (
    <Sidebar
      architecture={architecture}
      selectedNode={selectedNode}
      mode={mode}
      currentUser={currentUser}
      repoStatus={repoStatus}
      onSelect={selectAndFocus}
      onClose={clearSelection}
      variant={variant}
    />
  );

  return (
    <MapContext.Provider value={contextValue}>
      <div className="flex h-full flex-col">
        <TopBar
          project={architecture.meta.project}
          repo={architecture.meta.repo}
          mode={mode}
          onModeChange={setMode}
          stats={stats}
          team={team}
          currentUser={currentUser}
          onSwitchUser={onSwitchUser}
          onOpenOverview={isDesktop ? undefined : openOverview}
        />

        <div className="flex min-h-0 flex-1">
          <main className="relative min-w-0 flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onNodeClick={onNodeClick}
              onPaneClick={clearSelection}
              nodesDraggable
              nodesConnectable={false}
              elementsSelectable={false}
              edgesFocusable={false}
              deleteKeyCode={null}
              fitView
              fitViewOptions={{ padding: isDesktop ? 0.08 : 0.04 }}
              minZoom={0.1}
              maxZoom={1.75}
            >
              <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#d6d3d1" />
              <Controls showInteractive={false} position="bottom-left" />
              {layout !== 'phone' && (
                <MiniMap
                  position="bottom-right"
                  pannable
                  zoomable
                  maskColor="rgba(250, 250, 249, 0.75)"
                  nodeBorderRadius={6}
                  nodeColor={(n) => (n.type === 'lane' ? 'transparent' : LAYERS[n.data.layer]?.minimap ?? '#a8a29e')}
                  nodeStrokeColor={() => 'transparent'}
                  style={{ width: 180, height: 120 }}
                  className="!rounded-lg !border !border-stone-200 !shadow-sm"
                />
              )}
            </ReactFlow>

            {/* En tablet el cajón vive dentro del área del mapa */}
            {panelVisible && layout === 'tablet' && sidebar('drawer')}
          </main>

          {panelVisible && layout !== 'tablet' && sidebar(panelVariant)}
        </div>
      </div>
    </MapContext.Provider>
  );
}

export default function App() {
  const [userId, setUserId] = useState(() => {
    const saved = loadUserId();
    return team.some((m) => m.id === saved) ? saved : null;
  });
  const [showWelcome, setShowWelcome] = useState(false);
  const currentUser = team.find((m) => m.id === userId) ?? null;

  const selectUser = (id) => {
    saveUserId(id);
    setUserId(id);
    setShowWelcome(true);
  };

  const switchUser = () => {
    saveUserId(null);
    setUserId(null);
    setShowWelcome(false);
  };

  const hideWelcome = useCallback(() => setShowWelcome(false), []);

  if (!currentUser) {
    return <UserPicker team={team} project={architecture.meta.project} onSelect={selectUser} />;
  }

  return (
    <ReactFlowProvider>
      <ArchitectureMap currentUser={currentUser} onSwitchUser={switchUser} />
      {showWelcome && <WelcomeOverlay member={currentUser} architecture={architecture} onDone={hideWelcome} />}
    </ReactFlowProvider>
  );
}

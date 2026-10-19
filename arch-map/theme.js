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
  const repoStatus = useRepoStatus();
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

  const onNodeClick = useCallback((_, node) => {
    if (node.type === 'module') setSelectedId(node.id);
  }, []);

  const clearSelection = useCallback(() => setSelectedId(null), []);

  // Selección desde el sidebar: además centra la cámara en el módulo.
  const selectAndFocus = useCallback(
    (id) => {
      setSelectedId(id);
      const target = nodes.find((n) => n.id === id);
      if (target) {
        setCenter(target.position.x + NODE_WIDTH / 2, target.position.y + 50, {
          zoom: Math.max(getZoom(), 0.85),
          duration: 450,
        });
      }
    },
    [nodes, setCenter, getZoom]
  );

  // Escape cierra el detalle
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && clearSelection();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearSelection]);

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
              fitViewOptions={{ padding: 0.08 }}
              minZoom={0.2}
              maxZoom={1.75}
            >
              <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#d6d3d1" />
              <Controls showInteractive={false} position="bottom-left" />
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
            </ReactFlow>
          </main>

          <Sidebar
            architecture={architecture}
            selectedNode={selectedNode}
            mode={mode}
            currentUser={currentUser}
            repoStatus={repoStatus}
            onSelect={selectAndFocus}
            onClose={clearSelection}
          />
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

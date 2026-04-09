import { useState, useCallback, useEffect } from 'react';
import { ReactFlowProvider, useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import { defaultNodes, defaultEdges } from './data/defaultFlow';
import { loadFlow, clearFlow, useAutoSave } from './hooks/useFlowPersistence';
import { useHistory } from './hooks/useHistory';
import { useAuth } from './components/AuthProvider';
import { generateId, exportFlow } from './utils/helpers';
import './App.css';

function FlowApp() {
  const saved = loadFlow();
  const initNodes = saved?.nodes || defaultNodes;
  const initEdges = saved?.edges || defaultEdges;
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const { takeSnapshot, undo, redo, canUndo, canRedo } = useHistory(initNodes, initEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('tracer-dark-mode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const { user, signOut } = useAuth();
  const { getViewport, setViewport, screenToFlowPosition } = useReactFlow();
  const debouncedSave = useAutoSave();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('tracer-dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (saved?.viewport) {
      setViewport(saved.viewport);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerSave = useCallback(
    (viewport) => {
      setNodes((currentNodes) => {
        setEdges((currentEdges) => {
          debouncedSave(currentNodes, currentEdges, viewport || getViewport());
          return currentEdges;
        });
        return currentNodes;
      });
    },
    [debouncedSave, getViewport, setNodes, setEdges]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }) => {
      setSelectedNode(selectedNodes.length === 1 ? selectedNodes[0] : null);
    },
    []
  );

  const onNodeUpdate = useCallback(
    (nodeId, newData) => {
      takeSnapshot(nodes, edges);
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n))
      );
      setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data: newData } : prev));
      setTimeout(() => triggerSave(), 0);
    },
    [setNodes, triggerSave, takeSnapshot, nodes, edges]
  );

  const onNodeDelete = useCallback(
    (nodeId) => {
      takeSnapshot(nodes, edges);
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
      setTimeout(() => triggerSave(), 0);
    },
    [setNodes, setEdges, triggerSave, takeSnapshot, nodes, edges]
  );

  const onAddNode = useCallback(
    (type) => {
      takeSnapshot(nodes, edges);
      const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      const id = generateId();
      const defaults = {
        stepNode: { title: 'New step', subtitle: '', category: 'default' },
        decisionNode: { title: 'Decision?' },
        flagNode: { title: 'Open question', description: '' },
        annotationNode: { title: 'Note', text: '' },
      };
      const newNode = {
        id,
        type,
        position: { x: Math.round(center.x / 20) * 20, y: Math.round(center.y / 20) * 20 },
        data: defaults[type],
      };
      setNodes((nds) => [...nds, newNode]);
      setTimeout(() => triggerSave(), 0);
    },
    [setNodes, screenToFlowPosition, triggerSave, takeSnapshot, nodes, edges]
  );

  const handleUndo = useCallback(() => {
    const state = undo();
    if (!state) return;
    setNodes(state.nodes);
    setEdges(state.edges);
    setSelectedNode(null);
    setTimeout(() => triggerSave(), 0);
  }, [undo, setNodes, setEdges, triggerSave]);

  const handleRedo = useCallback(() => {
    const state = redo();
    if (!state) return;
    setNodes(state.nodes);
    setEdges(state.edges);
    setSelectedNode(null);
    setTimeout(() => triggerSave(), 0);
  }, [redo, setNodes, setEdges, triggerSave]);

  const handleExport = useCallback(() => {
    exportFlow(nodes, edges, getViewport());
  }, [nodes, edges, getViewport]);

  const handleImport = useCallback(
    (data) => {
      takeSnapshot(nodes, edges);
      setNodes(data.nodes);
      setEdges(data.edges);
      if (data.viewport) setViewport(data.viewport);
      setTimeout(() => triggerSave(), 0);
    },
    [setNodes, setEdges, setViewport, triggerSave, takeSnapshot, nodes, edges]
  );

  const handleReset = useCallback(() => {
    takeSnapshot(nodes, edges);
    clearFlow();
    setNodes(defaultNodes);
    setEdges(defaultEdges);
    setSelectedNode(null);
    setTimeout(() => triggerSave(), 0);
  }, [setNodes, setEdges, triggerSave, takeSnapshot, nodes, edges]);

  // Keyboard shortcuts: Cmd/Ctrl+Z = undo, Cmd/Ctrl+Shift+Z = redo
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  return (
    <div className="app">
      <Toolbar
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo()}
        canRedo={canRedo()}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
        user={user}
        onSignOut={signOut}
      />
      <div className="app-body">
        <Sidebar
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
          onNodeDelete={onNodeDelete}
          onAddNode={onAddNode}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
        <Canvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          onSave={triggerSave}
          setNodes={setNodes}
          setEdges={setEdges}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowApp />
    </ReactFlowProvider>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import Canvas from './Canvas';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import { useFlowPersistence } from '../hooks/useFlowPersistence';
import { useHistory } from '../hooks/useHistory';
import { useAuth } from './AuthProvider';
import { generateId, exportFlow } from '../utils/helpers';

export default function FlowEditor({ flowId, onGoHome }) {
  const { flowData, flowName, loading, error, save } = useFlowPersistence(flowId);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('tracer-dark-mode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const { user, signOut } = useAuth();
  const { getViewport, setViewport, screenToFlowPosition } = useReactFlow();
  const hasInitialized = useRef(false);

  // Initialize from flowData once loaded
  useEffect(() => {
    if (!flowData || hasInitialized.current) return;
    hasInitialized.current = true;
    setNodes(flowData.nodes || []);
    setEdges(flowData.edges || []);
    if (flowData.viewport) {
      setTimeout(() => setViewport(flowData.viewport), 0);
    }
  }, [flowData, setNodes, setEdges, setViewport]);

  // Reset initialization flag when flowId changes
  useEffect(() => {
    hasInitialized.current = false;
  }, [flowId]);

  const { takeSnapshot, undo, redo, canUndo, canRedo } = useHistory(
    flowData?.nodes || [],
    flowData?.edges || []
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('tracer-dark-mode', darkMode);
  }, [darkMode]);

  const triggerSave = useCallback(
    (viewport) => {
      setNodes((currentNodes) => {
        setEdges((currentEdges) => {
          save(currentNodes, currentEdges, viewport || getViewport());
          return currentEdges;
        });
        return currentNodes;
      });
    },
    [save, getViewport, setNodes, setEdges]
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
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setTimeout(() => triggerSave(), 0);
  }, [setNodes, setEdges, triggerSave, takeSnapshot, nodes, edges]);

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

  if (loading) {
    return <div className="auth-loading">Loading flow...</div>;
  }

  if (error) {
    return (
      <div className="auth-loading">
        <div style={{ textAlign: 'center' }}>
          <p>Failed to load flow</p>
          <button className="auth-btn" onClick={onGoHome}>Go home</button>
        </div>
      </div>
    );
  }

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
        onGoHome={onGoHome}
        flowName={flowName}
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
          setEdges={setEdges}
        />
      </div>
    </div>
  );
}

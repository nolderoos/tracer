import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import StepNode from './nodes/StepNode';
import DecisionNode from './nodes/DecisionNode';
import FlagNode from './nodes/FlagNode';
import AnnotationNode from './nodes/AnnotationNode';

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { strokeWidth: 1.5 },
  markerEnd: { type: 'arrowclosed', width: 14, height: 14 },
};

export default function Canvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onSelectionChange,
  onSave,
  setEdges,
}) {
  const nodeTypes = useMemo(
    () => ({
      stepNode: StepNode,
      decisionNode: DecisionNode,
      flagNode: FlagNode,
      annotationNode: AnnotationNode,
    }),
    []
  );

  const { getViewport } = useReactFlow();

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds));
    },
    [setEdges]
  );

  const handleChange = useCallback(
    (changes, handler) => {
      handler(changes);
      // Trigger save after state updates on next tick
      setTimeout(() => {
        onSave(getViewport());
      }, 0);
    },
    [onSave, getViewport]
  );

  return (
    <div className="canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => handleChange(changes, onNodesChange)}
        onEdgesChange={(changes) => handleChange(changes, onEdgesChange)}
        onConnect={(params) => {
          onConnect(params);
          setTimeout(() => onSave(getViewport()), 0);
        }}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid
        snapGrid={[20, 20]}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        selectionKeyCode={null}
      >
        <Background variant="dots" gap={20} size={1} />
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            if (node.type === 'flagNode') return '#E24B4A';
            if (node.type === 'decisionNode') return '#6366F1';
            return '#94A3B8';
          }}
          maskColor="rgba(0,0,0,0.08)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

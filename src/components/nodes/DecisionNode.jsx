import { Handle, Position } from '@xyflow/react';

export default function DecisionNode({ data, selected }) {
  return (
    <div className={`decision-node-wrapper${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="top" className="decision-handle-top" />
      <div className="decision-node">
        <div className="decision-node-inner">
          <span className="decision-node-label">{data.title}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Left} id="left" className="decision-handle-left" />
      <Handle type="source" position={Position.Right} id="right" className="decision-handle-right" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="decision-handle-bottom" />
    </div>
  );
}

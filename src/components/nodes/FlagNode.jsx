import { Handle, Position } from '@xyflow/react';

export default function FlagNode({ data, selected }) {
  return (
    <div className={`flag-node${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flag-node-header">
        <span className="flag-node-icon">&#9873;</span>
        <span className="flag-node-title">{data.title}</span>
      </div>
      {data.description && <div className="flag-node-desc">{data.description}</div>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

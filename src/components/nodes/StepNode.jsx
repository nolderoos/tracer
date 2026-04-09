import { Handle, Position } from '@xyflow/react';

export default function StepNode({ data, selected }) {
  return (
    <div className={`step-node${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="step-node-title">{data.title}</div>
      {data.subtitle && <div className="step-node-subtitle">{data.subtitle}</div>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

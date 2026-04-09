export default function AnnotationNode({ data }) {
  return (
    <div className="annotation-node">
      {data.title && <div className="annotation-node-title">{data.title}</div>}
      {data.text && <div className="annotation-node-text">{data.text}</div>}
    </div>
  );
}

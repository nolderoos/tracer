import { CATEGORY_COLORS } from '../utils/helpers';

const CATEGORIES = [
  { value: 'default', label: 'Default' },
  { value: 'process', label: 'Process' },
  { value: 'input', label: 'Input' },
  { value: 'output', label: 'Output' },
  { value: 'storage', label: 'Storage' },
  { value: 'external', label: 'External' },
];

export default function Sidebar({ selectedNode, onNodeUpdate, onNodeDelete, onAddNode, collapsed, onToggle }) {
  const handleChange = (field, value) => {
    if (!selectedNode) return;
    onNodeUpdate(selectedNode.id, { ...selectedNode.data, [field]: value });
  };

  const handleDelete = () => {
    if (!selectedNode) return;
    if (window.confirm(`Delete "${selectedNode.data.title}"?`)) {
      onNodeDelete(selectedNode.id);
    }
  };

  return (
    <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <button className="sidebar-toggle" onClick={onToggle}>
        {collapsed ? '\u276F' : '\u276E'}
      </button>

      {!collapsed && (
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3 className="sidebar-heading">Add node</h3>
            <div className="sidebar-add-buttons">
              <button className="add-btn add-step" onClick={() => onAddNode('stepNode')}>
                <span className="add-btn-icon">+</span> Step
              </button>
              <button className="add-btn add-decision" onClick={() => onAddNode('decisionNode')}>
                <span className="add-btn-icon">&#9670;</span> Decision
              </button>
              <button className="add-btn add-flag" onClick={() => onAddNode('flagNode')}>
                <span className="add-btn-icon">&#9873;</span> Flag
              </button>
              <button className="add-btn add-annotation" onClick={() => onAddNode('annotationNode')}>
                <span className="add-btn-icon">#</span> Note
              </button>
            </div>
          </div>

          {selectedNode && (
            <div className="sidebar-section">
              <h3 className="sidebar-heading">Edit node</h3>

              <label className="sidebar-label">Title</label>
              <input
                className="sidebar-input"
                value={selectedNode.data.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
              />

              {selectedNode.type === 'stepNode' && (
                <>
                  <label className="sidebar-label">Subtitle</label>
                  <input
                    className="sidebar-input"
                    value={selectedNode.data.subtitle || ''}
                    onChange={(e) => handleChange('subtitle', e.target.value)}
                  />

                  <label className="sidebar-label">Category</label>
                  <div className="sidebar-select-wrapper">
                    <select
                      className="sidebar-select"
                      value={selectedNode.data.category || 'default'}
                      onChange={(e) => handleChange('category', e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className="sidebar-category-dot"
                      style={{ background: CATEGORY_COLORS[selectedNode.data.category] }}
                    />
                  </div>
                </>
              )}

              {selectedNode.type === 'flagNode' && (
                <>
                  <label className="sidebar-label">Description</label>
                  <textarea
                    className="sidebar-textarea"
                    rows={4}
                    value={selectedNode.data.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                </>
              )}

              {selectedNode.type === 'annotationNode' && (
                <>
                  <label className="sidebar-label">Text</label>
                  <textarea
                    className="sidebar-textarea"
                    rows={4}
                    value={selectedNode.data.text || ''}
                    onChange={(e) => handleChange('text', e.target.value)}
                  />
                </>
              )}

              <button className="delete-btn" onClick={handleDelete}>
                Delete node
              </button>
            </div>
          )}

          {!selectedNode && (
            <div className="sidebar-section sidebar-hint">
              Click a node to edit it
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useRef } from 'react';
import { importFlow } from '../utils/helpers';

export default function Toolbar({ onExport, onImport, onReset, onUndo, onRedo, canUndo, canRedo, darkMode, onToggleDark }) {
  const fileRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await importFlow(file);
      onImport(data);
    } catch (err) {
      alert(err.message);
    }
    fileRef.current.value = '';
  };

  const handleReset = () => {
    if (window.confirm('Clear canvas? All changes will be lost.')) {
      onReset();
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-title">Tracer</div>
      <div className="toolbar-actions">
        <button className="toolbar-btn icon-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Cmd+Z)">&#8617;</button>
        <button className="toolbar-btn icon-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)">&#8618;</button>
        <span className="toolbar-sep" />
        <button className="toolbar-btn" onClick={handleReset}>Clear</button>
        <button className="toolbar-btn" onClick={onExport}>Export</button>
        <button className="toolbar-btn" onClick={() => fileRef.current.click()}>Import</button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <button className="toolbar-btn icon-btn" onClick={onToggleDark} title="Toggle dark mode">
          {darkMode ? '\u2600' : '\u263E'}
        </button>
      </div>
    </div>
  );
}

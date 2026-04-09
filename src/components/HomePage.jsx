import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import Toolbar from './Toolbar';
import { listFlows, listFolders, createFlow, createFolder, updateFlow, updateFolder, deleteFlow, deleteFolder } from '../lib/api';
import { timeAgo } from '../utils/helpers';

export default function HomePage({ onOpenFlow }) {
  const { user, signOut } = useAuth();
  const [flows, setFlows] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingFlowId, setEditingFlowId] = useState(null);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [menuFlowId, setMenuFlowId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('tracer-dark-mode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const editInputRef = useRef(null);
  const folderInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('tracer-dark-mode', darkMode);
  }, [darkMode]);

  const fetchData = useCallback(async () => {
    try {
      const [flowsData, foldersData] = await Promise.all([
        listFlows(activeFolder),
        listFolders(),
      ]);
      setFlows(flowsData);
      setFolders(foldersData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFolder]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuFlowId) return;
    const handler = () => setMenuFlowId(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [menuFlowId]);

  const handleNewFlow = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const folderId = activeFolder && activeFolder !== 'root' ? activeFolder : null;
      const flow = await createFlow('Untitled flow', folderId);
      onOpenFlow(flow.id);
    } catch (err) {
      console.error('Failed to create flow:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFlow = async (id) => {
    if (!window.confirm('Delete this flow? This cannot be undone.')) return;
    try {
      await deleteFlow(id);
      setFlows((f) => f.filter((flow) => flow.id !== id));
    } catch (err) {
      console.error('Failed to delete flow:', err);
    }
  };

  const handleRenameFlow = async (id, newName) => {
    setEditingFlowId(null);
    if (!newName.trim()) return;
    try {
      await updateFlow(id, { name: newName.trim() });
      setFlows((f) => f.map((flow) => flow.id === id ? { ...flow, name: newName.trim() } : flow));
    } catch (err) {
      console.error('Failed to rename flow:', err);
    }
  };

  const handleMoveFlow = async (flowId, folderId) => {
    setMenuFlowId(null);
    try {
      await updateFlow(flowId, { folder_id: folderId });
      setFlows((f) => f.map((flow) => flow.id === flowId ? { ...flow, folder_id: folderId } : flow));
    } catch (err) {
      console.error('Failed to move flow:', err);
    }
  };

  const handleNewFolder = async () => {
    try {
      const folder = await createFolder('New folder');
      setFolders((f) => [...f, folder].sort((a, b) => a.name.localeCompare(b.name)));
      setEditingFolderId(folder.id);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const handleRenameFolder = async (id, newName) => {
    setEditingFolderId(null);
    if (!newName.trim()) return;
    try {
      await updateFolder(id, newName.trim());
      setFolders((f) => f.map((folder) => folder.id === id ? { ...folder, name: newName.trim() } : folder).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Failed to rename folder:', err);
    }
  };

  const handleDeleteFolder = async (id) => {
    if (!window.confirm('Delete this folder? Flows inside will be moved to Unfiled.')) return;
    try {
      await deleteFolder(id);
      setFolders((f) => f.filter((folder) => folder.id !== id));
      if (activeFolder === id) setActiveFolder(null);
      // Refresh flows since some may have been moved to unfiled
      const flowsData = await listFlows(activeFolder === id ? null : activeFolder);
      setFlows(flowsData);
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  };

  const folderName = activeFolder && activeFolder !== 'root'
    ? folders.find((f) => f.id === activeFolder)?.name || 'Folder'
    : activeFolder === 'root' ? 'Unfiled' : 'All flows';

  return (
    <div className="home-page">
      <Toolbar
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
        user={user}
        onSignOut={signOut}
      />
      <div className="home-body">
        <div className="home-sidebar">
          <button
            className={`home-sidebar-item ${activeFolder === null ? 'active' : ''}`}
            onClick={() => setActiveFolder(null)}
          >
            All flows
          </button>
          <button
            className={`home-sidebar-item ${activeFolder === 'root' ? 'active' : ''}`}
            onClick={() => setActiveFolder('root')}
          >
            Unfiled
          </button>
          <div className="home-sidebar-divider" />
          {folders.map((folder) => (
            <div key={folder.id} className="home-sidebar-folder">
              {editingFolderId === folder.id ? (
                <input
                  ref={folderInputRef}
                  className="inline-edit-input home-sidebar-input"
                  defaultValue={folder.name}
                  autoFocus
                  onBlur={(e) => handleRenameFolder(folder.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameFolder(folder.id, e.target.value);
                    if (e.key === 'Escape') setEditingFolderId(null);
                  }}
                />
              ) : (
                <button
                  className={`home-sidebar-item ${activeFolder === folder.id ? 'active' : ''}`}
                  onClick={() => setActiveFolder(folder.id)}
                  onDoubleClick={() => setEditingFolderId(folder.id)}
                >
                  <span className="home-sidebar-folder-name">{folder.name}</span>
                  <span
                    className="home-sidebar-delete"
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                    title="Delete folder"
                  >
                    &times;
                  </span>
                </button>
              )}
            </div>
          ))}
          <button className="home-sidebar-item home-sidebar-add" onClick={handleNewFolder}>
            + New folder
          </button>
        </div>
        <div className="home-content">
          <h2 className="home-heading">{folderName}</h2>
          {loading ? (
            <div className="home-empty">
              <p className="home-empty-text">Loading...</p>
            </div>
          ) : flows.length === 0 && !creating ? (
            <div className="home-empty">
              <p className="home-empty-title">No flows yet</p>
              <p className="home-empty-text">Create your first flow to get started.</p>
              <button className="auth-btn" onClick={handleNewFlow}>New flow</button>
            </div>
          ) : (
            <div className="flow-grid">
              {flows.map((flow) => (
                <div
                  key={flow.id}
                  className="flow-card"
                  onClick={() => {
                    if (editingFlowId !== flow.id) onOpenFlow(flow.id);
                  }}
                >
                  {editingFlowId === flow.id ? (
                    <input
                      ref={editInputRef}
                      className="inline-edit-input"
                      defaultValue={flow.name}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => handleRenameFlow(flow.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameFlow(flow.id, e.target.value);
                        if (e.key === 'Escape') setEditingFlowId(null);
                      }}
                    />
                  ) : (
                    <div className="flow-card-name">{flow.name}</div>
                  )}
                  <div className="flow-card-meta">{timeAgo(flow.updated_at)}</div>
                  {activeFolder === null && flow.folder_id && (
                    <span className="flow-card-folder">
                      {folders.find((f) => f.id === flow.folder_id)?.name || ''}
                    </span>
                  )}
                  <button
                    className="flow-card-menu"
                    onClick={(e) => { e.stopPropagation(); setMenuFlowId(menuFlowId === flow.id ? null : flow.id); }}
                  >
                    &#8943;
                  </button>
                  {menuFlowId === flow.id && (
                    <div className="flow-dropdown" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="flow-dropdown-item"
                        onClick={() => { setMenuFlowId(null); setEditingFlowId(flow.id); }}
                      >
                        Rename
                      </button>
                      {folders.length > 0 && (
                        <>
                          <div className="flow-dropdown-label">Move to</div>
                          {flow.folder_id && (
                            <button
                              className="flow-dropdown-item"
                              onClick={() => handleMoveFlow(flow.id, null)}
                            >
                              Unfiled
                            </button>
                          )}
                          {folders.filter((f) => f.id !== flow.folder_id).map((f) => (
                            <button
                              key={f.id}
                              className="flow-dropdown-item"
                              onClick={() => handleMoveFlow(flow.id, f.id)}
                            >
                              {f.name}
                            </button>
                          ))}
                        </>
                      )}
                      <button
                        className="flow-dropdown-item flow-dropdown-item--danger"
                        onClick={() => { setMenuFlowId(null); handleDeleteFlow(flow.id); }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button className="flow-card new-flow-card" onClick={handleNewFlow} disabled={creating}>
                {creating ? 'Creating...' : '+ New flow'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

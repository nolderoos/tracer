import { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import HomePage from './components/HomePage';
import FlowEditor from './components/FlowEditor';
import { clearLegacyStorage } from './hooks/useFlowPersistence';
import './App.css';

function getFlowIdFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/flow\/([a-f0-9-]+)$/);
  return match ? match[1] : null;
}

export default function App() {
  const [flowId, setFlowId] = useState(getFlowIdFromHash);

  useEffect(() => { clearLegacyStorage(); }, []);

  useEffect(() => {
    const handler = () => setFlowId(getFlowIdFromHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const openFlow = useCallback((id) => {
    window.location.hash = `#/flow/${id}`;
  }, []);

  const goHome = useCallback(() => {
    window.location.hash = '';
  }, []);

  if (flowId) {
    return (
      <ReactFlowProvider>
        <FlowEditor flowId={flowId} onGoHome={goHome} />
      </ReactFlowProvider>
    );
  }

  return <HomePage onOpenFlow={openFlow} />;
}

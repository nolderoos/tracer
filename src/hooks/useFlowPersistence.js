import { useState, useCallback, useRef, useEffect } from 'react';
import { getFlow, saveFlowData } from '../lib/api';

const CACHE_PREFIX = 'tracer-flow-';

function cacheFlow(flowId, nodes, edges, viewport) {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${flowId}`,
      JSON.stringify({ nodes, edges, viewport })
    );
  } catch {
    // localStorage full or unavailable
  }
}

function getCachedFlow(flowId) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${flowId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLegacyStorage() {
  localStorage.removeItem('tracer');
}

export function useFlowPersistence(flowId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flowData, setFlowData] = useState(null);
  const [flowName, setFlowName] = useState('');
  const revisionRef = useRef(0);
  const timerRef = useRef(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!flowId) {
      setLoading(false);
      setFlowData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // Try cache first for instant render
    const cached = getCachedFlow(flowId);
    if (cached) {
      setFlowData({ nodes: cached.nodes, edges: cached.edges, viewport: cached.viewport });
    }

    getFlow(flowId)
      .then((flow) => {
        if (cancelled) return;
        revisionRef.current = flow.latestRevisionNumber;
        setFlowData(flow.data);
        setFlowName(flow.name);
        cacheFlow(flowId, flow.data.nodes, flow.data.edges, flow.data.viewport);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (cached) {
          setLoading(false);
        } else {
          setError(err.message || 'Failed to load flow');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [flowId]);

  const save = useCallback(
    (nodes, edges, viewport) => {
      if (!flowId) return;

      cacheFlow(flowId, nodes, edges, viewport);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (savingRef.current) return;
        savingRef.current = true;
        try {
          const newRev = await saveFlowData(
            flowId,
            { nodes, edges, viewport },
            revisionRef.current
          );
          revisionRef.current = newRev;
        } catch (err) {
          console.error('Auto-save failed:', err);
        } finally {
          savingRef.current = false;
        }
      }, 800);
    },
    [flowId]
  );

  return { flowData, flowName, loading, error, save };
}

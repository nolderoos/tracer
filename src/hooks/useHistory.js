import { useCallback, useRef } from 'react';

const MAX_HISTORY = 50;

export function useHistory(initialNodes, initialEdges) {
  const past = useRef([]);
  const future = useRef([]);
  const lastSnapshot = useRef(null);

  const takeSnapshot = useCallback((nodes, edges) => {
    const snap = JSON.stringify({ nodes, edges });
    // Skip if identical to last snapshot
    if (snap === lastSnapshot.current) return;
    if (lastSnapshot.current !== null) {
      past.current.push(lastSnapshot.current);
      if (past.current.length > MAX_HISTORY) past.current.shift();
    }
    lastSnapshot.current = snap;
    future.current = [];
  }, []);

  // Initialize with starting state
  if (lastSnapshot.current === null) {
    lastSnapshot.current = JSON.stringify({ nodes: initialNodes, edges: initialEdges });
  }

  const undo = useCallback(() => {
    if (past.current.length === 0) return null;
    future.current.push(lastSnapshot.current);
    const prev = past.current.pop();
    lastSnapshot.current = prev;
    return JSON.parse(prev);
  }, []);

  const redo = useCallback(() => {
    if (future.current.length === 0) return null;
    past.current.push(lastSnapshot.current);
    const next = future.current.pop();
    lastSnapshot.current = next;
    return JSON.parse(next);
  }, []);

  const canUndo = useCallback(() => past.current.length > 0, []);
  const canRedo = useCallback(() => future.current.length > 0, []);

  return { takeSnapshot, undo, redo, canUndo, canRedo };
}

import { useCallback, useRef } from 'react';

const STORAGE_KEY = 'tracer';

export function loadFlow() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveFlow(nodes, edges, viewport) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges, viewport }));
}

export function clearFlow() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useAutoSave() {
  const timerRef = useRef(null);

  const debouncedSave = useCallback((nodes, edges, viewport) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveFlow(nodes, edges, viewport);
    }, 500);
  }, []);

  return debouncedSave;
}

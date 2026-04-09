let counter = 0;

export function generateId() {
  counter += 1;
  return `node-${Date.now()}-${counter}`;
}

export function exportFlow(nodes, edges, viewport) {
  const data = JSON.stringify({ nodes, edges, viewport }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tracer-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importFlow(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.nodes || !data.edges) {
          reject(new Error('Invalid flow file: missing nodes or edges'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export const CATEGORY_COLORS = {
  default: '#6B7280',
  process: '#378ADD',
  input: '#1D9E75',
  output: '#639922',
  storage: '#7F77DD',
  external: '#EF9F27',
};

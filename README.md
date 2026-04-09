# Tracer

Fast, beautiful workflow diagrams. Open source.

Tracer is a browser-based diagram tool for mapping product flows, engineering architectures, marketing funnels, and anything else that connects. No sign-up required to start — just open and draw.

## Quick start

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Stack

- **Frontend:** React + Vite + [React Flow](https://reactflow.dev)
- **Backend:** Supabase (auth, database, realtime)
- **Hosting:** Vercel
- **License:** Open source

## Features

- Drag-and-drop nodes: steps, decisions, flags, annotations
- Connect nodes with animated smoothstep edges
- Undo/redo (Cmd+Z / Cmd+Shift+Z)
- Auto-save to localStorage
- Export/import as JSON
- Dark and light mode
- Snap-to-grid canvas with minimap

## Roadmap

- [ ] Supabase auth (magic link)
- [ ] Cloud persistence (flows + folders)
- [ ] Shareable links (read-only + editable)
- [ ] Real-time collaboration
- [ ] Templates library
- [ ] Auto-layout
- [ ] PNG/SVG export
- [ ] Interactive onboarding tour

## Contributing

Tracer is open source. PRs welcome.

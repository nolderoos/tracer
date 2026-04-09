# Tracer

A fast, open-source workflow diagram tool. Built with Vite + React + React Flow, deployed on Vercel with Supabase backend.

## Project overview

Tracer lets anyone map out flows — product workflows, engineering architectures, marketing funnels, user journeys. The core value: speed, developer-native feel, and beautiful output. Think Linear meets Miro, without the bloat.

**Domain:** tracerflow.app (pending)
**Stack:** Vite + React + @xyflow/react + Supabase + Vercel
**License:** Open source (free forever)

## Architecture

Currently a local-first SPA. Evolving toward:

```
Browser (React + React Flow)
  ├── Supabase Auth (magic link email)
  ├── Supabase DB (flows, folders, user prefs)
  ├── Supabase Realtime (live collaboration)
  └── Vercel (hosting, edge functions if needed)
```

## Commands

```bash
npm run dev      # Start dev server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## File structure

```
src/
├── App.jsx              # Main layout: toolbar + sidebar + canvas
├── App.css              # All styles + dark/light theme variables
├── main.jsx             # Entry point
├── components/
│   ├── Canvas.jsx       # React Flow wrapper
│   ├── Sidebar.jsx      # Left panel: add/edit nodes
│   ├── Toolbar.jsx      # Top bar: undo/redo, export, import, clear, dark mode
│   └── nodes/
│       ├── StepNode.jsx
│       ├── DecisionNode.jsx
│       ├── FlagNode.jsx
│       └── AnnotationNode.jsx
├── data/
│   └── defaultFlow.js   # Default empty state
├── hooks/
│   ├── useFlowPersistence.js  # localStorage save/load
│   └── useHistory.js          # Undo/redo stack
└── utils/
    └── helpers.js        # ID gen, export/import, category colors
```

## Design direction

- Linear / Supabase / Vercel "motion" aesthetic — modern, clean, not sterile
- No AI-generated-looking design (no weird thick borders, no generic capitals)
- System font stack, subtle shadows, category colors as accents
- Dark and light mode, respect system preference
- Should look sharp enough to screenshare in a client call

## Node types

1. **stepNode** — Process step with title, subtitle, category color
2. **decisionNode** — Diamond-shaped branch point with left/right/bottom outputs
3. **flagNode** — Open question / blocker (red accent)
4. **annotationNode** — Floating note, dashed border, no handles

## Categories (step node colors)

- default (#6B7280) — gray
- process (#378ADD) — blue
- input (#1D9E75) — teal
- output (#639922) — green
- storage (#7F77DD) — purple
- external (#EF9F27) — amber

## Code style

- Plain JSX, no TypeScript (for now)
- No heavy UI frameworks — plain CSS with custom properties for theming
- Minimal dependencies: only @xyflow/react beyond Vite defaults
- No over-engineering. Ship fast, iterate.

## Key decisions

- localStorage persistence with 500ms debounced auto-save
- Undo/redo via snapshot history (50 levels), Cmd+Z / Cmd+Shift+Z
- Snap to 20px grid
- Edges: smoothstep with animated dots and arrow markers

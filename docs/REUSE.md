# Reuse masterclass

The goal is maximum reuse with minimum abstraction.

## Frontend — three layers only

1. **Tokens** (`packages/design/tokens`) — colour, type, space  
2. **Primitives** (`packages/design/primitives`) — `.ah-btn`, `.ah-input`, …  
3. **Shells** (`packages/design/shells`) — full page HTML skeletons  

Any runtime (Hub HTML, TS Worker, Python Worker, static) imports the same `ah.css` (+ optional `ah.js`).  
React is optional and hub-only if you add it later. Prefer HTML.

**Rule:** a new project is on-brand after copying `ah.css` and picking a shell. No design decisions.

## Backend — contracts, not a mega-framework

| Package | Role |
| --- | --- |
| `@ah/contract` | `ProjectMeta`, `HealthResponse`, `RunRequest` — one vocabulary |
| `@ah/worker-kit` | security headers, `json`/`html`, tiny CORS helper |

Auth lives **only on the hub**. Projects do not implement login in v1.

**Rule:** reuse shapes and 3–5 helpers; isolate by deployment.

## Adding a UI piece

1. Add a class to `primitives.css` (or a tiny helper in `ah.js`).  
2. Use it in a shell if it is page-level.  
3. Sync into hub/public via `npm run sync:design -w @ah/hub`.  
4. Do not add a component library.

See mockups in `docs/design/`.

# Sandbox rules (free tier)

## Guarantees

Each project Worker is a separate V8 isolate. Without shared bindings, project code cannot read hub memory, D1, or secrets.

## Required defaults

- Own Worker name + Custom Domain
- `risk` declared in registry
- Security headers from `@ah/worker-kit` (or copy)
- No secrets in git

## Residual risks

- **Shared 100k req/day** — a runaway project can 429 the account
- **Experimental labs** that evaluate code — keep constrained; prefer client-side or paid Sandbox later
- **Embedding** — if the hub iframes a project, use `sandbox` + strict CSP

## When to pay

| Need | Product |
| --- | --- |
| Run arbitrary untrusted Linux/Python freely | Cloudflare Sandbox / Containers (Workers Paid ~$5+) |
| Unlimited project scripts + dispatch | Workers for Platforms (~$25) |

## Python Workers note

Use `async def on_fetch(request, env)` as the entrypoint (see `_template-python`). The class-based `WorkerEntrypoint`/`fetch` form currently fails with `Method on_fetch does not exist` under Wrangler 4.x + local Pyodide. Keep Python Workers small — startup must stay under ~1s.

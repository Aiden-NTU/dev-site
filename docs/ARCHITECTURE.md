# Architecture

Advanced platform, boring code. The site has two kinds of deployable things:

1. **Hub** (`apps/hub`) — `aidenhawkins.dev`  
   Catalog, auth, learning vault. Trusted. Owns D1.
2. **Projects** (`projects/...`) — nested Custom Domains  
   One Cloudflare Worker each. Isolated. No hub secrets.

```
visitor → hub Worker → D1 (auth/progress)
visitor → project Worker (own subdomain) → own logic only
hub ──links──▶ project URLs   (never executes project code)
```

## URL scheme

`{project}.{subgroup}.{group}.aidenhawkins.dev`

Nested SSL works on the free plan **only** when the hostname is attached as a **Worker Custom Domain** (Wrangler `custom_domain = true`). Plain DNS + Universal SSL covers only one subdomain level.

## Free-tier limits (know these)

| Resource | Free allotment |
| --- | --- |
| Workers | 100 scripts |
| Custom domains / zone | 100 |
| Requests | 100k / day **shared** across all Workers |
| D1 | 5GB, daily read/write caps |

Noisy projects can burn the shared request budget. They cannot read hub D1 or cookies if you follow `SANDBOX.md`.

## What we deliberately do not use (yet)

- **Workers for Platforms** ($25/mo) — unlimited user Workers
- **Sandbox / Containers** (Workers Paid) — true Linux isolation for arbitrary code

Isolation today = **separate Workers + Custom Domains + no shared bindings**.

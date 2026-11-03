# aidenhawkins.dev

Course encyclopedia: a trusted **hub** plus **sandboxed project Workers** on nested subdomains.

```
{project}.{subgroup}.{group}.aidenhawkins.dev
```

## Quick start

```bash
cp .env.example .env   # CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN
npm install
npm run dev:hub
```

Deploy hub:

```bash
npm run deploy:hub
```

New project:

```bash
npm run create-project -- --group cs --subgroup programming --name my-lab --template ts
```

## Docs

- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [REUSE.md](docs/REUSE.md)
- [NEW_PROJECT.md](docs/NEW_PROJECT.md)
- [SANDBOX.md](docs/SANDBOX.md)
- [LEARNING_VAULT.md](docs/LEARNING_VAULT.md)
- Design targets: [docs/design/](docs/design/)

## Design kit

No shadcn. Tiny in-house kit in `packages/design` (tokens → primitives → shells). IBM Plex, white canvas, one blue accent.

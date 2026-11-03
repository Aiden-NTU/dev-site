# New project checklist

```bash
npm run create-project -- \
  --group cs \
  --subgroup programming \
  --name my-lab \
  --template ts \
  --title "My Lab" \
  --summary "What this teaches"
```

Templates: `ts` | `python` | `static`

Then:

1. Open `projects/<group>/<subgroup>/<name>/`
2. Confirm `wrangler.toml` Custom Domain hostname
3. Implement the project (keep using `ah.css` shells)
4. Set `risk` in `project.toml` / registry: `static` | `trusted` | `experimental`
5. Deploy: `npx wrangler deploy` from the project folder
6. Confirm the hub catalog lists it (`registry/projects.json` was updated by the CLI)
7. Redeploy the hub if you want the catalog live immediately: `npm run deploy:hub`

### DNS / SSL

Do **not** create the nested DNS record yourself. Wrangler Custom Domains create DNS + certificate.

### Forbidden

- Hub D1 binding
- Hub service binding
- Sharing `BETTER_AUTH_SECRET`
- Cookie `Domain=.aidenhawkins.dev` on project Workers

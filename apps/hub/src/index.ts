import { Hono } from "hono";
import { html, json, withSecurityHeaders } from "@ah/worker-kit";
import type { Env } from "./env";
import { layout, escapeHtml } from "./lib/layout";
import { getProject, getRegistry, listProjects, projectsByReleased } from "./lib/registry";
import { LEARN_INDEX, getLearnDoc } from "./lib/learn";
import { renderMarkdown } from "./lib/markdown";
import { analyticsSummary, recordHit } from "./lib/analytics";

type AppEnv = { Bindings: Env };

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  await next();
  if (c.res.headers.get("content-type")?.includes("text/html")) {
    c.res = withSecurityHeaders(c.res);
  }
});

app.post("/api/analytics/hit", async (c) => {
  let body: { path?: string; title?: string; projectId?: string | null } = {};
  try {
    body = await c.req.json();
  } catch {
    return json({ ok: false }, { status: 400 });
  }
  const country =
    (c.req.raw.cf && typeof c.req.raw.cf === "object" && "country" in c.req.raw.cf
      ? String((c.req.raw.cf as { country?: string }).country || "")
      : "") || c.req.header("cf-ipcountry") || "XX";

  await recordHit(c.env, {
    path: body.path || "/",
    title: body.title,
    projectId: body.projectId,
    country,
  });
  return json({ ok: true });
});

app.get("/api/analytics/summary", async (c) => {
  const summary = await analyticsSummary(c.env);
  return json(summary);
});

app.get("/", async (c) => {
  const released = projectsByReleased(8);
  const topRows = await c.env.DB.prepare(
    `SELECT project_id, views FROM project_views ORDER BY views DESC LIMIT 8`,
  ).all<{ project_id: string; views: number }>();

  const mostViewed = (topRows.results ?? [])
    .map((row) => {
      const p = getProject(row.project_id);
      if (!p) return "";
      return `<li data-home-row="${escapeHtml(`${p.title} ${p.id} ${p.summary}`)}">
        <a href="${escapeHtml(p.url)}" data-recent-link data-recent-title="${escapeHtml(p.title)}" data-project-id="${escapeHtml(p.id)}">
          ${escapeHtml(p.title)}
          <span class="ah-col-meta">${row.views} views · ${escapeHtml(p.group)}/${escapeHtml(p.subgroup)}</span>
        </a>
      </li>`;
    })
    .filter(Boolean)
    .join("");

  const releasedHtml = released
    .map(
      (p) => `<li data-home-row="${escapeHtml(`${p.title} ${p.id} ${p.summary}`)}">
        <a href="${escapeHtml(p.url)}" data-recent-link data-recent-title="${escapeHtml(p.title)}" data-project-id="${escapeHtml(p.id)}">
          ${escapeHtml(p.title)}
          <span class="ah-col-meta">${escapeHtml(p.released ?? "")} · ${escapeHtml(p.runtime)}</span>
        </a>
      </li>`,
    )
    .join("");

  const body = `
    <h1 class="ah-home-title">aidenhawkins.dev</h1>
    <div class="ah-hero-search">
      <input id="ah-hero-search" type="search" placeholder="Search projects…" aria-label="Search projects" />
      <kbd>⌘K</kbd>
    </div>
    <div class="ah-columns">
      <section>
        <h2 class="ah-col-title">Most viewed</h2>
        ${mostViewed ? `<ul class="ah-col-list">${mostViewed}</ul>` : `<div class="ah-empty">Views will appear as people open projects.</div>`}
      </section>
      <section>
        <h2 class="ah-col-title">Recently released</h2>
        <ul class="ah-col-list">${releasedHtml}</ul>
      </section>
      <section>
        <h2 class="ah-col-title">Your recents</h2>
        <div id="ah-home-recents"></div>
      </section>
    </div>
    <div class="ah-analytics">
      <section class="ah-card">
        <div class="ah-card-head"><h2>Visitors</h2></div>
        <div class="ah-card-body" id="ah-world-map"></div>
      </section>
      <section class="ah-card">
        <div class="ah-card-head"><h2>Traffic</h2></div>
        <div class="ah-card-body" id="ah-traffic"></div>
      </section>
    </div>`;

  return html(
    layout({
      title: "Home",
      body,
      current: "home",
      wide: true,
      track: { path: "/", title: "Home" },
    }),
  );
});

app.get("/projects", async (c) => {
  const q = c.req.query("q") ?? "";
  const group = c.req.query("group") ?? "";
  const subgroup = c.req.query("subgroup") ?? "";
  const projects = listProjects({
    q,
    group: group || undefined,
    subgroup: subgroup || undefined,
  });

  const rows = projects
    .map(
      (p) => `<li class="ah-list-row" data-home-row="${escapeHtml([p.id, p.title, p.group, p.subgroup, p.summary].join(" "))}">
        <div>
          <a href="${escapeHtml(p.url)}" data-recent-link data-recent-title="${escapeHtml(p.title)}" data-project-id="${escapeHtml(p.id)}"><strong>${escapeHtml(p.title)}</strong></a>
          <div class="ah-col-meta">${escapeHtml(p.group)} / ${escapeHtml(p.subgroup)}</div>
        </div>
      </li>`,
    )
    .join("");

  const body = `
    <h1>Projects</h1>
    <form method="get" class="ah-hero-search" style="max-width:28rem;margin:0 0 1.5rem">
      ${group ? `<input type="hidden" name="group" value="${escapeHtml(group)}" />` : ""}
      ${subgroup ? `<input type="hidden" name="subgroup" value="${escapeHtml(subgroup)}" />` : ""}
      <input class="ah-input" style="border-radius:var(--ah-radius);min-height:2.4rem;padding:0.55rem 0.85rem;width:100%;border:var(--ah-border)" type="search" name="q" value="${escapeHtml(q)}" placeholder="Filter…" />
    </form>
    <ul class="ah-col-list">${rows || `<li><div class="ah-empty" style="border:0">No matches.</div></li>`}</ul>`;

  return html(
    layout({
      title: "Projects",
      body,
      current: "projects",
      track: { path: "/projects", title: "Projects" },
    }),
  );
});

app.get("/learn", async (c) => {
  const byGroup = new Map<string, typeof LEARN_INDEX>();
  for (const doc of LEARN_INDEX) {
    const list = byGroup.get(doc.group) ?? [];
    list.push(doc);
    byGroup.set(doc.group, list);
  }

  const side = [...byGroup.entries()]
    .map(([group, docs]) => {
      const links = docs.map((d) => `<a href="/learn/${escapeHtml(d.id)}">${escapeHtml(d.title)}</a>`).join("");
      return `<div class="ah-nav-section">${escapeHtml(group)}</div>${links}`;
    })
    .join("");

  const body = `
    <div class="ah-layout-docs">
      <aside class="ah-docs-side">${side}</aside>
      <article>
        <h1>Learn</h1>
        <p class="ah-empty" style="border:0;padding:0">Notes from the University vault.</p>
      </article>
    </div>`;

  return html(
    layout({
      title: "Learn",
      body,
      current: "learn",
      wide: true,
      track: { path: "/learn", title: "Learn" },
      head: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" />`,
    }),
  );
});

app.get("/learn/:id", async (c) => {
  const doc = getLearnDoc(c.req.param("id"));
  if (!doc) return c.notFound();

  const asset = await c.env.ASSETS.fetch(new URL(`/learn-content/${doc.path}`, c.req.url));
  const md = asset.ok ? await asset.text() : `# ${doc.title}\n\nMissing.`;
  const rendered = await renderMarkdown(md);

  const side = LEARN_INDEX.map(
    (d) =>
      `<a href="/learn/${escapeHtml(d.id)}"${d.id === doc.id ? ' aria-current="page"' : ""}>${escapeHtml(d.title)}</a>`,
  ).join("");

  const body = `
    <div class="ah-layout-docs">
      <aside class="ah-docs-side">
        <div class="ah-nav-section">Notes</div>
        ${side}
      </aside>
      <article class="ah-md">${rendered}</article>
    </div>`;

  return html(
    layout({
      title: doc.title,
      body,
      current: "learn",
      wide: true,
      track: { path: `/learn/${doc.id}`, title: doc.title },
      head: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" />`,
    }),
  );
});

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "hub",
    risk: "trusted",
    time: new Date().toISOString(),
  }),
);

app.get("/api/registry", (c) => c.json(getRegistry()));

app.notFound(async (c) => {
  const asset = await c.env.ASSETS.fetch(c.req.raw);
  if (asset.status !== 404) return asset;
  return html(
    layout({
      title: "Not found",
      body: `<h1>Not found</h1><p><a href="/">Home</a></p>`,
      track: { path: "/404", title: "Not found" },
    }),
    { status: 404 },
  );
});

export default app;

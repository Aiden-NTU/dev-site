import { Hono } from "hono";
import { html, withSecurityHeaders } from "@ah/worker-kit";
import type { Env } from "./env";
import { createAuth, getSession } from "./lib/auth";
import { layout, escapeHtml } from "./lib/layout";
import { getGroup, getRegistry, listProjects } from "./lib/registry";
import { LEARN_INDEX, getLearnDoc } from "./lib/learn";
import { renderMarkdown } from "./lib/markdown";

type AppEnv = { Bindings: Env };

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  await next();
  if (c.res.headers.get("content-type")?.includes("text/html")) {
    c.res = withSecurityHeaders(c.res);
  }
});

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

async function userName(c: { env: Env; req: { raw: Request } }) {
  const auth = createAuth(c.env);
  const session = await getSession(auth, c.req.raw);
  return session?.user?.name ?? null;
}

app.get("/", async (c) => {
  const name = await userName(c);
  const { groups, projects } = getRegistry();
  const groupLinks = groups
    .map(
      (g) => `<a href="/projects?group=${encodeURIComponent(g.id)}">${escapeHtml(g.title)}</a>
      <p class="ah-faint" style="margin:0 0 1rem;font-size:0.85rem">${escapeHtml(g.summary)}</p>`,
    )
    .join("");

  const rows = projects
    .map(
      (p) => `<li class="ah-list-row" data-project-row="${escapeHtml([p.id, p.title, p.group, p.subgroup, p.summary].join(" "))}">
        <div>
          <a href="${escapeHtml(p.url)}"><strong>${escapeHtml(p.title)}</strong></a>
          <div class="ah-faint ah-mono" style="font-size:0.8rem">${escapeHtml(p.host)}</div>
          <p class="ah-muted" style="margin:0.35rem 0 0">${escapeHtml(p.summary)}</p>
        </div>
        <span class="ah-risk ah-risk-${escapeHtml(p.risk)}">${escapeHtml(p.risk)}</span>
      </li>`,
    )
    .join("");

  const body = `
    <section class="ah-hero">
      <h1 class="ah-hero-brand">aidenhawkins.dev</h1>
      <p class="ah-hero-lede">Projects, coursework, and learning notes — organised by course group.</p>
      <div class="ah-row">
        <a class="ah-btn ah-btn-primary" href="/projects">Browse projects</a>
        <a class="ah-btn ah-btn-ghost" href="/learn">Open learning vault</a>
      </div>
    </section>
    <div class="ah-catalog">
      <aside class="ah-sidebar">
        <div class="ah-sidebar-group">Groups</div>
        ${groupLinks}
      </aside>
      <section>
        <div class="ah-row" style="justify-content:space-between;margin-bottom:0.5rem">
          <h2 style="margin:0">Projects</h2>
          <input id="ah-catalog-search" class="ah-input" style="max-width:16rem" type="search" placeholder="Filter on this page" />
        </div>
        <ul class="ah-list">${rows}</ul>
      </section>
    </div>`;

  return html(layout({ title: "Home", body, current: "home", userName: name, wide: true }));
});

app.get("/projects", async (c) => {
  const name = await userName(c);
  const q = c.req.query("q") ?? "";
  const group = c.req.query("group") ?? "";
  const projects = listProjects({ q, group: group || undefined });
  const { groups } = getRegistry();
  const active = group ? getGroup(group) : null;

  const groupNav = groups
    .map(
      (g) =>
        `<a href="/projects?group=${encodeURIComponent(g.id)}"${g.id === group ? ' aria-current="page"' : ""}>${escapeHtml(g.title)}</a>`,
    )
    .join("");

  const rows = projects
    .map(
      (p) => `<li class="ah-list-row" data-project-row="${escapeHtml([p.id, p.title, p.group, p.subgroup, p.summary].join(" "))}">
        <div>
          <a href="${escapeHtml(p.url)}"><strong>${escapeHtml(p.title)}</strong></a>
          <div class="ah-faint ah-mono" style="font-size:0.8rem">${escapeHtml(p.group)} / ${escapeHtml(p.subgroup)} / ${escapeHtml(p.id)}</div>
          <p class="ah-muted" style="margin:0.35rem 0 0">${escapeHtml(p.summary)}</p>
        </div>
        <span class="ah-risk ah-risk-${escapeHtml(p.risk)}">${escapeHtml(p.risk)}</span>
      </li>`,
    )
    .join("");

  const body = `
    <h1>Projects</h1>
    <p class="ah-muted">${active ? escapeHtml(active.summary) : "Sandboxed Workers on nested subdomains. The hub only links out."}</p>
    <form method="get" class="ah-row" style="margin:1rem 0 1.5rem">
      ${group ? `<input type="hidden" name="group" value="${escapeHtml(group)}" />` : ""}
      <input class="ah-input" style="max-width:20rem" type="search" name="q" value="${escapeHtml(q)}" placeholder="Search" />
      <button class="ah-btn" type="submit">Search</button>
      <a class="ah-btn ah-btn-ghost" href="/projects">Clear</a>
    </form>
    <div class="ah-catalog">
      <aside class="ah-sidebar">
        <div class="ah-sidebar-group">Groups</div>
        <a href="/projects"${!group ? ' aria-current="page"' : ""}>All</a>
        ${groupNav}
      </aside>
      <ul class="ah-list">${rows || '<li class="ah-muted">No projects match.</li>'}</ul>
    </div>`;

  return html(layout({ title: "Projects", body, current: "projects", userName: name, wide: true }));
});

app.get("/learn", async (c) => {
  const name = await userName(c);
  const byGroup = new Map<string, typeof LEARN_INDEX>();
  for (const doc of LEARN_INDEX) {
    const list = byGroup.get(doc.group) ?? [];
    list.push(doc);
    byGroup.set(doc.group, list);
  }

  const sidebar = [...byGroup.entries()]
    .map(([group, docs]) => {
      const links = docs.map((d) => `<a href="/learn/${escapeHtml(d.id)}">${escapeHtml(d.title)}</a>`).join("");
      return `<div class="ah-sidebar-group">${escapeHtml(group)}</div>${links}`;
    })
    .join("");

  const body = `
    <div class="ah-layout-docs">
      <aside class="ah-sidebar">${sidebar}</aside>
      <article>
        <h1>Learning vault</h1>
        <p class="ah-muted">Starter notes mirrored from the public <a href="https://github.com/Aiden-NTU/University">University</a> Obsidian vault. Sign in to track progress later.</p>
        <div class="ah-callout ah-callout-accent">Pick a note in the sidebar. Interactive components will replace these pages over time — same shells, richer slots.</div>
      </article>
    </div>`;

  return html(
    layout({
      title: "Learn",
      body,
      current: "learn",
      userName: name,
      wide: true,
      head: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" />`,
    }),
  );
});

app.get("/learn/:id", async (c) => {
  const name = await userName(c);
  const doc = getLearnDoc(c.req.param("id"));
  if (!doc) return c.notFound();

  const asset = await c.env.ASSETS.fetch(new URL(`/learn-content/${doc.path}`, c.req.url));
  const md = asset.ok ? await asset.text() : `# ${doc.title}\n\nContent not synced yet.`;
  const rendered = await renderMarkdown(md);

  const sidebar = LEARN_INDEX.map(
    (d) =>
      `<a href="/learn/${escapeHtml(d.id)}"${d.id === doc.id ? ' aria-current="page"' : ""}>${escapeHtml(d.title)}</a>`,
  ).join("");

  const progress = name
    ? `<form method="post" action="/learn/${escapeHtml(doc.id)}/progress" class="ah-row" style="margin-top:1.5rem">
        <button class="ah-btn" type="submit">Mark as reviewed</button>
        <span class="ah-faint">Progress hooks for signed-in learners</span>
      </form>`
    : `<p class="ah-faint" style="margin-top:1.5rem"><a href="/login">Sign in</a> to track progress.</p>`;

  const body = `
    <div class="ah-layout-docs">
      <aside class="ah-sidebar">
        <div class="ah-sidebar-group">Notes</div>
        ${sidebar}
      </aside>
      <article class="ah-md">
        ${rendered}
        <div class="ah-panel" style="margin-top:1.5rem">
          <div class="ah-panel-head"><strong>Try it</strong><span class="ah-faint">interactive slot</span></div>
          <div class="ah-panel-body">
            <p class="ah-muted" style="margin:0">Interactive widgets land here later. For now this is a stable slot in DocsShell.</p>
          </div>
        </div>
        ${progress}
      </article>
    </div>`;

  return html(
    layout({
      title: doc.title,
      body,
      current: "learn",
      userName: name,
      wide: true,
      head: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" />`,
    }),
  );
});

app.post("/learn/:id/progress", async (c) => {
  const auth = createAuth(c.env);
  const session = await getSession(auth, c.req.raw);
  if (!session?.user) return c.redirect("/login");
  const doc = getLearnDoc(c.req.param("id"));
  if (!doc) return c.notFound();

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO learning_progress (id, user_id, path, completed, updated_at)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(user_id, path) DO UPDATE SET completed = 1, updated_at = excluded.updated_at`,
  )
    .bind(id, session.user.id, doc.path, Date.now())
    .run();

  return c.redirect(`/learn/${doc.id}`);
});

app.get("/login", async (c) => {
  const name = await userName(c);
  if (name) return c.redirect("/account");
  const err = c.req.query("error");
  const body = `
    <div class="ah-auth-box">
      <h1>Log in</h1>
      <p class="ah-muted">Public accounts for learning progress. Projects stay sandboxed.</p>
      ${err ? `<p class="ah-error">${escapeHtml(err)}</p>` : ""}
      <form method="post" action="/login">
        <div class="ah-field">
          <label class="ah-label" for="email">Email</label>
          <input class="ah-input" id="email" name="email" type="email" required autocomplete="email" />
        </div>
        <div class="ah-field">
          <label class="ah-label" for="password">Password</label>
          <input class="ah-input" id="password" name="password" type="password" required minlength="8" autocomplete="current-password" />
        </div>
        <button class="ah-btn ah-btn-primary" type="submit">Log in</button>
      </form>
      <p class="ah-faint" style="margin-top:1rem">No account? <a href="/signup">Sign up</a></p>
    </div>`;
  return html(layout({ title: "Log in", body, current: "login" }));
});

app.post("/login", async (c) => {
  const auth = createAuth(c.env);
  const form = await c.req.parseBody();
  const email = String(form.email ?? "");
  const password = String(form.password ?? "");
  try {
    const res = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });
    // Forward Set-Cookie to browser and redirect
    const headers = new Headers(res.headers);
    headers.set("Location", "/account");
    return new Response(null, { status: 302, headers });
  } catch {
    return c.redirect("/login?error=" + encodeURIComponent("Invalid email or password"));
  }
});

app.get("/signup", async (c) => {
  const name = await userName(c);
  if (name) return c.redirect("/account");
  const err = c.req.query("error");
  const body = `
    <div class="ah-auth-box">
      <h1>Sign up</h1>
      <p class="ah-muted">Create an account to track learning progress over time.</p>
      ${err ? `<p class="ah-error">${escapeHtml(err)}</p>` : ""}
      <form method="post" action="/signup">
        <div class="ah-field">
          <label class="ah-label" for="name">Name</label>
          <input class="ah-input" id="name" name="name" required autocomplete="name" />
        </div>
        <div class="ah-field">
          <label class="ah-label" for="email">Email</label>
          <input class="ah-input" id="email" name="email" type="email" required autocomplete="email" />
        </div>
        <div class="ah-field">
          <label class="ah-label" for="password">Password</label>
          <input class="ah-input" id="password" name="password" type="password" required minlength="8" autocomplete="new-password" />
        </div>
        <button class="ah-btn ah-btn-primary" type="submit">Create account</button>
      </form>
      <p class="ah-faint" style="margin-top:1rem">Already have an account? <a href="/login">Log in</a></p>
    </div>`;
  return html(layout({ title: "Sign up", body, current: "login" }));
});

app.post("/signup", async (c) => {
  const auth = createAuth(c.env);
  const form = await c.req.parseBody();
  const email = String(form.email ?? "");
  const password = String(form.password ?? "");
  const name = String(form.name ?? "");
  try {
    const res = await auth.api.signUpEmail({
      body: { email, password, name },
      asResponse: true,
    });
    const headers = new Headers(res.headers);
    headers.set("Location", "/account");
    return new Response(null, { status: 302, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not sign up";
    return c.redirect("/signup?error=" + encodeURIComponent(msg));
  }
});

app.get("/logout", async (c) => {
  const auth = createAuth(c.env);
  const res = await auth.api.signOut({
    headers: c.req.raw.headers,
    asResponse: true,
  });
  const headers = new Headers(res.headers);
  headers.set("Location", "/");
  return new Response(null, { status: 302, headers });
});

app.get("/account", async (c) => {
  const auth = createAuth(c.env);
  const session = await getSession(auth, c.req.raw);
  if (!session?.user) return c.redirect("/login");

  const progress = await c.env.DB.prepare(
    `SELECT path, completed, updated_at FROM learning_progress WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20`,
  )
    .bind(session.user.id)
    .all<{ path: string; completed: number; updated_at: number }>();

  const rows =
    progress.results
      ?.map(
        (r) =>
          `<li class="ah-list-row"><span class="ah-mono">${escapeHtml(r.path)}</span><span class="ah-risk ${r.completed ? "ah-risk-trusted" : ""}">${r.completed ? "reviewed" : "open"}</span></li>`,
      )
      .join("") || `<li class="ah-muted">No progress yet. Open the learning vault.</li>`;

  const body = `
    <h1>Account</h1>
    <p class="ah-muted">Signed in as <strong>${escapeHtml(session.user.name)}</strong> (${escapeHtml(session.user.email)}).</p>
    <h2>Learning progress</h2>
    <ul class="ah-list">${rows}</ul>
    <p style="margin-top:1.5rem"><a class="ah-btn" href="/learn">Continue learning</a> <a class="ah-btn ah-btn-ghost" href="/logout">Log out</a></p>`;

  return html(layout({ title: "Account", body, current: "account", userName: session.user.name }));
});

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "hub",
    risk: "trusted",
    time: new Date().toISOString(),
  }),
);

app.notFound(async (c) => {
  // Let the asset binding try static files first for /ah.css etc. when worker-first misses.
  const asset = await c.env.ASSETS.fetch(c.req.raw);
  if (asset.status !== 404) return asset;
  return html(
    layout({
      title: "Not found",
      body: `<h1>Not found</h1><p class="ah-muted"><a href="/">Back home</a></p>`,
    }),
    { status: 404 },
  );
});

export default app;

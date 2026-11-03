import { navTree } from "./registry";

export function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function iconHome() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 7.2 8 2.5l5.5 4.7V13a1 1 0 0 1-1 1H9.2V9.5H6.8V14H3.5a1 1 0 0 1-1-1V7.2Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/></svg>`;
}

function iconClock() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.4" stroke="currentColor" stroke-width="1.25"/><path d="M8 5V8.2l2 1.3" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg>`;
}

function iconFolder() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 4.5h3.1l1.2 1.2H13.5v6.8a.9.9 0 0 1-.9.9h-9a.9.9 0 0 1-.9-.9V4.5Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/></svg>`;
}

function iconBook() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.2 3.2h4.1c1.1 0 2 .9 2 2v7.2L7.5 11l-1.8 1.4V5.2c0-1.1-.9-2-2-2H3.2v8.8" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.8 3.2H8.7c-1.1 0-2 .9-2 2v7.2L8.5 11l1.8 1.4V5.2c0-1.1.9-2 2-2h.5v8.8" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export function layout(opts: {
  title: string;
  body: string;
  current?: string;
  wide?: boolean;
  head?: string;
  track?: { path: string; title: string; projectId?: string };
}) {
  const tree = navTree();
  const groupsHtml = tree
    .map((g) => {
      const subs = g.subgroups
        .map((sg) => {
          const projects = sg.projects
            .map(
              (p) => `<li>
                <a href="${escapeHtml(p.url)}" data-recent-link data-recent-title="${escapeHtml(p.title)}" data-project-id="${escapeHtml(p.id)}">
                  ${escapeHtml(p.title)}
                  <span class="ah-nav-sub">${escapeHtml(g.title)} / ${escapeHtml(sg.title)}</span>
                </a>
              </li>`,
            )
            .join("");
          return `<li class="ah-nav-item" data-nav-node data-nav-text="${escapeHtml(`${g.title} ${sg.title}`)}">
            <button type="button" data-nav-toggle aria-expanded="false">
              ${iconFolder()}
              <span class="ah-nav-label">${escapeHtml(sg.title)}</span>
              <span class="ah-nav-chevron">›</span>
            </button>
            <ul class="ah-nav-children" hidden>${projects || `<li><span class="ah-nav-sub" style="display:block;padding:8px 10px 8px 28px">No projects</span></li>`}</ul>
          </li>`;
        })
        .join("");
      return `<div class="ah-nav-section" data-nav-section data-nav-text="${escapeHtml(g.title)}">${escapeHtml(g.title)}</div>
        <ul class="ah-nav-list" data-nav-group>${subs}</ul>`;
    })
    .join("");

  const trackAttr = opts.track
    ? `data-track-path="${escapeHtml(opts.track.path)}" data-track-title="${escapeHtml(opts.track.title)}"${opts.track.projectId ? ` data-track-project="${escapeHtml(opts.track.projectId)}"` : ""}`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)} · aidenhawkins.dev</title>
  <link rel="stylesheet" href="/ah.css" />
  ${opts.head ?? ""}
</head>
<body ${trackAttr}>
  <div class="ah-app">
    <aside class="ah-sidenav" aria-label="Site">
      <a class="ah-sidenav-brand" href="/"><span class="ah-brand-mark" aria-hidden="true"></span>aidenhawkins.dev</a>
      <div class="ah-nav-search">
        <input id="ah-nav-filter" type="search" placeholder="Quick search..." aria-label="Filter navigation" />
        <kbd>Ctrl K</kbd>
      </div>
      <ul class="ah-nav-list">
        <li class="ah-nav-item">
          <a href="/" ${opts.current === "home" ? 'aria-current="page"' : ""}>${iconHome()}<span class="ah-nav-label">Home</span></a>
        </li>
        <li class="ah-nav-item" data-open="false" id="ah-recents-item">
          <button type="button" data-nav-toggle aria-expanded="false">
            ${iconClock()}
            <span class="ah-nav-label">Recents</span>
            <span class="ah-nav-chevron">›</span>
          </button>
          <ul class="ah-nav-children" id="ah-recents-list" hidden></ul>
        </li>
        <li class="ah-nav-item">
          <a href="/learn" ${opts.current === "learn" ? 'aria-current="page"' : ""}>${iconBook()}<span class="ah-nav-label">Learn</span></a>
        </li>
      </ul>
      <hr class="ah-nav-divider" />
      ${groupsHtml}
    </aside>
    <div class="ah-workspace">
      <main class="ah-content${opts.wide ? " ah-content-wide" : ""}">
        ${opts.body}
      </main>
    </div>
  </div>
  <script src="/ah.js" defer></script>
</body>
</html>`;
}

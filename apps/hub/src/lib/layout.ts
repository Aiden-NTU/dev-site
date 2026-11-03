export function layout(opts: {
  title: string;
  body: string;
  current?: "home" | "projects" | "learn" | "login" | "account";
  userName?: string | null;
  wide?: boolean;
  head?: string;
}) {
  const nav = (href: string, label: string, key: string) =>
    `<a href="${href}"${opts.current === key ? ' aria-current="page"' : ""}>${label}</a>`;

  const authLink = opts.userName
    ? `<a href="/account">${escapeHtml(opts.userName)}</a><a href="/logout">Log out</a>`
    : `<a href="/login"${opts.current === "login" ? ' aria-current="page"' : ""}>Log in</a>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)} · aidenhawkins.dev</title>
  <link rel="stylesheet" href="/ah.css" />
  ${opts.head ?? ""}
</head>
<body>
  <div class="ah-shell">
    <header class="ah-header">
      <a class="ah-brand" href="/">aidenhawkins.dev</a>
      <form class="ah-header-search" action="/projects" method="get" role="search">
        <input class="ah-input" type="search" name="q" placeholder="Search projects" aria-label="Search projects" />
      </form>
      <nav class="ah-nav">
        ${nav("/projects", "Projects", "projects")}
        ${nav("/learn", "Learn", "learn")}
        ${authLink}
      </nav>
    </header>
    <main class="ah-main${opts.wide ? " ah-main-wide" : ""}">
      ${opts.body}
    </main>
    <footer class="ah-footer">Course encyclopedia · sandboxed subdomains · free-tier Cloudflare</footer>
  </div>
  <script src="/ah.js" defer></script>
</body>
</html>`;
}

export function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

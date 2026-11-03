import { html, json, jsonError, withSecurityHeaders } from "./kit";

export interface Env {
  ASSETS: Fetcher;
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hello TypeScript Lab</title>
  <link rel="stylesheet" href="/ah.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" />
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js"></script>
</head>
<body>
  <div class="ah-shell">
    <header class="ah-header">
      <a class="ah-brand" href="https://aidenhawkins.dev/">aidenhawkins.dev</a>
      <span class="ah-risk ah-risk-experimental">experimental</span>
    </header>
    <main class="ah-main ah-main-wide">
      <div class="ah-breadcrumb">hello-ts.programming.cs.aidenhawkins.dev</div>
      <h1>Hello TypeScript Lab</h1>
      <p class="ah-muted">LabShell + KaTeX + a tiny /api/run endpoint on an isolated Worker.</p>
      <div class="ah-layout-lab" style="margin-top:1.5rem">
        <section class="ah-panel">
          <div class="ah-panel-head"><strong>Instructions</strong></div>
          <div class="ah-panel-body ah-md">
            <p>Edit <code class="ah-inline-code">src/index.ts</code>. This Worker is isolated from the hub.</p>
            <div class="ah-math" id="eq"></div>
          </div>
        </section>
        <section class="ah-panel" data-lab data-lab-endpoint="/api/run">
          <div class="ah-panel-head">
            <strong>Lab</strong>
            <button type="button" class="ah-btn ah-btn-primary" data-lab-run>Run</button>
          </div>
          <div class="ah-panel-body">
            <label class="ah-label" for="lab-input">Source</label>
            <textarea id="lab-input" class="ah-textarea ah-mono" data-lab-input>return 2 + 2;</textarea>
          </div>
          <pre class="ah-console" data-lab-out>Ready.</pre>
        </section>
      </div>
    </main>
    <footer class="ah-footer">Sandboxed TS Worker · no hub secrets</footer>
  </div>
  <script src="/ah.js" defer></script>
  <script>
    window.addEventListener("load", () => {
      if (window.katex) katex.render("e^{i\\\\pi} + 1 = 0", document.getElementById("eq"), { throwOnError: false });
    });
  </script>
</body>
</html>`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return withSecurityHeaders(
        json({ ok: true, service: "hello-ts", risk: "experimental", time: new Date().toISOString() }),
      );
    }

    if (url.pathname === "/api/run" && request.method === "POST") {
      // Intentionally tiny + constrained: no eval of user code on the server.
      // Student labs should grow carefully; mark risk=experimental.
      try {
        const body = (await request.json()) as { source?: string };
        const source = (body.source ?? "").trim();
        if (!/^[0-9+\-*/().\s]+$/.test(source.replace(/^return\s+/, "").replace(/;$/, ""))) {
          return withSecurityHeaders(jsonError("Only simple arithmetic is allowed in the template.", 400));
        }
        const expr = source.replace(/^return\s+/, "").replace(/;$/, "");
        // eslint-disable-next-line no-new-func
        const value = Function(`"use strict"; return (${expr});`)();
        return withSecurityHeaders(json({ ok: true, output: String(value) }));
      } catch (e) {
        return withSecurityHeaders(json({ ok: false, output: String(e) }, { status: 400 }));
      }
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return html(PAGE);
    }

    const asset = await env.ASSETS.fetch(request);
    return withSecurityHeaders(asset);
  },
};

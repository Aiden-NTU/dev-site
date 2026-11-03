from workers import Response
import json


PAGE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TEMPLATE_TITLE</title>
  <link rel="stylesheet" href="/ah.css" />
</head>
<body>
  <div class="ah-shell">
    <header class="ah-header">
      <a class="ah-brand" href="https://aidenhawkins.dev/">aidenhawkins.dev</a>
      <span class="ah-risk ah-risk-experimental">experimental</span>
    </header>
    <main class="ah-main">
      <div class="ah-breadcrumb">TEMPLATE_HOST</div>
      <h1>TEMPLATE_TITLE</h1>
      <p class="ah-muted">TEMPLATE_SUMMARY</p>
      <div class="ah-panel" style="margin-top:1.5rem" data-lab data-lab-endpoint="/api/run">
        <div class="ah-panel-head">
          <strong>Python API</strong>
          <button type="button" class="ah-btn ah-btn-primary" data-lab-run>Call /api/run</button>
        </div>
        <div class="ah-panel-body">
          <label class="ah-label" for="lab-input">Message</label>
          <textarea id="lab-input" class="ah-textarea" data-lab-input>hello from the browser</textarea>
        </div>
        <pre class="ah-console" data-lab-out>Ready.</pre>
      </div>
      <p class="ah-faint"><a href="/api/health">/api/health</a></p>
    </main>
    <footer class="ah-footer">Sandboxed Python Worker · no hub secrets</footer>
  </div>
  <script src="/ah.js" defer></script>
</body>
</html>
"""


async def on_fetch(request, env):
    """Python Workers entry (on_fetch). Prefer this over WorkerEntrypoint with current wrangler."""
    from urllib.parse import urlparse

    path = urlparse(str(request.url)).path or "/"

    if path == "/api/health":
        return Response(
            json.dumps({"ok": True, "service": "TEMPLATE_ID", "risk": "experimental"}),
            headers={"content-type": "application/json"},
        )

    if path == "/api/run" and request.method == "POST":
        raw = await request.text()
        data = json.loads(raw) if raw else {}
        source = data.get("source", "")
        return Response(
            json.dumps({"ok": True, "output": f"python received: {source!r} (len={len(source)})"}),
            headers={"content-type": "application/json"},
        )

    if path.startswith("/ah."):
        return await env.ASSETS.fetch(request)

    return Response(PAGE, headers={"content-type": "text/html; charset=utf-8"})

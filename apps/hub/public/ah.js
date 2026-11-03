/**
 * AH design kit client helpers.
 */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const RECENTS_KEY = "ah.recents.v1";

  function loadRecents() {
    try {
      return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveRecent(entry) {
    const list = loadRecents().filter((x) => x.href !== entry.href);
    list.unshift({ ...entry, at: Date.now() });
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, 12)));
  }

  function renderRecents() {
    const ul = $("#ah-recents-list");
    if (!ul) return;
    const items = loadRecents();
    if (!items.length) {
      ul.innerHTML = `<li class="ah-empty" style="border:0;padding:0.35rem 0.45rem">Nothing yet</li>`;
      return;
    }
    ul.innerHTML = items
      .slice(0, 8)
      .map(
        (x) =>
          `<li><a href="${x.href}">${escape(x.title || x.href)}</a></li>`,
      )
      .join("");
  }

  function escape(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  // Track current page into recents + analytics beacon
  const path = document.body.getAttribute("data-track-path");
  const title = document.body.getAttribute("data-track-title");
  const projectId = document.body.getAttribute("data-track-project");
  if (path && title) {
    saveRecent({ href: location.pathname + location.search, title });
    const payload = JSON.stringify({
      path: location.pathname + location.search,
      title,
      projectId: projectId || null,
    });
    try {
      navigator.sendBeacon("/api/analytics/hit", new Blob([payload], { type: "application/json" }));
    } catch {
      fetch("/api/analytics/hit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }

  // Also track outbound project clicks from nav
  $$("[data-recent-link]").forEach((a) => {
    a.addEventListener("click", () => {
      saveRecent({
        href: a.href,
        title: a.getAttribute("data-recent-title") || a.textContent || a.href,
        projectId: a.getAttribute("data-project-id") || null,
      });
    });
  });

  renderRecents();

  // Expand / collapse nav groups
  $$("[data-nav-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".ah-nav-item");
      if (!item) return;
      const open = item.getAttribute("data-open") === "true";
      item.setAttribute("data-open", String(!open));
      btn.setAttribute("aria-expanded", String(!open));
      const kids = item.querySelector(":scope > .ah-nav-children");
      if (kids) kids.hidden = open;
    });
  });

  // Sidebar filter
  const navFilter = $("#ah-nav-filter");
  if (navFilter) {
    const apply = () => {
      const q = navFilter.value.trim().toLowerCase();
      $$("[data-nav-node]").forEach((node) => {
        const hay = (node.getAttribute("data-nav-text") || "").toLowerCase() + " " + node.textContent.toLowerCase();
        const show = !q || hay.includes(q);
        node.classList.toggle("ah-nav-filter-hide", !show);
        if (show && q) {
          node.setAttribute("data-open", "true");
          const kids = node.querySelector(":scope > .ah-nav-children");
          if (kids) kids.hidden = false;
        }
      });
      $$("[data-nav-section]").forEach((sec) => {
        let el = sec.nextElementSibling;
        let any = false;
        while (el && !el.matches("[data-nav-section], .ah-nav-divider")) {
          if (el.matches("[data-nav-group], .ah-nav-list")) {
            const visible = [...el.querySelectorAll("[data-nav-node]")].some(
              (n) => !n.classList.contains("ah-nav-filter-hide"),
            );
            any = any || visible;
          }
          el = el.nextElementSibling;
        }
        sec.classList.toggle("ah-nav-filter-hide", Boolean(q) && !any);
      });
    };
    navFilter.addEventListener("input", apply);
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        navFilter.focus();
      }
    });
  }

  // Home hero search → filter columns + jump
  const hero = $("#ah-hero-search");
  if (hero) {
    hero.addEventListener("input", () => {
      const q = hero.value.trim().toLowerCase();
      $$("[data-home-row]").forEach((row) => {
        const hay = (row.getAttribute("data-home-row") || "").toLowerCase();
        row.hidden = Boolean(q) && !hay.includes(q);
      });
    });
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && document.activeElement !== navFilter) {
        // already handled for nav; if hero exists and nav not focused, still ok
      }
    });
  }

  // Populate "Your recents" column on home
  const yours = $("#ah-home-recents");
  if (yours) {
    const items = loadRecents();
    if (!items.length) {
      yours.innerHTML = `<div class="ah-empty">Browse a project from the sidebar — it will show up here.</div>`;
    } else {
      yours.innerHTML = `<ul class="ah-col-list">${items
        .slice(0, 8)
        .map(
          (x) =>
            `<li data-home-row="${escape(x.title)} ${escape(x.href)}"><a href="${x.href}">${escape(x.title)}<span class="ah-col-meta">${escape(x.href.replace(/^https?:\/\//, ""))}</span></a></li>`,
        )
        .join("")}</ul>`;
    }
  }

  // Tabs
  $$(".ah-tabs").forEach((tabs) => {
    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".ah-tab");
      if (!btn || !tabs.contains(btn)) return;
      const id = btn.getAttribute("data-tab-target");
      if (!id) return;
      $$(".ah-tab", tabs).forEach((t) => t.setAttribute("aria-selected", String(t === btn)));
      const scope = tabs.parentElement || document;
      $$("[data-tab-panel]", scope).forEach((panel) => {
        panel.hidden = panel.getAttribute("data-tab-panel") !== id;
      });
    });
  });

  // Lab run helper
  $$("[data-lab-run]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const form = btn.closest("[data-lab]");
      if (!form) return;
      const out = $("[data-lab-out]", form);
      const input = $("[data-lab-input]", form);
      if (out) out.textContent = "Running…";
      try {
        const endpoint = form.getAttribute("data-lab-endpoint") || "/api/run";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ source: input ? input.value : "" }),
        });
        const text = await res.text();
        if (out) out.textContent = text;
      } catch (err) {
        if (out) out.textContent = String(err);
      }
    });
  });

  // Analytics panels on home
  const mapHost = $("#ah-world-map");
  const trafficHost = $("#ah-traffic");
  if (mapHost || trafficHost) {
    fetch("/api/analytics/summary")
      .then((r) => r.json())
      .then((data) => {
        if (mapHost) renderMap(mapHost, data.countries || []);
        if (trafficHost) renderTraffic(trafficHost, data);
      })
      .catch(() => {
        if (mapHost) mapHost.innerHTML = `<p class="ah-empty" style="border:0">No traffic yet.</p>`;
      });
  }

  function renderMap(host, countries) {
    const coords = {
      US: [-98, 39], GB: [-2, 54], IE: [-8, 53], DE: [10, 51], FR: [2, 46], NL: [5, 52],
      ES: [-3, 40], IT: [12, 42], CA: [-100, 56], AU: [134, -25], JP: [138, 36], IN: [78, 22],
      BR: [-52, -14], SG: [104, 1.3], AE: [54, 24], ZA: [25, -29], PL: [19, 52], SE: [15, 62],
    };
    const project = (lon, lat) => {
      const x = ((lon + 180) / 360) * 800;
      const y = ((90 - lat) / 180) * 400;
      return [x, y];
    };
    const dots = countries
      .map((c) => {
        const pair = coords[c.country];
        if (!pair) return "";
        const [x, y] = project(pair[0], pair[1]);
        const r = Math.min(10, 3 + Math.log2((c.c || 1) + 1));
        return `<circle class="ah-map-dot" cx="${x}" cy="${y}" r="${r}"><title>${c.country}: ${c.c}</title></circle>`;
      })
      .join("");
    host.innerHTML = `<svg class="ah-map" viewBox="0 0 800 400" role="img" aria-label="Visitor map">
      <rect width="800" height="400" fill="#f1f2f4"/>
      <path fill="#dfe3e8" d="M80 80h120v60H80zm180 40h160v80H260zm360 20h140v70H620zM120 220h200v90H120zm350 40h180v70H470zM40 300h90v40H40z"/>
      ${dots}
    </svg>`;
  }

  function renderTraffic(host, data) {
    const stats = `<div class="ah-stat-row">
      <div class="ah-stat"><div class="ah-stat-value">${data.hits24h ?? 0}</div><div class="ah-stat-label">Hits · 24h</div></div>
      <div class="ah-stat"><div class="ah-stat-value">${(data.countries || []).length}</div><div class="ah-stat-label">Countries</div></div>
      <div class="ah-stat"><div class="ah-stat-value">${(data.topProjects || []).length}</div><div class="ah-stat-label">Projects hit</div></div>
    </div>`;
    const rows = (data.recent || [])
      .map((r) => {
        const when = new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return `<li><span>${escape(r.title || r.path)} <span class="ah-col-meta">${escape(r.country || "—")}</span></span><span class="ah-col-meta">${when}</span></li>`;
      })
      .join("");
    host.innerHTML = `${stats}<ul class="ah-traffic-list">${rows || `<li><span>No hits yet</span></li>`}</ul>`;
  }
})();

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const RECENTS_KEY = "ah.recents.v1";
  const PAGE = 6;

  const COORDS = {
    US: [-98, 39], GB: [-2, 54], IE: [-8, 53], DE: [10, 51], FR: [2, 46], NL: [5, 52],
    BE: [4.5, 50.5], ES: [-3, 40], IT: [12, 42], PT: [-8, 39.5], SE: [15, 62], NO: [9, 61],
    DK: [10, 56], FI: [26, 64], PL: [19, 52], CZ: [15, 50], AT: [14, 47.5], CH: [8, 47],
    CA: [-100, 56], MX: [-102, 23], BR: [-52, -14], AR: [-64, -34], AU: [134, -25],
    NZ: [174, -41], JP: [138, 36], KR: [128, 36], CN: [104, 35], IN: [78, 22], SG: [104, 1.3],
    HK: [114, 22], TW: [121, 24], AE: [54, 24], SA: [45, 24], ZA: [25, -29], NG: [8, 10],
    EG: [30, 27], TR: [35, 39], RU: [100, 60], UA: [32, 49], IL: [35, 31],
  };

  function escape(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

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
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, 16)));
  }

  function renderRecents() {
    const ul = $("#ah-recents-list");
    if (!ul) return;
    const items = loadRecents();
    if (!items.length) {
      ul.innerHTML = `<li><span class="ah-nav-sub" style="display:block;padding:8px 10px 8px 28px">Nothing yet</span></li>`;
      return;
    }
    ul.innerHTML = items
      .slice(0, 8)
      .map((x) => {
        const href = escape(x.href);
        const title = escape(x.title || x.href);
        const sub = escape(String(x.href || "").replace(/^https?:\/\//, ""));
        return `<li><a href="${href}">${title}<span class="ah-nav-sub">${sub}</span></a></li>`;
      })
      .join("");
  }

  // Track + beacon
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

  const navFilter = $("#ah-nav-filter");
  if (navFilter) {
    const apply = () => {
      const q = navFilter.value.trim().toLowerCase();
      $$("[data-nav-node]").forEach((node) => {
        const hay = ((node.getAttribute("data-nav-text") || "") + " " + node.textContent).toLowerCase();
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
            any =
              any ||
              [...el.querySelectorAll("[data-nav-node]")].some((n) => !n.classList.contains("ah-nav-filter-hide"));
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
        const hero = $("#ah-hero-search");
        (hero || navFilter).focus();
      }
    });
  }

  const hero = $("#ah-hero-search");
  if (hero) {
    hero.addEventListener("input", () => {
      const q = hero.value.trim().toLowerCase();
      $$("[data-home-row]").forEach((row) => {
        const hay = (row.getAttribute("data-home-row") || "").toLowerCase();
        row.hidden = Boolean(q) && !hay.includes(q);
      });
    });
  }

  const yours = $("#ah-home-recents");
  if (yours) {
    const items = loadRecents();
    if (!items.length) {
      yours.innerHTML = `<div class="ah-empty">Open a project — it shows up here.</div>`;
    } else {
      yours.innerHTML = `<ul class="ah-col-list">${items
        .slice(0, 8)
        .map((x) => {
          const href = escape(x.href);
          const t = escape(x.title || x.href);
          const meta = escape(String(x.href || "").replace(/^https?:\/\//, ""));
          return `<li data-home-row="${t} ${meta}"><a href="${href}"><span class="ah-row-icon" aria-hidden="true">↗</span><span><span class="ah-row-title">${t}</span><span class="ah-row-meta">${meta}</span></span><span class="ah-row-chevron">›</span></a></li>`;
        })
        .join("")}</ul>`;
    }
  }

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
        if (out) out.textContent = await res.text();
      } catch (err) {
        if (out) out.textContent = String(err);
      }
    });
  });

  // Analytics: real map + streaming traffic
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
        if (mapHost) mapHost.innerHTML = `<div class="ah-empty" style="border:0">No traffic yet.</div>`;
      });
  }

  function project(lon, lat) {
    // viewBox is 0..100 x 0..50 (2:1 equirectangular)
    return [((lon + 180) / 360) * 100, ((90 - lat) / 180) * 50];
  }

  function renderMap(host, countries) {
    const dots = countries
      .map((c, i) => {
        const pair = COORDS[c.country];
        if (!pair) return "";
        const [x, y] = project(pair[0], pair[1]);
        const r = Math.min(2.2, 0.7 + Math.log2((c.c || 1) + 1) * 0.45);
        return `<circle class="ah-map-pulse" cx="${x}" cy="${y}" r="${r * 2.2}" style="animation-delay:${i * 0.12}s"/><circle class="ah-map-dot" cx="${x}" cy="${y}" r="${r}" style="animation-delay:${i * 0.08}s"><title>${c.country}: ${c.c}</title></circle>`;
      })
      .join("");

    host.innerHTML = `<div class="ah-map-wrap">
      <img src="/world-map.svg" alt="" width="960" height="480" decoding="async" />
      <svg class="ah-map-overlay" viewBox="0 0 100 50" preserveAspectRatio="none" aria-label="Visitor locations">${dots}</svg>
    </div>`;
  }

  function renderTraffic(host, data) {
    const all = data.recent || [];
    let shown = 0;

    host.innerHTML = `<div class="ah-stat-row">
      <div class="ah-stat"><div class="ah-stat-value">${data.hits24h ?? 0}</div><div class="ah-stat-label">Hits · 24h</div></div>
      <div class="ah-stat"><div class="ah-stat-value">${(data.countries || []).length}</div><div class="ah-stat-label">Countries</div></div>
      <div class="ah-stat"><div class="ah-stat-value">${(data.topProjects || []).length}</div><div class="ah-stat-label">Projects</div></div>
    </div>
    <ul class="ah-stream" id="ah-stream-list"></ul>
    <button type="button" class="ah-show-more" id="ah-stream-more" hidden>Show more</button>`;

    const list = $("#ah-stream-list", host);
    const more = $("#ah-stream-more", host);

    function rowHtml(r) {
      const when = new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const code = escape(r.country || "—");
      return `<li class="ah-stream-item">
        <span class="ah-stream-flag">${code.slice(0, 2)}</span>
        <span><div class="ah-stream-title">${escape(r.title || r.path)}</div><div class="ah-stream-meta">${code}</div></span>
        <span class="ah-stream-time">${when}</span>
      </li>`;
    }

    function bounceIn(nodes, baseDelay = 0) {
      nodes.forEach((n, i) => {
        n.classList.remove("is-in");
        // force reflow so repeated Show more batches re-animate
        void n.offsetWidth;
        n.style.animationDelay = `${baseDelay + i * 0.08}s`;
        requestAnimationFrame(() => n.classList.add("is-in"));
      });
    }

    function reveal(batch) {
      const start = shown;
      const slice = all.slice(shown, shown + batch);
      shown += slice.length;
      if (!all.length) {
        list.innerHTML = `<li class="ah-stream-item is-in"><span class="ah-stream-flag">—</span><span><div class="ah-stream-title">No hits yet</div></span><span></span></li>`;
        more.hidden = true;
        return;
      }
      list.insertAdjacentHTML("beforeend", slice.map(rowHtml).join(""));
      const nodes = [...list.children].slice(start);
      bounceIn(nodes);
      more.hidden = shown >= all.length;
    }

    reveal(PAGE);
    more.addEventListener("click", () => reveal(PAGE));
  }
})();

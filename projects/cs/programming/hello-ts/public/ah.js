/**
 * Tiny client helpers for the AH design kit.
 * No framework. Safe to load on hub, TS, Python, and static projects.
 */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Tabs: button.ah-tab[data-tab-target] <-> [data-tab-panel]
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

  // Catalog live filter
  const search = $("#ah-catalog-search");
  if (search) {
    const rows = $$("[data-project-row]");
    const apply = () => {
      const q = search.value.trim().toLowerCase();
      rows.forEach((row) => {
        const hay = (row.getAttribute("data-project-row") || "").toLowerCase();
        row.hidden = q !== "" && !hay.includes(q);
      });
    };
    search.addEventListener("input", apply);
  }

  // Lab run helper for demos with data-lab-run
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
})();

// Serves the site, plus /api/rules, which reads each tab of the requirements
// Google Sheet as CSV. The app checks every row itself and keeps its last good
// version of anything it can't read.
// The sheet is not secret: it is shared as "Anyone with the link: Viewer".
// The SHEET_ID variable in wrangler.jsonc overrides it; previews don't receive that variable.
const DEFAULT_SHEET_ID = "1b6QMkZBtEUT-d1O6UaZrPYWe9f3KoFOejfhZiTmnZio";
const TABS = { requirements: "Requirements", settings: "Settings", checklist: "Checklist", dates: "Dates", notes: "Notes" };

function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/rules") return env.ASSETS.fetch(request);
    const out = { fetched: new Date().toISOString(), tabs: {} };
    const sheetId = env.SHEET_ID || DEFAULT_SHEET_ID;
    await Promise.all(Object.entries(TABS).map(async ([key, name]) => {
      try {
        const src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(name)}`;
        const r = await fetch(src, { cf: { cacheTtl: 120, cacheEverything: true } });
        const type = r.headers.get("content-type") || "";
        if (!r.ok || !type.includes("csv")) throw new Error(`Sheet returned ${r.status} ${type}`);
        out.tabs[key] = { ok: true, rows: parseCSV(await r.text()) };
      } catch (e) {
        out.tabs[key] = { ok: false, error: String(e && e.message || e) };
      }
    }));
    return Response.json(out, { headers: { "cache-control": "public, max-age=60", "x-robots-tag": "noindex" } });
  },
};

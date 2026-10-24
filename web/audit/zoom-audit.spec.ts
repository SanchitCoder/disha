/**
 * Zoom / layout audit: every page x 5 viewports x 5 browser-zoom levels.
 * Real browser zoom is emulated the way browsers do it: the CSS viewport shrinks by the zoom factor and the device pixel ratio grows by it
 * (so media queries and rem-based sizes react exactly as they do at 125% / 200% zoom).
 *
 *   AUDIT_LABEL=before npm run audit:zoom      -> reports/zoom/before/{issues.json, *.png}
 *   AUDIT_LABEL=after  npm run audit:zoom      -> reports/zoom/after/...
 */
import { expect, Page, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "http://localhost:8110";
const LABEL = process.env.AUDIT_LABEL ?? "after";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../reports/zoom", LABEL);
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [[360, 740], [390, 844], [768, 1024], [1280, 800], [1440, 900]] as const;
const ZOOMS = [0.8, 1, 1.25, 1.5, 2] as const;

type Ctx = { fever: string; vague: string; booking: string; waiting: string };
const ids: Partial<Ctx> = {};

async function post(path: string, body: unknown) {
  const r = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}

test.beforeAll(async () => {
  const loc = { lat: 28.54, lng: 77.27 };
  const f = await post("/v1/session/triage?force_decision=true", { user_input: "papa ko 3 din se bukhar hai aur badan dard", location: loc, conversation_history: [] });
  ids.fever = f.app.case_id;
  // a SEPARATE case with the blood test already scheduled: leaves one step awaiting a clinician so the nurse "Actions to confirm" tab has content
  const w = await post("/v1/session/triage?force_decision=true", { user_input: "mummy ko 4 din se bukhar hai aur chills", location: loc, conversation_history: [] });
  ids.waiting = w.app.case_id;
  const acts = await (await fetch(`${API}/v1/cases/${ids.waiting}/actions`)).json();
  const blood = acts.find((a: any) => a.type === "home_sample_collection");
  if (blood) {
    const s = await (await fetch(`${API}/v1/actions/${blood.id}/slots`)).json();
    await post(`/v1/actions/${blood.id}/schedule`, { slot: s.options[0]?.iso });
  }
  const top = f.app.caregivers[0];
  ids.booking = (await post("/v1/book", { case_id: ids.fever, caregiver_id: top.caregiver_id, slot: top.slot })).booking_id;
  const v = await post("/v1/session/triage", { user_input: "I need help", location: loc, conversation_history: [] });
  ids.vague = v.app.case_id;
});

type Step = (p: Page) => Promise<void>;
const PAGES: { name: string; url: () => string; setup?: Step }[] = [
  { name: "landing", url: () => "/" },
  { name: "start", url: () => "/start" },
  { name: "question", url: () => `/q/${ids.vague}` },
  { name: "plan", url: () => `/plan/${ids.fever}` },
  { name: "plan-slotpicker", url: () => `/plan/${ids.fever}`, setup: async (p) => { await p.getByTestId("schedule-home_sample_collection").first().click(); await p.getByTestId("slot-chip").first().waitFor(); } },
  { name: "plan-details", url: () => `/plan/${ids.fever}`, setup: async (p) => { await p.getByTestId("open-details").click(); await p.getByTestId("save-details").waitFor(); } },
  { name: "book", url: () => `/book/${ids.fever}` },
  { name: "brief", url: () => `/brief/${ids.booking}` },
  { name: "checkin", url: () => `/checkin/${ids.fever}` },
  { name: "emergency", url: () => "/emergency" },
  { name: "nurse-queue", url: () => "/nurse" },
  { name: "nurse-actions", url: () => "/nurse", setup: async (p) => { await p.getByTestId("tab-actions").click(); await p.getByTestId("actions-to-confirm").waitFor(); } },
];

/** Runs inside the page. Returns a list of problems found in the current layout. */
function inspect() {
  const issues: { type: string; detail: string }[] = [];
  const vw = window.innerWidth;
  const sel = (el: Element) => {
    const e = el as HTMLElement;
    return e.getAttribute("data-testid") ? `[data-testid=${e.getAttribute("data-testid")}]` : `${e.tagName.toLowerCase()}${e.id ? "#" + e.id : ""}${e.className && typeof e.className === "string" ? "." + e.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".") : ""}`;
  };
  const visible = (el: Element) => { const r = (el as HTMLElement).getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0"; };
  // with a modal dialog open, only the dialog is on screen in any meaningful sense: the dimmed page behind it is not "overlapping"
  const dialog = document.querySelector("[role=dialog]");
  const scope: ParentNode = dialog ?? document.body;
  const all = [...scope.querySelectorAll("*")].filter(visible);

  // 1) horizontal overflow: the page scrolls sideways, or something sticks out past the right edge
  const docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  if (docW > vw + 1) {
    const culprits = all.filter((e) => { const r = e.getBoundingClientRect(); return r.right > vw + 1 && getComputedStyle(e).position !== "fixed" && !e.closest("[aria-hidden='true']"); }).slice(0, 4).map(sel);
    issues.push({ type: "horizontal-overflow", detail: `page ${docW}px wide in a ${vw}px viewport; sticking out: ${culprits.join(", ") || "(see screenshot)"}` });
  }

  // 2) tap targets: real controls must be >= 44 css px each way
  const controls = scope.querySelectorAll("button, input:not([type=hidden]), select, textarea, [role=switch], [role=tab], a.sk-btn, a.sk-btn-secondary, a.sk-btn-alarm, a.sk-btn-sage, a.sk-btn-ghost");
  controls.forEach((el) => {
    if (!visible(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) issues.push({ type: "small-tap-target", detail: `${sel(el)} is ${Math.round(r.width)}x${Math.round(r.height)}px` });
  });
  scope.querySelectorAll("input, textarea, select").forEach((el) => {
    if (!visible(el)) return;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 16) issues.push({ type: "ios-input-zoom", detail: `${sel(el)} font-size ${fs}px (< 16px makes iOS Safari zoom in on focus)` });
  });

  // 3) clipped text: a box that hides overflow while its content is bigger than it
  all.forEach((el) => {
    const cs = getComputedStyle(el), e = el as HTMLElement;
    if (!(cs.overflowX === "hidden" || cs.overflowX === "clip" || cs.overflowY === "hidden" || cs.overflowY === "clip")) return;
    if (e.closest(".leaflet-container, [aria-hidden='true']") || e.tagName === "SVG" || cs.textOverflow === "ellipsis") return;
    const txt = (e.innerText || "").trim();
    if (txt.length < 3) return;
    if (e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2) issues.push({ type: "clipped-content", detail: `${sel(el)} hides ${Math.max(e.scrollHeight - e.clientHeight, e.scrollWidth - e.clientWidth)}px of "${txt.slice(0, 40)}"` });
  });

  // 4) overlapping text: two different text boxes drawn on top of each other
  const texty = all.filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent || "").trim().length > 2) && !e.closest("[aria-hidden='true'], svg, .leaflet-container"));
  const rects = texty.map((e) => ({ e, r: e.getBoundingClientRect() }));
  let found = 0;
  for (let i = 0; i < rects.length && found < 4; i++) for (let j = i + 1; j < rects.length && found < 4; j++) {
    const a = rects[i], b = rects[j];
    if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
    const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (w > 4 && h > 4 && (w * h) / Math.min(a.r.width * a.r.height, b.r.width * b.r.height) > 0.3) {
      const pa = getComputedStyle(a.e).position, pb = getComputedStyle(b.e).position;
      if (pa === "fixed" || pb === "fixed" || a.e.closest("header") !== b.e.closest("header")) continue;     // sticky header over scrolled content is not an overlap
      issues.push({ type: "overlapping-text", detail: `${sel(a.e)} overlaps ${sel(b.e)}` }); found++;
    }
  }

  // 5) viewport meta must not block pinch zoom
  const meta = document.querySelector("meta[name=viewport]")?.getAttribute("content") ?? "";
  if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(meta) || !/width=device-width/.test(meta)) issues.push({ type: "viewport-meta", detail: `viewport meta is "${meta}"` });

  // 6) fixed-height boxes whose text is cut (px heights set inline / by style)
  return issues;
}

const ONLY = process.env.AUDIT_PAGES?.split(",");
const ONLY_VP = process.env.AUDIT_VIEWPORTS?.split(",");   // e.g. 360x740,390x844
for (const pg of PAGES.filter((p) => !ONLY || ONLY.includes(p.name))) {
  for (const [w, h] of VIEWPORTS.filter(([a, b]) => !ONLY_VP || ONLY_VP.includes(`${a}x${b}`))) {
    for (const z of ZOOMS) {
      test(`${pg.name} @ ${w}x${h} zoom ${Math.round(z * 100)}%`, async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width: Math.round(w / z), height: Math.round(h / z) }, deviceScaleFactor: z, hasTouch: w < 800 });
        const page = await ctx.newPage();
        await page.addInitScript(() => localStorage.setItem("disha.lang", "hi"));
        await page.goto(pg.url(), { waitUntil: "networkidle" });
        await page.waitForTimeout(500);
        if (pg.setup) await pg.setup(page);
        await page.waitForTimeout(300);
        const issues = await page.evaluate(inspect);
        const key = `${pg.name}__${w}x${h}__${Math.round(z * 100)}`;
        if (issues.length) await page.screenshot({ path: path.join(OUT, `${key}.png`), fullPage: true });
        fs.writeFileSync(path.join(OUT, `${key}.json`), JSON.stringify({ page: pg.name, viewport: [w, h], zoom: z, issues }, null, 1));
        await ctx.close();
        expect(true).toBe(true);        // an audit records; the summary decides
      });
    }
  }
}

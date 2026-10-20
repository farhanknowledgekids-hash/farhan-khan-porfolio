// Static quality checks with no dependencies: `npm run check`.
// Fails (exit 1) on broken local links/assets, duplicate ids, missing alt text,
// broken label/aria references, missing titles/descriptions, or demo pages without the demo notice.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

const root = resolve(process.argv[2] || ".");
const skip = new Set(["node_modules", "dist", ".git", "scripts"]);
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (skip.has(n)) continue;
    const p = join(d, n);
    statSync(p).isDirectory() ? walk(p) : files.push(p);
  }
})(root);

const html = files.filter(f => f.endsWith(".html"));
const css = files.filter(f => f.endsWith(".css"));
const errors = [];
const err = (f, m) => errors.push(`${relative(root, f)}: ${m}`);
let refs = 0;

function checkLocal(f, url, isRootRelative) {
  if (!url || /^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(url)) return;
  const clean = url.split("#")[0].split("?")[0];
  if (!clean) return;
  refs++;
  const target = isRootRelative || clean.startsWith("/") ? join(root, clean) : resolve(dirname(f), clean);
  const ok = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, "index.html")));
  if (!ok) err(f, `broken local reference "${url}"`);
}

for (const f of html) {
  const src = readFileSync(f, "utf8");
  const is404 = f.endsWith("404.html");
  if (!/<html[^>]+lang="/.test(src)) err(f, "missing <html lang>");
  if (!/<title>[^<]{10,}<\/title>/.test(src)) err(f, "missing or short <title>");
  if (!is404 && !/<meta name="description" content="[^"]{50,}"/.test(src)) err(f, "missing or short meta description");
  if (!/<meta name="viewport"/.test(src)) err(f, "missing viewport meta");
  const h1 = (src.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) err(f, `expected exactly one <h1>, found ${h1}`);

  const ids = [...src.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const idSet = new Set();
  for (const id of ids) { if (idSet.has(id)) err(f, `duplicate id "${id}"`); idSet.add(id); }

  for (const m of src.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(m[0])) err(f, `<img> without alt: ${m[0].slice(0, 80)}`);
    if (!/\swidth="\d+"/.test(m[0]) || !/\sheight="\d+"/.test(m[0])) err(f, `<img> without width/height: ${m[0].slice(0, 80)}`);
  }
  for (const m of src.matchAll(/\s(?:href|src)="([^"]+)"/g)) checkLocal(f, m[1].replace(/&amp;/g, "&"), is404);
  for (const m of src.matchAll(/\ssrcset="([^"]+)"/g))
    for (const part of m[1].split(",")) checkLocal(f, part.trim().split(/\s+/)[0].replace(/&amp;/g, "&"), is404);
  for (const m of src.matchAll(/href="#([^"]+)"/g)) if (!idSet.has(m[1])) err(f, `in-page link to missing id "#${m[1]}"`);
  for (const m of src.matchAll(/<label[^>]*\sfor="([^"]+)"/g)) if (!idSet.has(m[1])) err(f, `label for missing id "${m[1]}"`);
  for (const m of src.matchAll(/aria-(?:describedby|labelledby|controls)="([^"]+)"/g))
    for (const id of m[1].split(/\s+/)) if (!idSet.has(id)) err(f, `aria reference to missing id "${id}"`);
  for (const m of src.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
    const a = m[2];
    if (/type="(hidden|radio|submit)"/.test(a)) continue;
    const id = (a.match(/\sid="([^"]+)"/) || [])[1];
    if (!id || !new RegExp(`for="${id}"`).test(src)) err(f, `form control without a <label for>: <${m[1]}${a.slice(0, 60)}`);
  }
  for (const m of src.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) err(f, "target=_blank without rel=noopener");
  if (f.includes(`${"/"}demos${"/"}`) || f.includes("\\demos\\")) {
    if (!/class="demo-bar"/.test(src)) err(f, "demo page is missing the demo-concept notice");
    if (!/name="robots" content="noindex/.test(src)) err(f, "demo page should be noindex");
    if (!/data-enquiry="demo"/.test(src)) err(f, "demo form must use data-enquiry=\"demo\" so it never sends");
  }
  if (/http:\/\//.test(src.replace(/xmlns="http:\/\/www\.w3\.org[^"]*"/g, ""))) err(f, "insecure http:// URL");
}
for (const f of css) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/url\(["']?([^"')]+)["']?\)/g)) checkLocal(f, m[1]);
}
const cfg = readFileSync(join(root, "assets/js/config.js"), "utf8");
const notes = [];
if (/FORM_ENDPOINT:\s*""/.test(cfg) && /CONTACT_EMAIL:\s*""/.test(cfg)) notes.push("Studio enquiry form is NOT connected: set FORM_ENDPOINT or CONTACT_EMAIL in assets/js/config.js.");
if (/WHATSAPP_NUMBER:\s*""/.test(cfg)) notes.push("WhatsApp button is hidden: set WHATSAPP_NUMBER in assets/js/config.js to show it.");

console.log(`Checked ${html.length} HTML files, ${css.length} CSS files, ${refs} local references.`);
notes.forEach(n => console.log("Note: " + n));
if (errors.length) { console.error(`\n${errors.length} problem(s):\n- ` + errors.join("\n- ")); process.exit(1); }
console.log("All checks passed.");

// Zero-dependency static server: `npm start` (serves the project) or `npm run preview` (serves dist/).
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] || ".");
const port = Number(process.env.PORT) || 8080;
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".json": "application/json", ".xml": "application/xml"
};

http.createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = normalize(join(root, path));
    if (!file.startsWith(root)) { res.writeHead(403).end("Forbidden"); return; }
    let s = await stat(file).catch(() => null);
    if (s && s.isDirectory()) { file = join(file, "index.html"); s = await stat(file).catch(() => null); }
    if (!s) {
      const notFound = await readFile(join(root, "404.html")).catch(() => "Not found");
      res.writeHead(404, { "Content-Type": types[".html"] }).end(notFound);
      return;
    }
    res.writeHead(200, { "Content-Type": types[extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(await readFile(file));
  } catch (e) {
    res.writeHead(500).end("Server error");
  }
}).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}`));

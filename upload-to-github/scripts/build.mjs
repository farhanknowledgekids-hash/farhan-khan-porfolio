// `npm run build`: runs the checks, then copies the deployable site into dist/.
import { cpSync, rmSync, mkdirSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";

const root = resolve(".");
execFileSync(process.execPath, ["scripts/check.mjs"], { stdio: "inherit" });
const out = join(root, "dist");
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
const exclude = new Set(["dist", "node_modules", "scripts", ".git", "package.json", "package-lock.json", "README.md"]);
for (const name of readdirSync(root)) {
  if (exclude.has(name) || name.startsWith(".")) continue;
  cpSync(join(root, name), join(out, name), { recursive: true });
}
console.log("Built to dist/. Upload the contents of dist/ to any static host.");

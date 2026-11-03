import { copyFileSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const design = join(root, "packages/design");
const pub = join(dirname(fileURLToPath(import.meta.url)), "../public");
mkdirSync(pub, { recursive: true });

function read(rel) {
  return readFileSync(join(design, rel), "utf8");
}

// Bundle CSS without @import so Workers assets serve one file.
const css = [
  '/* IBM Plex via Google Fonts */',
  '@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap");',
  read("tokens/tokens.css"),
  read("primitives/primitives.css"),
  read("shells/shells.css"),
].join("\n\n");

writeFileSync(join(pub, "ah.css"), css);
copyFileSync(join(design, "ah.js"), join(pub, "ah.js"));

const learnSrc = join(root, "content/learn");
const learnDst = join(pub, "learn-content");
if (existsSync(learnSrc)) {
  mkdirSync(learnDst, { recursive: true });
  cpSync(learnSrc, learnDst, { recursive: true });
}

console.log("synced design (+ learn content if present) → apps/hub/public");

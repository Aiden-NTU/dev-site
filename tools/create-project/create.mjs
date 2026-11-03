#!/usr/bin/env node
/**
 * Scaffold a sandboxed project Worker and register it in registry/projects.json.
 *
 * Usage:
 *   npm run create-project -- --group cs --subgroup programming --name hello-lab --template ts
 */
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

function usage() {
  console.log(`Usage:
  npm run create-project -- --group cs --subgroup programming --name my-lab --template ts|python|static
Optional:
  --title "My Lab"
  --summary "Short description"
`);
}

const group = arg("group");
const subgroup = arg("subgroup");
const name = arg("name");
const template = arg("template", "ts");
const title = arg("title", name);
const summary = arg("summary", `${title} — course project`);

if (!group || !subgroup || !name || !["ts", "python", "static"].includes(template)) {
  usage();
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(name) || !/^[a-z0-9-]+$/.test(group) || !/^[a-z0-9-]+$/.test(subgroup)) {
  console.error("group, subgroup, and name must be lowercase DNS labels (a-z, 0-9, -).");
  process.exit(1);
}

const host = `${name}.${subgroup}.${group}.aidenhawkins.dev`;
const src = join(root, "projects", `_template-${template}`);
const dest = join(root, "projects", group, subgroup, name);

if (!existsSync(src)) {
  console.error("Missing template:", src);
  process.exit(1);
}
if (existsSync(dest)) {
  console.error("Project already exists:", dest);
  process.exit(1);
}

function walk(dir, fn) {
  for (const ent of readdirSync(dir)) {
    const p = join(dir, ent);
    if (statSync(p).isDirectory()) walk(p, fn);
    else fn(p);
  }
}

mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });

const replacements = {
  TEMPLATE_ID: name,
  TEMPLATE_TITLE: title,
  TEMPLATE_SUMMARY: summary,
  TEMPLATE_GROUP: group,
  TEMPLATE_SUBGROUP: subgroup,
  TEMPLATE_HOST: host,
};

walk(dest, (file) => {
  if (/\.(png|jpg|jpeg|gif|webp|woff2?)$/i.test(file)) return;
  let text = readFileSync(file, "utf8");
  let next = text;
  for (const [k, v] of Object.entries(replacements)) next = next.split(k).join(v);
  if (next !== text) writeFileSync(file, next);
});

// Copy design assets into public/
const pub = join(dest, "public");
mkdirSync(pub, { recursive: true });
const design = join(root, "packages/design");
const tokens = readFileSync(join(design, "tokens/tokens.css"), "utf8");
const primitives = readFileSync(join(design, "primitives/primitives.css"), "utf8");
const shells = readFileSync(join(design, "shells/shells.css"), "utf8");
const css = [
  '@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap");',
  tokens,
  primitives,
  shells,
].join("\n\n");
writeFileSync(join(pub, "ah.css"), css);
writeFileSync(join(pub, "ah.js"), readFileSync(join(design, "ah.js")));

const registryPath = join(root, "registry/projects.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const risk = template === "static" ? "static" : "experimental";
const entry = {
  id: name,
  title,
  summary,
  group,
  subgroup,
  risk,
  runtime: template,
  host,
  url: `https://${host}/`,
  tags: ["generated"],
};
if (registry.projects.some((p) => p.id === name && p.group === group && p.subgroup === subgroup)) {
  console.warn("Registry already has this project id; leaving registry unchanged.");
} else {
  registry.projects.push(entry);
  writeFileSync(registryPath, JSON.stringify(registry, null, 2) + "\n");
}

console.log(`Created ${dest}`);
console.log(`Host: https://${host}/`);
console.log(`Next:
  cd ${dest}
  # review wrangler.toml
  npx wrangler deploy
`);

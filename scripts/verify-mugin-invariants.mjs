/**
 * Smoke-check invariants after Mugin Scholar rebrand (Fase Safe).
 * Exit 1 if non-allowlisted legacy brand/prefix hits remain in source.
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const SKIP = new Set(["node_modules", "dist", ".git", "uploads"]);
const EXT = new Set([
  ".js",
  ".mjs",
  ".vue",
  ".php",
  ".css",
  ".html",
  ".md",
  ".yaml",
  ".yml",
  ".json",
  ".htaccess",
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (EXT.has(path.extname(ent.name)) || ent.name === ".htaccess" || ent.name === ".env.example") {
      out.push(full);
    }
  }
  return out;
}

const allow = (line, file) =>
  /qpm-openai-service\.azurewebsites\.net/.test(line) ||
  /danishdiabetesknowledgecenter\/QuickPubMed/.test(line) ||
  /github\.com\/[^"'\\\s]+\/QuickPubMed/.test(line) ||
  /\bcd QuickPubMed\b/.test(line) ||
  /nempubmed\.dk/i.test(line) ||
  /quickpubmed\.dk/i.test(line) ||
  /rename-to-mugin/.test(file) ||
  /verify-mugin-invariants/.test(file);

const pattern = /\b(qpm_|QPM_|NEMPUBMED|NemPubMed|QuickPubMed|QpmMarkdown|qpmTelemetry|qpm-searchform|#qpm-)/;
const bad = [];
for (const file of walk(root)) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  if (rel.startsWith("scripts/rename-to-mugin")) continue;
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (pattern.test(line) && !allow(line, rel)) {
      bad.push(`${rel}:${i + 1}:${line.trim().slice(0, 160)}`);
    }
  });
}

// Required positives after rename
const required = [
  ["entries/scripts/SearchForm.js", /\.mugin-searchform/],
  ["entries/scripts/Editor.js", /mugin-editor/],
  ["backend/config/config.example.php", /MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED/],
  ["backend/api/.htaccess", /MUGIN_CORS_ORIGIN/],
];
for (const [rel, re] of required) {
  const text = fs.readFileSync(path.join(root, rel), "utf8");
  if (!re.test(text)) {
    bad.push(`MISSING required pattern ${re} in ${rel}`);
  }
}

if (bad.length) {
  console.error(`FAIL: ${bad.length} invariant issue(s)`);
  bad.slice(0, 50).forEach((l) => console.error(l));
  process.exit(1);
}
console.log("OK: Mugin rename invariants hold (allowlist-only legacy hits).");

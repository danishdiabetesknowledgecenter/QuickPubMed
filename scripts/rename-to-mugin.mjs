/**
 * Mechanical rebrand: QuickPubMed/NemPubMed/qpm → Mugin Scholar / mugin.
 * Preserves: nempubmed.dk, quickpubmed.dk, qpm-openai-service, GitHub QuickPubMed paths.
 */
import fs from "fs";
import path from "path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  "uploads",
  "agent-transcripts",
  "data/runtime",
  "data/cache",
]);

const TEXT_EXT = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".vue",
  ".php",
  ".css",
  ".html",
  ".md",
  ".yaml",
  ".yml",
  ".json",
  ".txt",
  ".example",
  ".htaccess",
  ".env",
]);

function shouldSkipDir(rel) {
  const norm = rel.replace(/\\/g, "/");
  for (const d of SKIP_DIRS) {
    if (norm === d || norm.startsWith(d + "/")) return true;
  }
  return false;
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(root, full).replace(/\\/g, "/");
    if (ent.isDirectory()) {
      if (!shouldSkipDir(rel)) walk(full, out);
      continue;
    }
    const ext = path.extname(ent.name).toLowerCase();
    if (ent.name === ".htaccess" || TEXT_EXT.has(ext) || ent.name.endsWith(".example.php") || ent.name === "config.example.php") {
      out.push(full);
    }
  }
  return out;
}

function protect(text) {
  const tokens = [];
  const stash = (match) => {
    const i = tokens.length;
    tokens.push(match);
    return `__MUGIN_PROTECT_${i}__`;
  };
  let s = text;
  s = s.replace(/qpm-openai-service\.azurewebsites\.net/g, stash);
  s = s.replace(/danishdiabetesknowledgecenter\/QuickPubMed/g, stash);
  s = s.replace(/github\.com\/[^"'\\\s]+\/QuickPubMed/gi, stash);
  s = s.replace(/\*\.?nempubmed\.dk/gi, stash);
  s = s.replace(/nempubmed\.dk/gi, stash);
  s = s.replace(/\*\.?quickpubmed\.dk/gi, stash);
  s = s.replace(/quickpubmed\.dk/gi, stash);
  s = s.replace(/api\.nempubmed\.dk/gi, stash);
  return { s, tokens };
}

function restore(text, tokens) {
  let s = text;
  for (let i = tokens.length - 1; i >= 0; i--) {
    s = s.replace(`__MUGIN_PROTECT_${i}__`, tokens[i]);
  }
  return s;
}

function transformContent(text) {
  const { s: protectedText, tokens } = protect(text);
  let s = protectedText;

  // Brand strings (order matters)
  s = s.replace(/NemPubMed/g, "Mugin Scholar");
  s = s.replace(/QuickPubMed/g, "Mugin Scholar");
  s = s.replace(/Mugin Scholar\/1\.0/g, "MuginScholar/1.0");
  s = s.replace(/tool=Mugin Scholar/g, "tool=MuginScholar");
  s = s.replace(/'Mugin Scholar'/g, (m, offset, full) => {
    // NLM tool param contexts often use single-quoted tool name
    return m;
  });
  s = s.replace(/\$params\['tool'\]\s*=\s*'Mugin Scholar'/g, "$params['tool'] = 'MuginScholar'");
  s = s.replace(/\$params\["tool"\]\s*=\s*"Mugin Scholar"/g, '$params["tool"] = "MuginScholar"');

  // PHP / JS constants and prefixes
  s = s.replace(/NEMPUBMED_/g, "MUGIN_");
  s = s.replace(/QPM_/g, "MUGIN_");
  s = s.replace(/\bqpmPublicSearch/g, "muginPublicSearch");
  s = s.replace(/\bqpmSemanticQuality/g, "muginSemanticQuality");
  s = s.replace(/\bqpmSemanticRerank/g, "muginSemanticRerank");
  s = s.replace(/\bqpmApply/g, "muginApply");
  s = s.replace(/\bqpmHttp/g, "muginHttp");
  s = s.replace(/\bqpmThrottle/g, "muginThrottle");
  s = s.replace(/\bqpmGet/g, "muginGet");
  s = s.replace(/\bqpmIs/g, "muginIs");
  s = s.replace(/\bqpmLoad/g, "muginLoad");
  s = s.replace(/\bqpmStore/g, "muginStore");
  s = s.replace(/\bqpmBuild/g, "muginBuild");
  s = s.replace(/\bqpmParse/g, "muginParse");
  s = s.replace(/\bqpmNormalize/g, "muginNormalize");
  s = s.replace(/\bqpmReconstruct/g, "muginReconstruct");
  s = s.replace(/\bqpmEnforce/g, "muginEnforce");
  s = s.replace(/\bqpmOpenAlex/g, "muginOpenAlex");
  s = s.replace(/\bqpmElicit/g, "muginElicit");
  s = s.replace(/\bqpmLocal/g, "muginLocal");
  s = s.replace(/\bqpmFile/g, "muginFile");
  s = s.replace(/\bqpm_/g, "mugin_");
  s = s.replace(/\bqpm-/g, "mugin-");
  s = s.replace(/\bqpm:/g, "mugin:");
  s = s.replace(/\bQPM_CORS_ORIGIN\b/g, "MUGIN_CORS_ORIGIN");
  // Remaining camelCase qpm* helpers
  s = s.replace(/\bqpm([A-Z][A-Za-z0-9]*)/g, "mugin$1");

  // Env / vite leftovers
  s = s.replace(/VITE_QPM_/g, "VITE_MUGIN_");

  return restore(s, tokens);
}

function transformFilename(name) {
  return name.replace(/qpm/gi, (m) => (m === "QPM" ? "MUGIN" : m === "Qpm" ? "Mugin" : "mugin"));
}

const files = walk(root);
let changedFiles = 0;
const renames = [];

for (const file of files) {
  if (path.basename(file) === "rename-to-mugin.mjs") continue;
  const original = fs.readFileSync(file, "utf8");
  const next = transformContent(original);
  if (next !== original) {
    fs.writeFileSync(file, next, "utf8");
    changedFiles++;
  }
  const base = path.basename(file);
  const newBase = transformFilename(base);
  if (newBase !== base) {
    const newPath = path.join(path.dirname(file), newBase);
    renames.push([file, newPath]);
  }
}

for (const [from, to] of renames) {
  if (fs.existsSync(from) && from !== to) {
    fs.renameSync(from, to);
    // Fix imports that referenced old filename in already-written content
    console.log("renamed", path.relative(root, from), "->", path.relative(root, to));
  }
}

console.log(`Updated ${changedFiles} files, renamed ${renames.length} paths`);

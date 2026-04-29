#!/usr/bin/env node
/**
 * Summarize QuickPubMed telemetry JSONL logs.
 *
 * Reads all qpm-telemetry-YYYY-MM-DD.jsonl files from the runtime log directory
 * (default: data/runtime) and prints aggregate statistics across event types.
 *
 * Usage:
 *   node scripts/summarize-telemetry.js
 *   node scripts/summarize-telemetry.js --dir data/runtime --days 14
 *   node scripts/summarize-telemetry.js --json > summary.json
 *
 * Flags:
 *   --dir <path>    Directory containing qpm-telemetry-*.jsonl files (default: data/runtime)
 *   --days <n>      Only include files from the last N days (default: 30)
 *   --json          Emit a JSON report instead of the human-readable text summary
 *   --event <name>  Only include a single event type
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

function parseArgs(argv) {
  const args = {
    dir: path.join("data", "runtime"),
    days: 30,
    json: false,
    event: "",
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dir") {
      args.dir = String(argv[++i] || args.dir);
    } else if (arg === "--days") {
      args.days = Number(argv[++i] || args.days) || args.days;
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg === "--event") {
      args.event = String(argv[++i] || "");
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: node scripts/summarize-telemetry.js [--dir <path>] [--days <n>] [--event <name>] [--json]"
      );
      process.exit(0);
    }
  }
  return args;
}

function listTelemetryFiles(dir, days) {
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (err) {
    console.error(`Cannot read directory ${dir}:`, err.message);
    process.exit(1);
  }
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
  const files = [];
  for (const name of entries) {
    if (!/^qpm-telemetry-\d{4}-\d{2}-\d{2}\.jsonl$/.test(name)) continue;
    const full = path.join(dir, name);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch (_err) {
      continue;
    }
    if (stat.mtimeMs < cutoffMs) continue;
    files.push(full);
  }
  files.sort();
  return files;
}

function createAccumulator() {
  return {
    totalEvents: 0,
    eventCounts: {},
    semanticIntent: {
      count: 0,
      lowConfidence: 0,
      schemaInvalid: 0,
      fallbackUsed: 0,
      intentTypes: {},
      avgConfidence: 0,
      confidenceSum: 0,
      confidenceSamples: 0,
      suggestionsProvidedCount: 0,
      suggestionsTotal: 0,
    },
    sourceHits: {
      zeroHits: {},
      overHits: {},
      total: {},
    },
    filterDrop: {
      count: 0,
      highDrop: 0,
      avgDropRatio: 0,
      dropRatioSum: 0,
    },
    overlap: {
      count: 0,
      lowOverlap: 0,
      avgOverlapRatio: 0,
      overlapSum: 0,
    },
    mesh: {
      count: 0,
      hallucinationFlag: 0,
      totalMeshTerms: 0,
      invalidCount: 0,
      observeOnly: 0,
    },
    probeCounts: {
      count: 0,
      outOfRangeBySource: {},
    },
    paraphrase: {
      editCount: 0,
    },
    queryPlan: {
      count: 0,
      hasCoreQuery: 0,
      adaptedSources: {},
      fallbackUsed: 0,
    },
    promptVersions: {},
  };
}

function updateAcc(acc, evt) {
  acc.totalEvents += 1;
  const type = String(evt.type || "").trim();
  if (!type) return;
  acc.eventCounts[type] = (acc.eventCounts[type] || 0) + 1;
  if (evt.promptVersion) {
    acc.promptVersions[evt.promptVersion] =
      (acc.promptVersions[evt.promptVersion] || 0) + 1;
  }

  const payload = evt.payload && typeof evt.payload === "object" ? evt.payload : evt;

  switch (type) {
    case "semantic_intent_parsed": {
      acc.semanticIntent.count += 1;
      const meta = payload.meta || {};
      const confidence = Number(meta.confidenceScore);
      if (Number.isFinite(confidence)) {
        acc.semanticIntent.confidenceSum += confidence;
        acc.semanticIntent.confidenceSamples += 1;
      }
      if (Number.isFinite(confidence) && confidence < 0.6) {
        acc.semanticIntent.lowConfidence += 1;
      }
      if (meta.intentType) {
        const t = String(meta.intentType);
        acc.semanticIntent.intentTypes[t] =
          (acc.semanticIntent.intentTypes[t] || 0) + 1;
      }
      if (payload.schemaCheck && payload.schemaCheck.valid === false) {
        acc.semanticIntent.schemaInvalid += 1;
      }
      if (payload.fallbackUsed) acc.semanticIntent.fallbackUsed += 1;
      const sc = Number(payload.suggestionCount);
      if (Number.isFinite(sc) && sc > 0) {
        acc.semanticIntent.suggestionsProvidedCount += 1;
        acc.semanticIntent.suggestionsTotal += sc;
      }
      break;
    }
    case "source_hit_count": {
      const src = String(payload.source || "unknown");
      acc.sourceHits.total[src] = (acc.sourceHits.total[src] || 0) + 1;
      if (payload.isZero) {
        acc.sourceHits.zeroHits[src] = (acc.sourceHits.zeroHits[src] || 0) + 1;
      }
      if (payload.isOverHit) {
        acc.sourceHits.overHits[src] = (acc.sourceHits.overHits[src] || 0) + 1;
      }
      break;
    }
    case "filter_drop_ratio": {
      acc.filterDrop.count += 1;
      const ratio = Number(payload.dropRatio);
      if (Number.isFinite(ratio)) acc.filterDrop.dropRatioSum += ratio;
      if (payload.highDropFlag) acc.filterDrop.highDrop += 1;
      break;
    }
    case "overlap_summary": {
      acc.overlap.count += 1;
      const ratio = Number(payload.overlapRatio);
      if (Number.isFinite(ratio)) acc.overlap.overlapSum += ratio;
      if (payload.lowOverlapFlag) acc.overlap.lowOverlap += 1;
      break;
    }
    case "mesh_validation": {
      acc.mesh.count += 1;
      if (payload.hallucinationFlag) acc.mesh.hallucinationFlag += 1;
      if (Number.isFinite(Number(payload.totalMeshTerms))) {
        acc.mesh.totalMeshTerms += Number(payload.totalMeshTerms);
      }
      if (Number.isFinite(Number(payload.invalidCount))) {
        acc.mesh.invalidCount += Number(payload.invalidCount);
      }
      if (payload.observeOnly) acc.mesh.observeOnly += 1;
      break;
    }
    case "source_probe_counts": {
      acc.probeCounts.count += 1;
      const sources = payload.sources && typeof payload.sources === "object"
        ? payload.sources
        : {};
      for (const [src, stat] of Object.entries(sources)) {
        if (stat && stat.outOfRange) {
          acc.probeCounts.outOfRangeBySource[src] =
            (acc.probeCounts.outOfRangeBySource[src] || 0) + 1;
        }
      }
      break;
    }
    case "paraphrase_edited": {
      acc.paraphrase.editCount += 1;
      break;
    }
    case "query_plan_built": {
      acc.queryPlan.count += 1;
      if (payload.hasCoreQuery) acc.queryPlan.hasCoreQuery += 1;
      if (payload.fallbackUsed) acc.queryPlan.fallbackUsed += 1;
      const adapted = Array.isArray(payload.adaptedSources) ? payload.adaptedSources : [];
      adapted.forEach((src) => {
        const key = String(src);
        acc.queryPlan.adaptedSources[key] =
          (acc.queryPlan.adaptedSources[key] || 0) + 1;
      });
      break;
    }
    default:
      break;
  }
}

function finalize(acc) {
  if (acc.semanticIntent.confidenceSamples > 0) {
    acc.semanticIntent.avgConfidence = Number(
      (acc.semanticIntent.confidenceSum / acc.semanticIntent.confidenceSamples).toFixed(4)
    );
  }
  if (acc.filterDrop.count > 0) {
    acc.filterDrop.avgDropRatio = Number(
      (acc.filterDrop.dropRatioSum / acc.filterDrop.count).toFixed(4)
    );
  }
  if (acc.overlap.count > 0) {
    acc.overlap.avgOverlapRatio = Number(
      (acc.overlap.overlapSum / acc.overlap.count).toFixed(4)
    );
  }
  return acc;
}

async function readFile(file, eventFilter, acc) {
  const stream = fs.createReadStream(file, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const evt = JSON.parse(trimmed);
      if (eventFilter && String(evt.type || "") !== eventFilter) continue;
      updateAcc(acc, evt);
    } catch (_err) {
      // Skip malformed lines.
    }
  }
}

function formatText(summary, files) {
  const lines = [];
  lines.push(`QuickPubMed telemetry summary`);
  lines.push(`Files scanned: ${files.length}`);
  lines.push(`Total events: ${summary.totalEvents}`);
  lines.push("");
  lines.push("Event counts:");
  for (const [type, count] of Object.entries(summary.eventCounts).sort()) {
    lines.push(`  ${type}: ${count}`);
  }
  lines.push("");
  lines.push("Semantic intent:");
  lines.push(`  Count: ${summary.semanticIntent.count}`);
  lines.push(`  Fallback used: ${summary.semanticIntent.fallbackUsed}`);
  lines.push(`  Schema invalid: ${summary.semanticIntent.schemaInvalid}`);
  lines.push(`  Low confidence (<0.6): ${summary.semanticIntent.lowConfidence}`);
  lines.push(`  Avg confidence: ${summary.semanticIntent.avgConfidence}`);
  lines.push(
    `  Suggestions provided: ${summary.semanticIntent.suggestionsProvidedCount}/${summary.semanticIntent.count}` +
      ` (total suggestions: ${summary.semanticIntent.suggestionsTotal})`
  );
  const intentTypeEntries = Object.entries(summary.semanticIntent.intentTypes);
  if (intentTypeEntries.length > 0) {
    lines.push(`  Intent types:`);
    intentTypeEntries
      .sort((a, b) => b[1] - a[1])
      .forEach(([t, n]) => lines.push(`    ${t}: ${n}`));
  }
  lines.push("");
  lines.push("Source hit counts:");
  const allSources = new Set([
    ...Object.keys(summary.sourceHits.total),
    ...Object.keys(summary.sourceHits.zeroHits),
    ...Object.keys(summary.sourceHits.overHits),
  ]);
  allSources.forEach((src) => {
    lines.push(
      `  ${src}: total=${summary.sourceHits.total[src] || 0}, zero=${
        summary.sourceHits.zeroHits[src] || 0
      }, over=${summary.sourceHits.overHits[src] || 0}`
    );
  });
  lines.push("");
  lines.push("Filter drop ratio:");
  lines.push(`  Count: ${summary.filterDrop.count}`);
  lines.push(`  High drop flag (>threshold): ${summary.filterDrop.highDrop}`);
  lines.push(`  Avg drop ratio: ${summary.filterDrop.avgDropRatio}`);
  lines.push("");
  lines.push("Overlap summary:");
  lines.push(`  Count: ${summary.overlap.count}`);
  lines.push(`  Low overlap flag: ${summary.overlap.lowOverlap}`);
  lines.push(`  Avg overlap ratio: ${summary.overlap.avgOverlapRatio}`);
  lines.push("");
  lines.push("MeSH validation:");
  lines.push(`  Count: ${summary.mesh.count}`);
  lines.push(`  Hallucination flag: ${summary.mesh.hallucinationFlag}`);
  lines.push(`  Total mesh terms seen: ${summary.mesh.totalMeshTerms}`);
  lines.push(`  Invalid mesh terms: ${summary.mesh.invalidCount}`);
  lines.push(`  Observe-only runs: ${summary.mesh.observeOnly}`);
  lines.push("");
  lines.push("Probe counts (out-of-range by source):");
  for (const [src, n] of Object.entries(summary.probeCounts.outOfRangeBySource).sort()) {
    lines.push(`  ${src}: ${n}`);
  }
  lines.push("");
  lines.push("Paraphrase chip edits:");
  lines.push(`  Count: ${summary.paraphrase.editCount}`);
  lines.push("");
  lines.push("Query plan:");
  lines.push(`  Count: ${summary.queryPlan.count}`);
  lines.push(`  With coreQuery: ${summary.queryPlan.hasCoreQuery}`);
  lines.push(`  Fallback used: ${summary.queryPlan.fallbackUsed}`);
  for (const [src, n] of Object.entries(summary.queryPlan.adaptedSources).sort()) {
    lines.push(`  Adapted source ${src}: ${n}`);
  }
  lines.push("");
  lines.push("Prompt versions:");
  for (const [hash, n] of Object.entries(summary.promptVersions).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${hash}: ${n}`);
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv);
  const files = listTelemetryFiles(args.dir, args.days);
  if (files.length === 0) {
    console.error(`No telemetry files found in ${args.dir} (last ${args.days} days).`);
    process.exit(1);
  }
  const acc = createAccumulator();
  for (const file of files) {
    await readFile(file, args.event, acc);
  }
  const summary = finalize(acc);
  if (args.json) {
    console.log(JSON.stringify({ files, summary }, null, 2));
  } else {
    console.log(formatText(summary, files));
  }
}

main().catch((err) => {
  console.error("summarize-telemetry failed:", err);
  process.exit(1);
});

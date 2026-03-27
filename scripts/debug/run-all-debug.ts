/**
 * Orchestrateur — lance tous les scripts de diagnostic en séquence.
 *
 * Usage :
 *   pnpm tsx scripts/debug/run-all-debug.ts <dossierId>
 *
 * Chaque script est exécuté via `pnpm tsx` avec le même dossierId.
 * Les outputs sont écrits dans scripts/debug/output/.
 */

import { spawnSync } from "child_process";
import { join } from "path";

const dossierId = process.argv[2];
if (!dossierId) {
  console.error("Usage : pnpm tsx scripts/debug/run-all-debug.ts <dossierId>");
  process.exit(1);
}

const SCRIPTS = [
  "debug-bilan.ts",
  "debug-compte-de-resultat.ts",
  "debug-synthese.ts",
  "debug-sig.ts",
  "debug-budget.ts",
  "debug-caf.ts",
  "debug-seuil.ts",
  "debug-bfr.ts",
  "debug-tableau-financement.ts",
  "debug-plan-financement.ts",
  "debug-ratios.ts",
  "debug-tva.ts",
  "debug-tresorerie.ts",
  "debug-saisie.ts",
];

const ROOT = join(process.cwd());
const debugDir = join(ROOT, "scripts", "debug");

type Result = {
  script: string;
  ok: boolean;
  durationMs: number;
  output: string;
};

const results: Result[] = [];

console.log(`\n${"═".repeat(60)}`);
console.log(`  Orchestrateur diagnostics — Dossier : ${dossierId}`);
console.log(`${"═".repeat(60)}\n`);

for (const script of SCRIPTS) {
  const name = script.replace(".ts", "");
  process.stdout.write(`▶ ${name.padEnd(35)}`);

  const t0 = Date.now();
  const res = spawnSync(
    process.execPath, // node.exe courant
    ["--import", "tsx", join(debugDir, script), dossierId],
    {
      cwd: ROOT,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, TSX_TSCONFIG_PATH: join(ROOT, "tsconfig.json") },
    },
  );
  const durationMs = Date.now() - t0;
  const ok = res.status === 0 || (res.status === null && !res.error);
  const output = (res.stdout ?? "") + (res.stderr ?? "");

  results.push({ script: name, ok, durationMs, output });

  if (ok) {
    console.log(`✅  ${(durationMs / 1000).toFixed(1)} s`);
  } else {
    console.log(`❌  ${(durationMs / 1000).toFixed(1)} s`);
    // Afficher les dernières lignes de l'erreur
    const errLines = output.trim().split("\n").slice(-5).join("\n    ");
    console.log(`    ${errLines}`);
  }
}

// ─── Récapitulatif ────────────────────────────────────────────────────────────

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;
const totalMs = results.reduce((s, r) => s + r.durationMs, 0);

console.log(`\n${"─".repeat(60)}`);
console.log(`  Résultat : ${passed}/${results.length} OK · ${failed} KO · ${(totalMs / 1000).toFixed(1)} s total`);
console.log(`${"─".repeat(60)}`);

if (failed > 0) {
  console.log(`\n⚠  Scripts en erreur :`);
  for (const r of results.filter((r) => !r.ok)) {
    console.log(`  - ${r.script}`);
  }
  process.exit(1);
} else {
  console.log(`\n✅  Tous les diagnostics générés dans scripts/debug/output/`);
}

import "dotenv/config";
import { prisma, Prisma } from "@/lib/prisma";

const dossierId = process.argv[2] ?? "cmo8p96h40001schp26dfdknv";
const FIX = process.argv[3] === "--fix";

async function main() {

const scenario = await prisma.scenario.findFirst({ where: { dossierId } });
if (!scenario) { console.log("Pas de scenario pour dossierId:", dossierId); process.exit(1); }
console.log("scenarioId:", scenario.id);

const sal = await prisma.ligneSalarie.findMany({
  where: { scenarioId: scenario.id },
  select: { id: true, libelle: true, hypothese: true, montantN: true, actif: true, detailMensuelN: true },
});
const dir = await prisma.ligneDirigeant.findMany({
  where: { scenarioId: scenario.id },
  select: { id: true, libelle: true, hypothese: true, montantN: true, actif: true, detailMensuelN: true },
});
const tns = await prisma.ligneCotisationTNS.findMany({
  where: { scenarioId: scenario.id },
  select: { id: true, libelle: true, hypothese: true, montantN: true },
});

console.log("\n=== SALARIES ===");
for (const s of sal) {
  console.log(`  [${s.actif ? "actif" : "inactif"}] ${s.libelle} | hypothese=${JSON.stringify(s.hypothese)} | montantN=${s.montantN} | detailMensuelN=${s.detailMensuelN ? "SET:" + JSON.stringify(s.detailMensuelN).substring(0,80) : "null"}`);
}

console.log("\n=== DIRIGEANTS ===");
for (const d of dir) {
  console.log(`  [${d.actif ? "actif" : "inactif"}] ${d.libelle} | hypothese=${JSON.stringify(d.hypothese)} | montantN=${d.montantN} | detailMensuelN=${d.detailMensuelN ? "SET:" + JSON.stringify(d.detailMensuelN).substring(0,80) : "null"}`);
}

console.log("\n=== TNS (2 premiers) ===");
for (const t of tns.slice(0, 2)) {
  console.log(`  ${t.libelle} | hypothese=${JSON.stringify(t.hypothese)} | montantN=${t.montantN}`);
}

if (FIX) {
  console.log("\n=== CORRECTION EN COURS ===");
  // Fix dirigeants : hypothese PESSIMISTE/OPTIMISTE → COMMUNE si le dossier n'utilise pas les scénarios
  for (const d of dir) {
    const detail = d.detailMensuelN as Record<string, number[]> | null;
    const detailTotal = detail ? (detail.brutIndividuel ?? []).reduce((s: number, v: number) => s + v, 0) : 0;
    const needsHypotheseFix = d.hypothese !== "COMMUNE" && d.hypothese !== "REALISTE";
    const needsDetailFix = detail !== null && detailTotal === 0;

    if (needsHypotheseFix || needsDetailFix) {
      await prisma.ligneDirigeant.update({
        where: { id: d.id },
        data: {
          ...(needsHypotheseFix ? { hypothese: "COMMUNE" } : {}),
          ...(needsDetailFix ? { detailMensuelN: Prisma.DbNull } : {}),
        },
      });
      console.log(`  Dirigeant "${d.libelle}" : ${needsHypotheseFix ? `hypothese ${d.hypothese}→COMMUNE` : ""} ${needsDetailFix ? "detailMensuelN→null" : ""}`);
    }
  }
  console.log("  Corrections appliquées.");
} else {
  console.log("\n→ Ajoutez '--fix' pour corriger automatiquement les incohérences.");
}

  await prisma.$disconnect();
}

main().catch(console.error);

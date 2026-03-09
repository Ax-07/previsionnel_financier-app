$f = "e:\Projet Nextjs\Clone RCA previsionnel\previsionnel-app\src\app\actions\controle\plan-financement.ts"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$c = $c.Replace("`r`n", "`n")

# 1. Fix import: add buildFinCalc, remove calcIS
$c = $c.Replace(
    'import { n, calcIS } from "@/lib/finance/utils";',
    "import { n } from `"@/lib/finance/utils`";`nimport { buildFinCalc } from `"@/lib/finance/calculs`";"
)

# 2. Simplify destructuring (keep only what is still needed after P&L block removal)
$oldDestructuring = @"
  const {
    dateDemarrage: dateDemarrageDate,
    isIS,
    apports,
    subventions,
    emprunts,
    immobilisations,
    activites,
    fournitures,
    services,
    impotsTaxes,
    salaries,
    dirigeants,
    cotisationsTNS,
    taxesSalaires,
    provisions,
    chargesFinancieres,
    chargesExceptionnelles,
    reprisesProduits,
    financiersProduits,
    exceptionnelsProduits,
    subventionsExploitation,
    parametresIS,
    ajustementsFiscaux,
  } = data;
"@

$newDestructuring = @"
  const {
    dateDemarrage: dateDemarrageDate,
    isIS,
    apports,
    subventions,
    emprunts,
    immobilisations,
    activites,
    fournitures,
    services,
  } = data;
"@

$c = $c.Replace($oldDestructuring, $newDestructuring)

# 3. Remove the entire P&L section (6. CAF) and replace with buildFinCalc + minimal actifsActifs
$dash = [char]0x2500
$sec6Mark = "  // $dash$dash 6. CAF"
$sec7Mark = "  // $dash$dash 7. BFR"
$sec6Idx = $c.IndexOf($sec6Mark)
$sec7Idx = $c.IndexOf($sec7Mark)

if ($sec6Idx -lt 0 -or $sec7Idx -lt 0) {
    Write-Error "Section markers not found! sec6=$sec6Idx, sec7=$sec7Idx"
    exit 1
}

$before = $c.Substring(0, $sec6Idx)
$after  = $c.Substring($sec7Idx)

$insert = @"
  // ── 6. CAF

  const actifsActifs = activites.filter((a) => a.actif !== false);
  const fc = buildFinCalc(data, data.dateDemarrage);

  const caf: Record<PfYearKey, number> = {
    y0: 0,
    y1: fc.caf.y1,
    y2: fc.caf.y2,
    y3: fc.caf.y3,
  };

"@

$c = $before + $insert + $after

# 4. Replace stocksMatieres definition (uses fc.stockFinal) — regex approach for line-ending safety
$c = [System.Text.RegularExpressions.Regex]::Replace(
    $c,
    '(?s)(// Stocks de mati[^\n]*\n  const stocksMatieres: YAcc3 = \{).+?(\};)',
    "// Stocks de mati`u{00E8}res (encours)`n  const stocksMatieres: YAcc3 = {`n    y1: fc.stockFinal.y1,`n    y2: fc.stockFinal.y2,`n    y3: fc.stockFinal.y3,`n  };"
)
if (-not $c.Contains("fc.stockFinal.y1")) {
    Write-Warning "stocksMatieres replacement may have failed"
}

# 5. Fix dettesImpots: impotsTotal -> fc.impotsTaxes
$c = $c.Replace(
    "    y1: (impotsTotal.y1 * 30) / 365,`n    y2: (impotsTotal.y2 * 30) / 365,`n    y3: (impotsTotal.y3 * 30) / 365,",
    "    y1: (fc.impotsTaxes.y1 * 30) / 365,`n    y2: (fc.impotsTaxes.y2 * 30) / 365,`n    y3: (fc.impotsTaxes.y3 * 30) / 365,"
)

# 6. Fix dettesPersonnel: chargesPersonnel -> fc.chargesPersonnel.total
$c = $c.Replace(
    "    y1: (chargesPersonnel.y1 * 30) / 365,`n    y2: (chargesPersonnel.y2 * 30) / 365,`n    y3: (chargesPersonnel.y3 * 30) / 365,",
    "    y1: (fc.chargesPersonnel.total.y1 * 30) / 365,`n    y2: (fc.chargesPersonnel.total.y2 * 30) / 365,`n    y3: (fc.chargesPersonnel.total.y3 * 30) / 365,"
)

# 7. Fix dettesIS: isParAnnee -> fc.isParAnnee
$c = $c.Replace(
    "    y1: isIS ? isParAnnee.y1 / 4 : 0,`n    y2: isIS ? isParAnnee.y2 / 4 : 0,`n    y3: isIS ? isParAnnee.y3 / 4 : 0,",
    "    y1: isIS ? fc.isParAnnee.y1 / 4 : 0,`n    y2: isIS ? fc.isParAnnee.y2 / 4 : 0,`n    y3: isIS ? fc.isParAnnee.y3 / 4 : 0,"
)

[System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
Write-Host "plan-financement.ts migrated successfully"

$f = "e:\Projet Nextjs\Clone RCA previsionnel\previsionnel-app\src\app\actions\controle\ratios.ts"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
# Normalize line endings
$c = $c.Replace("`r`n", "`n")

# Step 1: Remove from chargesExternes block through interetsEmprunts declaration (keep capitalRestantDu)
$c = [System.Text.RegularExpressions.Regex]::Replace($c, "(?s)  const chargesExternes: YAcc = \{.+?(?=  const capitalRestantDu)", "")

Write-Host "After step 1: length=$($c.Length)"
Write-Host "capitalRestantDu present: $($c.Contains('const capitalRestantDu'))"

# Step 2: Simplify emprunts loop - remove interetsEmprunts and toExerciceKey parts
$old2 = "      const yk = toExerciceKey(dl);`n      if (yk) {`n        const interet = n(ligne.interesMois) + n(ligne.assuranceMois);`n        interetsEmprunts[yk] += interet;`n      }`n"
$new2 = ""
$c = $c.Replace($old2, $new2)
Write-Host "After step 2: length=$($c.Length)"
Write-Host "toExerciceKey present: $($c.Contains('toExerciceKey'))"

# Step 3: Remove ebe through caf block (everything after emprunts loop closing brace up to immoNette)
# Find the position of const ebe
$ebeIdx = $c.IndexOf("  const ebe: YAcc = {")
$bilanIdx = $c.IndexOf("  // Immobilisations nettes")
Write-Host "ebe=$ebeIdx bilan=$bilanIdx"

if ($ebeIdx -gt 0 -and $bilanIdx -gt $ebeIdx) {
  $fcAliases = "  // Agregats depuis buildFinCalc`n  const chargesPersonnel = fc.chargesPersonnel.total;`n  const impotsTotal = fc.impotsTaxes;`n  const isParAnnee = fc.isParAnnee;`n  const resultatNet = fc.resNet;`n  const caf = fc.caf;`n`n"
  $c = $c.Substring(0, $ebeIdx) + $fcAliases + $c.Substring($bilanIdx)
  Write-Host "After step 3: length=$($c.Length)"
}

# Write back
[System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
Write-Host "File written successfully"

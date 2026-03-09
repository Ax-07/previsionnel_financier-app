$f = "e:\Projet Nextjs\Clone RCA previsionnel\previsionnel-app\src\app\actions\controle\tableau-financement.ts"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$c = $c.Replace("`r`n", "`n")

# 1. Add buildFinCalc import
$c = $c.Replace(
    'import { n } from "@/lib/finance/utils";',
    "import { n } from `"@/lib/finance/utils`";`nimport { buildFinCalc } from `"@/lib/finance/calculs`";"
)

# 2. Simplify destructuring (keep only what sections 5, 7, 8 need)
# Use IndexOf approach to avoid heredoc CRLF issues
$dStart = $c.IndexOf("  const {`n    dateDemarrage: dateDemarrageDate,`n    isIS,`n    apports,")
$dEnd   = $c.IndexOf("  } = data;", $dStart) + "  } = data;".Length

if ($dStart -lt 0) {
    Write-Warning "Destructuring start not found - trying CRLF version"
    $dStart = $c.IndexOf("  const {`r`n    dateDemarrage: dateDemarrageDate,")
}

if ($dStart -lt 0 -or $dEnd -lt 0) {
    Write-Error "Destructuring not found!"
    exit 1
}

$newDestructuring = "  const {`n    dateDemarrage: dateDemarrageDate,`n    apports,`n    subventions,`n    emprunts,`n    immobilisations,`n  } = data;"
$c = $c.Substring(0, $dStart) + $newDestructuring + $c.Substring($dEnd)

# 3. Remove the entire P&L section (6. CAF) and replace with buildFinCalc
$dash = [char]0x2500
$sec6Mark = "  // $dash$dash 6. CAF"
$sec7Mark = "  // $dash$dash 7. EMPLOIS"
$sec6Idx = $c.IndexOf($sec6Mark)
$sec7Idx = $c.IndexOf($sec7Mark)

if ($sec6Idx -lt 0 -or $sec7Idx -lt 0) {
    Write-Error "Section markers not found! sec6=$sec6Idx sec7=$sec7Idx"
    exit 1
}

$before = $c.Substring(0, $sec6Idx)
$after  = $c.Substring($sec7Idx)

$dd = "$dash$dash"
$insert = "  // $dd 6. CAF`n`n  const fc = buildFinCalc(data, data.dateDemarrage);`n`n  const caf: Record<TfYearKey, number> = {`n    y0: 0,`n    y1: fc.caf.y1,`n    y2: fc.caf.y2,`n    y3: fc.caf.y3,`n  };`n`n"

$c = $before + $insert + $after

[System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
Write-Host "tableau-financement.ts migrated successfully"

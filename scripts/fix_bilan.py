
path = r'e:/Projet Nextjs/Clone RCA previsionnel/previsionnel-app/src/app/actions/controle/bilan.ts'
f = open(path, 'r', encoding='utf-8')
lines = f.readlines()
f.close()

# 1. Fix import (line 3, 0-indexed: 2)
lines[2] = 'import { fetchScenarioData } from "@/lib/finance/fetch-scenario";\n'

new_block = [
  '  const data = await fetchScenarioData(dossierId);\n',
  '  const {\n',
  '    dateDemarrage: dateDemarrageDate,\n',
  '    isIS,\n',
  '    apports,\n',
  '    emprunts,\n',
  '    immobilisations,\n',
  '    activites,\n',
  '    fournitures,\n',
  '    services,\n',
  '    impotsTaxes,\n',
  '    salaries,\n',
  '    dirigeants,\n',
  '    cotisationsTNS,\n',
  '    taxesSalaires,\n',
  '    provisions,\n',
  '    chargesFinancieres,\n',
  '    chargesExceptionnelles,\n',
  '    reprisesProduits,\n',
  '    financiersProduits,\n',
  '    exceptionnelsProduits,\n',
  '    subventionsExploitation,\n',
  '    parametresIS,\n',
  '  } = data;\n',
  '  const immobilisationsActives = immobilisations.filter((i) => i.actif !== false);\n',
  '  const anneeDebut = dateDemarrageDate.getFullYear();\n',
  '  const moisDebut = dateDemarrageDate.getMonth(); // 0-based (0 = jan)\n',
  '  const fmtEx = (start: number) =>\n',
  '    moisDebut === 0 ? `${start}` : `${start}\u2013${start + 1}`;\n',
  '  const { toExerciceKey, exBorne1, exBorne2, exBorne3 } = makeExerciceHelpers(dateDemarrageDate);\n',
  '  const yearLabels: Record<BilanYearKey, string> = {\n',
  '    y1: fmtEx(anneeDebut),\n',
  '    y2: fmtEx(anneeDebut + 1),\n',
  '    y3: fmtEx(anneeDebut + 2),\n',
  '  };\n',
]

# Lines 85-181 = 0-indexed 84-180
result = lines[:84] + new_block + lines[181:]

# Replace all for-loops using immobilisations with immobilisationsActives
result = [l.replace('for (const immo of immobilisations)', 'for (const immo of immobilisationsActives)') for l in result]

f = open(path, 'w', encoding='utf-8', newline='')
f.writelines(result)
f.close()
print(f'Done, lines: {len(result)}')

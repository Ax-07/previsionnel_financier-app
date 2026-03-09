
path = r'e:/Projet Nextjs/Clone RCA previsionnel/previsionnel-app/src/app/actions/controle/tva.ts'
f = open(path, 'r', encoding='utf-8')
lines = f.readlines()
f.close()

# Fix import (0-indexed line 2)
lines[2] = 'import { fetchScenarioData } from "@/lib/finance/fetch-scenario";\n'

new_block = [
    '  const data = await fetchScenarioData(dossierId);\n',
    '  const {\n',
    '    dateDemarrage,\n',
    '    scenario,\n',
    '    activites,\n',
    '    fournitures,\n',
    '    services,\n',
    '    immobilisations,\n',
    '  } = data;\n',
    '\n',
    '  const anneeDebut = dateDemarrage.getFullYear();\n',
    '  const moisDebut = dateDemarrage.getMonth(); // 0-based\n',
    '\n',
    '  const yearLabels: Record<YearKey, string> = {\n',
    '    y1: `${anneeDebut}\u2013${anneeDebut + 1}`,\n',
    '    y2: `${anneeDebut + 1}\u2013${anneeDebut + 2}`,\n',
    '    y3: `${anneeDebut + 2}\u2013${anneeDebut + 3}`,\n',
    '  };\n',
    '\n',
    '  const FR_MONTHS = [\n',
    '    "Jan", "F\u00e9v", "Mar", "Avr", "Mai", "Jun",\n',
    '    "Jul", "Ao\u00fb", "Sep", "Oct", "Nov", "D\u00e9c",\n',
    '  ];\n',
    '\n',
    '  function buildMonthLabels(startMonth: number, startYear: number): string[] {\n',
    '    return Array.from({ length: 12 }, (_, i) => {\n',
    '      const m = (startMonth + i) % 12;\n',
    '      const y = startYear + Math.floor((startMonth + i) / 12);\n',
    '      return `${FR_MONTHS[m]} ${y}`;\n',
    '    });\n',
    '  }\n',
    '\n',
    '  const monthLabels: Record<YearKey, string[]> = {\n',
    '    y1: buildMonthLabels(moisDebut, anneeDebut),\n',
    '    y2: buildMonthLabels(moisDebut, anneeDebut + 1),\n',
    '    y3: buildMonthLabels(moisDebut, anneeDebut + 2),\n',
    '  };\n',
    '\n',
    '  const regimeTVA = scenario.parametres?.regimeTVA ?? "REEL_NORMAL";\n',
    '  const isFranchise = regimeTVA === "FRANCHISE";\n',
    '\n',
    '  // En franchise, pas de TVA \u00e0 d\u00e9clarer\n',
    '  if (isFranchise) {\n',
    '    return { yearLabels, monthLabels, rows: [], periodicite: "mensuel", isFranchise: true };\n',
    '  }\n',
    '\n',
    '  const periodicite = (\n',
    '    (scenario.parametres?.periodiciteDeclarationTVA ?? "mensuel") === "trimestriel"\n',
    '      ? "trimestriel"\n',
    '      : "mensuel"\n',
    '  ) as "mensuel" | "trimestriel";\n',
    '\n',
]

# Lines 159-243 are 0-indexed 158-242 (dossier fetch through Promise.all end)
result = lines[:158] + new_block + lines[243:]

f = open(path, 'w', encoding='utf-8', newline='')
f.writelines(result)
f.close()
print(f'Done: {len(lines)} -> {len(result)} lines')

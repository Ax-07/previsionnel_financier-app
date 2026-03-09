"""
Refactoring script: replace Prisma boilerplate in contrôle action files
with fetchScenarioData + destructuring.

Pattern for each file:
  1. Replace import { prisma } with import { fetchScenarioData }
  2. Replace block A (dossier fetch) with the new call + destructuring
  3. Keep block B (file-specific helpers that use dateDemarrageDate etc.)
  4. Remove block C (scenario fetch + Promise.all)
"""
import os

BASE = r'e:/Projet Nextjs/Clone RCA previsionnel/previsionnel-app/src/app/actions/controle'

def make_block(dest_vars: list[str], extra_after: list[str]) -> list[str]:
    """Build the fetchScenarioData + destructuring lines."""
    lines = [
        '  const data = await fetchScenarioData(dossierId);\n',
        '  const {\n',
    ]
    for v in dest_vars:
        lines.append(f'    {v},\n')
    lines.append('  } = data;\n')
    lines.extend(extra_after)
    return lines


def refactor(
    filename: str,
    dest_vars: list[str],
    extra_after: list[str],
    # 1-indexed line numbers (from survey output)
    dossier_start_1: int,   # first line of dossier block (inclusive)
    dossier_end_1: int,     # last line of initial-vars block (inclusive), 0 if no helpers
    scenario_start_1: int,  # first line of scenario block (inclusive)
    promiseall_end_1: int,  # last line of Promise.all (the ]);) (inclusive)
):
    fp = os.path.join(BASE, filename)
    with open(fp, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Fix import (0-indexed line 2)
    lines[2] = 'import { fetchScenarioData } from "@/lib/finance/fetch-scenario";\n'

    # Convert to 0-indexed
    ds = dossier_start_1 - 1   # first line of dossier block (inclusive)
    de = dossier_end_1 - 1     # last line of initial-vars (inclusive), -1 means no helpers section
    sc = scenario_start_1 - 1  # first line of scenario block (inclusive)
    pe = promiseall_end_1 - 1  # last line (the ]);) (inclusive)

    new_block = make_block(dest_vars, extra_after)

    if dossier_end_1 > 0:
        # Has helpers section: replace dossier block, KEEP helpers, REMOVE scenario+PA
        # Part A: before dossier block
        # Part B: new block
        # Part C: helpers = lines[de+1 .. sc-1]
        # Part D: rest after Promise.all
        helpers = lines[de + 1:sc]  # lines between dossier end and scenario start
        result = lines[:ds] + new_block + helpers + lines[pe + 1:]
    else:
        # No helpers: replace dossier..promiseall_end in one shot
        result = lines[:ds] + new_block + lines[pe + 1:]

    with open(fp, 'w', encoding='utf-8', newline='') as f:
        f.writelines(result)

    print(f'{filename}: {len(lines)} -> {len(result)} lines OK')


# ─────────────────────────────────────────────────────────────────────────────
# caf.ts
# dossier: L59-L69, helpers: L70-L111, scenario+PA: L112-L184
# ─────────────────────────────────────────────────────────────────────────────
refactor(
    'caf.ts',
    dest_vars=[
        'dateDemarrage: dateDemarrageDate',
        'isIS',
        'activites',
        'subventionsExploitation: subventions',
        'fournitures',
        'services',
        'impotsTaxes: impots',
        'salaries',
        'dirigeants',
        'cotisationsTNS',
        'taxesSalaires',
        'immobilisations',
        'provisions',
        'chargesFinancieres',
        'chargesExceptionnelles',
        'reprisesProduits',
        'financiersProduits',
        'exceptionnelsProduits',
        'emprunts',
        'parametresIS',
        'ajustementsFiscaux',
    ],
    extra_after=[
        '  const anneeDebut = dateDemarrageDate.getFullYear();\n',
        '  const moisDebut = dateDemarrageDate.getMonth(); // 0-based (0=jan, 6=juil)\n',
    ],
    dossier_start_1=59, dossier_end_1=69,
    scenario_start_1=112, promiseall_end_1=184,
)

# ─────────────────────────────────────────────────────────────────────────────
# seuil-rentabilite.ts
# dossier+yearLabels: L106-L120 (no helpers), scenario+PA: L121-L192
# ─────────────────────────────────────────────────────────────────────────────
refactor(
    'seuil-rentabilite.ts',
    dest_vars=[
        'dateDemarrage: dateDemarrageDate',
        'isIS',
        'activites',
        'subventionsExploitation: subventions',
        'fournitures',
        'services',
        'impotsTaxes: impots',
        'salaries',
        'dirigeants',
        'cotisationsTNS',
        'taxesSalaires',
        'immobilisations',
        'provisions',
        'chargesFinancieres',
        'chargesExceptionnelles',
        'exceptionnelsProduits',
        'financiersProduits',
        'emprunts',
        'parametresIS',
    ],
    extra_after=[
        '  const anneeDebut = dateDemarrageDate.getFullYear();\n',
        '  const yearLabels: Record<YearKey, string> = {\n',
        '    y1: `${anneeDebut}\u2013${anneeDebut + 1}`,\n',
        '    y2: `${anneeDebut + 1}\u2013${anneeDebut + 2}`,\n',
        '    y3: `${anneeDebut + 2}\u2013${anneeDebut + 3}`,\n',
        '  };\n',
    ],
    dossier_start_1=106, dossier_end_1=0,  # no helpers
    scenario_start_1=121, promiseall_end_1=192,
)

# ─────────────────────────────────────────────────────────────────────────────
# plan-financement.ts
# dossier: L80-L90, helpers: L91-L123, scenario+PA: L124-L197
# ─────────────────────────────────────────────────────────────────────────────
refactor(
    'plan-financement.ts',
    dest_vars=[
        'dateDemarrage: dateDemarrageDate',
        'isIS',
        'apports',
        'subventions',
        'emprunts',
        'immobilisations',
        'activites',
        'fournitures',
        'services',
        'impotsTaxes',
        'salaries',
        'dirigeants',
        'cotisationsTNS',
        'taxesSalaires',
        'provisions',
        'chargesFinancieres',
        'chargesExceptionnelles',
        'reprisesProduits',
        'financiersProduits',
        'exceptionnelsProduits',
        'subventionsExploitation',
        'parametresIS',
        'ajustementsFiscaux',
    ],
    extra_after=[
        '  const anneeDebut = dateDemarrageDate.getFullYear();\n',
        '  const moisDebut = dateDemarrageDate.getMonth(); // 0-based\n',
    ],
    dossier_start_1=80, dossier_end_1=90,
    scenario_start_1=124, promiseall_end_1=197,
)

# ─────────────────────────────────────────────────────────────────────────────
# tableau-financement.ts
# dossier: L66-L76, helpers: L77-L109, scenario+PA: L110-L184
# ─────────────────────────────────────────────────────────────────────────────
refactor(
    'tableau-financement.ts',
    dest_vars=[
        'dateDemarrage: dateDemarrageDate',
        'isIS',
        'apports',
        'subventions',
        'emprunts',
        'immobilisations',
        'activites',
        'fournitures',
        'services',
        'impotsTaxes',
        'salaries',
        'dirigeants',
        'cotisationsTNS',
        'taxesSalaires',
        'provisions',
        'chargesFinancieres',
        'chargesExceptionnelles',
        'reprisesProduits',
        'financiersProduits',
        'exceptionnelsProduits',
        'parametresIS',
        'ajustementsFiscaux',
    ],
    extra_after=[
        '  const anneeDebut = dateDemarrageDate.getFullYear();\n',
        '  const moisDebut = dateDemarrageDate.getMonth(); // 0-based\n',
    ],
    dossier_start_1=66, dossier_end_1=76,
    scenario_start_1=110, promiseall_end_1=184,
)

# ─────────────────────────────────────────────────────────────────────────────
# tresorerie.ts
# dossier: L329-L338, helpers: L339-L365, scenario+PA: L366-L450
# ─────────────────────────────────────────────────────────────────────────────
refactor(
    'tresorerie.ts',
    dest_vars=[
        'dateDemarrage: dateDemarrageDate',
        'isIS',
        'apports',
        'subventions',
        'emprunts',
        'immobilisations',
        'activites',
        'fournitures',
        'services',
        'impotsTaxes',
        'salaries',
        'dirigeants',
        'cotisationsTNS',
        'taxesSalaires',
        'parametresIS',
        'subventionsExploitation',
        'diversEncaissements',
        'diversDecaissements',
        'diversRemboursementsCC',
    ],
    extra_after=[
        '  const anneeDebut = dateDemarrageDate.getFullYear();\n',
        '  const moisDebut = dateDemarrageDate.getMonth(); // 0-based\n',
    ],
    dossier_start_1=329, dossier_end_1=338,
    scenario_start_1=366, promiseall_end_1=450,
)

# ─────────────────────────────────────────────────────────────────────────────
# budget.ts
# dossier: L181-L191, helpers: L192-L218, scenario+PA: L219-L289
# ─────────────────────────────────────────────────────────────────────────────
refactor(
    'budget.ts',
    dest_vars=[
        'dateDemarrage: dateDemarrageDate',
        'isIS',
        'activites',
        'subventionsExploitation: subventions',
        'fournitures',
        'services',
        'impotsTaxes: impots',
        'salaries',
        'dirigeants',
        'cotisationsTNS',
        'taxesSalaires',
        'immobilisations',
        'provisions',
        'chargesFinancieres',
        'chargesExceptionnelles',
        'reprisesProduits',
        'financiersProduits',
        'exceptionnelsProduits',
    ],
    extra_after=[
        '  const anneeDebut = dateDemarrageDate.getFullYear();\n',
        '  const moisDebut = dateDemarrageDate.getMonth(); // 0-based\n',
    ],
    dossier_start_1=181, dossier_end_1=191,
    scenario_start_1=219, promiseall_end_1=289,
)

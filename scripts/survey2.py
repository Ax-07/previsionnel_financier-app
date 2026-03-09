"""
Survey each controle file to find the exact structure, looking for:
- Import line
- dossier block (start/end)
- local helpers between dossier and scenario (to be KEPT)
- scenario block (start/end)
- Promise.all block (start/end)
"""
import os

base = r'e:/Projet Nextjs/Clone RCA previsionnel/previsionnel-app/src/app/actions/controle'
files = ['caf.ts', 'seuil-rentabilite.ts', 'plan-financement.ts',
         'tableau-financement.ts', 'tresorerie.ts', 'budget.ts']

for fn in files:
    fp = os.path.join(base, fn)
    with open(fp, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Find key line numbers (1-indexed)
    dossier_start = None
    dossier_end = None   # Line after dossier block (the moisDebut= or anneeDebut= line range)
    scenario_start = None
    promiseall_end = None

    for i, l in enumerate(lines):
        if 'prisma.dossier.findUnique' in l and dossier_start is None:
            dossier_start = i + 1  # 1-indexed
        if 'const scenario = await prisma.scenario.findFirst' in l and scenario_start is None:
            scenario_start = i + 1
        if 'const moisDebut = ' in l and dossier_start and scenario_start is None and dossier_end is None:
            dossier_end = i + 1
        if '  ]);' in l:
            promiseall_end = i + 1

    print(f'\n{fn} ({len(lines)} lines):')
    print(f'  dossier_start=L{dossier_start}, dossier_end=L{dossier_end}')
    print(f'  scenario_start=L{scenario_start}, promiseall_end=L{promiseall_end}')
    if dossier_end and scenario_start:
        print(f'  helpers to keep: L{dossier_end+1}-L{scenario_start-1}')
        for i in range(dossier_end, scenario_start - 1):
            print(f'    {i+1}: {lines[i].rstrip()[:80]}')

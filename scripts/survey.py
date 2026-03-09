import os

base = r'e:/Projet Nextjs/Clone RCA previsionnel/previsionnel-app/src/app/actions/controle'
files = ['tresorerie.ts', 'caf.ts', 'seuil-rentabilite.ts', 'plan-financement.ts', 'tableau-financement.ts', 'tva.ts', 'budget.ts']

for fn in files:
    fp = os.path.join(base, fn)
    if os.path.exists(fp):
        with open(fp, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        has_prisma = any('import { prisma }' in l for l in lines)
        dossier_line = next((i+1 for i, l in enumerate(lines) if 'prisma.dossier.findUnique' in l), None)
        promiseall_start = next((i+1 for i, l in enumerate(lines) if '  ] = await Promise.all([' in l), None)
        # Find the closing ]);  after the Promise.all
        close_line = None
        if promiseall_start:
            for i in range(promiseall_start, len(lines)):
                if lines[i].strip() == ']);':
                    close_line = i + 1
                    break
        # Show destructuring variables
        if promiseall_start and close_line:
            dest_start = None
            for i in range((dossier_line or 1) - 1, promiseall_start):
                if '  const [' in lines[i]:
                    dest_start = i + 1
                    break
            if dest_start:
                vars_list = []
                for i in range(dest_start, promiseall_start - 1):
                    v = lines[i].strip().rstrip(',')
                    if v and not v.startswith('//'):
                        vars_list.append(v)
        print(f'{fn}: lines={len(lines)}, prisma={has_prisma}, dossier=L{dossier_line}, promiseAllEnd=L{close_line}')
        if promiseall_start and close_line:
            print(f'  vars: {", ".join(vars_list)}')
    else:
        print(f'{fn}: NOT FOUND')

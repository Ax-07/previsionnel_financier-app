"""Fix UTF-8/CP1252 mojibake in form TSX files."""
import os


def fix_mojibake(text: str) -> str:
    result = []
    i = 0
    n = len(text)
    while i < n:
        fixed = False
        for length in (3, 2):
            if i + length > n:
                continue
            segment = text[i : i + length]
            try:
                encoded = segment.encode("cp1252")
                decoded = encoded.decode("utf-8")
                if decoded != segment:
                    result.append(decoded)
                    i += length
                    fixed = True
                    break
            except (UnicodeEncodeError, UnicodeDecodeError):
                pass
        if not fixed:
            result.append(text[i])
            i += 1
    return "".join(result)


base = r"e:\Projet Nextjs\Clone RCA previsionnel\previsionnel-app\src\components\app\forms"
files = [
    os.path.join(base, "charges", "charges-form.tsx"),
    os.path.join(base, "autres-charges", "autres-charges-form.tsx"),
    os.path.join(base, "autres-produits", "autres-produits-form.tsx"),
]

for path in files:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    fixed = fix_mojibake(content)
    if fixed != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(fixed)
        print(f"CORRIGE: {os.path.basename(path)}")
    else:
        print(f"OK (pas de changement): {os.path.basename(path)}")

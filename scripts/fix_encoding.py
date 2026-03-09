"""Fix UTF-8/CP1252 mojibake in all .ts files under src/app/actions/controle.

Strategy: process text char-by-char, trying to re-encode sequences of length
3, 2, then 1 as cp1252 and decode as utf-8.  Chars that can't encode to cp1252
(already-correct Unicode like box-drawing U+2500) are kept as-is.
"""
import os
import glob


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


folder = r"e:\Projet Nextjs\Clone RCA previsionnel\previsionnel-app\src\app\actions\controle"
files = sorted(glob.glob(os.path.join(folder, "*.ts")))

for path in files:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    fixed = fix_mojibake(content)
    if fixed != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(fixed)
        print(f"CORRIGE: {os.path.basename(path)}")
    else:
        print(f"OK: {os.path.basename(path)}")

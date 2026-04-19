# Diagnostic CAF (Capacité d'Autofinancement) — Dossier `cmmjoradm0001kohp15on2xe1`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`buildCafRows` · `buildFinCalc`


## 0. Paramètres généraux

| Paramètre | Valeur |
| --- | --- |
| Dossier ID | `cmmjoradm0001kohp15on2xe1` |
| Date de démarrage | 01/05/2026 |
| Mois de début | Mai (5) |
| Exercices | 2026–2027 · 2027–2028 · 2028–2029 |
| Immobilisations actives | 12 |
| Provisions | 0 |
| Reprises sur produits | 0 |
| Emprunts | 1 |


## 1. Tableau CAF complet


| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Résultat de l'exercice | 5 048,48 | 7 292,14 | 10 543,76 |
| + Dotations aux amortissements | 3 417,20 | 3 417,20 | 3 417,20 |
| \  Fond de commerce (materiel) | 3 106,00 | 3 106,00 | 3 106,00 |
| \  Enseigne et communication | 100,00 | 100,00 | 100,00 |
| \  Caisse enregistreuse (airkitchen) | 88,90 | 88,90 | 88,90 |
| \  Meuble pizza | 122,30 | 122,30 | 122,30 |
| **= Capacité d'autofinancement (CAF)** | 8 465,68 | 10 709,33 | 13 960,96 |
| − Remboursement du capital des emprunts | 6 936,24 | 7 862,08 | 8 182,42 |
| \  CIC | 6 936,24 | 7 862,08 | 8 182,42 |
| **= Autofinancement net** | 1 529,44 | 2 847,25 | 5 778,54 |


## 2. Vérifications de cohérence


| Check | Statut | Détail |
| --- | :---: | --- |
| CAF = Résultat net + Dot.amort + Dot.prov − Reprises (2026–2027) | ✅ | 8 465,68 ≟ 8 465,68 |
| CAF = Résultat net + Dot.amort + Dot.prov − Reprises (2027–2028) | ✅ | 10 709,33 ≟ 10 709,33 |
| CAF = Résultat net + Dot.amort + Dot.prov − Reprises (2028–2029) | ✅ | 13 960,96 ≟ 13 960,96 |
| Autofinancement = CAF − Remboursement capital (2026–2027) | ✅ | 1 529,44 ≟ 1 529,44 |
| Autofinancement = CAF − Remboursement capital (2027–2028) | ✅ | 2 847,25 ≟ 2 847,25 |
| Autofinancement = CAF − Remboursement capital (2028–2029) | ✅ | 5 778,54 ≟ 5 778,54 |
| Dot.amort total = Σ par immobilisation (2026–2027) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot.amort total = Σ par immobilisation (2027–2028) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot.amort total = Σ par immobilisation (2028–2029) | ✅ | 3 417,20 ≟ 3 417,20 |
| Remboursement capital total = Σ par emprunt (2026–2027) | ✅ | 6 936,24 ≟ 6 936,24 |
| Remboursement capital total = Σ par emprunt (2027–2028) | ✅ | 7 862,08 ≟ 7 862,08 |
| Remboursement capital total = Σ par emprunt (2028–2029) | ✅ | 8 182,42 ≟ 8 182,42 |
| Résultat net — CafRows vs FinCalc (2026–2027) | ✅ | 5 048,48 ≟ 5 048,48 |
| Résultat net — CafRows vs FinCalc (2027–2028) | ✅ | 7 292,14 ≟ 7 292,14 |
| Résultat net — CafRows vs FinCalc (2028–2029) | ✅ | 10 543,76 ≟ 10 543,76 |
| Dot. amortissements — CafRows vs FinCalc (2026–2027) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot. amortissements — CafRows vs FinCalc (2027–2028) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot. amortissements — CafRows vs FinCalc (2028–2029) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot. provisions — CafRows vs FinCalc (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| Dot. provisions — CafRows vs FinCalc (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Dot. provisions — CafRows vs FinCalc (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| Reprises — CafRows vs FinCalc (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| Reprises — CafRows vs FinCalc (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Reprises — CafRows vs FinCalc (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| CAF brute — CafRows vs FinCalc (2026–2027) | ✅ | 8 465,68 ≟ 8 465,68 |
| CAF brute — CafRows vs FinCalc (2027–2028) | ✅ | 10 709,33 ≟ 10 709,33 |
| CAF brute — CafRows vs FinCalc (2028–2029) | ✅ | 13 960,96 ≟ 13 960,96 |
| Remboursement capital — CafRows vs FinCalc (2026–2027) | ✅ | 6 936,24 ≟ 6 936,24 |
| Remboursement capital — CafRows vs FinCalc (2027–2028) | ✅ | 7 862,08 ≟ 7 862,08 |
| Remboursement capital — CafRows vs FinCalc (2028–2029) | ✅ | 8 182,42 ≟ 8 182,42 |
| Autofinancement net — CafRows vs FinCalc (2026–2027) | ✅ | 1 529,44 ≟ 1 529,44 |
| Autofinancement net — CafRows vs FinCalc (2027–2028) | ✅ | 2 847,25 ≟ 2 847,25 |
| Autofinancement net — CafRows vs FinCalc (2028–2029) | ✅ | 5 778,54 ≟ 5 778,54 |


## 3. Détail dotations par immobilisation


| Immobilisation | Nature | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: |
| Fond de commerce (materiel) | CORPOREL | 3 106,00 | 3 106,00 | 3 106,00 |
| Enseigne et communication | CORPOREL | 100,00 | 100,00 | 100,00 |
| Caisse enregistreuse (airkitchen) | CORPOREL | 88,90 | 88,90 | 88,90 |
| Meuble pizza | CORPOREL | 122,30 | 122,30 | 122,30 |

| **Dot. amort. totales** | | **3 417,20** | **3 417,20** | **3 417,20** |


## 4. Détail provisions & reprises



## 5. Remboursement capital par emprunt


| Emprunt | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| CIC | 6 936,24 | 7 862,08 | 8 182,42 |
| **Total** | **6 936,24** | **7 862,08** | **8 182,42** |


## 6. Récapitulatif


| Bilan | Valeur |
| --- | --- |
| Total checks | 33 |
| ✅ OK | 33 |
| ❌ KO | 0 |

> ✅ **Tous les checks sont OK.** Les calculs de la CAF sont cohérents.


### 6.1 Indicateurs clés


| Indicateur | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Résultat net | 5 048,48 | 7 292,14 | 10 543,76 |
| + Dot. amortissements | 3 417,20 | 3 417,20 | 3 417,20 |
| + Dot. provisions | 0,00 | 0,00 | 0,00 |
| − Reprises | 0,00 | 0,00 | 0,00 |
| **= CAF brute** | **8 465,68** | **10 709,33** | **13 960,96** |
| − Remboursement capital | 6 936,24 | 7 862,08 | 8 182,42 |
| **= Autofinancement net** | **1 529,44** | **2 847,25** | **5 778,54** |

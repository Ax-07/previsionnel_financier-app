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
| Résultat de l'exercice | 5 453,29 | 7 201,01 | 10 467,36 |
| + Dotations aux amortissements | 3 417,20 | 3 417,20 | 3 417,20 |
| \  Fond de commerce (materiel) | 3 106,00 | 3 106,00 | 3 106,00 |
| \  Enseigne et communication | 100,00 | 100,00 | 100,00 |
| \  Caisse enregistreuse (airkitchen) | 88,90 | 88,90 | 88,90 |
| \  Meuble pizza | 122,30 | 122,30 | 122,30 |
| **= Capacité d'autofinancement (CAF)** | 8 870,49 | 10 618,21 | 13 884,56 |
| − Remboursement du capital des emprunts | 8 092,26 | 9 172,43 | 9 546,14 |
| \  CIC | 8 092,26 | 9 172,43 | 9 546,14 |
| **= Autofinancement net** | 778,23 | 1 445,78 | 4 338,42 |


## 2. Vérifications de cohérence


| Check | Statut | Détail |
| --- | :---: | --- |
| CAF = Résultat net + Dot.amort + Dot.prov − Reprises (2026–2027) | ✅ | 8 870,49 ≟ 8 870,49 |
| CAF = Résultat net + Dot.amort + Dot.prov − Reprises (2027–2028) | ✅ | 10 618,21 ≟ 10 618,21 |
| CAF = Résultat net + Dot.amort + Dot.prov − Reprises (2028–2029) | ✅ | 13 884,56 ≟ 13 884,56 |
| Autofinancement = CAF − Remboursement capital (2026–2027) | ✅ | 778,23 ≟ 778,23 |
| Autofinancement = CAF − Remboursement capital (2027–2028) | ✅ | 1 445,78 ≟ 1 445,78 |
| Autofinancement = CAF − Remboursement capital (2028–2029) | ✅ | 4 338,42 ≟ 4 338,42 |
| Dot.amort total = Σ par immobilisation (2026–2027) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot.amort total = Σ par immobilisation (2027–2028) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot.amort total = Σ par immobilisation (2028–2029) | ✅ | 3 417,20 ≟ 3 417,20 |
| Remboursement capital total = Σ par emprunt (2026–2027) | ✅ | 8 092,26 ≟ 8 092,26 |
| Remboursement capital total = Σ par emprunt (2027–2028) | ✅ | 9 172,43 ≟ 9 172,43 |
| Remboursement capital total = Σ par emprunt (2028–2029) | ✅ | 9 546,14 ≟ 9 546,14 |
| Résultat net — CafRows vs FinCalc (2026–2027) | ✅ | 5 453,29 ≟ 5 453,29 |
| Résultat net — CafRows vs FinCalc (2027–2028) | ✅ | 7 201,01 ≟ 7 201,01 |
| Résultat net — CafRows vs FinCalc (2028–2029) | ✅ | 10 467,36 ≟ 10 467,36 |
| Dot. amortissements — CafRows vs FinCalc (2026–2027) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot. amortissements — CafRows vs FinCalc (2027–2028) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot. amortissements — CafRows vs FinCalc (2028–2029) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot. provisions — CafRows vs FinCalc (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| Dot. provisions — CafRows vs FinCalc (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Dot. provisions — CafRows vs FinCalc (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| Reprises — CafRows vs FinCalc (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| Reprises — CafRows vs FinCalc (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Reprises — CafRows vs FinCalc (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| CAF brute — CafRows vs FinCalc (2026–2027) | ✅ | 8 870,49 ≟ 8 870,49 |
| CAF brute — CafRows vs FinCalc (2027–2028) | ✅ | 10 618,21 ≟ 10 618,21 |
| CAF brute — CafRows vs FinCalc (2028–2029) | ✅ | 13 884,56 ≟ 13 884,56 |
| Remboursement capital — CafRows vs FinCalc (2026–2027) | ✅ | 8 092,26 ≟ 8 092,26 |
| Remboursement capital — CafRows vs FinCalc (2027–2028) | ✅ | 9 172,43 ≟ 9 172,43 |
| Remboursement capital — CafRows vs FinCalc (2028–2029) | ✅ | 9 546,14 ≟ 9 546,14 |
| Autofinancement net — CafRows vs FinCalc (2026–2027) | ✅ | 778,23 ≟ 778,23 |
| Autofinancement net — CafRows vs FinCalc (2027–2028) | ✅ | 1 445,78 ≟ 1 445,78 |
| Autofinancement net — CafRows vs FinCalc (2028–2029) | ✅ | 4 338,42 ≟ 4 338,42 |


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
| CIC | 8 092,26 | 9 172,43 | 9 546,14 |
| **Total** | **8 092,26** | **9 172,43** | **9 546,14** |


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
| Résultat net | 5 453,29 | 7 201,01 | 10 467,36 |
| + Dot. amortissements | 3 417,20 | 3 417,20 | 3 417,20 |
| + Dot. provisions | 0,00 | 0,00 | 0,00 |
| − Reprises | 0,00 | 0,00 | 0,00 |
| **= CAF brute** | **8 870,49** | **10 618,21** | **13 884,56** |
| − Remboursement capital | 8 092,26 | 9 172,43 | 9 546,14 |
| **= Autofinancement net** | **778,23** | **1 445,78** | **4 338,42** |

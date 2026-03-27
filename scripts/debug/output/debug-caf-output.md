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
| Résultat de l'exercice | 5 904,02 | 5 028,86 | 8 417,52 |
| + Dotations aux amortissements | 3 583,70 | 3 583,70 | 3 583,70 |
| \  Meuble pizza | 149,90 | 149,90 | 149,90 |
| \  Enseigne et communication | 150,00 | 150,00 | 150,00 |
| \  Caisse enregistreuse (airkitchen) | 177,80 | 177,80 | 177,80 |
| \  Fond de commerce (materiel) | 3 106,00 | 3 106,00 | 3 106,00 |
| **= Capacité d'autofinancement (CAF)** | 9 487,72 | 8 612,55 | 12 001,22 |
| − Remboursement du capital des emprunts | 6 936,24 | 7 862,08 | 8 182,42 |
| \  CIC | 6 936,24 | 7 862,08 | 8 182,42 |
| **= Autofinancement net** | 2 551,48 | 750,47 | 3 818,80 |


## 2. Vérifications de cohérence


| Check | Statut | Détail |
| --- | :---: | --- |
| CAF = Résultat net + Dot.amort + Dot.prov − Reprises (2026–2027) | ✅ | 9 487,72 ≟ 9 487,72 |
| CAF = Résultat net + Dot.amort + Dot.prov − Reprises (2027–2028) | ✅ | 8 612,55 ≟ 8 612,55 |
| CAF = Résultat net + Dot.amort + Dot.prov − Reprises (2028–2029) | ✅ | 12 001,22 ≟ 12 001,22 |
| Autofinancement = CAF − Remboursement capital (2026–2027) | ✅ | 2 551,48 ≟ 2 551,48 |
| Autofinancement = CAF − Remboursement capital (2027–2028) | ✅ | 750,47 ≟ 750,47 |
| Autofinancement = CAF − Remboursement capital (2028–2029) | ✅ | 3 818,80 ≟ 3 818,80 |
| Dot.amort total = Σ par immobilisation (2026–2027) | ✅ | 3 583,70 ≟ 3 583,70 |
| Dot.amort total = Σ par immobilisation (2027–2028) | ✅ | 3 583,70 ≟ 3 583,70 |
| Dot.amort total = Σ par immobilisation (2028–2029) | ✅ | 3 583,70 ≟ 3 583,70 |
| Remboursement capital total = Σ par emprunt (2026–2027) | ✅ | 6 936,24 ≟ 6 936,24 |
| Remboursement capital total = Σ par emprunt (2027–2028) | ✅ | 7 862,08 ≟ 7 862,08 |
| Remboursement capital total = Σ par emprunt (2028–2029) | ✅ | 8 182,42 ≟ 8 182,42 |
| Résultat net — CafRows vs FinCalc (2026–2027) | ✅ | 5 904,02 ≟ 5 904,02 |
| Résultat net — CafRows vs FinCalc (2027–2028) | ✅ | 5 028,86 ≟ 5 028,86 |
| Résultat net — CafRows vs FinCalc (2028–2029) | ✅ | 8 417,52 ≟ 8 417,52 |
| Dot. amortissements — CafRows vs FinCalc (2026–2027) | ✅ | 3 583,70 ≟ 3 583,70 |
| Dot. amortissements — CafRows vs FinCalc (2027–2028) | ✅ | 3 583,70 ≟ 3 583,70 |
| Dot. amortissements — CafRows vs FinCalc (2028–2029) | ✅ | 3 583,70 ≟ 3 583,70 |
| Dot. provisions — CafRows vs FinCalc (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| Dot. provisions — CafRows vs FinCalc (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Dot. provisions — CafRows vs FinCalc (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| Reprises — CafRows vs FinCalc (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| Reprises — CafRows vs FinCalc (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Reprises — CafRows vs FinCalc (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| CAF brute — CafRows vs FinCalc (2026–2027) | ✅ | 9 487,72 ≟ 9 487,72 |
| CAF brute — CafRows vs FinCalc (2027–2028) | ✅ | 8 612,55 ≟ 8 612,55 |
| CAF brute — CafRows vs FinCalc (2028–2029) | ✅ | 12 001,22 ≟ 12 001,22 |
| Remboursement capital — CafRows vs FinCalc (2026–2027) | ✅ | 6 936,24 ≟ 6 936,24 |
| Remboursement capital — CafRows vs FinCalc (2027–2028) | ✅ | 7 862,08 ≟ 7 862,08 |
| Remboursement capital — CafRows vs FinCalc (2028–2029) | ✅ | 8 182,42 ≟ 8 182,42 |
| Autofinancement net — CafRows vs FinCalc (2026–2027) | ✅ | 2 551,48 ≟ 2 551,48 |
| Autofinancement net — CafRows vs FinCalc (2027–2028) | ✅ | 750,47 ≟ 750,47 |
| Autofinancement net — CafRows vs FinCalc (2028–2029) | ✅ | 3 818,80 ≟ 3 818,80 |


## 3. Détail dotations par immobilisation


| Immobilisation | Nature | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: |
| Meuble pizza | CORPOREL | 149,90 | 149,90 | 149,90 |
| Enseigne et communication | CORPOREL | 150,00 | 150,00 | 150,00 |
| Caisse enregistreuse (airkitchen) | CORPOREL | 177,80 | 177,80 | 177,80 |
| Fond de commerce (materiel) | CORPOREL | 3 106,00 | 3 106,00 | 3 106,00 |

| **Dot. amort. totales** | | **3 583,70** | **3 583,70** | **3 583,70** |


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
| Résultat net | 5 904,02 | 5 028,86 | 8 417,52 |
| + Dot. amortissements | 3 583,70 | 3 583,70 | 3 583,70 |
| + Dot. provisions | 0,00 | 0,00 | 0,00 |
| − Reprises | 0,00 | 0,00 | 0,00 |
| **= CAF brute** | **9 487,72** | **8 612,55** | **12 001,22** |
| − Remboursement capital | 6 936,24 | 7 862,08 | 8 182,42 |
| **= Autofinancement net** | **2 551,48** | **750,47** | **3 818,80** |

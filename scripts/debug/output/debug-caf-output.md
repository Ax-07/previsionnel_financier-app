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
| Résultat de l'exercice | 8 216,01 | 10 689,42 | 14 182,15 |
| + Dotations aux amortissements | 3 417,20 | 3 417,20 | 3 417,20 |
| \  Fond de commerce (materiel) | 3 106,00 | 3 106,00 | 3 106,00 |
| \  Enseigne et communication | 100,00 | 100,00 | 100,00 |
| \  Caisse enregistreuse (airkitchen) | 88,90 | 88,90 | 88,90 |
| \  Meuble pizza | 122,30 | 122,30 | 122,30 |
| **= Capacité d'autofinancement (CAF)** | 11 633,21 | 14 106,62 | 17 599,34 |
| − Remboursement du capital des emprunts | 8 092,26 | 9 172,43 | 9 546,14 |
| \  CIC | 8 092,26 | 9 172,43 | 9 546,14 |
| **= Autofinancement net** | 3 540,95 | 4 934,19 | 8 053,20 |


## 2. Vérifications de cohérence


| Check | Statut | Détail |
| --- | :---: | --- |
| CAF = Résultat net + Dot.amort + Dot.prov − Reprises (2026–2027) | ✅ | 11 633,21 ≟ 11 633,21 |
| CAF = Résultat net + Dot.amort + Dot.prov − Reprises (2027–2028) | ✅ | 14 106,62 ≟ 14 106,62 |
| CAF = Résultat net + Dot.amort + Dot.prov − Reprises (2028–2029) | ✅ | 17 599,34 ≟ 17 599,34 |
| Autofinancement = CAF − Remboursement capital (2026–2027) | ✅ | 3 540,95 ≟ 3 540,95 |
| Autofinancement = CAF − Remboursement capital (2027–2028) | ✅ | 4 934,19 ≟ 4 934,19 |
| Autofinancement = CAF − Remboursement capital (2028–2029) | ✅ | 8 053,20 ≟ 8 053,20 |
| Dot.amort total = Σ par immobilisation (2026–2027) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot.amort total = Σ par immobilisation (2027–2028) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot.amort total = Σ par immobilisation (2028–2029) | ✅ | 3 417,20 ≟ 3 417,20 |
| Remboursement capital total = Σ par emprunt (2026–2027) | ✅ | 8 092,26 ≟ 8 092,26 |
| Remboursement capital total = Σ par emprunt (2027–2028) | ✅ | 9 172,43 ≟ 9 172,43 |
| Remboursement capital total = Σ par emprunt (2028–2029) | ✅ | 9 546,14 ≟ 9 546,14 |
| Résultat net — CafRows vs FinCalc (2026–2027) | ✅ | 8 216,01 ≟ 8 216,01 |
| Résultat net — CafRows vs FinCalc (2027–2028) | ✅ | 10 689,42 ≟ 10 689,42 |
| Résultat net — CafRows vs FinCalc (2028–2029) | ✅ | 14 182,15 ≟ 14 182,15 |
| Dot. amortissements — CafRows vs FinCalc (2026–2027) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot. amortissements — CafRows vs FinCalc (2027–2028) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot. amortissements — CafRows vs FinCalc (2028–2029) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dot. provisions — CafRows vs FinCalc (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| Dot. provisions — CafRows vs FinCalc (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Dot. provisions — CafRows vs FinCalc (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| Reprises — CafRows vs FinCalc (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| Reprises — CafRows vs FinCalc (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Reprises — CafRows vs FinCalc (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| CAF brute — CafRows vs FinCalc (2026–2027) | ✅ | 11 633,21 ≟ 11 633,21 |
| CAF brute — CafRows vs FinCalc (2027–2028) | ✅ | 14 106,62 ≟ 14 106,62 |
| CAF brute — CafRows vs FinCalc (2028–2029) | ✅ | 17 599,34 ≟ 17 599,34 |
| Remboursement capital — CafRows vs FinCalc (2026–2027) | ✅ | 8 092,26 ≟ 8 092,26 |
| Remboursement capital — CafRows vs FinCalc (2027–2028) | ✅ | 9 172,43 ≟ 9 172,43 |
| Remboursement capital — CafRows vs FinCalc (2028–2029) | ✅ | 9 546,14 ≟ 9 546,14 |
| Autofinancement net — CafRows vs FinCalc (2026–2027) | ✅ | 3 540,95 ≟ 3 540,95 |
| Autofinancement net — CafRows vs FinCalc (2027–2028) | ✅ | 4 934,19 ≟ 4 934,19 |
| Autofinancement net — CafRows vs FinCalc (2028–2029) | ✅ | 8 053,20 ≟ 8 053,20 |


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
| Résultat net | 8 216,01 | 10 689,42 | 14 182,15 |
| + Dot. amortissements | 3 417,20 | 3 417,20 | 3 417,20 |
| + Dot. provisions | 0,00 | 0,00 | 0,00 |
| − Reprises | 0,00 | 0,00 | 0,00 |
| **= CAF brute** | **11 633,21** | **14 106,62** | **17 599,34** |
| − Remboursement capital | 8 092,26 | 9 172,43 | 9 546,14 |
| **= Autofinancement net** | **3 540,95** | **4 934,19** | **8 053,20** |

# Diagnostic Synthèse Prévisionnelle — Dossier `cmo8p96h40001schp26dfdknv`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`buildSigData` · `calcSeuil` · `buildBfrRows` · `buildBilanRows` · `buildTresorerieRows` · `buildFinCalc`


## 0. Paramètres généraux

| Paramètre | Valeur |
| --- | --- |
| Dossier ID | `cmo8p96h40001schp26dfdknv` |
| Date de démarrage | 01/05/2026 |
| Année de début | 2026 |
| Mois de début | Mai (5) |
| Régime fiscal | IS |
| Régime TVA | REEL_NORMAL |
| Franchise TVA | Non |
| Mois paiement salaires | M+1 |
| Exercices | 2026–2027 · 2027–2028 · 2028–2029 |
| Activités | 9 |
| Salariés | 2 |
| Immobilisations actives | 13 |
| Emprunts | 1 |


## 1. Soldes Intermédiaires de Gestion (SIG)

*Tous les montants sont en € HT. Le % CA est par rapport au chiffre d'affaires HT.*


### 1.1 SIG avec % CA

| Désignation | 2026–2027 € | 2026–2027 % CA | 2027–2028 € | 2027–2028 % CA | 2028–2029 € | 2028–2029 % CA |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ****Chiffre d'affaires**** | 0,00 | — | 0,00 | — | 0,00 | — |
| Ventes + Production réelle | 0,00 | — | 0,00 | — | 0,00 | — |
| Marge globale | 0,00 | — | 0,00 | — | 0,00 | — |
| Valeur ajoutée | 39 385,05 | 37.5 % | 43 034,21 | 39.0 % | 46 475,24 | 40.1 % |
| Excédent brut d'exploitation (EBE) | 30 698,80 | 29.2 % | 32 371,53 | 29.4 % | 35 812,56 | 30.9 % |
| Résultat d'exploitation | 27 281,60 | 26.0 % | 28 954,33 | 26.3 % | 32 395,36 | 28.0 % |
| Résultat financier | -2 865,96 | -2.7 % | -2 482,56 | -2.3 % | -2 080,82 | -1.8 % |
| Résultat courant | 24 415,64 | 23.3 % | 26 471,77 | 24.0 % | 30 314,54 | 26.2 % |
| ****Résultat de l'exercice**** | 20 753,29 | 19.8 % | 22 501,01 | 20.4 % | 25 767,36 | 22.3 % |
| ****CAF**** | 24 170,49 | 23.0 % | 25 918,21 | 23.5 % | 29 184,56 | 25.2 % |


### 1.2 Vérifications de cohérence SIG

| Check | Statut | Détail |
| --- | :---: | --- |
| CAF ≥ Résultat net (2026–2027) | ✅ | CAF = 24 170,49 € | ResNet = 20 753,29 € |
| CAF ≥ Résultat net (2027–2028) | ✅ | CAF = 25 918,21 € | ResNet = 22 501,01 € |
| CAF ≥ Résultat net (2028–2029) | ✅ | CAF = 29 184,56 € | ResNet = 25 767,36 € |
| EBE ≥ Résultat exploitation (2026–2027) | ✅ | EBE = 30 698,80 € | ResExpl = 27 281,60 € |
| EBE ≥ Résultat exploitation (2027–2028) | ✅ | EBE = 32 371,53 € | ResExpl = 28 954,33 € |
| EBE ≥ Résultat exploitation (2028–2029) | ✅ | EBE = 35 812,56 € | ResExpl = 32 395,36 € |


## 2. Seuil de Rentabilité Économique


| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| ****Ventes + Production réelle**** | 104 997,00 | 110 246,85 | 115 759,19 |
| Coûts variables | 29 164,95 | 27.8 % | 30 623,20 | 27.8 % | 32 154,36 | 27.8 % |
| Taux de marge sur coût variable | 72.2 % | 72.2 % | 72.2 % |
| Coûts fixes | 48 550,45 | 46.2 % | 50 669,32 | 46.0 % | 51 209,47 | 44.2 % |
| ****Seuil de rentabilité**** | 67 222,92 | 70 156,70 | 70 904,59 |
| Excédent / insuffisance | 37 774,08 | 40 090,15 | 44 854,60 |
| Point mort (jours) | 234 j | 232 j | 224 j |


### 2.1 Vérifications de cohérence seuil

| Check | Statut | Détail |
| --- | :---: | --- |
| Excédent = Ventes − Seuil (2026–2027) | ✅ | 37 774,08 ≟ 104 997,00 − 67 222,92 = 37 774,08 |
| Excédent = Ventes − Seuil (2027–2028) | ✅ | 40 090,15 ≟ 110 246,85 − 70 156,70 = 40 090,15 |
| Excédent = Ventes − Seuil (2028–2029) | ✅ | 44 854,60 ≟ 115 759,19 − 70 904,59 = 44 854,60 |
| Seuil = CF / Taux MCV (2026–2027) | ✅ | 67 222,92 ≟ 48 550,45 / 72.2 % = 67 222,92 |
| Seuil = CF / Taux MCV (2027–2028) | ✅ | 70 156,70 ≟ 50 669,32 / 72.2 % = 70 156,70 |
| Seuil = CF / Taux MCV (2028–2029) | ✅ | 70 904,59 ≟ 51 209,47 / 72.2 % = 70 904,59 |


## 3. Besoin en Fonds de Roulement (BFR)


*BFR = photo de la situation à la clôture, basée sur le dernier mois de l'exercice.*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Stocks de matières | 1 298,71 | 1 275,97 | 1 339,76 |
| Crédit de TVA | 179,61 | 0,00 | 0,00 |
| Total des besoins | 1 478,32 | 1 275,97 | 1 339,76 |
| Dettes fournisseurs (achats matières) | 2 366,41 | 2 485,38 | 2 609,65 |
| Dettes charges externes | 2 283,38 | 2 309,02 | 2 335,68 |
| Dettes impôts et taxes | 0,00 | 0,00 | 0,00 |
| Dettes personnel | 2 088,60 | 2 223,72 | 2 223,72 |
| TVA à payer | 0,00 | 161,44 | 190,06 |
| Impôt sur les sociétés (dette) | 915,59 | 992,69 | 1 136,80 |
| Total des ressources | 7 653,98 | 8 172,26 | 8 495,90 |
| Variation du BFR | -10 678,96 | -720,63 | -259,85 |
| **Besoin en fonds de roulement (BFR)** | -6 175,66 | -6 896,29 | -7 156,14 |


### 3.1 Récapitulatif BFR

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| ****BFR total**** | -6 175,66 | -6 896,29 | -7 156,14 |


## 4. Équilibre Financier (Fonds de Roulement)


*FR = Capitaux propres + Emprunts (LMT) − Immobilisations nettes*
*Solde trésorerie annuel = FR − BFR*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Capitaux propres | 40 753,29 | 63 254,30 | 89 021,67 |
| Emprunts (LMT) | 61 907,74 | 52 735,31 | 43 189,17 |
| Immobilisations nettes | 73 496,79 | 70 079,59 | 66 662,39 |
| ****Fonds de roulement (FR)**** | 29 164,24 | 45 910,02 | 65 548,44 |
| ****BFR**** | -6 175,66 | -6 896,29 | -7 156,14 |
| ****Solde de trésorerie (Annuel)**** | 35 339,91 | 52 806,31 | 72 704,58 |


### 4.1 Vérifications de cohérence FR

| Check | Statut | Détail |
| --- | :---: | --- |
| FR = CP + Emprunts − Immo (2026–2027) | ✅ | 29 164,24 ≟ 40 753,29 + 61 907,74 − 73 496,79 = 29 164,24 |
| Solde annuel = FR − BFR (2026–2027) | ✅ | 35 339,91 ≟ 29 164,24 − -6 175,66 = 35 339,91 |
| FR = CP + Emprunts − Immo (2027–2028) | ✅ | 45 910,02 ≟ 63 254,30 + 52 735,31 − 70 079,59 = 45 910,02 |
| Solde annuel = FR − BFR (2027–2028) | ✅ | 52 806,31 ≟ 45 910,02 − -6 896,29 = 52 806,31 |
| FR = CP + Emprunts − Immo (2028–2029) | ✅ | 65 548,44 ≟ 89 021,67 + 43 189,17 − 66 662,39 = 65 548,44 |
| Solde annuel = FR − BFR (2028–2029) | ✅ | 72 704,58 ≟ 65 548,44 − -7 156,14 = 72 704,58 |


## 5. Trésorerie



### 5.1 Synthèse annuelle trésorerie

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Total encaissements | 0,00 | 0,00 | 0,00 |
| Total décaissements | 0,00 | 0,00 | 0,00 |
| Variation de trésorerie | 17 339,91 | -533,59 | 1 898,27 |
| ****Solde trésorerie fin d'exercice (M12)**** | 17 339,91 | 16 806,31 | 18 704,58 |


### 5.2 Vérification solde M12 vs solde annuel (FR−BFR)


*Note : le solde FR−BFR est un solde comptable statique (bilan). Le solde M12 est le solde*
*de trésorerie mensuel à fin décembre calculé par le tableau de trésorerie.*
*Ces deux valeurs doivent être proches mais peuvent différer selon les décalages de paiement.*

| Exercice | Solde M12 (trésorerie) | Solde Annuel (FR−BFR) | Écart |
| --- | ---: | ---: | ---: |
| 2026–2027 | 17 339,91 | 35 339,91 | -18 000,00 |
| 2027–2028 | 16 806,31 | 52 806,31 | -36 000,00 |
| 2028–2029 | 18 704,58 | 72 704,58 | -54 000,00 |


### 5.3 Soldes mensuels de trésorerie


**2026–2027**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 103 133,33 | 80 833,55 | 22 299,78 | 22 299,78 |
| Fév | 12 716,03 | 12 440,66 | 275,37 | 22 575,14 |
| Mar | 13 133,33 | 11 000,62 | 2 132,71 | 24 707,86 |
| Avr | 15 764,63 | 10 211,04 | 5 553,59 | 30 261,45 |
| Mai | 10 165,87 | 10 911,83 | -745,97 | 29 515,48 |
| Jun | 6 862,25 | 10 654,85 | -3 792,60 | 25 722,88 |
| Jul | 6 607,23 | 9 432,46 | -2 825,22 | 22 897,66 |
| Aoû | 6 607,23 | 8 261,88 | -1 654,64 | 21 243,01 |
| Sep | 6 862,25 | 9 202,45 | -2 340,20 | 18 902,81 |
| Oct | 6 097,20 | 8 365,38 | -2 268,18 | 16 634,63 |
| Nov | 9 111,03 | 8 183,66 | 927,37 | 17 562,00 |
| Déc | 8 856,01 | 9 078,11 | -222,09 | 17 339,91 |

**2027–2028**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 13 789,99 | 9 047,48 | 4 742,51 | 22 082,42 |
| Fév | 13 351,83 | 10 955,01 | 2 396,82 | 24 479,23 |
| Mar | 13 789,99 | 11 969,45 | 1 820,55 | 26 299,78 |
| Avr | 16 552,86 | 11 172,79 | 5 380,08 | 31 679,86 |
| Mai | 10 674,16 | 12 114,96 | -1 440,80 | 30 239,06 |
| Jun | 7 205,36 | 11 749,13 | -4 543,77 | 25 695,29 |
| Jul | 6 937,60 | 9 754,60 | -2 817,00 | 22 878,29 |
| Aoû | 6 937,60 | 8 535,78 | -1 598,18 | 21 280,11 |
| Sep | 7 205,36 | 9 532,20 | -2 326,83 | 18 953,28 |
| Oct | 6 402,06 | 8 608,66 | -2 206,59 | 16 746,69 |
| Nov | 9 566,58 | 8 410,77 | 1 155,81 | 17 902,50 |
| Déc | 9 298,81 | 10 395,00 | -1 096,19 | 16 806,31 |

**2028–2029**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 14 479,49 | 9 513,99 | 4 965,51 | 21 771,82 |
| Fév | 14 019,42 | 11 431,76 | 2 587,67 | 24 359,48 |
| Mar | 14 479,49 | 12 410,19 | 2 069,30 | 26 428,78 |
| Avr | 17 380,50 | 11 482,21 | 5 898,29 | 32 327,08 |
| Mai | 11 207,87 | 12 470,12 | -1 262,25 | 31 064,82 |
| Jun | 7 565,63 | 12 130,88 | -4 565,25 | 26 499,57 |
| Jul | 7 284,48 | 9 922,16 | -2 637,69 | 23 861,89 |
| Aoû | 7 284,48 | 8 687,95 | -1 403,48 | 22 458,41 |
| Sep | 7 565,63 | 9 827,03 | -2 261,40 | 20 197,01 |
| Oct | 6 722,17 | 8 782,31 | -2 060,15 | 18 136,86 |
| Nov | 10 044,91 | 8 541,29 | 1 503,61 | 19 640,48 |
| Déc | 9 763,75 | 10 699,65 | -935,90 | 18 704,58 |


## 6. Détail des lignes du tableau de trésorerie


| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| **ENCAISSEMENTS** | 0,00 | 0,00 | 0,00 |
| Apports en capital | 20 000,00 | 0,00 | 0,00 |
| Apports en comptes courants | 0,00 | 0,00 | 0,00 |
| Emprunts (déblocages) | 70 000,00 | 0,00 | 0,00 |
| Production vendue | 115 916,40 | 121 712,22 | 127 797,83 |
| Subventions d'exploitation | 0,00 | 0,00 | 0,00 |
| Subventions et aides | 0,00 | 0,00 | 0,00 |
| Encaissements divers | 0,00 | 0,00 | 0,00 |
| Total des encaissements | 205 916,40 | 121 712,22 | 127 797,83 |
| **DÉCAISSEMENTS** | 0,00 | 0,00 | 0,00 |
| Immobilisations (Total) | 79 234,79 | 0,00 | 0,00 |
| Échéances d'emprunts | 10 958,22 | 11 654,99 | 11 626,96 |
| Achats effectués (Total) | 29 997,66 | 32 385,56 | 34 101,18 |
| Charges externes (Total) | 41 041,42 | 43 460,54 | 44 097,93 |
| État – Impôts et taxes | 1 623,00 | 1 978,00 | 1 978,00 |
| Charges de personnel (Total) | 22 974,65 | 26 549,56 | 26 684,68 |
| TVA à payer | 0,00 | 2 323,50 | 3 007,73 |
| Impôt sur les sociétés | 2 746,76 | 3 893,66 | 4 403,08 |
| Décaissements divers | 0,00 | 0,00 | 0,00 |
| Total des décaissements | 188 576,49 | 122 245,81 | 125 899,56 |
| **SOLDE DE TRÉSORERIE** | 0,00 | 0,00 | 0,00 |
| Solde précédent | 0,00 | 17 339,91 | 16 806,31 |
| Variation de trésorerie | 17 339,91 | -533,59 | 1 898,27 |
| **Solde de trésorerie** | 17 339,91 | 16 806,31 | 18 704,58 |
| Encours fournisseurs | 3 166,86 | 3 312,41 | 3 368,91 |


## 7. Récapitulatif global de cohérence


| Bilan | Valeur |
| --- | --- |
| Total checks | 18 |
| ✅ OK | 18 |
| ❌ KO | 0 |

> ✅ **Tous les checks sont OK.** Les calculs de synthèse sont cohérents.


### 7.1 Synthèse chiffrée des indicateurs clés


| Indicateur | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Chiffre d'affaires | 0,00 | 0,00 | 0,00 |
| EBE | 30 698,80 | 32 371,53 | 35 812,56 |
| Résultat net | 20 753,29 | 22 501,01 | 25 767,36 |
| CAF | 24 170,49 | 25 918,21 | 29 184,56 |
| Seuil de rentabilité | 67 222,92 | 70 156,70 | 70 904,59 |
| Fonds de roulement | 29 164,24 | 45 910,02 | 65 548,44 |
| BFR | -6 175,66 | -6 896,29 | -7 156,14 |
| Solde trésorerie annuel | 35 339,91 | 52 806,31 | 72 704,58 |
| Solde trésorerie M12 | 17 339,91 | 16 806,31 | 18 704,58 |

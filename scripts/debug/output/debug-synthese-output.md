# Diagnostic Synthèse Prévisionnelle — Dossier `cmmjoradm0001kohp15on2xe1`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`buildSigData` · `calcSeuil` · `buildBfrRows` · `buildBilanRows` · `buildTresorerieRows` · `buildFinCalc`


## 0. Paramètres généraux

| Paramètre | Valeur |
| --- | --- |
| Dossier ID | `cmmjoradm0001kohp15on2xe1` |
| Date de démarrage | 01/05/2026 |
| Année de début | 2026 |
| Mois de début | Mai (5) |
| Régime fiscal | IS |
| Régime TVA | REEL_NORMAL |
| Franchise TVA | Non |
| Mois paiement salaires | M+1 |
| Exercices | 2026–2027 · 2027–2028 · 2028–2029 |
| Activités | 5 |
| Salariés | 2 |
| Immobilisations actives | 12 |
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
| Excédent brut d'exploitation (EBE) | 12 698,80 | 12.1 % | 14 371,53 | 13.0 % | 17 812,56 | 15.4 % |
| Résultat d'exploitation | 9 281,60 | 8.8 % | 10 954,33 | 9.9 % | 14 395,36 | 12.4 % |
| Résultat financier | -2 865,96 | -2.7 % | -2 482,56 | -2.3 % | -2 080,82 | -1.8 % |
| Résultat courant | 6 415,64 | 6.1 % | 8 471,77 | 7.7 % | 12 314,54 | 10.6 % |
| ****Résultat de l'exercice**** | 5 453,29 | 5.2 % | 7 201,01 | 6.5 % | 10 467,36 | 9.0 % |
| ****CAF**** | 8 870,49 | 8.4 % | 10 618,21 | 9.6 % | 13 884,56 | 12.0 % |


### 1.2 Vérifications de cohérence SIG

| Check | Statut | Détail |
| --- | :---: | --- |
| CAF ≥ Résultat net (2026–2027) | ✅ | CAF = 8 870,49 € | ResNet = 5 453,29 € |
| CAF ≥ Résultat net (2027–2028) | ✅ | CAF = 10 618,21 € | ResNet = 7 201,01 € |
| CAF ≥ Résultat net (2028–2029) | ✅ | CAF = 13 884,56 € | ResNet = 10 467,36 € |
| EBE ≥ Résultat exploitation (2026–2027) | ✅ | EBE = 12 698,80 € | ResExpl = 9 281,60 € |
| EBE ≥ Résultat exploitation (2027–2028) | ✅ | EBE = 14 371,53 € | ResExpl = 10 954,33 € |
| EBE ≥ Résultat exploitation (2028–2029) | ✅ | EBE = 17 812,56 € | ResExpl = 14 395,36 € |


## 2. Seuil de Rentabilité Économique


| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| ****Ventes + Production réelle**** | 294 597,00 | 309 326,85 | 324 793,20 |
| Coûts variables | 80 356,95 | 27.3 % | 84 374,80 | 27.3 % | 88 593,54 | 27.3 % |
| Taux de marge sur coût variable | 72.7 % | 72.7 % | 72.7 % |
| Coûts fixes | 66 550,45 | 22.6 % | 68 669,32 | 22.2 % | 69 209,47 | 21.3 % |
| ****Seuil de rentabilité**** | 91 512,13 | 94 425,74 | 95 168,49 |
| Excédent / insuffisance | 203 084,87 | 214 901,11 | 229 624,71 |
| Point mort (jours) | 113 j | 111 j | 107 j |


### 2.1 Vérifications de cohérence seuil

| Check | Statut | Détail |
| --- | :---: | --- |
| Excédent = Ventes − Seuil (2026–2027) | ✅ | 203 084,87 ≟ 294 597,00 − 91 512,13 = 203 084,87 |
| Excédent = Ventes − Seuil (2027–2028) | ✅ | 214 901,11 ≟ 309 326,85 − 94 425,74 = 214 901,11 |
| Excédent = Ventes − Seuil (2028–2029) | ✅ | 229 624,71 ≟ 324 793,20 − 95 168,49 = 229 624,71 |
| Seuil = CF / Taux MCV (2026–2027) | ✅ | 91 512,13 ≟ 66 550,45 / 72.7 % = 91 512,13 |
| Seuil = CF / Taux MCV (2027–2028) | ✅ | 94 425,74 ≟ 68 669,32 / 72.7 % = 94 425,74 |
| Seuil = CF / Taux MCV (2028–2029) | ✅ | 95 168,49 ≟ 69 209,47 / 72.7 % = 95 168,49 |


## 3. Besoin en Fonds de Roulement (BFR)


*BFR = photo de la situation à la clôture, basée sur le dernier mois de l'exercice.*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Stocks de matières | 1 298,71 | 1 275,97 | 1 339,76 |
| Crédit de TVA | 27,81 | 0,00 | 0,00 |
| Total des besoins | 1 326,52 | 1 275,97 | 1 339,76 |
| Dettes fournisseurs (achats matières) | 6 492,59 | 6 817,86 | 7 158,76 |
| Dettes charges externes | 2 283,38 | 2 309,02 | 2 335,68 |
| Dettes impôts et taxes | 0,00 | 0,00 | 0,00 |
| Dettes personnel | 2 088,60 | 2 223,72 | 2 223,72 |
| TVA à payer | 0,00 | 161,44 | 190,06 |
| Impôt sur les sociétés (dette) | 240,59 | 317,69 | 461,80 |
| Total des ressources | 11 105,16 | 11 829,74 | 12 370,02 |
| Variation du BFR | -16 130,14 | -775,13 | -476,47 |
| **Besoin en fonds de roulement (BFR)** | -9 778,64 | -10 553,78 | -11 030,25 |


### 3.1 Récapitulatif BFR

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| ****BFR total**** | -9 778,64 | -10 553,78 | -11 030,25 |


## 4. Équilibre Financier (Fonds de Roulement)


*FR = Capitaux propres + Emprunts (LMT) − Immobilisations nettes*
*Solde trésorerie annuel = FR − BFR*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Capitaux propres | 25 453,29 | 32 654,30 | 43 121,67 |
| Emprunts (LMT) | 61 907,74 | 52 735,31 | 43 189,17 |
| Immobilisations nettes | 72 737,79 | 69 320,59 | 65 903,39 |
| ****Fonds de roulement (FR)**** | 14 623,24 | 16 069,02 | 20 407,44 |
| ****BFR**** | -9 778,64 | -10 553,78 | -11 030,25 |
| ****Solde de trésorerie (Annuel)**** | 24 401,89 | 26 622,80 | 31 437,69 |


### 4.1 Vérifications de cohérence FR

| Check | Statut | Détail |
| --- | :---: | --- |
| FR = CP + Emprunts − Immo (2026–2027) | ✅ | 14 623,24 ≟ 25 453,29 + 61 907,74 − 72 737,79 = 14 623,24 |
| Solde annuel = FR − BFR (2026–2027) | ✅ | 24 401,89 ≟ 14 623,24 − -9 778,64 = 24 401,89 |
| FR = CP + Emprunts − Immo (2027–2028) | ✅ | 16 069,02 ≟ 32 654,30 + 52 735,31 − 69 320,59 = 16 069,02 |
| Solde annuel = FR − BFR (2027–2028) | ✅ | 26 622,80 ≟ 16 069,02 − -10 553,78 = 26 622,80 |
| FR = CP + Emprunts − Immo (2028–2029) | ✅ | 20 407,44 ≟ 43 121,67 + 43 189,17 − 65 903,39 = 20 407,44 |
| Solde annuel = FR − BFR (2028–2029) | ✅ | 31 437,69 ≟ 20 407,44 − -11 030,25 = 31 437,69 |


## 5. Trésorerie



### 5.1 Synthèse annuelle trésorerie

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Total encaissements | 0,00 | 0,00 | 0,00 |
| Total décaissements | 0,00 | 0,00 | 0,00 |
| Variation de trésorerie | 176 616,10 | 164 476,37 | 175 090,83 |
| ****Solde trésorerie fin d'exercice (M12)**** | 176 616,10 | 341 092,47 | 516 183,30 |


### 5.2 Vérification solde M12 vs solde annuel (FR−BFR)


*Note : le solde FR−BFR est un solde comptable statique (bilan). Le solde M12 est le solde*
*de trésorerie mensuel à fin décembre calculé par le tableau de trésorerie.*
*Ces deux valeurs doivent être proches mais peuvent différer selon les décalages de paiement.*

| Exercice | Solde M12 (trésorerie) | Solde Annuel (FR−BFR) | Écart |
| --- | ---: | ---: | ---: |
| 2026–2027 | 176 616,10 | 24 401,89 | 152 214,21 |
| 2027–2028 | 341 092,47 | 26 622,80 | 314 469,67 |
| 2028–2029 | 516 183,30 | 31 437,69 | 484 745,60 |


### 5.3 Soldes mensuels de trésorerie


**2026–2027**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 126 763,18 | 79 922,75 | 46 840,42 | 46 840,42 |
| Fév | 35 595,06 | 20 694,62 | 14 900,44 | 61 740,87 |
| Mar | 36 763,18 | 16 293,91 | 20 469,27 | 82 210,13 |
| Avr | 44 128,79 | 16 381,81 | 27 746,99 | 109 957,12 |
| Mai | 28 456,58 | 18 305,96 | 10 150,62 | 120 107,74 |
| Jun | 19 209,00 | 14 748,06 | 4 460,95 | 124 568,68 |
| Jul | 18 495,15 | 12 645,87 | 5 849,28 | 130 417,96 |
| Aoû | 18 495,15 | 11 347,44 | 7 147,72 | 137 565,68 |
| Sep | 19 209,00 | 11 608,58 | 7 600,42 | 145 166,10 |
| Oct | 17 067,46 | 11 563,49 | 5 503,97 | 150 670,08 |
| Nov | 25 503,85 | 11 024,68 | 14 479,17 | 165 149,24 |
| Déc | 24 790,00 | 13 323,14 | 11 466,85 | 176 616,10 |

**2027–2028**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 38 601,33 | 13 173,66 | 25 427,67 | 202 043,77 |
| Fév | 37 374,81 | 17 534,61 | 19 840,20 | 221 883,97 |
| Mar | 38 601,33 | 17 520,17 | 21 081,16 | 242 965,13 |
| Avr | 46 335,23 | 17 603,49 | 28 731,74 | 271 696,87 |
| Mai | 29 879,41 | 19 832,55 | 10 046,86 | 281 743,73 |
| Jun | 20 169,45 | 16 050,74 | 4 118,71 | 285 862,44 |
| Jul | 19 419,91 | 13 113,32 | 6 306,59 | 292 169,03 |
| Aoû | 19 419,91 | 11 768,80 | 7 651,11 | 299 820,14 |
| Sep | 20 169,45 | 12 089,79 | 8 079,67 | 307 899,81 |
| Oct | 17 920,83 | 11 965,84 | 5 955,00 | 313 854,80 |
| Nov | 26 779,04 | 11 393,62 | 15 385,42 | 329 240,22 |
| Déc | 26 029,50 | 14 177,25 | 11 852,25 | 341 092,47 |

**2028–2029**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 40 531,40 | 13 846,48 | 26 684,93 | 367 777,40 |
| Fév | 39 243,56 | 18 191,40 | 21 052,15 | 388 829,55 |
| Mar | 40 531,40 | 18 290,46 | 22 240,95 | 411 070,50 |
| Avr | 48 651,99 | 18 255,85 | 30 396,15 | 441 466,64 |
| Mai | 31 373,38 | 20 593,53 | 10 779,85 | 452 246,49 |
| Jun | 21 177,93 | 16 693,79 | 4 484,13 | 456 730,62 |
| Jul | 20 390,91 | 13 454,89 | 6 936,01 | 463 666,64 |
| Aoû | 20 390,91 | 12 085,16 | 8 305,75 | 471 972,39 |
| Sep | 21 177,93 | 12 547,13 | 8 630,79 | 480 603,18 |
| Oct | 18 816,87 | 12 307,60 | 6 509,27 | 487 112,45 |
| Nov | 28 117,99 | 11 673,35 | 16 444,64 | 503 557,09 |
| Déc | 27 330,97 | 14 704,77 | 12 626,20 | 516 183,30 |


## 6. Détail des lignes du tableau de trésorerie


| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| **ENCAISSEMENTS** | 0,00 | 0,00 | 0,00 |
| Apports en capital | 1 000,00 | 0,00 | 0,00 |
| Apports en comptes courants | 19 000,00 | 0,00 | 0,00 |
| Emprunts (déblocages) | 70 000,00 | 0,00 | 0,00 |
| Production vendue | 324 476,40 | 340 700,22 | 357 735,24 |
| Subventions d'exploitation | 0,00 | 0,00 | 0,00 |
| Subventions et aides | 0,00 | 0,00 | 0,00 |
| Encaissements divers | 0,00 | 0,00 | 0,00 |
| Total des encaissements | 414 476,40 | 340 700,22 | 357 735,24 |
| **DÉCAISSEMENTS** | 0,00 | 0,00 | 0,00 |
| Immobilisations (Total) | 78 323,99 | 0,00 | 0,00 |
| Échéances d'emprunts | 10 958,22 | 11 654,99 | 11 626,96 |
| Achats effectués (Total) | 82 217,27 | 88 911,80 | 93 546,03 |
| Charges externes (Total) | 41 041,42 | 43 460,54 | 44 097,93 |
| État – Impôts et taxes | 1 623,00 | 1 978,00 | 1 978,00 |
| Charges de personnel (Total) | 22 974,65 | 26 549,56 | 26 684,68 |
| TVA à payer | 0,00 | 2 475,30 | 3 007,73 |
| Impôt sur les sociétés | 721,76 | 1 193,66 | 1 703,08 |
| Décaissements divers | 0,00 | 0,00 | 0,00 |
| Total des décaissements | 237 860,30 | 176 223,85 | 182 644,41 |
| **SOLDE DE TRÉSORERIE** | 0,00 | 0,00 | 0,00 |
| Solde précédent | 0,00 | 176 616,10 | 341 092,47 |
| Variation de trésorerie | 176 616,10 | 164 476,37 | 175 090,83 |
| **Solde de trésorerie** | 176 616,10 | 341 092,47 | 516 183,30 |
| Encours fournisseurs | 7 064,81 | 7 392,07 | 7 547,05 |


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
| EBE | 12 698,80 | 14 371,53 | 17 812,56 |
| Résultat net | 5 453,29 | 7 201,01 | 10 467,36 |
| CAF | 8 870,49 | 10 618,21 | 13 884,56 |
| Seuil de rentabilité | 91 512,13 | 94 425,74 | 95 168,49 |
| Fonds de roulement | 14 623,24 | 16 069,02 | 20 407,44 |
| BFR | -9 778,64 | -10 553,78 | -11 030,25 |
| Solde trésorerie annuel | 24 401,89 | 26 622,80 | 31 437,69 |
| Solde trésorerie M12 | 176 616,10 | 341 092,47 | 516 183,30 |

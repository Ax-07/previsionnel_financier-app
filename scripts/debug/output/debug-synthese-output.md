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
| Activités | 3 |
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
| Résultat financier | -3 342,21 | -3.2 % | -2 375,35 | -2.2 % | -1 990,94 | -1.7 % |
| Résultat courant | 5 939,39 | 5.7 % | 8 578,98 | 7.8 % | 12 404,42 | 10.7 % |
| ****Résultat de l'exercice**** | 5 048,48 | 4.8 % | 7 292,14 | 6.6 % | 10 543,76 | 9.1 % |
| ****CAF**** | 8 465,68 | 8.1 % | 10 709,33 | 9.7 % | 13 960,96 | 12.1 % |


### 1.2 Vérifications de cohérence SIG

| Check | Statut | Détail |
| --- | :---: | --- |
| CAF ≥ Résultat net (2026–2027) | ✅ | CAF = 8 465,68 € | ResNet = 5 048,48 € |
| CAF ≥ Résultat net (2027–2028) | ✅ | CAF = 10 709,33 € | ResNet = 7 292,14 € |
| CAF ≥ Résultat net (2028–2029) | ✅ | CAF = 13 960,96 € | ResNet = 10 543,76 € |
| EBE ≥ Résultat exploitation (2026–2027) | ✅ | EBE = 12 698,80 € | ResExpl = 9 281,60 € |
| EBE ≥ Résultat exploitation (2027–2028) | ✅ | EBE = 14 371,53 € | ResExpl = 10 954,33 € |
| EBE ≥ Résultat exploitation (2028–2029) | ✅ | EBE = 17 812,56 € | ResExpl = 14 395,36 € |


## 2. Seuil de Rentabilité Économique


| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| ****Ventes + Production réelle**** | 104 997,00 | 110 246,85 | 115 759,19 |
| Coûts variables | 29 164,95 | 27.8 % | 30 623,20 | 27.8 % | 32 154,36 | 27.8 % |
| Taux de marge sur coût variable | 72.2 % | 72.2 % | 72.2 % |
| Coûts fixes | 66 550,45 | 63.4 % | 68 669,32 | 62.3 % | 69 209,47 | 59.8 % |
| ****Seuil de rentabilité**** | 92 145,70 | 95 079,49 | 95 827,38 |
| Excédent / insuffisance | 12 851,30 | 15 167,36 | 19 931,81 |
| Point mort (jours) | 320 j | 315 j | 302 j |


### 2.1 Vérifications de cohérence seuil

| Check | Statut | Détail |
| --- | :---: | --- |
| Excédent = Ventes − Seuil (2026–2027) | ✅ | 12 851,30 ≟ 104 997,00 − 92 145,70 = 12 851,30 |
| Excédent = Ventes − Seuil (2027–2028) | ✅ | 15 167,36 ≟ 110 246,85 − 95 079,49 = 15 167,36 |
| Excédent = Ventes − Seuil (2028–2029) | ✅ | 19 931,81 ≟ 115 759,19 − 95 827,38 = 19 931,81 |
| Seuil = CF / Taux MCV (2026–2027) | ✅ | 92 145,70 ≟ 66 550,45 / 72.2 % = 92 145,70 |
| Seuil = CF / Taux MCV (2027–2028) | ✅ | 95 079,49 ≟ 68 669,32 / 72.2 % = 95 079,49 |
| Seuil = CF / Taux MCV (2028–2029) | ✅ | 95 827,38 ≟ 69 209,47 / 72.2 % = 95 827,38 |


## 3. Besoin en Fonds de Roulement (BFR)


*BFR = photo de la situation à la clôture, basée sur le dernier mois de l'exercice.*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Stocks de matières | 1 298,71 | 1 275,97 | 1 339,76 |
| Crédit de TVA | 27,81 | 0,00 | 0,00 |
| Total des besoins | 1 326,52 | 1 275,97 | 1 339,76 |
| Dettes fournisseurs (achats matières) | 2 366,41 | 2 485,38 | 2 609,65 |
| Dettes charges externes | 2 283,38 | 2 309,02 | 2 335,68 |
| Dettes impôts et taxes | 0,00 | 0,00 | 0,00 |
| Dettes personnel | 2 088,60 | 2 223,72 | 2 223,72 |
| TVA à payer | 0,00 | 161,44 | 190,06 |
| Impôt sur les sociétés (dette) | 222,73 | 321,71 | 465,17 |
| Total des ressources | 6 961,12 | 7 501,28 | 7 824,27 |
| Variation du BFR | -9 986,10 | -590,71 | -259,20 |
| **Besoin en fonds de roulement (BFR)** | -5 634,60 | -6 225,31 | -6 484,51 |


### 3.1 Récapitulatif BFR

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| ****BFR total**** | -5 634,60 | -6 225,31 | -6 484,51 |


## 4. Équilibre Financier (Fonds de Roulement)


*FR = Capitaux propres + Emprunts (LMT) − Immobilisations nettes*
*Solde trésorerie annuel = FR − BFR*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Capitaux propres | 25 048,48 | 32 340,62 | 42 884,38 |
| Emprunts (LMT) | 53 063,76 | 45 201,68 | 37 019,26 |
| Immobilisations nettes | 62 737,79 | 59 320,59 | 55 903,39 |
| ****Fonds de roulement (FR)**** | 15 374,45 | 18 221,71 | 24 000,25 |
| ****BFR**** | -5 634,60 | -6 225,31 | -6 484,51 |
| ****Solde de trésorerie (Annuel)**** | 21 009,05 | 24 447,02 | 30 484,76 |


### 4.1 Vérifications de cohérence FR

| Check | Statut | Détail |
| --- | :---: | --- |
| FR = CP + Emprunts − Immo (2026–2027) | ✅ | 15 374,45 ≟ 25 048,48 + 53 063,76 − 62 737,79 = 15 374,45 |
| Solde annuel = FR − BFR (2026–2027) | ✅ | 21 009,05 ≟ 15 374,45 − -5 634,60 = 21 009,05 |
| FR = CP + Emprunts − Immo (2027–2028) | ✅ | 18 221,71 ≟ 32 340,62 + 45 201,68 − 59 320,59 = 18 221,71 |
| Solde annuel = FR − BFR (2027–2028) | ✅ | 24 447,02 ≟ 18 221,71 − -6 225,31 = 24 447,02 |
| FR = CP + Emprunts − Immo (2028–2029) | ✅ | 24 000,25 ≟ 42 884,38 + 37 019,26 − 55 903,39 = 24 000,25 |
| Solde annuel = FR − BFR (2028–2029) | ✅ | 30 484,76 ≟ 24 000,25 − -6 484,51 = 30 484,76 |


## 5. Trésorerie



### 5.1 Synthèse annuelle trésorerie

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Total encaissements | 0,00 | 0,00 | 0,00 |
| Total décaissements | 0,00 | 0,00 | 0,00 |
| Variation de trésorerie | 21 009,05 | 3 437,96 | 6 037,74 |
| ****Solde trésorerie fin d'exercice (M12)**** | 21 009,05 | 24 447,02 | 30 484,76 |


### 5.2 Vérification solde M12 vs solde annuel (FR−BFR)


*Note : le solde FR−BFR est un solde comptable statique (bilan). Le solde M12 est le solde*
*de trésorerie mensuel à fin décembre calculé par le tableau de trésorerie.*
*Ces deux valeurs doivent être proches mais peuvent différer selon les décalages de paiement.*

| Exercice | Solde M12 (trésorerie) | Solde Annuel (FR−BFR) | Écart |
| --- | ---: | ---: | ---: |
| 2026–2027 | 21 009,05 | 21 009,05 | 0,00 |
| 2027–2028 | 24 447,02 | 24 447,02 | 0,00 |
| 2028–2029 | 30 484,76 | 30 484,76 | 0,00 |


### 5.3 Soldes mensuels de trésorerie


**2026–2027**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 93 133,33 | 70 511,92 | 22 621,41 | 22 621,41 |
| Fév | 12 716,03 | 12 326,48 | 389,55 | 23 010,95 |
| Mar | 13 133,33 | 10 193,35 | 2 939,98 | 25 950,94 |
| Avr | 15 764,63 | 10 096,39 | 5 668,24 | 31 619,17 |
| Mai | 10 165,87 | 10 796,95 | -631,09 | 30 988,09 |
| Jun | 6 862,25 | 9 846,87 | -2 984,62 | 28 003,47 |
| Jul | 6 607,23 | 9 317,11 | -2 709,87 | 25 293,59 |
| Aoû | 6 607,23 | 8 146,28 | -1 539,04 | 23 754,55 |
| Sep | 6 862,25 | 8 393,76 | -1 531,51 | 22 223,04 |
| Oct | 6 097,20 | 8 249,31 | -2 152,11 | 20 070,93 |
| Nov | 9 111,03 | 8 067,35 | 1 043,68 | 21 114,61 |
| Déc | 8 856,01 | 8 961,57 | -105,55 | 21 009,05 |

**2027–2028**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 13 789,99 | 8 930,69 | 4 859,30 | 25 868,36 |
| Fév | 13 351,83 | 10 989,78 | 2 362,05 | 28 230,40 |
| Mar | 13 789,99 | 11 181,19 | 2 608,81 | 30 839,21 |
| Avr | 16 552,86 | 11 055,28 | 5 497,59 | 36 336,80 |
| Mai | 10 674,16 | 11 997,21 | -1 323,05 | 35 013,75 |
| Jun | 7 205,36 | 10 960,15 | -3 754,79 | 31 258,96 |
| Jul | 6 937,60 | 9 636,36 | -2 698,76 | 28 560,20 |
| Aoû | 6 937,60 | 8 417,29 | -1 479,69 | 27 080,51 |
| Sep | 7 205,36 | 8 742,47 | -1 537,10 | 25 543,41 |
| Oct | 6 402,06 | 8 489,67 | -2 087,60 | 23 455,80 |
| Nov | 9 566,58 | 8 291,53 | 1 275,05 | 24 730,86 |
| Déc | 9 298,81 | 9 582,65 | -283,84 | 24 447,02 |

**2028–2029**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 14 479,49 | 9 394,26 | 5 085,24 | 29 532,25 |
| Fév | 14 019,42 | 11 311,77 | 2 707,66 | 32 239,91 |
| Mar | 14 479,49 | 11 618,32 | 2 861,17 | 35 101,08 |
| Avr | 17 380,50 | 11 361,71 | 6 018,79 | 41 119,87 |
| Mai | 11 207,87 | 12 349,37 | -1 141,50 | 39 978,37 |
| Jun | 7 565,63 | 11 338,25 | -3 772,62 | 36 205,75 |
| Jul | 7 284,48 | 9 800,91 | -2 516,44 | 33 689,31 |
| Aoû | 7 284,48 | 8 566,43 | -1 281,96 | 32 407,35 |
| Sep | 7 565,63 | 9 033,64 | -1 468,01 | 30 939,35 |
| Oct | 6 722,17 | 8 660,28 | -1 938,12 | 29 001,23 |
| Nov | 10 044,91 | 8 419,00 | 1 625,90 | 30 627,13 |
| Déc | 9 763,75 | 9 906,13 | -142,38 | 30 484,76 |


## 6. Détail des lignes du tableau de trésorerie


| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| **ENCAISSEMENTS** | 0,00 | 0,00 | 0,00 |
| Apports en capital | 1 000,00 | 0,00 | 0,00 |
| Apports en comptes courants | 19 000,00 | 0,00 | 0,00 |
| Emprunts (déblocages) | 60 000,00 | 0,00 | 0,00 |
| Production vendue | 115 916,40 | 121 712,22 | 127 797,83 |
| Subventions d'exploitation | 0,00 | 0,00 | 0,00 |
| Subventions et aides | 0,00 | 0,00 | 0,00 |
| Encaissements divers | 0,00 | 0,00 | 0,00 |
| Total des encaissements | 195 916,40 | 121 712,22 | 127 797,83 |
| **DÉCAISSEMENTS** | 0,00 | 0,00 | 0,00 |
| Immobilisations (Total) | 68 323,99 | 0,00 | 0,00 |
| Échéances d'emprunts | 10 278,45 | 10 237,43 | 10 173,36 |
| Achats effectués (Total) | 29 997,66 | 32 385,56 | 34 101,18 |
| Charges externes (Total) | 41 041,42 | 43 460,54 | 44 097,93 |
| État – Impôts et taxes | 1 623,00 | 1 978,00 | 1 978,00 |
| Charges de personnel (Total) | 22 974,65 | 26 549,56 | 26 684,68 |
| TVA à payer | 0,00 | 2 475,30 | 3 007,73 |
| Impôt sur les sociétés | 668,18 | 1 187,86 | 1 717,21 |
| Décaissements divers | 0,00 | 0,00 | 0,00 |
| Total des décaissements | 174 907,35 | 118 274,26 | 121 760,09 |
| **SOLDE DE TRÉSORERIE** | 0,00 | 0,00 | 0,00 |
| Solde précédent | 0,00 | 21 009,05 | 24 447,02 |
| Variation de trésorerie | 21 009,05 | 3 437,96 | 6 037,74 |
| **Solde de trésorerie** | 21 009,05 | 24 447,02 | 30 484,76 |
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
| EBE | 12 698,80 | 14 371,53 | 17 812,56 |
| Résultat net | 5 048,48 | 7 292,14 | 10 543,76 |
| CAF | 8 465,68 | 10 709,33 | 13 960,96 |
| Seuil de rentabilité | 92 145,70 | 95 079,49 | 95 827,38 |
| Fonds de roulement | 15 374,45 | 18 221,71 | 24 000,25 |
| BFR | -5 634,60 | -6 225,31 | -6 484,51 |
| Solde trésorerie annuel | 21 009,05 | 24 447,02 | 30 484,76 |
| Solde trésorerie M12 | 21 009,05 | 24 447,02 | 30 484,76 |

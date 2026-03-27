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
| Salariés | 1 |
| Immobilisations actives | 12 |
| Emprunts | 1 |


## 1. Soldes Intermédiaires de Gestion (SIG)

*Tous les montants sont en € HT. Le % CA est par rapport au chiffre d'affaires HT.*


### 1.1 SIG avec % CA

| Désignation | 2026–2027 € | 2026–2027 % CA | 2027–2028 € | 2027–2028 % CA | 2028–2029 € | 2028–2029 % CA |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ****Chiffre d'affaires**** | 103 136,00 | 100.0 % | 108 292,80 | 100.0 % | 113 707,44 | 100.0 % |
| Ventes + Production réelle | 103 136,00 | 100.0 % | 108 292,80 | 100.0 % | 113 707,44 | 100.0 % |
| Marge globale | 74 794,80 | 72.5 % | 78 534,54 | 72.5 % | 82 461,27 | 72.5 % |
| Valeur ajoutée | 37 435,33 | 36.3 % | 41 238,03 | 38.1 % | 44 840,29 | 39.4 % |
| Excédent brut d'exploitation (EBE) | 13 871,82 | 13.5 % | 11 875,35 | 11.0 % | 15 477,61 | 13.6 % |
| Résultat d'exploitation | 10 288,12 | 10.0 % | 8 291,65 | 7.7 % | 11 893,91 | 10.5 % |
| Résultat financier | -3 342,21 | -3.2 % | -2 375,35 | -2.2 % | -1 990,94 | -1.8 % |
| Résultat courant | 6 945,91 | 6.7 % | 5 916,30 | 5.5 % | 9 902,97 | 8.7 % |
| ****Résultat de l'exercice**** | 5 904,02 | 5.7 % | 5 028,86 | 4.6 % | 8 417,52 | 7.4 % |
| ****CAF**** | 9 487,72 | 9.2 % | 8 612,55 | 8.0 % | 12 001,22 | 10.6 % |


### 1.2 Vérifications de cohérence SIG

| Check | Statut | Détail |
| --- | :---: | --- |
| CAF ≥ Résultat net (2026–2027) | ✅ | CAF = 9 487,72 € | ResNet = 5 904,02 € |
| CAF ≥ Résultat net (2027–2028) | ✅ | CAF = 8 612,55 € | ResNet = 5 028,86 € |
| CAF ≥ Résultat net (2028–2029) | ✅ | CAF = 12 001,22 € | ResNet = 8 417,52 € |
| EBE ≥ Résultat exploitation (2026–2027) | ✅ | EBE = 13 871,82 € | ResExpl = 10 288,12 € |
| EBE ≥ Résultat exploitation (2027–2028) | ✅ | EBE = 11 875,35 € | ResExpl = 8 291,65 € |
| EBE ≥ Résultat exploitation (2028–2029) | ✅ | EBE = 15 477,61 € | ResExpl = 11 893,91 € |


## 2. Seuil de Rentabilité Économique


| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| ****Ventes + Production réelle**** | 103 136,00 | 108 292,80 | 113 707,44 |
| Coûts variables | 28 341,20 | 27.5 % | 29 758,26 | 27.5 % | 31 246,17 | 27.5 % |
| Taux de marge sur coût variable | 72.5 % | 72.5 % | 72.5 % |
| Coûts fixes | 64 506,68 | 62.5 % | 70 242,89 | 64.9 % | 70 567,36 | 62.1 % |
| ****Seuil de rentabilité**** | 88 949,51 | 96 859,28 | 97 306,70 |
| Excédent / insuffisance | 14 186,49 | 11 433,52 | 16 400,74 |
| Point mort (jours) | 315 j | 326 j | 312 j |


### 2.1 Vérifications de cohérence seuil

| Check | Statut | Détail |
| --- | :---: | --- |
| Excédent = Ventes − Seuil (2026–2027) | ✅ | 14 186,49 ≟ 103 136,00 − 88 949,51 = 14 186,49 |
| Excédent = Ventes − Seuil (2027–2028) | ✅ | 11 433,52 ≟ 108 292,80 − 96 859,28 = 11 433,52 |
| Excédent = Ventes − Seuil (2028–2029) | ✅ | 16 400,74 ≟ 113 707,44 − 97 306,70 = 16 400,74 |
| Seuil = CF / Taux MCV (2026–2027) | ✅ | 88 949,51 ≟ 64 506,68 / 72.5 % = 88 949,51 |
| Seuil = CF / Taux MCV (2027–2028) | ✅ | 96 859,28 ≟ 70 242,89 / 72.5 % = 96 859,28 |
| Seuil = CF / Taux MCV (2028–2029) | ✅ | 97 306,70 ≟ 70 567,36 / 72.5 % = 97 306,70 |


## 3. Besoin en Fonds de Roulement (BFR)


*BFR = photo de la situation à la clôture, basée sur le dernier mois de l'exercice.*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Stocks de matières | 1 180,88 | 1 239,93 | 1 301,92 |
| Crédit de TVA | 631,96 | 0,00 | 0,00 |
| Total des besoins | 1 812,85 | 1 239,93 | 1 301,92 |
| Dettes fournisseurs (achats matières) | 1 150,17 | 1 207,68 | 1 268,06 |
| Dettes charges externes | 2 350,60 | 2 363,44 | 2 376,65 |
| Dettes impôts et taxes | 0,00 | 0,00 | 0,00 |
| Dettes personnel | 1 828,38 | 2 282,06 | 2 282,06 |
| TVA à payer | 0,00 | 112,68 | 262,08 |
| Impôt sur les sociétés (dette) | 260,47 | 221,86 | 371,36 |
| Total des ressources | 5 589,61 | 6 187,72 | 6 560,21 |
| Variation du BFR | -7 683,47 | -1 171,02 | -310,50 |
| **Besoin en fonds de roulement (BFR)** | -3 776,77 | -4 947,79 | -5 258,29 |


### 3.1 Récapitulatif BFR

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| ****BFR total**** | -3 776,77 | -4 947,79 | -5 258,29 |


## 4. Équilibre Financier (Fonds de Roulement)


*FR = Capitaux propres + Emprunts (LMT) − Immobilisations nettes*
*Solde trésorerie annuel = FR − BFR*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Capitaux propres | 25 904,02 | 30 932,88 | 39 350,40 |
| Emprunts (LMT) | 53 063,76 | 45 201,68 | 37 019,26 |
| Immobilisations nettes | 61 097,30 | 57 513,60 | 53 929,90 |
| ****Fonds de roulement (FR)**** | 17 870,48 | 18 620,96 | 22 439,76 |
| ****BFR**** | -3 776,77 | -4 947,79 | -5 258,29 |
| ****Solde de trésorerie (Annuel)**** | 21 647,25 | 23 568,75 | 27 698,05 |


### 4.1 Vérifications de cohérence FR

| Check | Statut | Détail |
| --- | :---: | --- |
| FR = CP + Emprunts − Immo (2026–2027) | ✅ | 17 870,48 ≟ 25 904,02 + 53 063,76 − 61 097,30 = 17 870,48 |
| Solde annuel = FR − BFR (2026–2027) | ✅ | 21 647,25 ≟ 17 870,48 − -3 776,77 = 21 647,25 |
| FR = CP + Emprunts − Immo (2027–2028) | ✅ | 18 620,96 ≟ 30 932,88 + 45 201,68 − 57 513,60 = 18 620,96 |
| Solde annuel = FR − BFR (2027–2028) | ✅ | 23 568,75 ≟ 18 620,96 − -4 947,79 = 23 568,75 |
| FR = CP + Emprunts − Immo (2028–2029) | ✅ | 22 439,76 ≟ 39 350,40 + 37 019,26 − 53 929,90 = 22 439,76 |
| Solde annuel = FR − BFR (2028–2029) | ✅ | 27 698,05 ≟ 22 439,76 − -5 258,29 = 27 698,05 |


## 5. Trésorerie



### 5.1 Synthèse annuelle trésorerie

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Total encaissements | 0,00 | 0,00 | 0,00 |
| Total décaissements | 0,00 | 0,00 | 0,00 |
| Variation de trésorerie | 21 647,25 | 1 921,50 | 4 129,30 |
| ****Solde trésorerie fin d'exercice (M12)**** | 21 647,25 | 23 568,75 | 27 698,05 |


### 5.2 Vérification solde M12 vs solde annuel (FR−BFR)


*Note : le solde FR−BFR est un solde comptable statique (bilan). Le solde M12 est le solde*
*de trésorerie mensuel à fin décembre calculé par le tableau de trésorerie.*
*Ces deux valeurs doivent être proches mais peuvent différer selon les décalages de paiement.*

| Exercice | Solde M12 (trésorerie) | Solde Annuel (FR−BFR) | Écart |
| --- | ---: | ---: | ---: |
| 2026–2027 | 21 647,25 | 21 647,25 | 0,00 |
| 2027–2028 | 23 568,75 | 23 568,75 | 0,00 |
| 2028–2029 | 27 698,05 | 27 698,05 | -0,00 |


### 5.3 Soldes mensuels de trésorerie


**2026–2027**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 92 900,53 | 71 716,98 | 21 183,55 | 21 183,55 |
| Fév | 12 490,63 | 10 676,18 | 1 814,45 | 22 998,00 |
| Mar | 12 900,53 | 10 111,09 | 2 789,44 | 25 787,44 |
| Avr | 15 485,19 | 10 300,10 | 5 185,09 | 30 972,53 |
| Mai | 9 985,67 | 9 935,94 | 49,73 | 31 022,26 |
| Jun | 6 740,61 | 9 305,94 | -2 565,33 | 28 456,93 |
| Jul | 6 490,12 | 9 111,14 | -2 621,02 | 25 835,91 |
| Aoû | 6 490,12 | 7 949,92 | -1 459,81 | 24 376,11 |
| Sep | 6 740,61 | 8 251,33 | -1 510,72 | 22 865,39 |
| Oct | 5 989,13 | 7 922,68 | -1 933,56 | 20 931,83 |
| Nov | 8 949,53 | 8 235,38 | 714,15 | 21 645,98 |
| Déc | 8 699,03 | 8 697,77 | 1,27 | 21 647,25 |

**2027–2028**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 13 545,56 | 9 348,14 | 4 197,42 | 25 844,67 |
| Fév | 13 115,16 | 10 551,64 | 2 563,52 | 28 408,19 |
| Mar | 13 545,56 | 10 768,42 | 2 777,14 | 31 185,33 |
| Avr | 16 259,45 | 11 669,66 | 4 589,79 | 35 775,12 |
| Mai | 10 484,95 | 10 616,64 | -131,69 | 35 643,44 |
| Jun | 7 077,64 | 10 215,04 | -3 137,40 | 32 506,04 |
| Jul | 6 814,62 | 10 492,56 | -3 677,94 | 28 828,10 |
| Aoû | 6 814,62 | 8 484,92 | -1 670,30 | 27 157,80 |
| Sep | 7 077,64 | 8 744,41 | -1 666,77 | 25 491,04 |
| Oct | 6 288,58 | 8 449,24 | -2 160,66 | 23 330,37 |
| Nov | 9 397,01 | 8 775,99 | 621,02 | 23 951,39 |
| Déc | 9 133,99 | 9 516,63 | -382,65 | 23 568,75 |

**2028–2029**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 14 222,83 | 10 088,09 | 4 134,74 | 27 703,49 |
| Fév | 13 770,92 | 10 755,09 | 3 015,83 | 30 719,32 |
| Mar | 14 222,83 | 11 121,54 | 3 101,29 | 33 820,62 |
| Avr | 17 072,42 | 12 669,35 | 4 403,07 | 38 223,69 |
| Mai | 11 009,20 | 10 820,66 | 188,55 | 38 412,23 |
| Jun | 7 431,53 | 10 507,60 | -3 076,08 | 35 336,16 |
| Jul | 7 155,35 | 10 729,37 | -3 574,02 | 31 762,14 |
| Aoû | 7 155,35 | 8 601,68 | -1 446,33 | 30 315,81 |
| Sep | 7 431,53 | 9 012,37 | -1 580,85 | 28 734,97 |
| Oct | 6 603,01 | 8 564,18 | -1 961,17 | 26 773,80 |
| Nov | 9 866,86 | 8 906,23 | 960,62 | 27 734,42 |
| Déc | 9 590,68 | 9 627,06 | -36,37 | 27 698,05 |


## 6. Détail des lignes du tableau de trésorerie


| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| **ENCAISSEMENTS** | 0,00 | 0,00 | 0,00 |
| Apports en capital | 1 000,00 | 0,00 | 0,00 |
| Apports en comptes courants | 19 000,00 | 0,00 | 0,00 |
| Emprunts (déblocages) | 60 000,00 | 0,00 | 0,00 |
| Production vendue | 113 861,70 | 119 554,79 | 125 532,52 |
| Subventions d'exploitation | 0,00 | 0,00 | 0,00 |
| Subventions et aides | 0,00 | 0,00 | 0,00 |
| Encaissements divers | 0,00 | 0,00 | 0,00 |
| Total des encaissements | 193 861,70 | 119 554,79 | 125 532,52 |
| **DÉCAISSEMENTS** | 0,00 | 0,00 | 0,00 |
| Immobilisations (Total) | 67 005,20 | 0,00 | 0,00 |
| Échéances d'emprunts | 10 278,45 | 10 237,43 | 10 173,36 |
| Achats effectués (Total) | 30 213,49 | 31 619,78 | 33 200,77 |
| Charges externes (Total) | 42 200,76 | 44 457,37 | 44 840,66 |
| État – Impôts et taxes | 1 623,00 | 1 978,00 | 1 978,00 |
| Charges de personnel (Total) | 20 112,13 | 26 931,00 | 27 384,68 |
| TVA à payer | 0,00 | 1 483,65 | 2 489,81 |
| Impôt sur les sociétés | 781,41 | 926,06 | 1 335,95 |
| Décaissements divers | 0,00 | 0,00 | 0,00 |
| Total des décaissements | 172 214,45 | 117 633,29 | 121 403,23 |
| **SOLDE DE TRÉSORERIE** | 0,00 | 0,00 | 0,00 |
| Solde précédent | 0,00 | 21 647,25 | 23 568,75 |
| Variation de trésorerie | 21 647,25 | 1 921,50 | 4 129,30 |
| **Solde de trésorerie** | 21 647,25 | 23 568,75 | 27 698,05 |
| Encours fournisseurs | 1 478,12 | 1 472,90 | 1 467,42 |


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
| Chiffre d'affaires | 103 136,00 | 108 292,80 | 113 707,44 |
| EBE | 13 871,82 | 11 875,35 | 15 477,61 |
| Résultat net | 5 904,02 | 5 028,86 | 8 417,52 |
| CAF | 9 487,72 | 8 612,55 | 12 001,22 |
| Seuil de rentabilité | 88 949,51 | 96 859,28 | 97 306,70 |
| Fonds de roulement | 17 870,48 | 18 620,96 | 22 439,76 |
| BFR | -3 776,77 | -4 947,79 | -5 258,29 |
| Solde trésorerie annuel | 21 647,25 | 23 568,75 | 27 698,05 |
| Solde trésorerie M12 | 21 647,25 | 23 568,75 | 27 698,05 |

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
| ****Chiffre d'affaires**** | 110 947,00 | 100.0 % | 116 494,35 | 100.0 % | 122 319,07 | 100.0 % |
| Ventes + Production réelle | 110 947,00 | 100.0 % | 116 494,35 | 100.0 % | 122 319,07 | 100.0 % |
| Marge globale | 80 015,55 | 72.1 % | 84 016,33 | 72.1 % | 88 217,15 | 72.1 % |
| Valeur ajoutée | 43 568,55 | 39.3 % | 47 426,89 | 40.7 % | 51 087,56 | 41.8 % |
| Excédent brut d'exploitation (EBE) | 16 882,30 | 15.2 % | 18 764,21 | 16.1 % | 22 424,88 | 18.3 % |
| Résultat d'exploitation | 13 465,10 | 12.1 % | 15 347,01 | 13.2 % | 19 007,68 | 15.5 % |
| Résultat financier | -3 799,21 | -3.4 % | -2 771,22 | -2.4 % | -2 322,80 | -1.9 % |
| Résultat courant | 9 665,89 | 8.7 % | 12 575,79 | 10.8 % | 16 684,88 | 13.6 % |
| ****Résultat de l'exercice**** | 8 216,01 | 7.4 % | 10 689,42 | 9.2 % | 14 182,15 | 11.6 % |
| ****CAF**** | 11 633,21 | 10.5 % | 14 106,62 | 12.1 % | 17 599,34 | 14.4 % |


### 1.2 Vérifications de cohérence SIG

| Check | Statut | Détail |
| --- | :---: | --- |
| CAF ≥ Résultat net (2026–2027) | ✅ | CAF = 11 633,21 € | ResNet = 8 216,01 € |
| CAF ≥ Résultat net (2027–2028) | ✅ | CAF = 14 106,62 € | ResNet = 10 689,42 € |
| CAF ≥ Résultat net (2028–2029) | ✅ | CAF = 17 599,34 € | ResNet = 14 182,15 € |
| EBE ≥ Résultat exploitation (2026–2027) | ✅ | EBE = 16 882,30 € | ResExpl = 13 465,10 € |
| EBE ≥ Résultat exploitation (2027–2028) | ✅ | EBE = 18 764,21 € | ResExpl = 15 347,01 € |
| EBE ≥ Résultat exploitation (2028–2029) | ✅ | EBE = 22 424,88 € | ResExpl = 19 007,68 € |


## 2. Seuil de Rentabilité Économique


| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| ****Ventes + Production réelle**** | 110 947,00 | 116 494,35 | 122 319,07 |
| Coûts variables | 30 931,45 | 27.9 % | 32 478,02 | 27.9 % | 34 101,92 | 27.9 % |
| Taux de marge sur coût variable | 72.1 % | 72.1 % | 72.1 % |
| Coûts fixes | 66 550,45 | 60.0 % | 68 669,32 | 58.9 % | 69 209,47 | 56.6 % |
| ****Seuil de rentabilité**** | 92 276,72 | 95 214,68 | 95 963,63 |
| Excédent / insuffisance | 18 670,28 | 21 279,67 | 26 355,44 |
| Point mort (jours) | 304 j | 298 j | 286 j |


### 2.1 Vérifications de cohérence seuil

| Check | Statut | Détail |
| --- | :---: | --- |
| Excédent = Ventes − Seuil (2026–2027) | ✅ | 18 670,28 ≟ 110 947,00 − 92 276,72 = 18 670,28 |
| Excédent = Ventes − Seuil (2027–2028) | ✅ | 21 279,67 ≟ 116 494,35 − 95 214,68 = 21 279,67 |
| Excédent = Ventes − Seuil (2028–2029) | ✅ | 26 355,44 ≟ 122 319,07 − 95 963,63 = 26 355,44 |
| Seuil = CF / Taux MCV (2026–2027) | ✅ | 92 276,72 ≟ 66 550,45 / 72.1 % = 92 276,72 |
| Seuil = CF / Taux MCV (2027–2028) | ✅ | 95 214,68 ≟ 68 669,32 / 72.1 % = 95 214,68 |
| Seuil = CF / Taux MCV (2028–2029) | ✅ | 95 963,63 ≟ 69 209,47 / 72.1 % = 95 963,63 |


## 3. Besoin en Fonds de Roulement (BFR)


*BFR = photo de la situation à la clôture, basée sur le dernier mois de l'exercice.*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Stocks de matières | 1 372,29 | 1 353,25 | 1 420,91 |
| Crédit de TVA | 0,00 | 0,00 | 0,00 |
| Total des besoins | 1 372,29 | 1 353,25 | 1 420,91 |
| Dettes fournisseurs (achats matières) | 2 508,87 | 2 634,88 | 2 766,62 |
| Dettes charges externes | 2 283,38 | 2 309,02 | 2 335,68 |
| Dettes impôts et taxes | 0,00 | 0,00 | 0,00 |
| Dettes personnel | 2 088,60 | 2 223,72 | 2 223,72 |
| TVA à payer | 308,32 | 405,04 | 486,93 |
| Impôt sur les sociétés (dette) | 362,47 | 471,59 | 625,68 |
| Total des ressources | 7 551,65 | 8 044,25 | 8 438,64 |
| Variation du BFR | -10 530,87 | -511,64 | -326,72 |
| **Besoin en fonds de roulement (BFR)** | -6 179,37 | -6 691,00 | -7 017,73 |


### 3.1 Récapitulatif BFR

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| ****BFR total**** | -6 179,37 | -6 691,00 | -7 017,73 |


## 4. Équilibre Financier (Fonds de Roulement)


*FR = Capitaux propres + Emprunts (LMT) − Immobilisations nettes*
*Solde trésorerie annuel = FR − BFR*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Capitaux propres | 28 216,01 | 38 905,43 | 53 087,57 |
| Emprunts (LMT) | 61 907,74 | 52 735,31 | 43 189,17 |
| Immobilisations nettes | 72 737,79 | 69 320,59 | 65 903,39 |
| ****Fonds de roulement (FR)**** | 17 385,96 | 22 320,15 | 30 373,35 |
| ****BFR**** | -6 179,37 | -6 691,00 | -7 017,73 |
| ****Solde de trésorerie (Annuel)**** | 23 565,32 | 29 011,15 | 37 391,08 |


### 4.1 Vérifications de cohérence FR

| Check | Statut | Détail |
| --- | :---: | --- |
| FR = CP + Emprunts − Immo (2026–2027) | ✅ | 17 385,96 ≟ 28 216,01 + 61 907,74 − 72 737,79 = 17 385,96 |
| Solde annuel = FR − BFR (2026–2027) | ✅ | 23 565,32 ≟ 17 385,96 − -6 179,37 = 23 565,32 |
| FR = CP + Emprunts − Immo (2027–2028) | ✅ | 22 320,15 ≟ 38 905,43 + 52 735,31 − 69 320,59 = 22 320,15 |
| Solde annuel = FR − BFR (2027–2028) | ✅ | 29 011,15 ≟ 22 320,15 − -6 691,00 = 29 011,15 |
| FR = CP + Emprunts − Immo (2028–2029) | ✅ | 30 373,35 ≟ 53 087,57 + 43 189,17 − 65 903,39 = 30 373,35 |
| Solde annuel = FR − BFR (2028–2029) | ✅ | 37 391,08 ≟ 30 373,35 − -7 017,73 = 37 391,08 |


## 5. Trésorerie



### 5.1 Synthèse annuelle trésorerie

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Total encaissements | 0,00 | 0,00 | 0,00 |
| Total décaissements | 0,00 | 0,00 | 0,00 |
| Variation de trésorerie | 23 557,69 | 5 453,46 | 8 379,93 |
| ****Solde trésorerie fin d'exercice (M12)**** | 23 557,69 | 29 011,15 | 37 391,08 |


### 5.2 Vérification solde M12 vs solde annuel (FR−BFR)


*Note : le solde FR−BFR est un solde comptable statique (bilan). Le solde M12 est le solde*
*de trésorerie mensuel à fin décembre calculé par le tableau de trésorerie.*
*Ces deux valeurs doivent être proches mais peuvent différer selon les décalages de paiement.*

| Exercice | Solde M12 (trésorerie) | Solde Annuel (FR−BFR) | Écart |
| --- | ---: | ---: | ---: |
| 2026–2027 | 23 557,69 | 23 565,32 | -7,63 |
| 2027–2028 | 29 011,15 | 29 011,15 | -0,00 |
| 2028–2029 | 37 391,08 | 37 391,08 | -0,00 |


### 5.3 Soldes mensuels de trésorerie


**2026–2027**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 103 874,88 | 80 551,92 | 23 322,95 | 23 322,95 |
| Fév | 13 434,02 | 12 687,17 | 746,85 | 24 069,80 |
| Mar | 13 874,88 | 10 692,02 | 3 182,86 | 27 252,66 |
| Avr | 16 654,75 | 10 465,03 | 6 189,72 | 33 442,38 |
| Mai | 10 739,86 | 11 208,89 | -469,02 | 32 973,35 |
| Jun | 7 249,71 | 10 305,32 | -3 055,61 | 29 917,75 |
| Jul | 6 980,30 | 9 740,67 | -2 760,37 | 27 157,37 |
| Aoû | 6 980,30 | 8 400,47 | -1 420,17 | 25 737,21 |
| Sep | 7 249,71 | 8 785,42 | -1 535,70 | 24 201,50 |
| Oct | 6 441,47 | 8 507,09 | -2 065,62 | 22 135,88 |
| Nov | 9 625,47 | 8 308,75 | 1 316,72 | 23 452,60 |
| Déc | 9 356,05 | 9 250,96 | 105,09 | 23 557,69 |

**2027–2028**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 14 568,62 | 9 524,06 | 5 044,56 | 28 602,25 |
| Fév | 14 105,72 | 10 899,54 | 3 206,17 | 31 808,42 |
| Mar | 14 568,62 | 11 237,22 | 3 331,40 | 35 139,83 |
| Avr | 17 487,49 | 12 526,26 | 4 961,23 | 40 101,06 |
| Mai | 11 276,86 | 11 725,99 | -449,13 | 39 651,92 |
| Jun | 7 612,20 | 11 164,18 | -3 551,98 | 36 099,94 |
| Jul | 7 329,31 | 10 979,91 | -3 650,59 | 32 449,35 |
| Aoû | 7 329,31 | 8 671,00 | -1 341,69 | 31 107,66 |
| Sep | 7 612,20 | 9 145,94 | -1 533,73 | 29 573,93 |
| Oct | 6 763,54 | 8 835,25 | -2 071,71 | 27 502,22 |
| Nov | 10 106,74 | 8 536,32 | 1 570,42 | 29 072,64 |
| Déc | 9 823,85 | 9 885,34 | -61,49 | 29 011,15 |

**2028–2029**

| Mois | Encaissements | Décaissements | Variation | Solde final |
| --- | ---: | ---: | ---: | ---: |
| Jan | 15 297,05 | 9 929,06 | 5 367,99 | 34 379,13 |
| Fév | 14 811,00 | 11 160,17 | 3 650,83 | 38 029,96 |
| Mar | 15 297,05 | 11 653,31 | 3 643,74 | 41 673,70 |
| Avr | 18 361,86 | 12 941,19 | 5 420,67 | 47 094,37 |
| Mai | 11 840,70 | 12 037,78 | -197,08 | 46 897,29 |
| Jun | 7 992,81 | 11 528,16 | -3 535,35 | 43 361,94 |
| Jul | 7 695,78 | 11 245,28 | -3 549,50 | 39 812,44 |
| Aoû | 7 695,78 | 8 812,02 | -1 116,24 | 38 696,20 |
| Sep | 7 992,81 | 9 439,50 | -1 446,69 | 37 249,51 |
| Oct | 7 101,72 | 9 043,78 | -1 942,06 | 35 307,45 |
| Nov | 10 612,08 | 8 668,04 | 1 944,03 | 37 251,49 |
| Déc | 10 315,05 | 10 175,46 | 139,59 | 37 391,08 |


## 6. Détail des lignes du tableau de trésorerie


| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| **ENCAISSEMENTS** | 0,00 | 0,00 | 0,00 |
| Apports en capital | 1 000,00 | 0,00 | 0,00 |
| Apports en comptes courants | 19 000,00 | 0,00 | 0,00 |
| Emprunts (déblocages) | 70 000,00 | 0,00 | 0,00 |
| Production vendue | 122 461,40 | 128 584,47 | 135 013,70 |
| Subventions d'exploitation | 0,00 | 0,00 | 0,00 |
| Subventions et aides | 0,00 | 0,00 | 0,00 |
| Encaissements divers | 0,00 | 0,00 | 0,00 |
| Total des encaissements | 212 461,40 | 128 584,47 | 135 013,70 |
| **DÉCAISSEMENTS** | 0,00 | 0,00 | 0,00 |
| Immobilisations (Total) | 78 323,99 | 0,00 | 0,00 |
| Échéances d'emprunts | 11 891,47 | 11 943,65 | 11 868,94 |
| Achats effectués (Total) | 31 796,48 | 34 339,28 | 36 152,46 |
| Charges externes (Total) | 41 041,42 | 43 460,54 | 44 097,93 |
| État – Impôts et taxes | 1 623,00 | 1 978,00 | 1 978,00 |
| Charges de personnel (Total) | 22 974,65 | 26 549,56 | 26 684,68 |
| TVA à payer | 165,29 | 3 082,74 | 3 503,11 |
| Impôt sur les sociétés | 1 087,41 | 1 777,25 | 2 348,64 |
| Décaissements divers | 0,00 | 0,00 | 0,00 |
| Total des décaissements | 188 903,71 | 123 131,01 | 126 633,77 |
| **SOLDE DE TRÉSORERIE** | 0,00 | 0,00 | 0,00 |
| Solde précédent | 0,00 | 23 557,69 | 29 011,15 |
| Variation de trésorerie | 23 557,69 | 5 453,46 | 8 379,93 |
| **Solde de trésorerie** | 23 557,69 | 29 011,15 | 37 391,08 |
| Encours fournisseurs | 3 231,70 | 3 380,38 | 3 440,28 |


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
| Chiffre d'affaires | 110 947,00 | 116 494,35 | 122 319,07 |
| EBE | 16 882,30 | 18 764,21 | 22 424,88 |
| Résultat net | 8 216,01 | 10 689,42 | 14 182,15 |
| CAF | 11 633,21 | 14 106,62 | 17 599,34 |
| Seuil de rentabilité | 92 276,72 | 95 214,68 | 95 963,63 |
| Fonds de roulement | 17 385,96 | 22 320,15 | 30 373,35 |
| BFR | -6 179,37 | -6 691,00 | -7 017,73 |
| Solde trésorerie annuel | 23 565,32 | 29 011,15 | 37 391,08 |
| Solde trésorerie M12 | 23 557,69 | 29 011,15 | 37 391,08 |

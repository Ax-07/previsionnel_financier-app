# Diagnostic Bilan — Dossier `cmmjoradm0001kohp15on2xe1`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`buildBilanRows` · `calcBfr` · `buildFinCalc`

Exercices : **2026–2027** · **2027–2028** · **2028–2029**

## Données saisies

> Snapshot de toutes les hypothèses saisies — données brutes stockées en base. `✅` = actif · `❌` = inactif

### Paramètres généraux

| Paramètre              | Valeur                       |
| ---------------------- | ---------------------------- |
| Date de démarrage      | 01/05/2026                   |
| Durée projection       | 3 exercices                  |
| Régime fiscal          | `IS`                         |
| Taux IS normal         | 25 %                         |
| Taux IS réduit         | 15 % · Plafond : 42 500,00 € |
| Régime TVA             | `REEL_NORMAL`                |
| Périodicité TVA        | `trimestriel`                |
| Taux TVA standard      | 20 %                         |
| Mois paiement salaires | 1                            |
| Régime social TNS      | `commerce`                   |
| Mode calcul TNS        | `DEFINITIF`                  |

### Activités

|  ✓  | Libellé       | Type              | TVA CA | Tx marge | TVA ach. | Stock j | Cli. j | Fourn. j |      CA N |     CA N+1 |     CA N+2 |
| :-: | ------------- | ----------------- | -----: | -------: | -------: | ------: | -----: | -------: | --------: | ---------: | ---------: |
| ✅  | Vente pizza   | PRODUCTION_VENDUE |   10 % |     73 % |    5.5 % |      15 |      0 |       15 | 96 955,00 | 101 802,75 | 106 892,89 |
| ✅  | Vente boisson | PRODUCTION_VENDUE |   10 % |     65 % |    5.5 % |      15 |      0 |       15 |  2 060,00 |   2 163,00 |   2 271,15 |
| ✅  | Vente alcool  | PRODUCTION_VENDUE |   20 % |     65 % |     20 % |      15 |      0 |       15 |  4 121,00 |   4 327,05 |   4 543,40 |

#### Saisonnalité CA (activités non-uniformes)

**Vente pizza**

| Exercice    |       Mai |       Jun |       Jul |       Aoû |      Sep |      Oct |      Nov |      Déc |      Jan |      Fév |      Mar |      Avr |      **Total** |
| :---------- | --------: | --------: | --------: | --------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------------: |
| 2026–2027 % |    11.3 % |    11.0 % |    11.3 % |    13.6 % |    8.8 % |    5.9 % |    5.7 % |    5.7 % |    5.9 % |    5.3 % |    7.9 % |    7.6 % |    **100.0 %** |
| 2026–2027 € | 10 985,00 | 10 635,96 | 10 985,00 | 13 185,88 | 8 502,95 | 5 739,74 | 5 526,44 | 5 526,44 | 5 739,74 | 5 099,83 | 7 620,66 | 7 407,36 |  **96 955,00** |
| 2027–2028 % |    11.3 % |    11.0 % |    11.3 % |    13.6 % |    8.8 % |    5.9 % |    5.7 % |    5.7 % |    5.9 % |    5.3 % |    7.9 % |    7.6 % |    **100.0 %** |
| 2027–2028 € | 11 534,25 | 11 167,76 | 11 534,25 | 13 845,17 | 8 928,10 | 6 026,72 | 5 802,76 | 5 802,76 | 6 026,72 | 5 354,82 | 8 001,70 | 7 777,73 | **101 802,75** |
| 2028–2029 % |    11.3 % |    11.0 % |    11.3 % |    13.6 % |    8.8 % |    5.9 % |    5.7 % |    5.7 % |    5.9 % |    5.3 % |    7.9 % |    7.6 % |    **100.0 %** |
| 2028–2029 € | 12 110,96 | 11 726,15 | 12 110,96 | 14 537,43 | 9 374,51 | 6 328,06 | 6 092,89 | 6 092,89 | 6 328,06 | 5 622,57 | 8 401,78 | 8 166,62 | **106 892,89** |

**Vente boisson**

| Exercice    |    Mai |    Jun |    Jul |    Aoû |    Sep |    Oct |    Nov |    Déc |    Jan |    Fév |    Mar |    Avr |    **Total** |
| :---------- | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2026–2027 € | 233,40 | 225,98 | 233,40 | 280,16 | 180,66 | 121,95 | 117,42 | 117,42 | 121,95 | 108,36 | 161,92 | 157,38 | **2 060,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2027–2028 € | 245,07 | 237,28 | 245,07 | 294,17 | 189,70 | 128,05 | 123,29 | 123,29 | 128,05 | 113,77 | 170,01 | 165,25 | **2 163,00** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2028–2029 € | 257,32 | 249,15 | 257,32 | 308,88 | 199,18 | 134,45 | 129,46 | 129,46 | 134,45 | 119,46 | 178,51 | 173,52 | **2 271,15** |

**Vente alcool**

| Exercice    |    Mai |    Jun |    Jul |    Aoû |    Sep |    Oct |    Nov |    Déc |    Jan |    Fév |    Mar |    Avr |    **Total** |
| :---------- | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2026–2027 € | 466,91 | 452,07 | 466,91 | 560,46 | 361,41 | 243,96 | 234,90 | 234,90 | 243,96 | 216,76 | 323,91 | 314,84 | **4 121,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2027–2028 € | 490,25 | 474,68 | 490,25 | 588,48 | 379,48 | 256,16 | 246,64 | 246,64 | 256,16 | 227,60 | 340,11 | 330,59 | **4 327,05** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2028–2029 € | 514,77 | 498,41 | 514,77 | 617,90 | 398,46 | 268,97 | 258,97 | 258,97 | 268,97 | 238,98 | 357,11 | 347,12 | **4 543,40** |

### Charges d'exploitation

|  ✓  | Libellé                                    | Catégorie              | Fréq.         | Délai j | TVA % |         N |       N+1 |       N+2 |
| :-: | ------------------------------------------ | ---------------------- | ------------- | ------: | ----: | --------: | --------: | --------: |
| ✅  | Embalages                                  | FOURNITURE_CONSOMMABLE | PERSONNALISEE |       0 |  20 % |  1 543,15 |  1 543,15 |  1 543,15 |
| ✅  | Electricité                                | FOURNITURE_CONSOMMABLE | MENSUELLE     |       0 |  20 % |  4 500,00 |  4 590,00 |  4 681,80 |
| ✅  | Eau                                        | FOURNITURE_CONSOMMABLE | MENSUELLE     |      30 |  20 % |    250,00 |    255,00 |    260,10 |
| ✅  | Petit équimement                           | FOURNITURE_CONSOMMABLE | MENSUELLE     |       0 |  20 % |    450,00 |    459,00 |    468,18 |
| ✅  | Produits d'entretiens                      | FOURNITURE_CONSOMMABLE | MENSUELLE     |      15 |  20 % |    600,00 |    612,00 |    624,24 |
| ✅  | Fournitures administratives                | FOURNITURE_CONSOMMABLE | MENSUELLE     |       0 |  20 % |    450,00 |    459,00 |    468,18 |
| ✅  | Location immobilière                       | SERVICE_EXTERIEUR      | MENSUELLE     |      30 |  20 % | 15 126,00 | 15 126,00 | 15 126,00 |
| ✅  | Location TPE + pp                          | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    231,00 |    235,62 |    240,33 |
| ✅  | Frais de télécommunication                 | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    480,00 |    600,00 |    600,00 |
| ✅  | Primes d'assurances                        | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |   0 % |  1 400,00 |  1 428,00 |  1 456,56 |
| ✅  | Entretiens et réparations                  | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |  1 600,00 |  1 632,00 |  1 664,64 |
| ✅  | Honoraires comptable et juridiques         | SERVICE_EXTERIEUR      | MENSUELLE     |      30 |  20 % |  2 800,00 |  2 856,00 |  2 913,12 |
| ✅  | Honoraires juridiques                      | SERVICE_EXTERIEUR      | MENSUELLE     |      30 |  20 % |    600,00 |    630,00 |    661,50 |
| ✅  | Publicité, publications                    | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |  1 000,00 |    500,00 |    500,00 |
| ✅  | Services bancaires                         | SERVICE_EXTERIEUR      | MENSUELLE     |      30 |  20 % |    584,00 |    595,68 |    607,59 |
| ✅  | Frais divers                               | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    500,00 |    510,00 |    520,20 |
| ✅  | Frais titre restaurant                     | SERVICE_EXTERIEUR      | PERSONNALISEE |      30 |  20 % |    415,52 |    415,52 |    415,52 |
| ✅  | Déplacements                               | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    200,00 |    200,00 |    200,00 |
| ✅  | Vetements de travail                       | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    100,00 |    100,00 |    100,00 |
| ✅  | Commission CB                              | SERVICE_EXTERIEUR      | MENSUELLE     |      30 |  20 % |    658,00 |    677,74 |    698,07 |
| ✅  | Abonnement logiciel de caisse (airkitchen) | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    810,00 |    810,00 |    810,00 |
| ✅  | offerts                                    | SERVICE_EXTERIEUR      | PERSONNALISEE |      30 |  20 % |  3 061,80 |  3 061,80 |  3 061,80 |

#### Détail saisonnalité charges personnalisées

**Embalages** _(PERSONNALISEE)_

| Exercice    |    Mai |    Jun |    Jul |    Aoû |    Sep |   Oct |   Nov |   Déc |   Jan |   Fév |    Mar |    Avr |    **Total** |
| :---------- | -----: | -----: | -----: | -----: | -----: | ----: | ----: | ----: | ----: | ----: | -----: | -----: | -----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2026–2027 € | 174,84 | 169,28 | 174,84 | 209,87 | 135,33 | 91,35 | 87,96 | 87,96 | 91,35 | 81,17 | 121,29 | 117,90 | **1 543,15** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2027–2028 € | 174,84 | 169,28 | 174,84 | 209,87 | 135,33 | 91,35 | 87,96 | 87,96 | 91,35 | 81,17 | 121,29 | 117,90 | **1 543,15** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2028–2029 € | 174,84 | 169,28 | 174,84 | 209,87 | 135,33 | 91,35 | 87,96 | 87,96 | 91,35 | 81,17 | 121,29 | 117,90 | **1 543,15** |

**Frais titre restaurant** _(PERSONNALISEE)_

| Exercice    |    Mai |    Jun |    Jul |    Aoû |   Sep |   Oct |   Nov |   Déc |   Jan |   Fév |   Mar |   Avr |   **Total** |
| :---------- | -----: | -----: | -----: | -----: | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2026–2027 € |  47,08 |  45,58 |  47,08 |  56,51 | 36,44 | 24,60 | 23,68 | 23,68 | 24,60 | 21,86 | 32,66 | 31,75 |  **415,52** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2027–2028 € |  47,08 |  45,58 |  47,08 |  56,51 | 36,44 | 24,60 | 23,68 | 23,68 | 24,60 | 21,86 | 32,66 | 31,75 |  **415,52** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2028–2029 € |  47,08 |  45,58 |  47,08 |  56,51 | 36,44 | 24,60 | 23,68 | 23,68 | 24,60 | 21,86 | 32,66 | 31,75 |  **415,52** |

**offerts** _(PERSONNALISEE)_

| Exercice    |    Mai |    Jun |    Jul |    Aoû |    Sep |    Oct |    Nov |    Déc |    Jan |    Fév |    Mar |    Avr |    **Total** |
| :---------- | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2026–2027 € | 346,90 | 335,88 | 346,90 | 416,40 | 268,52 | 181,26 | 174,52 | 174,52 | 181,26 | 161,05 | 240,66 | 233,92 | **3 061,80** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2027–2028 € | 346,90 | 335,88 | 346,90 | 416,40 | 268,52 | 181,26 | 174,52 | 174,52 | 181,26 | 161,05 | 240,66 | 233,92 | **3 061,80** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2028–2029 € | 346,90 | 335,88 | 346,90 | 416,40 | 268,52 | 181,26 | 174,52 | 174,52 | 181,26 | 161,05 | 240,66 | 233,92 | **3 061,80** |

### Impôts et taxes

|  ✓  | Libellé       | Date N     |        N | Date N+1   |      N+1 | Date N+2   |      N+2 |
| :-: | ------------- | ---------- | -------: | ---------- | -------: | ---------- | -------: |
| ✅  | CFE           | 2026-11-01 | 1 128,00 | 2027-11-01 | 1 128,00 | 2028-11-01 | 1 128,00 |
| ✅  | Taxe foncière | 2026-10-01 |   495,00 | 2027-10-01 |   850,00 | 2028-10-01 |   850,00 |

### Personnel — Salariés

|  ✓  | Libellé                           |    Brut N | Évo N+1 |  Brut N+1 | Évo N+2 |  Brut N+2 | Cot. sal. % | Cot. pat. % |    Coût N |  Coût N+1 |  Coût N+2 | Taux fixe | Commis. | Prime | CP  |
| :-: | --------------------------------- | --------: | ------: | --------: | ------: | --------: | ----------: | ----------: | --------: | --------: | --------: | --------: | :-----: | :---: | :-: |
| ❌  | Serveur saisonnier 39h (42 repas) | 12 391,00 |     2 % | 12 638,82 |     2 % | 12 891,59 |        22 % |        25 % | 15 488,75 | 15 798,53 | 16 114,49 |     100 % |    —    |   —   |  —  |

#### Détail mensuel salariés

**Serveur saisonnier 39h (42 repas)** _(brut annuel N : 12 391,00 — coût N : 15 488,75)_
| Exercice | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc | Jan | Fév | Mar | Avr | **Total** |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026–2027 Brut/pers. | 2 253,00 | 2 253,00 | 2 253,00 | 2 253,00 | 3 379,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | **—** |
| 2026–2027 Brut total | 2 253,00 | 2 253,00 | 2 253,00 | 2 253,00 | 3 379,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | **12 391,00** |
| 2027–2028 Brut/pers. | 2 298,06 | 2 298,06 | 2 298,06 | 2 298,06 | 3 446,58 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | -2 298,06 | **—** |
| 2027–2028 Brut total | 2 298,06 | 2 298,06 | 2 298,06 | 2 298,06 | 3 446,58 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | -0,00 | **12 638,82** |
| 2028–2029 Brut/pers. | 2 344,02 | 2 344,02 | 2 344,02 | 2 344,02 | 3 515,51 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | -2 344,01 | **—** |
| 2028–2029 Brut total | 2 344,02 | 2 344,02 | 2 344,02 | 2 344,02 | 3 515,51 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | 0,00 | -0,00 | **12 891,59** |

### Personnel — Dirigeants

|  ✓  | Libellé             | Rémunération N |       N+1 |       N+2 |
| :-: | ------------------- | -------------: | --------: | --------: |
| ✅  | Rémunération gérant |      14 400,00 | 18 000,00 | 18 000,00 |

### Personnel — Cotisations TNS

|  ✓  | Libellé                                    |        N |      N+1 |      N+2 |
| :-: | ------------------------------------------ | -------: | -------: | -------: |
| ✅  | Allocations familiales                     |     0,00 |     0,00 |     0,00 |
| ✅  | Maladie-maternité                          |   149,77 |   323,04 |   323,04 |
| ✅  | Indemnités journalières (IJ)               |    96,12 |    98,73 |    98,73 |
| ✅  | Retraite (base + compl) + invalidité-décès | 4 286,29 | 5 384,92 | 5 384,92 |
| ✅  | CSG/CRDS                                   | 1 654,13 | 2 053,48 | 2 053,48 |
| ✅  | CFP (forfait PASS)                         |   654,20 |   824,51 |   824,51 |
| ✅  | Cotisations facultatives (Madelin)         |   700,00 |   700,00 |   700,00 |
| ✅  | Cotisations facultatives (non Madelin)     |     0,00 |     0,00 |     0,00 |

### Immobilisations

|  ✓  | Libellé                                                          | Nature     | Mode amort. | Date acq.  | Montant HT | TVA % |  Durée | Différé |
| :-: | ---------------------------------------------------------------- | ---------- | ----------- | ---------- | ---------: | ----: | -----: | ------: |
| ✅  | Meuble pizza                                                     | CORPOREL   | LINEAIRE    | 01/05/2026 |   1 499,00 |  20 % | 10 ans |  0 mois |
| ✅  | Enseigne et communication                                        | CORPOREL   | LINEAIRE    | 01/05/2026 |   1 500,00 |  20 % | 10 ans |  0 mois |
| ✅  | Caisse enregistreuse (airkitchen)                                | CORPOREL   | LINEAIRE    | 01/05/2026 |     889,00 |  20 % |  5 ans |  0 mois |
| ✅  | Frais d'agence                                                   | INCORPOREL | AUCUN       | 01/05/2026 |   5 833,00 |  20 % |  0 ans |  0 mois |
| ✅  | Fond de commerce (materiel)                                      | CORPOREL   | LINEAIRE    | 01/05/2026 |  31 060,00 |   0 % | 10 ans |  0 mois |
| ✅  | Débours (provision pour frais de greffe et journal)              | INCORPOREL | AUCUN       | 01/05/2026 |     500,00 |   0 % |  0 ans |  0 mois |
| ✅  | Honoraires notaire (vente)                                       | INCORPOREL | AUCUN       | 01/05/2026 |   1 200,00 |  20 % |  0 ans |  0 mois |
| ✅  | Honoraires notaire (constitution société)                        | INCORPOREL | AUCUN       | 01/05/2026 |     700,00 |  20 % |  0 ans |  0 mois |
| ✅  | Provision pour frais de greffe et journal (constitution société) | INCORPOREL | AUCUN       | 01/05/2026 |     500,00 |   0 % |  0 ans |  0 mois |
| ✅  | Frais de garantie "France active"                                | FINANCIER  | AUCUN       | 01/05/2026 |     950,00 |   0 % |  0 ans |  0 mois |
| ✅  | Droit d'enregistrement                                           | INCORPOREL | AUCUN       | 01/05/2026 |   1 110,00 |   0 % |  0 ans |  0 mois |
| ✅  | Fond de commerce                                                 | INCORPOREL | AUCUN       | 01/05/2026 |  18 940,00 |   0 % |  0 ans |  0 mois |

### Financement — Apports

| Type           | Libellé               |   Montant | Date       | Remboursable |
| -------------- | --------------------- | --------: | ---------- | :----------: |
| CAPITAL        | Apport personnel      |  1 000,00 | 01/05/2026 |      —       |
| COMPTE_COURANT | Apport prêt d'honneur | 10 000,00 | 01/05/2026 |      —       |
| COMPTE_COURANT | Apport personnel      |  9 000,00 | 01/05/2026 |      —       |

### Financement — Emprunts

| Libellé |   Montant | Taux | Assur. |   Durée | Déblocage  | Différé | Type         |
| ------- | --------: | ---: | -----: | ------: | ---------- | :------ | ------------ |
| CIC     | 60 000,00 |  4 % |  0.8 % | 84 mois | 01/05/2026 | —       | AMORTISSABLE |

## Données calculées

> Résultats générés par le moteur de calcul à partir des hypothèses ci-dessus.

### Bilan officiel (= écran)

| Désignation                          | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------------ | --------: | --------: | --------: |
| **ACTIF**                            |           |           |           |
| Immobilisations incorporelles brutes | 28 783,00 | 28 783,00 | 28 783,00 |
| − Amortissements incorporels cumulés |      0,00 |      0,00 |      0,00 |
| Immobilisations incorporelles nettes | 28 783,00 | 28 783,00 | 28 783,00 |
| Immobilisations corporelles brutes   | 35 898,00 | 35 898,00 | 35 898,00 |
| − Amortissements corporels cumulés   |  3 583,70 |  7 167,40 | 10 751,10 |
| Immobilisations corporelles nettes   | 32 314,30 | 28 730,60 | 25 146,90 |
| **Total immobilisations nettes**     | 61 097,30 | 57 513,60 | 53 929,90 |
| Stocks de matières                   |  1 180,88 |  1 239,93 |  1 301,92 |
| Crédit de TVA                        |    631,96 |      0,00 |      0,00 |
| Créances clients                     |      0,00 |      0,00 |      0,00 |
| Disponibilités (trésorerie)          | 21 647,25 | 23 568,75 | 27 698,05 |
| **Total actif circulant**            | 23 460,10 | 24 808,68 | 28 999,97 |
| **TOTAL ACTIF**                      | 84 557,40 | 82 322,28 | 82 929,87 |
| **PASSIF**                           |           |           |           |
| Capital social                       |  1 000,00 |  1 000,00 |  1 000,00 |
| Comptes courants associés            | 19 000,00 | 19 000,00 | 19 000,00 |
| Réserves / Report à nouveau          |      0,00 |  5 904,02 | 10 932,88 |
| Résultat de l'exercice               |  5 904,02 |  5 028,86 |  8 417,52 |
| **Total capitaux propres**           | 25 904,02 | 30 932,88 | 39 350,40 |
| Emprunts (capital restant dû)        | 53 063,76 | 45 201,68 | 37 019,26 |
| Dettes fournisseurs                  |  1 150,17 |  1 207,68 |  1 268,06 |
| Dettes charges externes              |  2 350,60 |  2 363,44 |  2 376,65 |
| Dettes personnel                     |  1 828,38 |  2 282,06 |  2 282,06 |
| Dettes impôts et taxes               |      0,00 |      0,00 |      0,00 |
| TVA à payer                          |      0,00 |    112,68 |    262,08 |
| Impôt sur les sociétés (acompte)     |    260,47 |    221,86 |    371,36 |
| **Total dettes d'exploitation**      |  5 589,61 |  6 187,72 |  6 560,21 |
| **Total des dettes**                 | 58 653,37 | 51 389,40 | 43 579,47 |
| **TOTAL PASSIF**                     | 84 557,40 | 82 322,28 | 82 929,87 |

### Équilibre du bilan

| Exercice  | Statut       |
| --------- | ------------ |
| 2026–2027 | ✅ Équilibré |
| 2027–2028 | ✅ Équilibré |
| 2028–2029 | ✅ Équilibré |

### BFR — Vue d'ensemble (= écran)

| Désignation                    |  Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------ | -------: | --------: | --------: | --------: |
| Stocks matières                | 1 500,00 |  1 180,88 |  1 239,93 |  1 301,92 |
| Créances clients               |     0,00 |      0,00 |      0,00 |      0,00 |
| Crédit TVA                     | 2 406,70 |    631,96 |      0,00 |      0,00 |
| \***\*= Total Besoins\*\***    | 3 906,70 |  1 812,85 |  1 239,93 |  1 301,92 |
| Dettes fournisseurs            |     0,00 |  1 150,17 |  1 207,68 |  1 268,06 |
| Dettes charges ext.            |     0,00 |  2 350,60 |  2 363,44 |  2 376,65 |
| Dettes impôts/taxes            |     0,00 |      0,00 |      0,00 |      0,00 |
| Dettes personnel               |     0,00 |  1 828,38 |  2 282,06 |  2 282,06 |
| TVA à payer                    |     0,00 |      0,00 |    112,68 |    262,08 |
| Dettes IS                      |     0,00 |    260,47 |    221,86 |    371,36 |
| \***\*= Total Ressources\*\*** |     0,00 |  5 589,61 |  6 187,72 |  6 560,21 |
| \***\*= BFR\*\***              | 3 906,70 | -3 776,77 | -4 947,79 | -5 258,29 |
| \***\*Variation BFR\*\***      | 3 906,70 | -7 683,47 | -1 171,02 |   -310,50 |

### BFR — Détail Achats / Stocks par activité

#### Paramètres

| Activité      | Coef achat | TVA ach. % | Jours stock | Jours fourn. |
| ------------- | ---------: | ---------: | ----------: | -----------: |
| Vente pizza   |     0.2700 |        5.5 |          15 |           15 |
| Vente boisson |     0.3500 |        5.5 |          15 |           15 |
| Vente alcool  |     0.3500 |         20 |          15 |           15 |

#### Achats HT consommés + ponctuels

> AchHT = CA × coef. StockInit = ponctuelN[0] → BFR initial (y0). PoncFlux N = ponctuelN[1..11].

| Activité      | AchHT 2026–2027 | AchHT 2027–2028 | AchHT 2028–2029 | StockInit (y0) | PoncFlux 2026–2027 | PoncFlux 2027–2028 | PoncFlux 2028–2029 |
| ------------- | --------------: | --------------: | --------------: | -------------: | -----------------: | -----------------: | -----------------: |
| Vente pizza   |       26 177,85 |       27 486,74 |       28 861,08 |       1 500,00 |               0,00 |               0,00 |               0,00 |
| Vente boisson |          721,00 |          757,05 |          794,90 |           0,00 |               0,00 |               0,00 |               0,00 |
| Vente alcool  |        1 442,35 |        1 514,47 |        1 590,19 |           0,00 |               0,00 |               0,00 |               0,00 |
| **Total**     |   **28 341,20** |   **29 758,26** |   **31 246,17** |   **1 500,00** |           **0,00** |           **0,00** |           **0,00** |

#### Stocks fin d'exercice & Dettes fournisseurs

> Stock = achatsConsoHT × joursStock/360 (formule annuelle). DetteFourn = (M12 HT + ΔStock/12) × coefTTC × délaiMois.

| Activité                 |     Stock y0 | Stock 2026–2027 | Stock 2027–2028 | Stock 2028–2029 | DetteFourn 2026–2027 | DetteFourn 2027–2028 | DetteFourn 2028–2029 |
| ------------------------ | -----------: | --------------: | --------------: | --------------: | -------------------: | -------------------: | -------------------: |
| Vente pizza              |     1 500,00 |        1 090,74 |        1 145,28 |        1 202,55 |             1 054,99 |             1 107,74 |             1 163,13 |
| Vente boisson            |         0,00 |           30,04 |           31,54 |           33,12 |                29,06 |                30,51 |                32,04 |
| Vente alcool             |         0,00 |           60,10 |           63,10 |           66,26 |                66,12 |                69,42 |                72,89 |
| **Total**                | **1 500,00** |    **1 180,88** |    **1 239,93** |    **1 301,92** |         **1 150,17** |         **1 207,68** |         **1 268,06** |
| _BFR stocksMatieres_     |   _1 500,00_ |      _1 180,88_ |      _1 239,93_ |      _1 301,92_ |                      |                      |                      |
| _BFR dettesFournisseurs_ |              |      _1 150,17_ |      _1 207,68_ |      _1 268,06_ |                      |                      |                      |

#### TVA déductible achats (recalc par activité)

> TVA déd = (achatsConsoHT + ΔStock) × tvaAchats%.
> ΔStock Y1 = stockFin Y1 − 0 (SI = 0 hors ponctuel). ΔStock Y2 = stockFin Y2 − Y1. etc.
> Comparer le **Total recalc** au **Total moteur TVA** pour détecter les écarts.

| Activité         | TVADed 2026–2027 | TVADed 2027–2028 | TVADed 2028–2029 |
| ---------------- | ---------------: | ---------------: | ---------------: |
| Vente pizza      |         1 499,77 |         1 514,77 |         1 590,51 |
| Vente boisson    |            41,31 |            41,72 |            43,81 |
| Vente alcool     |           300,49 |           303,49 |           318,67 |
| **Total recalc** |     **1 841,57** |     **1 859,99** |     **1 952,98** |

### BFR — Détail charges externes

| Libellé                                    |       MtN |      MtN1 |      MtN2 | Délai | TVA% |  DetteY1 |  DetteY2 |  DetteY3 |
| ------------------------------------------ | --------: | --------: | --------: | ----: | ---: | -------: | -------: | -------: |
| Embalages                                  |  1 543,15 |  1 543,15 |  1 543,15 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Electricité                                |  4 500,00 |  4 590,00 |  4 681,80 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Eau                                        |    250,00 |    255,00 |    260,10 |    30 |   20 |    25,00 |    25,50 |    26,01 |
| Petit équimement                           |    450,00 |    459,00 |    468,18 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Produits d'entretiens                      |    600,00 |    612,00 |    624,24 |    15 |   20 |    30,00 |    30,60 |    31,21 |
| Fournitures administratives                |    450,00 |    459,00 |    468,18 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Location immobilière                       | 15 126,00 | 15 126,00 | 15 126,00 |    30 |   20 | 1 512,60 | 1 512,60 | 1 512,60 |
| Location TPE + pp                          |    231,00 |    235,62 |    240,33 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Frais de télécommunication                 |    480,00 |    600,00 |    600,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Primes d'assurances                        |  1 400,00 |  1 428,00 |  1 456,56 |     0 |    0 |     0,00 |     0,00 |     0,00 |
| Entretiens et réparations                  |  1 600,00 |  1 632,00 |  1 664,64 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Honoraires comptable et juridiques         |  2 800,00 |  2 856,00 |  2 913,12 |    30 |   20 |   280,00 |   285,60 |   291,31 |
| Honoraires juridiques                      |    600,00 |    630,00 |    661,50 |    30 |   20 |    60,00 |    63,00 |    66,15 |
| Publicité, publications                    |  1 000,00 |    500,00 |    500,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Services bancaires                         |    584,00 |    595,68 |    607,59 |    30 |   20 |    58,40 |    59,57 |    60,76 |
| Frais divers                               |    500,00 |    510,00 |    520,20 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Frais titre restaurant                     |    415,52 |    415,52 |    415,52 |    30 |   20 |    38,09 |    38,09 |    38,09 |
| Déplacements                               |    200,00 |    200,00 |    200,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Vetements de travail                       |    100,00 |    100,00 |    100,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Commission CB                              |    658,00 |    677,74 |    698,07 |    30 |   20 |    65,80 |    67,77 |    69,81 |
| Abonnement logiciel de caisse (airkitchen) |    810,00 |    810,00 |    810,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| offerts                                    |  3 061,80 |  3 061,80 |  3 061,80 |    30 |   20 |   280,71 |   280,71 |   280,71 |

### Compte de résultat (fc)

| Désignation                         |  2026–2027 |  2027–2028 |  2028–2029 |
| ----------------------------------- | ---------: | ---------: | ---------: |
| Chiffre d'affaires                  | 103 136,00 | 108 292,80 | 113 707,44 |
| Subventions                         |       0,00 |       0,00 |       0,00 |
| Production immobilisée              |       0,00 |       0,00 |       0,00 |
| Autres produits                     |       0,00 |       0,00 |       0,00 |
| \***\*= Total produits expl.\*\***  | 103 136,00 | 108 292,80 | 113 707,44 |
| Achats consommés                    |  28 341,20 |  29 758,26 |  31 246,17 |
| Charges externes                    |  37 359,47 |  37 296,51 |  37 620,98 |
| Impôts et taxes                     |   1 623,00 |   1 978,00 |   1 978,00 |
| Charges personnel                   |  21 940,51 |  27 384,68 |  27 384,68 |
| Dotations amort.                    |   3 583,70 |   3 583,70 |   3 583,70 |
| Dotations provisions                |       0,00 |       0,00 |       0,00 |
| Reprises                            |       0,00 |       0,00 |       0,00 |
| Autres charges gestion              |       0,00 |       0,00 |       0,00 |
| \***\*= Résultat exploitation\*\*** |  10 288,12 |   8 291,65 |  11 893,91 |
| Produits financiers                 |       0,00 |       0,00 |       0,00 |
| Charges financières                 |   3 342,21 |   2 375,35 |   1 990,94 |
| \***\*= Résultat financier\*\***    |  -3 342,21 |  -2 375,35 |  -1 990,94 |
| \***\*= Résultat courant\*\***      |   6 945,91 |   5 916,30 |   9 902,97 |
| Résultat exceptionnel               |       0,00 |       0,00 |       0,00 |
| Ajustement net                      |       0,00 |       0,00 |       0,00 |
| − IS                                |   1 041,89 |     887,44 |   1 485,45 |
| \***\*= Résultat net\*\***          |   5 904,02 |   5 028,86 |   8 417,52 |

### Vérification compte de résultat

| Désignation                        | 2026–2027 | 2027–2028 | 2028–2029 |
| ---------------------------------- | --------: | --------: | --------: | ---- |
| ResExpl (fc)                       | 10 288,12 |  8 291,65 | 11 893,91 |
| ResExpl recalculé (Prod − Charges) | 10 288,12 |  8 291,65 | 11 893,91 |
| Écart ResExpl                      |     -0,00 |      0,00 |     -0,00 | _✅_ |
| ResNet (fc)                        |  5 904,02 |  5 028,86 |  8 417,52 |

### Détail dotations amortissement (par immobilisation)

> Méthode : `distribuerAmortParExercice` — respecte AUCUN / LINEAIRE / DEGRESSIF.

| Libellé                                                          | Mode     | Durée | Montant HT |   Dot Y1 |   Dot Y2 |   Dot Y3 |
| ---------------------------------------------------------------- | -------- | ----: | ---------: | -------: | -------: | -------: |
| Meuble pizza                                                     | LINEAIRE |    10 |   1 499,00 |   149,90 |   149,90 |   149,90 |
| Enseigne et communication                                        | LINEAIRE |    10 |   1 500,00 |   150,00 |   150,00 |   150,00 |
| Caisse enregistreuse (airkitchen)                                | LINEAIRE |     5 |     889,00 |   177,80 |   177,80 |   177,80 |
| Frais d'agence                                                   | AUCUN    |     0 |   5 833,00 |     0,00 |     0,00 |     0,00 |
| Fond de commerce (materiel)                                      | LINEAIRE |    10 |  31 060,00 | 3 106,00 | 3 106,00 | 3 106,00 |
| Débours (provision pour frais de greffe et journal)              | AUCUN    |     0 |     500,00 |     0,00 |     0,00 |     0,00 |
| Honoraires notaire (vente)                                       | AUCUN    |     0 |   1 200,00 |     0,00 |     0,00 |     0,00 |
| Honoraires notaire (constitution société)                        | AUCUN    |     0 |     700,00 |     0,00 |     0,00 |     0,00 |
| Provision pour frais de greffe et journal (constitution société) | AUCUN    |     0 |     500,00 |     0,00 |     0,00 |     0,00 |
| Frais de garantie "France active"                                | AUCUN    |     0 |     950,00 |     0,00 |     0,00 |     0,00 |
| Droit d'enregistrement                                           | AUCUN    |     0 |   1 110,00 |     0,00 |     0,00 |     0,00 |
| Fond de commerce                                                 | AUCUN    |     0 |  18 940,00 |     0,00 |     0,00 |     0,00 |

### Cohérence dotations amort (distribuerAmortParExercice vs fc.dotationsAmort)

| Désignation       | 2026–2027 | 2027–2028 | 2028–2029 |
| ----------------- | --------: | --------: | --------: | ------------- |
| Σ distribuerAmort |  3 583,70 |  3 583,70 |  3 583,70 |
| fc.dotationsAmort |  3 583,70 |  3 583,70 |  3 583,70 |
| Écart             |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |

### Détail immobilisations actives

| Libellé                                                          | Nature     | Date acq.  | Montant HT | Durée | Actif |
| ---------------------------------------------------------------- | ---------- | ---------- | ---------: | ----: | ----- |
| Meuble pizza                                                     | CORPOREL   | 01/05/2026 |   1 499,00 |    10 | oui   |
| Enseigne et communication                                        | CORPOREL   | 01/05/2026 |   1 500,00 |    10 | oui   |
| Caisse enregistreuse (airkitchen)                                | CORPOREL   | 01/05/2026 |     889,00 |     5 | oui   |
| Frais d'agence                                                   | INCORPOREL | 01/05/2026 |   5 833,00 |     0 | oui   |
| Fond de commerce (materiel)                                      | CORPOREL   | 01/05/2026 |  31 060,00 |    10 | oui   |
| Débours (provision pour frais de greffe et journal)              | INCORPOREL | 01/05/2026 |     500,00 |     0 | oui   |
| Honoraires notaire (vente)                                       | INCORPOREL | 01/05/2026 |   1 200,00 |     0 | oui   |
| Honoraires notaire (constitution société)                        | INCORPOREL | 01/05/2026 |     700,00 |     0 | oui   |
| Provision pour frais de greffe et journal (constitution société) | INCORPOREL | 01/05/2026 |     500,00 |     0 | oui   |
| Frais de garantie "France active"                                | FINANCIER  | 01/05/2026 |     950,00 |     0 | oui   |
| Droit d'enregistrement                                           | INCORPOREL | 01/05/2026 |   1 110,00 |     0 | oui   |
| Fond de commerce                                                 | INCORPOREL | 01/05/2026 |  18 940,00 |     0 | oui   |

### Détail emprunts

| Libellé | Montant initial | Date déblocage | Capital restant fin Y1 |    fin Y2 |    fin Y3 |
| ------- | --------------: | -------------- | ---------------------: | --------: | --------: |
| CIC     |       60 000,00 | 01/05/2026     |              53 063,76 | 45 201,68 | 37 019,26 |

### Trésorerie — Comparaison Bilan vs Tableau mensuel

> **But :** identifier pourquoi `Disponibilités (bilan)` peut différer du `Solde fin (tableau mensuel)`.
>
> - **Tableau mensuel** : cumule les flux TTC mois par mois (encaissements TTC − décaissements TTC).
> - **Bilan** : reconstruit la tréso via la formule économique : apports + emprunts + CAF cumulatif − immos − BFR besoins + BFR dettes.
>
> Les deux doivent être égaux si les hypothèses sont cohérentes. Un écart signale une divergence de modélisation.

#### A — Tableau de trésorerie (flux mensuels TTC)

| Désignation                                         |  2026–2027 |  2027–2028 |  2028–2029 |
| --------------------------------------------------- | ---------: | ---------: | ---------: |
| Enc. apports capital                                |   1 000,00 |       0,00 |       0,00 |
| Enc. apports CC                                     |  19 000,00 |       0,00 |       0,00 |
| Enc. emprunts débloqués                             |  60 000,00 |       0,00 |       0,00 |
| Enc. production vendue (TTC)                        | 113 861,70 | 119 554,79 | 125 532,52 |
| Enc. subventions exploitation                       |       0,00 |       0,00 |       0,00 |
| Enc. subventions investissement                     |       0,00 |       0,00 |       0,00 |
| Enc. divers                                         |       0,00 |       0,00 |       0,00 |
| \***\*= Total encaissements\*\***                   | 193 861,70 | 119 554,79 | 125 532,52 |
| Dec. immobilisations (TTC)                          |  67 005,20 |       0,00 |       0,00 |
| Dec. emprunts (capital + intérêts + frais)          |  10 278,45 |  10 237,43 |  10 173,36 |
| Dec. achats                                         |  30 213,49 |  31 619,78 |  33 200,77 |
| Dec. charges externes                               |  42 200,76 |  44 457,37 |  44 840,66 |
| Dec. impôts et taxes                                |   1 623,00 |   1 978,00 |   1 978,00 |
| Dec. personnel                                      |  20 112,13 |  26 931,00 |  27 384,68 |
| Dec. TVA nette (collectée − déductible)             |       0,00 |   1 483,65 |   2 489,81 |
| Dec. IS                                             |     781,41 |     926,06 |   1 335,95 |
| Dec. divers                                         |       0,00 |       0,00 |       0,00 |
| \***\*= Total décaissements\*\***                   | 172 214,45 | 117 633,29 | 121 403,23 |
| Solde début d'exercice                              |       0,00 |  21 647,25 |  23 568,75 |
| Variation nette (enc − dec)                         |  21 647,25 |   1 921,50 |   4 129,30 |
| \***\*= Solde fin d'exercice (soldeFinal[11])\*\*** |  21 647,25 |  23 568,75 |  27 698,05 |

#### B — Trésorerie bilan (formule cumulative économique)

> Formule : apports + emprunts + CAF cumulatif − immos − BFR besoins + BFR dettes

| Désignation                                      | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------------------------ | --------: | --------: | --------: |
| Apports capital cumulatifs                       |  1 000,00 |  1 000,00 |  1 000,00 |
| Apports CC cumulatifs                            | 19 000,00 | 19 000,00 | 19 000,00 |
| Emprunts débloqués cumulatifs                    | 60 000,00 | 60 000,00 | 60 000,00 |
| + CAF cumulatif                                  |  9 487,72 | 18 100,28 | 30 101,50 |
| dont: CAF Y1                                     |  9 487,72 |  9 487,72 |  9 487,72 |
| dont: CAF Y2                                     |      0,00 |  8 612,55 |  8 612,55 |
| dont: CAF Y3                                     |      0,00 |      0,00 | 12 001,22 |
| + Enc. non-P&L cumulatifs (subv invest + divers) |      0,00 |      0,00 |      0,00 |
| − Dec. non-P&L cumulatifs (divers)               |      0,00 |      0,00 |      0,00 |
| − Immos acquises cumulatives (HT)                | 64 681,00 | 64 681,00 | 64 681,00 |
| − BFR besoins (stocks+crédit TVA+créances)       |  1 812,85 |  1 239,93 |  1 301,92 |
| dont: Stocks de matières                         |  1 180,88 |  1 239,93 |  1 301,92 |
| dont: Crédit de TVA                              |    631,96 |      0,00 |      0,00 |
| dont: Créances clients                           |      0,00 |      0,00 |      0,00 |
| − Remboursements capital cumulatifs              |  6 936,24 | 14 798,32 | 22 980,74 |
| \***\*= Trésorerie brute\*\***                   | 16 057,64 | 17 381,03 | 21 137,84 |
| + BFR dettes expl. (totalRessources)             |  5 589,61 |  6 187,72 |  6 560,21 |
| dont: Dettes fournisseurs                        |  1 150,17 |  1 207,68 |  1 268,06 |
| dont: Dettes charges ext.                        |  2 350,60 |  2 363,44 |  2 376,65 |
| dont: Dettes impôts/taxes                        |      0,00 |      0,00 |      0,00 |
| dont: Dettes personnel                           |  1 828,38 |  2 282,06 |  2 282,06 |
| dont: TVA à payer                                |      0,00 |    112,68 |    262,08 |
| dont: Dettes IS                                  |    260,47 |    221,86 |    371,36 |
| \***\*= Tréso corrigée\*\***                     | 21 647,25 | 23 568,75 | 27 698,05 |
| \***\*= Disponibilités (bilan)\*\***             | 21 647,25 | 23 568,75 | 27 698,05 |

#### C — Réconciliation

| Désignation                     | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------- | --------: | --------: | --------: | ------------- |
| Tableau mensuel soldeFinal[11]  | 21 647,25 | 23 568,75 | 27 698,05 |
| Bilan disponibilités            | 21 647,25 | 23 568,75 | 27 698,05 |
| \***\*Écart (Tab − Bilan)\*\*** |      0,00 |      0,00 |     -0,00 | _✅ Cohérent_ |

### Détail apports

| Type           |   Montant | Date apport |
| -------------- | --------: | ----------- |
| CAPITAL        |  1 000,00 | 01/05/2026  |
| COMPTE_COURANT | 10 000,00 | 01/05/2026  |
| COMPTE_COURANT |  9 000,00 | 01/05/2026  |

### Tableau de TVA

> **Régime TVA :** REEL_NORMAL | **Périodicité déclaration :** trimestriel

#### A — Synthèse annuelle

| Désignation                           | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------------- | --------: | --------: | --------: |
| TVA collectée sur CA                  | 10 725,70 | 11 261,99 | 11 825,08 |
| **Total TVA collectée**               | 10 725,70 | 11 261,99 | 11 825,08 |
| ---                                   |      ---: |      ---: |      ---: |
| TVA déductible sur immos              |  2 324,20 |      0,00 |      0,00 |
| TVA déductible sur achats matières    |  1 841,57 |  1 859,99 |  1 952,98 |
| TVA déductible sur charges ext.       |  7 191,89 |  7 173,70 |  7 232,88 |
| **Total TVA déductible**              | 11 357,66 |  9 033,69 |  9 185,87 |
| ---                                   |      ---: |      ---: |      ---: |
| TVA nette annuelle (∑)                |   -631,96 |  2 228,30 |  2 639,22 |
| Crédit TVA fin exercice (M12 reporté) |    631,96 |      0,00 |      0,00 |
| **TVA à payer annuelle (∑)**          |      0,00 |  1 596,33 |  2 639,22 |

#### B — Cohérence TVA tableau vs BFR

> Le BFR utilise la valeur de fin d'exercice (M12) : TVA à payer = dette passif ; crédit TVA = actif circulant.

| Désignation                     | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------- | --------: | --------: | --------: | ------------- |
| TVA à payer M12 (tableau TVA)   |      0,00 |    112,68 |    262,08 |
| TVA à payer BFR (bfr.tvaAPayer) |      0,00 |    112,68 |    262,08 |
| Écart TVA à payer               |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |
| Crédit TVA M12 (tableau TVA)    |    631,96 |      0,00 |      0,00 |
| Crédit TVA BFR (bfr.creditTVA)  |    631,96 |      0,00 |      0,00 |
| Écart crédit TVA                |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |

#### C — Cohérence TVA décaissée vs tableau de trésorerie

> `dec.decTVA` = TVA payée dans le tableau mensuel. Doit correspondre à `tvaAPayerMonthly` du moteur TVA.

| Désignation                              | 2026–2027 | 2027–2028 | 2028–2029 |
| ---------------------------------------- | --------: | --------: | --------: | --------------- |
| TVA à payer ∑ annuel (tableau TVA)       |      0,00 |  1 596,33 |  2 639,22 |
| dec.decTVA ∑ annuel (tableau trésorerie) |      0,00 |  1 483,65 |  2 489,81 |
| Écart                                    |      0,00 |   -112,68 |   -149,40 | _❌ DIVERGENCE_ |

#### D — Détail mensuel

**2026–2027**

| Désignation                 |       M01 |      M02 |      M03 |      M04 |      M05 |    M06 |    M07 |    M08 |    M09 |     M10 |    M11 |    M12 |     Total |
| --------------------------- | --------: | -------: | -------: | -------: | -------: | -----: | -----: | -----: | -----: | ------: | -----: | -----: | --------: |
| TVA collectée CA            |  1 215,22 | 1 176,61 | 1 215,22 | 1 458,70 |   940,64 | 634,96 | 611,36 | 611,36 | 634,96 |  564,17 | 843,04 | 819,44 | 10 725,70 |
| TVA déductible immos        |  2 324,20 |        — |        — |        — |        — |      — |      — |      — |      — |       — |      — |      — |  2 324,20 |
| TVA déductible achats       |    206,44 |   200,08 |   206,44 |   246,57 |   161,18 | 110,80 | 106,91 | 106,91 | 110,80 |   99,13 | 145,10 | 141,21 |  1 841,57 |
| TVA déductible charges ext. |    629,41 |   625,80 |   629,41 |   652,21 |   603,71 | 575,09 | 572,88 | 572,88 | 575,09 |  568,47 | 594,57 | 592,36 |  7 191,89 |
| TVA nette                   | -1 944,83 |   350,73 |   379,37 |   559,91 |   175,75 | -50,93 | -68,43 | -68,43 | -50,93 | -103,42 | 103,37 |  85,87 |   -631,96 |
| Crédit TVA reporté          |         — |        — | 1 214,74 | 1 214,74 | 1 214,74 | 530,00 | 530,00 | 530,00 | 717,79 |  717,79 | 717,79 | 631,96 |  8 019,53 |
| TVA à payer                 |         — |        — |        — |        — |        — |      — |      — |      — |      — |       — |      — |      — |         — |

**2027–2028**

| Désignation                 |      M01 |      M02 |      M03 |      M04 |    M05 |    M06 |    M07 |    M08 |    M09 |    M10 |    M11 |    M12 |     Total |
| --------------------------- | -------: | -------: | -------: | -------: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | --------: |
| TVA collectée CA            | 1 275,98 | 1 235,44 | 1 275,98 | 1 531,63 | 987,68 | 666,71 | 641,93 | 641,93 | 666,71 | 592,38 | 885,19 | 860,42 | 11 261,99 |
| TVA déductible immos        |        — |        — |        — |        — |      — |      — |      — |      — |      — |      — |      — |      — |         — |
| TVA déductible achats       |   210,63 |   203,94 |   210,63 |   252,76 | 163,10 | 110,20 | 106,12 | 106,12 | 110,20 |  97,95 | 146,21 | 142,13 |  1 859,99 |
| TVA déductible charges ext. |   627,90 |   624,28 |   627,90 |   650,69 | 602,19 | 573,58 | 571,37 | 571,37 | 573,58 | 566,95 | 593,06 | 590,85 |  7 173,70 |
| TVA nette                   |   437,46 |   407,21 |   437,46 |   628,18 | 222,38 | -17,07 | -35,55 | -35,55 | -17,07 | -72,52 | 145,92 | 127,44 |  2 228,30 |
| Crédit TVA reporté          |   631,96 |   631,96 |        — |        — |      — |      — |      — |      — |  88,17 |  88,17 |  88,17 |      — |  1 528,43 |
| TVA à payer                 |        — |        — |   650,17 |        — |      — | 833,49 |      — |      — |      — |      — |      — | 112,68 |  1 596,33 |

**2028–2029**

| Désignation                 |      M01 |      M02 |      M03 |      M04 |      M05 |    M06 |    M07 |    M08 |    M09 |    M10 |    M11 |    M12 |     Total |
| --------------------------- | -------: | -------: | -------: | -------: | -------: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | --------: |
| TVA collectée CA            | 1 339,78 | 1 297,21 | 1 339,78 | 1 608,21 | 1 037,06 | 700,04 | 674,03 | 674,03 | 700,04 | 622,00 | 929,45 | 903,44 | 11 825,08 |
| TVA déductible immos        |        — |        — |        — |        — |        — |      — |      — |      — |      — |      — |      — |      — |         — |
| TVA déductible achats       |   221,16 |   214,14 |   221,16 |   265,40 |   171,26 | 115,71 | 111,42 | 111,42 | 115,71 | 102,85 | 153,52 | 149,23 |  1 952,98 |
| TVA déductible charges ext. |   632,83 |   629,21 |   632,83 |   655,62 |   607,12 | 578,51 | 576,30 | 576,30 | 578,51 | 571,88 | 597,99 | 595,78 |  7 232,88 |
| TVA nette                   |   485,80 |   453,86 |   485,80 |   687,19 |   258,68 |   5,83 | -13,69 | -13,69 |   5,83 | -52,73 | 177,94 | 158,42 |  2 639,22 |
| Crédit TVA reporté          |        — |        — |        — |        — |        — |      — |      — |      — |  21,56 |  21,56 |  21,56 |      — |     64,67 |
| TVA à payer                 |        — |        — | 1 425,45 |        — |        — | 951,69 |      — |      — |      — |      — |      — | 262,08 |  2 639,22 |

### Vérification CAF (= Résultat net + Dotations − Reprises)

| Désignation                | 2026–2027 | 2027–2028 | 2028–2029 |
| -------------------------- | --------: | --------: | --------: | ------------- |
| Résultat net               |  5 904,02 |  5 028,86 |  8 417,52 |
| + Dotations amortissements |  3 583,70 |  3 583,70 |  3 583,70 |
| + Dotations provisions     |      0,00 |      0,00 |      0,00 |
| − Reprises sur provisions  |      0,00 |      0,00 |      0,00 |
| **= CAF recalculée**       |  9 487,72 |  8 612,55 | 12 001,22 |
| CAF officielle (fc.caf)    |  9 487,72 |  8 612,55 | 12 001,22 |
| Écart                      |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |

### SIG — Soldes Intermédiaires de Gestion

> Valeurs issues de **fc** — même moteur que l'application.

| Désignation                           |  2026–2027 |  2027–2028 |  2028–2029 |
| ------------------------------------- | ---------: | ---------: | ---------: | ------------------------------ |
| CA HT                                 | 103 136,00 | 108 292,80 | 113 707,44 |
| − Achats consommés                    |  28 341,20 |  29 758,26 |  31 246,17 |
| **= Marge brute**                     |  74 794,80 |  78 534,54 |  82 461,27 | _tx: 72,5 % / 72,5 % / 72,5 %_ |
| + Production immobilisée              |       0,00 |       0,00 |       0,00 |
| + Transferts de charges               |       0,00 |       0,00 |       0,00 |
| + Autres produits exploitation        |       0,00 |       0,00 |       0,00 |
| − Charges externes                    |  37 359,47 |  37 296,51 |  37 620,98 |
| **= Valeur Ajoutée (VA)**             |  37 435,33 |  41 238,03 |  44 840,29 | _tx: 36,3 % / 38,1 % / 39,4 %_ |
| + Subventions exploitation            |       0,00 |       0,00 |       0,00 |
| − Impôts et taxes                     |   1 623,00 |   1 978,00 |   1 978,00 |
| − Charges de personnel                |  21 940,51 |  27 384,68 |  27 384,68 |
| **= EBE**                             |  13 871,82 |  11 875,35 |  15 477,61 | _tx: 13,5 % / 11,0 % / 13,6 %_ |
| − Dotations amortissements            |   3 583,70 |   3 583,70 |   3 583,70 |
| − Dotations provisions                |       0,00 |       0,00 |       0,00 |
| + Reprises sur provisions             |       0,00 |       0,00 |       0,00 |
| ± Autres charges/produits gestion net |      -0,00 |      -0,00 |      -0,00 |
| **= Résultat d'exploitation (REX)**   |  10 288,12 |   8 291,65 |  11 893,91 | _tx: 10,0 % / 7,7 % / 10,5 %_  |
| + Produits financiers                 |       0,00 |       0,00 |       0,00 |
| − Charges financières                 |   3 342,21 |   2 375,35 |   1 990,94 |
| **= Résultat financier**              |  -3 342,21 |  -2 375,35 |  -1 990,94 |
| **= Résultat courant (RCB)**          |   6 945,91 |   5 916,30 |   9 902,97 |
| + Résultat exceptionnel               |       0,00 |       0,00 |       0,00 |
| +/− Ajustements nets                  |       0,00 |       0,00 |       0,00 |
| − IS                                  |   1 041,89 |     887,44 |   1 485,45 |
| **= Résultat net**                    |   5 904,02 |   5 028,86 |   8 417,52 | _tx: 5,7 % / 4,6 % / 7,4 %_    |
| **CAF**                               |   9 487,72 |   8 612,55 |  12 001,22 | _tx: 9,2 % / 8,0 % / 10,6 %_   |

### Détail activités (hypothèses saisies)

| Libellé       | Type              | Tx marge | TVA CA | TVA ach. | Stock j | Cli. j | Fourn. j |      CA N |     CA N+1 |     CA N+2 |
| ------------- | ----------------- | -------: | -----: | -------: | ------: | -----: | -------: | --------: | ---------: | ---------: |
| Vente pizza   | PRODUCTION_VENDUE |     73 % |   10 % |    5.5 % |      15 |      0 |       15 | 96 955,00 | 101 802,75 | 106 892,89 |
| Vente boisson | PRODUCTION_VENDUE |     65 % |   10 % |    5.5 % |      15 |      0 |       15 |  2 060,00 |   2 163,00 |   2 271,15 |
| Vente alcool  | PRODUCTION_VENDUE |     65 % |   20 % |     20 % |      15 |      0 |       15 |  4 121,00 |   4 327,05 |   4 543,40 |

| Désignation                         |  2026–2027 |  2027–2028 |  2028–2029 |
| ----------------------------------- | ---------: | ---------: | ---------: |
| CA total activités actives (saisie) | 103 136,00 | 108 292,80 | 113 707,44 |
| CA total (fc.ca)                    | 103 136,00 | 108 292,80 | 113 707,44 |

### Détail personnel (hypothèses saisies vs fc)

#### Salariés

> _(aucun)_

#### Dirigeants

| Libellé             | Rémunération N |       N+1 |       N+2 |
| ------------------- | -------------: | --------: | --------: |
| Rémunération gérant |      14 400,00 | 18 000,00 | 18 000,00 |

#### Cotisations TNS

| Libellé                                    |        N |      N+1 |      N+2 |
| ------------------------------------------ | -------: | -------: | -------: |
| Allocations familiales                     |     0,00 |     0,00 |     0,00 |
| Maladie-maternité                          |   149,77 |   323,04 |   323,04 |
| Indemnités journalières (IJ)               |    96,12 |    98,73 |    98,73 |
| Retraite (base + compl) + invalidité-décès | 4 286,29 | 5 384,92 | 5 384,92 |
| CSG/CRDS                                   | 1 654,13 | 2 053,48 | 2 053,48 |
| CFP (forfait PASS)                         |   654,20 |   824,51 |   824,51 |
| Cotisations facultatives (Madelin)         |   700,00 |   700,00 |   700,00 |
| Cotisations facultatives (non Madelin)     |     0,00 |     0,00 |     0,00 |

#### Taxes sur salaires

> _(aucune)_

#### Récapitulatif fc.chargesPersonnel

| Désignation                   | 2026–2027 | 2027–2028 | 2028–2029 |
| ----------------------------- | --------: | --------: | --------: |
| Salaires bruts                |      0,00 |      0,00 |      0,00 |
| + Charges patronales          |      0,00 |      0,00 |      0,00 |
| + Rémunération dirigeant      | 14 400,00 | 18 000,00 | 18 000,00 |
| + Cotisations TNS total       |  7 540,51 |  9 384,68 |  9 384,68 |
| + Taxes salaires total        |      0,00 |      0,00 |      0,00 |
| **= Total charges personnel** | 21 940,51 | 27 384,68 | 27 384,68 |

### Plan de financement (= écran)

**BESOINS**

| Désignation                     |   Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------- | --------: | --------: | --------: | --------: |
| + Immobilisations incorporelles | 28 783,00 |      0,00 |      0,00 |      0,00 |
| + Immobilisations corporelles   | 35 898,00 |      0,00 |      0,00 |      0,00 |
| = Total immobilisations         | 64 681,00 |      0,00 |      0,00 |      0,00 |
| + Variation du BFR              |  3 906,70 | -7 683,47 | -1 171,02 |   -310,50 |
| + Remboursement des emprunts    |      0,00 |  6 936,24 |  7 862,08 |  8 182,42 |
| **= Total des besoins**         | 68 587,70 |   -747,23 |  6 691,06 |  7 871,92 |

**RESSOURCES**

| Désignation                        |   Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| ---------------------------------- | --------: | --------: | --------: | --------: |
| + Apports en capital               |  1 000,00 |      0,00 |      0,00 |      0,00 |
| + Apports en comptes courants      | 19 000,00 |      0,00 |      0,00 |      0,00 |
| + Souscription d'emprunts          | 60 000,00 |      0,00 |      0,00 |      0,00 |
| + Subventions d'investissement     |      0,00 |      0,00 |      0,00 |      0,00 |
| + Capacité d'autofinancement (CAF) |      0,00 |  9 487,72 |  8 612,55 | 12 001,22 |
| **= Total des ressources**         | 80 000,00 |  9 487,72 |  8 612,55 | 12 001,22 |

**TRÉSORERIE**

| Désignation               |   Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------- | --------: | --------: | --------: | --------: |
| = Variation de trésorerie | 11 412,30 | 10 234,95 |  1 921,50 |  4 129,30 |
| **= Solde de trésorerie** | 11 412,30 | 21 647,25 | 23 568,75 | 27 698,05 |

| **Écart (Ressources − Besoins)** | 11 412,30 | 10 234,95 | 1 921,50 | 4 129,30 | _❌ DÉSÉQUILIBRE_ |

### Échéancier emprunts (par exercice)

#### CIC

> Montant : **60 000,00 €** · Taux : **4 %** · Durée : **84 mois** · Déblocage : **01/05/2026** · MENSUEL · AMORTISSABLE

| Exercice                 | Cap. remboursé |     Intérêts |    Assurance | Total mensualités | Cap. restant fin |
| ------------------------ | -------------: | -----------: | -----------: | ----------------: | ---------------: |
| 2026–2027                |       6 936,24 |     2 085,17 |       417,04 |          9 438,45 |        53 063,75 |
| 2027–2028                |       7 862,08 |     1 979,46 |       395,89 |         10 237,43 |        45 201,66 |
| 2028–2029                |       8 182,42 |     1 659,13 |       331,81 |         10 173,37 |        37 019,26 |
| Hors projection          |      37 019,24 |     3 167,04 |            — |         40 819,71 |                — |
| **Total durée emprunts** |  **59 999,98** | **8 890,80** | **1 778,16** |     **70 668,96** |         **0,00** |

### Conclusion

> Synthèse de toutes les vérifications de cohérence effectuées dans ce rapport.
> **✅ = cohérent · ❌ = divergence à investiguer · ⚠ = anomalie à analyser**

#### Récapitulatif des vérifications de cohérence

| #   | Vérification                             |    Statut    | Écart 2026–2027 | Écart 2027–2028 | Écart 2028–2029 |
| --- | ---------------------------------------- | :----------: | --------------: | --------------: | --------------: |
| 1   | Bilan actif = passif                     | ✅ / ✅ / ✅ |               — |               — |               — |
| 2   | Résultat exploitation (fc = recalculé)   |      ✅      |               — |               — |               — |
| 3   | CAF (fc = ResNet + Dotations − Reprises) |      ✅      |               — |               — |               — |
| 4   | Dotations amort (distribuerAmort = fc)   |      ✅      |               — |               — |               — |
| 5   | TVA à payer BFR = tableau TVA M12        |      ✅      |               — |               — |               — |
| 6   | Crédit TVA BFR = tableau TVA M12         |      ✅      |               — |               — |               — |
| 7   | TVA décaissée = tableau TVA annuel       |      ❌      |               — |         -112,68 |         -149,40 |
| 8   | Trésorerie tableau mensuel = bilan       |      ✅      |               — |               — |               — |
| 9   | Capital emprunts bilan = échéancier      |      ✅      |               — |               — |               — |
| 10  | CA activités saisies = fc.ca             |      ✅      |               — |               — |               — |
| 11  | Plan financement solde tréso = bilan     |      ✅      |               — |               — |               — |

#### ❌ Divergences à investiguer

- **[7] TVA décaissée incohérente** (écarts : Y1=0,00 · Y2=-112,68 · Y3=-149,40) — le décaissement TVA du tableau trésorerie diffère du tableau TVA annuel. Vérifier `calculs/decaissements.ts`.

#### Points de vigilance

Aucun point de vigilance identifié.

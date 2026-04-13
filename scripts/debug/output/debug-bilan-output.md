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
| Périodicité TVA        | `mensuel`                    |
| Taux TVA standard      | 20 %                         |
| Mois paiement salaires | 1                            |
| Régime social TNS      | `commerce`                   |
| Mode calcul TNS        | `DEFINITIF`                  |

### Activités

|  ✓  | Libellé       | Type              | TVA CA | Tx marge | TVA ach. | Stock j | Cli. j | Fourn. j |      CA N |     CA N+1 |     CA N+2 |
| :-: | ------------- | ----------------- | -----: | -------: | -------: | ------: | -----: | -------: | --------: | ---------: | ---------: |
| ✅  | Vente pizza   | PRODUCTION_VENDUE |   10 % |     73 % |    5.5 % |      15 |      0 |       30 | 98 750,00 | 103 687,50 | 108 871,88 |
| ✅  | Vente boisson | PRODUCTION_VENDUE |   10 % |     65 % |    5.5 % |      15 |      0 |       30 |  8 000,00 |   8 400,00 |   8 820,00 |
| ✅  | Vente alcool  | PRODUCTION_VENDUE |   20 % |     65 % |     20 % |      15 |      0 |       30 |  4 197,00 |   4 406,85 |   4 627,19 |

#### Saisonnalité CA (activités non-uniformes)

**Vente pizza**

| Exercice    |       Mai |       Jun |       Jul |       Aoû |      Sep |      Oct |      Nov |      Déc |      Jan |      Fév |      Mar |      Avr |      **Total** |
| :---------- | --------: | --------: | --------: | --------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------------: |
| 2026–2027 % |    11.3 % |    11.0 % |    11.3 % |    13.6 % |    8.8 % |    5.9 % |    5.7 % |    5.7 % |    5.9 % |    5.3 % |    7.9 % |    7.6 % |    **100.0 %** |
| 2026–2027 € | 11 188,38 | 10 832,88 | 11 188,38 | 13 430,00 | 8 660,38 | 5 846,00 | 5 628,75 | 5 628,75 | 5 846,00 | 5 194,25 | 7 761,75 | 7 544,50 |  **98 750,00** |
| 2027–2028 % |    11.3 % |    11.0 % |    11.3 % |    13.6 % |    8.8 % |    5.9 % |    5.7 % |    5.7 % |    5.9 % |    5.3 % |    7.9 % |    7.6 % |    **100.0 %** |
| 2027–2028 € | 11 747,79 | 11 374,52 | 11 747,79 | 14 101,50 | 9 093,39 | 6 138,30 | 5 910,19 | 5 910,19 | 6 138,30 | 5 453,96 | 8 149,84 | 7 921,73 | **103 687,50** |
| 2028–2029 % |    11.3 % |    11.0 % |    11.3 % |    13.6 % |    8.8 % |    5.9 % |    5.7 % |    5.7 % |    5.9 % |    5.3 % |    7.9 % |    7.6 % |    **100.0 %** |
| 2028–2029 € | 12 335,18 | 11 943,25 | 12 335,18 | 14 806,58 | 9 548,06 | 6 445,22 | 6 205,70 | 6 205,70 | 6 445,22 | 5 726,66 | 8 557,33 | 8 317,81 | **108 871,88** |

**Vente boisson**

| Exercice    |    Mai |    Jun |    Jul |      Aoû |    Sep |    Oct |    Nov |    Déc |    Jan |    Fév |    Mar |    Avr |    **Total** |
| :---------- | -----: | -----: | -----: | -------: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % |   13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2026–2027 € | 906,40 | 877,60 | 906,40 | 1 088,00 | 701,60 | 473,60 | 456,00 | 456,00 | 473,60 | 420,80 | 628,80 | 611,20 | **8 000,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % |   13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2027–2028 € | 951,72 | 921,48 | 951,72 | 1 142,40 | 736,68 | 497,28 | 478,80 | 478,80 | 497,28 | 441,84 | 660,24 | 641,76 | **8 400,00** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % |   13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2028–2029 € | 999,31 | 967,55 | 999,31 | 1 199,52 | 773,51 | 522,14 | 502,74 | 502,74 | 522,14 | 463,93 | 693,25 | 673,85 | **8 820,00** |

**Vente alcool**

| Exercice    |    Mai |    Jun |    Jul |    Aoû |    Sep |    Oct |    Nov |    Déc |    Jan |    Fév |    Mar |    Avr |    **Total** |
| :---------- | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2026–2027 € | 475,52 | 460,41 | 475,52 | 570,79 | 368,08 | 248,46 | 239,23 | 239,23 | 248,46 | 220,76 | 329,88 | 320,65 | **4 197,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2027–2028 € | 499,30 | 483,43 | 499,30 | 599,33 | 386,48 | 260,89 | 251,19 | 251,19 | 260,89 | 231,80 | 346,38 | 336,68 | **4 406,85** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2028–2029 € | 524,26 | 507,60 | 524,26 | 629,30 | 405,80 | 273,93 | 263,75 | 263,75 | 273,93 | 243,39 | 363,70 | 353,52 | **4 627,19** |

### Charges d'exploitation

|  ✓  | Libellé                                    | Catégorie              | Fréq.         | Délai j | TVA % |         N |       N+1 |       N+2 |
| :-: | ------------------------------------------ | ---------------------- | ------------- | ------: | ----: | --------: | --------: | --------: |
| ✅  | Embalages                                  | FOURNITURE_CONSOMMABLE | PERSONNALISEE |       0 |  20 % |  1 244,25 |  1 306,46 |  1 371,79 |
| ✅  | Electricité                                | FOURNITURE_CONSOMMABLE | MENSUELLE     |       0 |  20 % |  4 500,00 |  4 590,00 |  4 681,80 |
| ✅  | Eau                                        | FOURNITURE_CONSOMMABLE | MENSUELLE     |      30 |  20 % |    250,00 |    255,00 |    260,10 |
| ✅  | Petit équimement                           | FOURNITURE_CONSOMMABLE | MENSUELLE     |       0 |  20 % |    450,00 |    459,00 |    468,18 |
| ✅  | Produits d'entretiens                      | FOURNITURE_CONSOMMABLE | MENSUELLE     |      15 |  20 % |    600,00 |    612,00 |    624,24 |
| ✅  | Fournitures administratives                | FOURNITURE_CONSOMMABLE | MENSUELLE     |       0 |  20 % |    450,00 |    459,00 |    468,18 |
| ✅  | Vetements de travail                       | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    100,00 |    100,00 |    100,00 |
| ✅  | Commission CB                              | SERVICE_EXTERIEUR      | MENSUELLE     |      30 |   0 % |    658,00 |    677,74 |    698,07 |
| ✅  | offerts                                    | SERVICE_EXTERIEUR      | PERSONNALISEE |      30 |  20 % |  2 468,75 |  2 592,19 |  2 721,80 |
| ✅  | Location immobilière                       | SERVICE_EXTERIEUR      | MENSUELLE     |      30 |  20 % | 15 126,00 | 15 126,00 | 15 126,00 |
| ✅  | Location TPE + pp                          | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    231,00 |    235,62 |    240,33 |
| ✅  | Frais de télécommunication                 | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    480,00 |    600,00 |    600,00 |
| ✅  | Primes d'assurances                        | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |   0 % |  1 400,00 |  1 428,00 |  1 456,56 |
| ✅  | Entretiens et réparations                  | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |  1 600,00 |  1 632,00 |  1 664,64 |
| ✅  | Honoraires comptable et juridiques         | SERVICE_EXTERIEUR      | MENSUELLE     |      30 |  20 % |  2 800,00 |  2 856,00 |  2 913,12 |
| ✅  | Honoraires juridiques                      | SERVICE_EXTERIEUR      | MENSUELLE     |      30 |  20 % |    600,00 |    630,00 |    661,50 |
| ✅  | Publicité, publications                    | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |  1 000,00 |    500,00 |    500,00 |
| ✅  | Frais divers                               | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    500,00 |    510,00 |    520,20 |
| ✅  | Déplacements                               | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    200,00 |    200,00 |    200,00 |
| ✅  | Abonnement logiciel de caisse (airkitchen) | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    810,00 |    810,00 |    810,00 |
| ✅  | Services bancaires                         | SERVICE_EXTERIEUR      | MENSUELLE     |      30 |  20 % |    584,00 |    595,68 |    607,59 |
| ✅  | Frais titre restaurant                     | SERVICE_EXTERIEUR      | PERSONNALISEE |      30 |  20 % |    395,00 |    414,75 |    435,49 |

#### Détail saisonnalité charges personnalisées

**Embalages** _(PERSONNALISEE)_

| Exercice    |    Mai |    Jun |    Jul |    Aoû |    Sep |   Oct |   Nov |   Déc |   Jan |   Fév |    Mar |    Avr |    **Total** |
| :---------- | -----: | -----: | -----: | -----: | -----: | ----: | ----: | ----: | ----: | ----: | -----: | -----: | -----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2026–2027 € | 140,97 | 136,49 | 140,97 | 169,22 | 109,12 | 73,66 | 70,92 | 70,92 | 73,66 | 65,45 |  97,80 |  95,06 | **1 244,25** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2027–2028 € | 148,02 | 143,32 | 148,02 | 177,68 | 114,58 | 77,34 | 74,47 | 74,47 | 77,34 | 68,72 | 102,69 |  99,81 | **1 306,46** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2028–2029 € | 155,42 | 150,49 | 155,42 | 186,56 | 120,31 | 81,21 | 78,19 | 78,19 | 81,21 | 72,16 | 107,82 | 104,80 | **1 371,79** |

**offerts** _(PERSONNALISEE)_

| Exercice    |    Mai |    Jun |    Jul |    Aoû |    Sep |    Oct |    Nov |    Déc |    Jan |    Fév |    Mar |    Avr |    **Total** |
| :---------- | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2026–2027 € | 279,71 | 270,82 | 279,71 | 335,75 | 216,51 | 146,15 | 140,72 | 140,72 | 146,15 | 129,86 | 194,04 | 188,61 | **2 468,75** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2027–2028 € | 293,70 | 284,36 | 293,70 | 352,54 | 227,34 | 153,46 | 147,75 | 147,75 | 153,46 | 136,35 | 203,75 | 198,04 | **2 592,19** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2028–2029 € | 308,38 | 298,58 | 308,38 | 370,16 | 238,70 | 161,13 | 155,14 | 155,14 | 161,13 | 143,17 | 213,93 | 207,95 | **2 721,80** |

**Frais titre restaurant** _(PERSONNALISEE)_

| Exercice    |    Mai |    Jun |    Jul |    Aoû |   Sep |   Oct |   Nov |   Déc |   Jan |   Fév |   Mar |   Avr |   **Total** |
| :---------- | -----: | -----: | -----: | -----: | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2026–2027 € |  44,75 |  43,33 |  44,75 |  53,72 | 34,64 | 23,38 | 22,52 | 22,52 | 23,38 | 20,78 | 31,05 | 30,18 |  **395,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2027–2028 € |  46,99 |  45,50 |  46,99 |  56,41 | 36,37 | 24,55 | 23,64 | 23,64 | 24,55 | 21,82 | 32,60 | 31,69 |  **414,75** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2028–2029 € |  49,34 |  47,77 |  49,34 |  59,23 | 38,19 | 25,78 | 24,82 | 24,82 | 25,78 | 22,91 | 34,23 | 33,27 |  **435,49** |

### Impôts et taxes

|  ✓  | Libellé       | Date N     |        N | Date N+1   |      N+1 | Date N+2   |      N+2 |
| :-: | ------------- | ---------- | -------: | ---------- | -------: | ---------- | -------: |
| ✅  | CFE           | 2026-11-01 | 1 128,00 | 2027-11-01 | 1 128,00 | 2028-11-01 | 1 128,00 |
| ✅  | Taxe foncière | 2026-10-01 |   495,00 | 2027-10-01 |   850,00 | 2028-10-01 |   850,00 |

### Personnel — Salariés

|  ✓  | Libellé                           |    Brut N | Évo N+1 |  Brut N+1 | Évo N+2 |  Brut N+2 | Cot. sal. % | Cot. pat. % |    Coût N |  Coût N+1 |  Coût N+2 | Taux fixe | Commis. | Prime | CP  |
| :-: | --------------------------------- | --------: | ------: | --------: | ------: | --------: | ----------: | ----------: | --------: | --------: | --------: | --------: | :-----: | :---: | :-: |
| ❌  | Serveur saisonnier 39h (42 repas) | 12 391,00 |     2 % | 12 638,82 |     2 % | 12 891,59 |        22 % |        42 % | 17 595,22 | 17 947,12 | 18 306,06 |     100 % |    —    |   —   |  —  |
| ❌  | Serveur 39h (42 repas) CDI        | 19 118,00 |     2 % | 19 500,36 |     2 % | 19 890,37 |        22 % |        42 % | 27 147,56 | 27 690,51 | 28 244,33 |     100 % |    —    |   —   |  —  |

#### Détail mensuel salariés

**Serveur saisonnier 39h (42 repas)** _(brut annuel N : 12 391,00 — coût N : 17 595,22)_
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
| ✅  | Rémunération gérant |      18 000,00 | 18 000,00 | 18 000,00 |

### Personnel — Cotisations TNS

|  ✓  | Libellé                                    |        N |      N+1 |      N+2 |
| :-: | ------------------------------------------ | -------: | -------: | -------: |
| ✅  | Allocations familiales                     |     0,00 |     0,00 |     0,00 |
| ✅  | Maladie-maternité                          |   193,95 |   323,04 |   323,04 |
| ✅  | Indemnités journalières (IJ)               |    96,12 |    98,73 |    98,73 |
| ✅  | Retraite (base + compl) + invalidité-décès | 4 168,86 | 5 384,92 | 5 384,92 |
| ✅  | CSG/CRDS                                   | 1 861,63 | 2 053,48 | 2 053,48 |
| ✅  | CFP (forfait PASS)                         |   742,69 |   824,51 |   824,51 |
| ✅  | Cotisations facultatives (Madelin)         |     0,00 |     0,00 |     0,00 |
| ✅  | Cotisations facultatives (non Madelin)     |     0,00 |     0,00 |     0,00 |

### Immobilisations

|  ✓  | Libellé                                                          | Nature     | Mode amort. | Date acq.  | Montant HT | TVA % |  Durée | Différé |
| :-: | ---------------------------------------------------------------- | ---------- | ----------- | ---------- | ---------: | ----: | -----: | ------: |
| ✅  | Frais d'agence                                                   | INCORPOREL | AUCUN       | 01/05/2026 |   5 833,00 |  20 % |  0 ans |  0 mois |
| ✅  | Fond de commerce (materiel)                                      | CORPOREL   | LINEAIRE    | 01/05/2026 |  31 060,00 |   0 % | 10 ans |  0 mois |
| ✅  | Débours (provision pour frais de greffe et journal)              | INCORPOREL | AUCUN       | 01/05/2026 |     500,00 |   0 % |  0 ans |  0 mois |
| ✅  | Honoraires notaire (vente)                                       | INCORPOREL | AUCUN       | 01/05/2026 |   1 200,00 |  20 % |  0 ans |  0 mois |
| ✅  | Honoraires notaire (constitution société)                        | INCORPOREL | AUCUN       | 01/05/2026 |     700,00 |  20 % |  0 ans |  0 mois |
| ✅  | Provision pour frais de greffe et journal (constitution société) | INCORPOREL | AUCUN       | 01/05/2026 |     500,00 |   0 % |  0 ans |  0 mois |
| ✅  | Enseigne et communication                                        | CORPOREL   | LINEAIRE    | 01/05/2026 |   1 000,00 |  20 % | 10 ans |  0 mois |
| ✅  | Droit d'enregistrement                                           | INCORPOREL | AUCUN       | 01/05/2026 |   1 110,00 |   0 % |  0 ans |  0 mois |
| ✅  | Fond de commerce                                                 | INCORPOREL | AUCUN       | 01/05/2026 |  28 940,00 |   0 % |  0 ans |  0 mois |
| ✅  | Caisse enregistreuse (airkitchen)                                | CORPOREL   | LINEAIRE    | 01/05/2026 |     889,00 |  20 % | 10 ans |  0 mois |
| ❌  | Formation HACCP                                                  | INCORPOREL | AUCUN       | 01/05/2026 |     759,00 |  20 % |  0 ans |  0 mois |
| ✅  | Meuble pizza                                                     | CORPOREL   | LINEAIRE    | 01/05/2026 |   1 222,99 |  20 % | 10 ans |  0 mois |
| ❌  | Frais de garantie "France active"                                | INCORPOREL | AUCUN       | 01/05/2026 |     950,00 |   0 % |  0 ans |  0 mois |
| ✅  | Frais de garantie "BPI"                                          | FINANCIER  | AUCUN       | 01/05/2026 |   3 200,00 |   0 % |  0 ans |  0 mois |

### Financement — Apports

| Type           | Libellé          |   Montant | Date       | Remboursable |
| -------------- | ---------------- | --------: | ---------- | :----------: |
| CAPITAL        | Apport personnel |  1 000,00 | 01/05/2026 |      —       |
| COMPTE_COURANT | Apport personnel | 19 000,00 | 01/05/2026 |      —       |

### Financement — Emprunts

| Libellé |   Montant | Taux | Assur. |   Durée | Déblocage  | Différé | Type         |
| ------- | --------: | ---: | -----: | ------: | ---------- | :------ | ------------ |
| CIC     | 70 000,00 |  4 % |  0.8 % | 84 mois | 01/05/2026 | —       | AMORTISSABLE |

## Données calculées

> Résultats générés par le moteur de calcul à partir des hypothèses ci-dessus.

### Bilan officiel (= écran)

| Désignation                          | 2026–2027 | 2027–2028 |  2028–2029 |
| ------------------------------------ | --------: | --------: | ---------: |
| **ACTIF**                            |           |           |            |
| Immobilisations incorporelles brutes | 38 783,00 | 38 783,00 |  38 783,00 |
| − Amortissements incorporels cumulés |      0,00 |      0,00 |       0,00 |
| Immobilisations incorporelles nettes | 38 783,00 | 38 783,00 |  38 783,00 |
| Immobilisations corporelles brutes   | 34 171,99 | 34 171,99 |  34 171,99 |
| − Amortissements corporels cumulés   |  3 417,20 |  6 834,40 |  10 251,60 |
| Immobilisations corporelles nettes   | 30 754,79 | 27 337,59 |  23 920,39 |
| Immobilisations financières brutes   |  3 200,00 |  3 200,00 |   3 200,00 |
| − Amortissements financiers cumulés  |      0,00 |      0,00 |       0,00 |
| Immobilisations financières nettes   |  3 200,00 |  3 200,00 |   3 200,00 |
| **Total immobilisations nettes**     | 72 737,79 | 69 320,59 |  65 903,39 |
| Stocks de matières                   |  1 372,29 |  1 353,25 |   1 420,91 |
| Crédit de TVA                        |      0,00 |      0,00 |       0,00 |
| Créances clients                     |      0,00 |      0,00 |       0,00 |
| Disponibilités (trésorerie)          | 23 423,08 | 28 807,49 |  37 136,14 |
| **Total actif circulant**            | 24 795,37 | 30 160,74 |  38 557,05 |
| **TOTAL ACTIF**                      | 97 533,16 | 99 481,33 | 104 460,45 |
| **PASSIF**                           |           |           |            |
| Capital social                       |  1 000,00 |  1 000,00 |   1 000,00 |
| Comptes courants associés            | 19 000,00 | 19 000,00 |  19 000,00 |
| Réserves / Report à nouveau          |      0,00 |  8 216,01 |  18 905,43 |
| Résultat de l'exercice               |  8 216,01 | 10 689,42 |  14 182,15 |
| **Total capitaux propres**           | 28 216,01 | 38 905,43 |  53 087,57 |
| Emprunts (capital restant dû)        | 61 907,74 | 52 735,31 |  43 189,17 |
| Dettes fournisseurs                  |  2 508,87 |  2 634,88 |   2 766,62 |
| Dettes charges externes              |  2 283,38 |  2 309,02 |   2 335,68 |
| Dettes personnel                     |  2 088,60 |  2 223,72 |   2 223,72 |
| Dettes impôts et taxes               |      0,00 |      0,00 |       0,00 |
| TVA à payer                          |    166,08 |    201,38 |     232,00 |
| Impôt sur les sociétés (acompte)     |    362,47 |    471,59 |     625,68 |
| **Total dettes d'exploitation**      |  7 409,41 |  7 840,60 |   8 183,70 |
| **Total des dettes**                 | 69 317,15 | 60 575,91 |  51 372,87 |
| **TOTAL PASSIF**                     | 97 533,16 | 99 481,33 | 104 460,45 |

### Équilibre du bilan

| Exercice  | Statut       |
| --------- | ------------ |
| 2026–2027 | ✅ Équilibré |
| 2027–2028 | ✅ Équilibré |
| 2028–2029 | ✅ Équilibré |

### BFR — Vue d'ensemble (= écran)

| Désignation                    |  Initial |  2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------ | -------: | ---------: | --------: | --------: |
| Stocks matières                | 2 000,00 |   1 372,29 |  1 353,25 |  1 420,91 |
| Créances clients               |     0,00 |       0,00 |      0,00 |      0,00 |
| Crédit TVA                     | 2 351,50 |       0,00 |      0,00 |      0,00 |
| \***\*= Total Besoins\*\***    | 4 351,50 |   1 372,29 |  1 353,25 |  1 420,91 |
| Dettes fournisseurs            |     0,00 |   2 508,87 |  2 634,88 |  2 766,62 |
| Dettes charges ext.            |     0,00 |   2 283,38 |  2 309,02 |  2 335,68 |
| Dettes impôts/taxes            |     0,00 |       0,00 |      0,00 |      0,00 |
| Dettes personnel               |     0,00 |   2 088,60 |  2 223,72 |  2 223,72 |
| TVA à payer                    |     0,00 |     166,08 |    201,38 |    232,00 |
| Dettes IS                      |     0,00 |     362,47 |    471,59 |    625,68 |
| \***\*= Total Ressources\*\*** |     0,00 |   7 409,41 |  7 840,60 |  8 183,70 |
| \***\*= BFR\*\***              | 4 351,50 |  -6 037,12 | -6 487,35 | -6 762,79 |
| \***\*Variation BFR\*\***      | 4 351,50 | -10 388,62 |   -450,22 |   -275,44 |

### BFR — Détail Achats / Stocks par activité

#### Paramètres

| Activité      | Coef achat | TVA ach. % | Jours stock | Jours fourn. |
| ------------- | ---------: | ---------: | ----------: | -----------: |
| Vente pizza   |     0.2700 |        5.5 |          15 |           30 |
| Vente boisson |     0.3500 |        5.5 |          15 |           30 |
| Vente alcool  |     0.3500 |         20 |          15 |           30 |

#### Achats HT consommés + ponctuels

> AchHT = CA × coef. StockInit = ponctuelN[0] → BFR initial (y0). PoncFlux N = ponctuelN[1..11].

| Activité      | AchHT 2026–2027 | AchHT 2027–2028 | AchHT 2028–2029 | StockInit (y0) | PoncFlux 2026–2027 | PoncFlux 2027–2028 | PoncFlux 2028–2029 |
| ------------- | --------------: | --------------: | --------------: | -------------: | -----------------: | -----------------: | -----------------: |
| Vente pizza   |       26 662,50 |       27 995,63 |       29 395,41 |       1 000,00 |               0,00 |               0,00 |               0,00 |
| Vente boisson |        2 800,00 |        2 940,00 |        3 087,00 |         500,00 |               0,00 |               0,00 |               0,00 |
| Vente alcool  |        1 468,95 |        1 542,40 |        1 619,52 |         500,00 |               0,00 |               0,00 |               0,00 |
| **Total**     |   **30 931,45** |   **32 478,02** |   **34 101,92** |   **2 000,00** |           **0,00** |           **0,00** |           **0,00** |

#### Stocks fin d'exercice & Dettes fournisseurs

> Stock = achatsConsoHT × joursStock/360 (formule annuelle). DetteFourn = (M12 HT + ΔStock/12) × coefTTC × délaiMois.

| Activité                 |     Stock y0 | Stock 2026–2027 | Stock 2027–2028 | Stock 2028–2029 | DetteFourn 2026–2027 | DetteFourn 2027–2028 | DetteFourn 2028–2029 |
| ------------------------ | -----------: | --------------: | --------------: | --------------: | -------------------: | -------------------: | -------------------: |
| Vente pizza              |     1 000,00 |        1 152,60 |        1 166,48 |        1 224,81 |             2 149,05 |             2 256,50 |             2 369,33 |
| Vente boisson            |       500,00 |          137,51 |          122,50 |          128,62 |               225,60 |               236,97 |               248,82 |
| Vente alcool             |       500,00 |           82,17 |           64,27 |           67,48 |               134,22 |               141,41 |               148,48 |
| **Total**                | **2 000,00** |    **1 372,29** |    **1 353,25** |    **1 420,91** |         **2 508,87** |         **2 634,88** |         **2 766,62** |
| _BFR stocksMatieres_     |   _2 000,00_ |      _1 372,29_ |      _1 353,25_ |      _1 420,91_ |                      |                      |                      |
| _BFR dettesFournisseurs_ |              |      _2 508,87_ |      _2 634,88_ |      _2 766,62_ |                      |                      |                      |

#### TVA déductible achats (recalc par activité)

> TVA déd = (achatsConsoHT + ΔStock) × tvaAchats%.
> ΔStock Y1 = stockFin Y1 − 0 (SI = 0 hors ponctuel). ΔStock Y2 = stockFin Y2 − Y1. etc.
> Comparer le **Total recalc** au **Total moteur TVA** pour détecter les écarts.

| Activité         | TVADed 2026–2027 | TVADed 2027–2028 | TVADed 2028–2029 |
| ---------------- | ---------------: | ---------------: | ---------------: |
| Vente pizza      |         1 529,83 |         1 540,52 |         1 619,96 |
| Vente boisson    |           161,56 |           160,87 |           170,12 |
| Vente alcool     |           310,22 |           304,90 |           324,55 |
| **Total recalc** |     **2 001,62** |     **2 006,30** |     **2 114,62** |

### BFR — Détail charges externes

| Libellé                                    |       MtN |      MtN1 |      MtN2 | Délai | TVA% |  DetteY1 |  DetteY2 |  DetteY3 |
| ------------------------------------------ | --------: | --------: | --------: | ----: | ---: | -------: | -------: | -------: |
| Embalages                                  |  1 244,25 |  1 306,46 |  1 371,79 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Electricité                                |  4 500,00 |  4 590,00 |  4 681,80 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Eau                                        |    250,00 |    255,00 |    260,10 |    30 |   20 |    25,00 |    25,50 |    26,01 |
| Petit équimement                           |    450,00 |    459,00 |    468,18 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Produits d'entretiens                      |    600,00 |    612,00 |    624,24 |    15 |   20 |    30,00 |    30,60 |    31,21 |
| Fournitures administratives                |    450,00 |    459,00 |    468,18 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Vetements de travail                       |    100,00 |    100,00 |    100,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Commission CB                              |    658,00 |    677,74 |    698,07 |    30 |    0 |    54,83 |    56,48 |    58,17 |
| offerts                                    |  2 468,75 |  2 592,19 |  2 721,80 |    30 |   20 |   226,34 |   237,65 |   249,53 |
| Location immobilière                       | 15 126,00 | 15 126,00 | 15 126,00 |    30 |   20 | 1 512,60 | 1 512,60 | 1 512,60 |
| Location TPE + pp                          |    231,00 |    235,62 |    240,33 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Frais de télécommunication                 |    480,00 |    600,00 |    600,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Primes d'assurances                        |  1 400,00 |  1 428,00 |  1 456,56 |     0 |    0 |     0,00 |     0,00 |     0,00 |
| Entretiens et réparations                  |  1 600,00 |  1 632,00 |  1 664,64 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Honoraires comptable et juridiques         |  2 800,00 |  2 856,00 |  2 913,12 |    30 |   20 |   280,00 |   285,60 |   291,31 |
| Honoraires juridiques                      |    600,00 |    630,00 |    661,50 |    30 |   20 |    60,00 |    63,00 |    66,15 |
| Publicité, publications                    |  1 000,00 |    500,00 |    500,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Frais divers                               |    500,00 |    510,00 |    520,20 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Déplacements                               |    200,00 |    200,00 |    200,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Abonnement logiciel de caisse (airkitchen) |    810,00 |    810,00 |    810,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Services bancaires                         |    584,00 |    595,68 |    607,59 |    30 |   20 |    58,40 |    59,57 |    60,76 |
| Frais titre restaurant                     |    395,00 |    414,75 |    435,49 |    30 |   20 |    36,21 |    38,02 |    39,93 |

### Compte de résultat (fc)

| Désignation                         |  2026–2027 |  2027–2028 |  2028–2029 |
| ----------------------------------- | ---------: | ---------: | ---------: |
| Chiffre d'affaires                  | 110 947,00 | 116 494,35 | 122 319,07 |
| Subventions                         |       0,00 |       0,00 |       0,00 |
| Production immobilisée              |       0,00 |       0,00 |       0,00 |
| Autres produits                     |       0,00 |       0,00 |       0,00 |
| \***\*= Total produits expl.\*\***  | 110 947,00 | 116 494,35 | 122 319,07 |
| Achats consommés                    |  30 931,45 |  32 478,02 |  34 101,92 |
| Charges externes                    |  36 447,00 |  36 589,44 |  37 129,59 |
| Impôts et taxes                     |   1 623,00 |   1 978,00 |   1 978,00 |
| Charges personnel                   |  25 063,25 |  26 684,68 |  26 684,68 |
| Dotations amort.                    |   3 417,20 |   3 417,20 |   3 417,20 |
| Dotations provisions                |       0,00 |       0,00 |       0,00 |
| Reprises                            |       0,00 |       0,00 |       0,00 |
| Autres charges gestion              |       0,00 |       0,00 |       0,00 |
| \***\*= Résultat exploitation\*\*** |  13 465,10 |  15 347,01 |  19 007,68 |
| Produits financiers                 |       0,00 |       0,00 |       0,00 |
| Charges financières                 |   3 799,21 |   2 771,22 |   2 322,80 |
| \***\*= Résultat financier\*\***    |  -3 799,21 |  -2 771,22 |  -2 322,80 |
| \***\*= Résultat courant\*\***      |   9 665,89 |  12 575,79 |  16 684,88 |
| Résultat exceptionnel               |       0,00 |       0,00 |       0,00 |
| Ajustement net                      |       0,00 |       0,00 |       0,00 |
| − IS                                |   1 449,88 |   1 886,37 |   2 502,73 |
| \***\*= Résultat net\*\***          |   8 216,01 |  10 689,42 |  14 182,15 |

### Vérification compte de résultat

| Désignation                        | 2026–2027 | 2027–2028 | 2028–2029 |
| ---------------------------------- | --------: | --------: | --------: | ---- |
| ResExpl (fc)                       | 13 465,10 | 15 347,01 | 19 007,68 |
| ResExpl recalculé (Prod − Charges) | 13 465,10 | 15 347,01 | 19 007,68 |
| Écart ResExpl                      |     -0,00 |     -0,00 |      0,00 | _✅_ |
| ResNet (fc)                        |  8 216,01 | 10 689,42 | 14 182,15 |

### Détail dotations amortissement (par immobilisation)

> Méthode : `distribuerAmortParExercice` — respecte AUCUN / LINEAIRE / DEGRESSIF.

| Libellé                                                          | Mode     | Durée | Montant HT |   Dot Y1 |   Dot Y2 |   Dot Y3 |
| ---------------------------------------------------------------- | -------- | ----: | ---------: | -------: | -------: | -------: |
| Frais d'agence                                                   | AUCUN    |     0 |   5 833,00 |     0,00 |     0,00 |     0,00 |
| Fond de commerce (materiel)                                      | LINEAIRE |    10 |  31 060,00 | 3 106,00 | 3 106,00 | 3 106,00 |
| Débours (provision pour frais de greffe et journal)              | AUCUN    |     0 |     500,00 |     0,00 |     0,00 |     0,00 |
| Honoraires notaire (vente)                                       | AUCUN    |     0 |   1 200,00 |     0,00 |     0,00 |     0,00 |
| Honoraires notaire (constitution société)                        | AUCUN    |     0 |     700,00 |     0,00 |     0,00 |     0,00 |
| Provision pour frais de greffe et journal (constitution société) | AUCUN    |     0 |     500,00 |     0,00 |     0,00 |     0,00 |
| Enseigne et communication                                        | LINEAIRE |    10 |   1 000,00 |   100,00 |   100,00 |   100,00 |
| Droit d'enregistrement                                           | AUCUN    |     0 |   1 110,00 |     0,00 |     0,00 |     0,00 |
| Fond de commerce                                                 | AUCUN    |     0 |  28 940,00 |     0,00 |     0,00 |     0,00 |
| Caisse enregistreuse (airkitchen)                                | LINEAIRE |    10 |     889,00 |    88,90 |    88,90 |    88,90 |
| Meuble pizza                                                     | LINEAIRE |    10 |   1 222,99 |   122,30 |   122,30 |   122,30 |
| Frais de garantie "BPI"                                          | AUCUN    |     0 |   3 200,00 |     0,00 |     0,00 |     0,00 |

### Cohérence dotations amort (distribuerAmortParExercice vs fc.dotationsAmort)

| Désignation       | 2026–2027 | 2027–2028 | 2028–2029 |
| ----------------- | --------: | --------: | --------: | ------------- |
| Σ distribuerAmort |  3 417,20 |  3 417,20 |  3 417,20 |
| fc.dotationsAmort |  3 417,20 |  3 417,20 |  3 417,20 |
| Écart             |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |

### Détail immobilisations actives

| Libellé                                                          | Nature     | Date acq.  | Montant HT | Durée | Actif |
| ---------------------------------------------------------------- | ---------- | ---------- | ---------: | ----: | ----- |
| Frais d'agence                                                   | INCORPOREL | 01/05/2026 |   5 833,00 |     0 | oui   |
| Fond de commerce (materiel)                                      | CORPOREL   | 01/05/2026 |  31 060,00 |    10 | oui   |
| Débours (provision pour frais de greffe et journal)              | INCORPOREL | 01/05/2026 |     500,00 |     0 | oui   |
| Honoraires notaire (vente)                                       | INCORPOREL | 01/05/2026 |   1 200,00 |     0 | oui   |
| Honoraires notaire (constitution société)                        | INCORPOREL | 01/05/2026 |     700,00 |     0 | oui   |
| Provision pour frais de greffe et journal (constitution société) | INCORPOREL | 01/05/2026 |     500,00 |     0 | oui   |
| Enseigne et communication                                        | CORPOREL   | 01/05/2026 |   1 000,00 |    10 | oui   |
| Droit d'enregistrement                                           | INCORPOREL | 01/05/2026 |   1 110,00 |     0 | oui   |
| Fond de commerce                                                 | INCORPOREL | 01/05/2026 |  28 940,00 |     0 | oui   |
| Caisse enregistreuse (airkitchen)                                | CORPOREL   | 01/05/2026 |     889,00 |    10 | oui   |
| Meuble pizza                                                     | CORPOREL   | 01/05/2026 |   1 222,99 |    10 | oui   |
| Frais de garantie "BPI"                                          | FINANCIER  | 01/05/2026 |   3 200,00 |     0 | oui   |

### Détail emprunts

| Libellé | Montant initial | Date déblocage | Capital restant fin Y1 |    fin Y2 |    fin Y3 |
| ------- | --------------: | -------------- | ---------------------: | --------: | --------: |
| CIC     |       70 000,00 | 01/05/2026     |              61 907,74 | 52 735,31 | 43 189,17 |

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
| Enc. emprunts débloqués                             |  70 000,00 |       0,00 |       0,00 |
| Enc. production vendue (TTC)                        | 122 461,40 | 128 584,47 | 135 013,70 |
| Enc. subventions exploitation                       |       0,00 |       0,00 |       0,00 |
| Enc. subventions investissement                     |       0,00 |       0,00 |       0,00 |
| Enc. divers                                         |       0,00 |       0,00 |       0,00 |
| \***\*= Total encaissements\*\***                   | 212 461,40 | 128 584,47 | 135 013,70 |
| Dec. immobilisations (TTC)                          |  78 323,99 |       0,00 |       0,00 |
| Dec. emprunts (capital + intérêts + frais)          |  11 891,47 |  11 943,65 |  11 868,94 |
| Dec. achats                                         |  31 796,48 |  34 339,28 |  36 152,46 |
| Dec. charges externes                               |  41 041,42 |  43 460,54 |  44 097,93 |
| Dec. impôts et taxes                                |   1 623,00 |   1 978,00 |   1 978,00 |
| Dec. personnel                                      |  22 974,65 |  26 549,56 |  26 684,68 |
| Dec. TVA nette (collectée − déductible)             |     299,90 |   3 151,79 |   3 554,39 |
| Dec. IS                                             |   1 087,41 |   1 777,25 |   2 348,64 |
| Dec. divers                                         |       0,00 |       0,00 |       0,00 |
| \***\*= Total décaissements\*\***                   | 189 038,32 | 123 200,06 | 126 685,05 |
| Solde début d'exercice                              |       0,00 |  23 423,08 |  28 807,49 |
| Variation nette (enc − dec)                         |  23 423,08 |   5 384,41 |   8 328,65 |
| \***\*= Solde fin d'exercice (soldeFinal[11])\*\*** |  23 423,08 |  28 807,49 |  37 136,14 |

#### B — Trésorerie bilan (formule cumulative économique)

> Formule : apports + emprunts + CAF cumulatif − immos − BFR besoins + BFR dettes

| Désignation                                      | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------------------------ | --------: | --------: | --------: |
| Apports capital cumulatifs                       |  1 000,00 |  1 000,00 |  1 000,00 |
| Apports CC cumulatifs                            | 19 000,00 | 19 000,00 | 19 000,00 |
| Emprunts débloqués cumulatifs                    | 70 000,00 | 70 000,00 | 70 000,00 |
| + CAF cumulatif                                  | 11 633,21 | 25 739,83 | 43 339,17 |
| dont: CAF Y1                                     | 11 633,21 | 11 633,21 | 11 633,21 |
| dont: CAF Y2                                     |      0,00 | 14 106,62 | 14 106,62 |
| dont: CAF Y3                                     |      0,00 |      0,00 | 17 599,34 |
| + Enc. non-P&L cumulatifs (subv invest + divers) |      0,00 |      0,00 |      0,00 |
| − Dec. non-P&L cumulatifs (divers)               |      0,00 |      0,00 |      0,00 |
| − Immos acquises cumulatives (HT)                | 76 154,99 | 76 154,99 | 76 154,99 |
| − BFR besoins (stocks+crédit TVA+créances)       |  1 372,29 |  1 353,25 |  1 420,91 |
| dont: Stocks de matières                         |  1 372,29 |  1 353,25 |  1 420,91 |
| dont: Crédit de TVA                              |      0,00 |      0,00 |      0,00 |
| dont: Créances clients                           |      0,00 |      0,00 |      0,00 |
| − Remboursements capital cumulatifs              |  8 092,26 | 17 264,69 | 26 810,83 |
| \***\*= Trésorerie brute\*\***                   | 16 013,67 | 20 966,89 | 28 952,44 |
| + BFR dettes expl. (totalRessources)             |  7 409,41 |  7 840,60 |  8 183,70 |
| dont: Dettes fournisseurs                        |  2 508,87 |  2 634,88 |  2 766,62 |
| dont: Dettes charges ext.                        |  2 283,38 |  2 309,02 |  2 335,68 |
| dont: Dettes impôts/taxes                        |      0,00 |      0,00 |      0,00 |
| dont: Dettes personnel                           |  2 088,60 |  2 223,72 |  2 223,72 |
| dont: TVA à payer                                |    166,08 |    201,38 |    232,00 |
| dont: Dettes IS                                  |    362,47 |    471,59 |    625,68 |
| \***\*= Tréso corrigée\*\***                     | 23 423,08 | 28 807,49 | 37 136,14 |
| \***\*= Disponibilités (bilan)\*\***             | 23 423,08 | 28 807,49 | 37 136,14 |

#### C — Réconciliation

| Désignation                     | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------- | --------: | --------: | --------: | ------------- |
| Tableau mensuel soldeFinal[11]  | 23 423,08 | 28 807,49 | 37 136,14 |
| Bilan disponibilités            | 23 423,08 | 28 807,49 | 37 136,14 |
| \***\*Écart (Tab − Bilan)\*\*** |     -0,00 |      0,00 |      0,00 | _✅ Cohérent_ |

### Détail apports

| Type           |   Montant | Date apport |
| -------------- | --------: | ----------- |
| CAPITAL        |  1 000,00 | 01/05/2026  |
| COMPTE_COURANT | 19 000,00 | 01/05/2026  |

### Tableau de TVA

> **Régime TVA :** REEL_NORMAL | **Périodicité déclaration :** mensuel

#### A — Synthèse annuelle

| Désignation                           | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------------- | --------: | --------: | --------: |
| TVA collectée sur CA                  | 11 514,40 | 12 090,12 | 12 694,63 |
| **Total TVA collectée**               | 11 514,40 | 12 090,12 | 12 694,63 |
| ---                                   |      ---: |      ---: |      ---: |
| TVA déductible sur immos              |      0,00 |      0,00 |      0,00 |
| TVA déductible sur achats matières    |  2 001,62 |  2 006,30 |  2 114,62 |
| TVA déductible sur charges ext.       |  6 877,80 |  6 896,74 |  6 994,99 |
| **Total TVA déductible**              |  8 879,42 |  8 903,04 |  9 109,62 |
| ---                                   |      ---: |      ---: |      ---: |
| TVA nette annuelle (∑)                |  2 634,98 |  3 187,08 |  3 585,01 |
| Crédit TVA fin exercice (M12 reporté) |      0,00 |      0,00 |      0,00 |
| **TVA à payer annuelle (∑)**          |    465,98 |  3 187,08 |  3 585,01 |

#### B — Cohérence TVA tableau vs BFR

> Le BFR utilise la valeur de fin d'exercice (M12) : TVA à payer = dette passif ; crédit TVA = actif circulant.

| Désignation                     | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------- | --------: | --------: | --------: | ------------- |
| TVA à payer M12 (tableau TVA)   |    166,08 |    201,38 |    232,00 |
| TVA à payer BFR (bfr.tvaAPayer) |    166,08 |    201,38 |    232,00 |
| Écart TVA à payer               |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |
| Crédit TVA M12 (tableau TVA)    |      0,00 |      0,00 |      0,00 |
| Crédit TVA BFR (bfr.creditTVA)  |      0,00 |      0,00 |      0,00 |
| Écart crédit TVA                |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |

#### C — Cohérence TVA décaissée vs tableau de trésorerie

> Identité : `decTVA = tvaAPayerAnnuel − ΔDettes TVA`
> où `ΔDettes TVA = tvaM12_fin − tvaM12_debut` (variation de la dette TVA bilan entre clôture et ouverture de l'exercice).
> La TVA de M12 est décaissée en début d'exercice suivant — elle n'est pas dans le flux de l'exercice courant.

| Désignation                                     | 2026–2027 | 2027–2028 | 2028–2029 |
| ----------------------------------------------- | --------: | --------: | --------: | ------------- |
| TVA à payer ∑ annuel (tableau TVA)              |    465,98 |  3 187,08 |  3 585,01 |
| − TVA restant à décaisser M12 fin exercice      |    166,08 |    201,38 |    232,00 |
| + TVA en attente M12 exercice précédent         |      0,00 |    166,08 |    201,38 |
| **= TVA à décaisser dans l'exercice (attendu)** |    299,90 |  3 151,79 |  3 554,39 |
| **TVA décaissée (dec.decTVA ∑)**                |    299,90 |  3 151,79 |  3 554,39 |
| Écart                                           |      0,00 |      0,00 |     -0,00 | _✅ Cohérent_ |

#### D — Détail mensuel

**2026–2027**

| Désignation                 |      M01 |      M02 |      M03 |      M04 |      M05 |    M06 |    M07 |    M08 |    M09 |    M10 |    M11 |    M12 |     Total |
| --------------------------- | -------: | -------: | -------: | -------: | -------: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | --------: |
| TVA collectée CA            | 1 304,58 | 1 263,13 | 1 304,58 | 1 565,96 | 1 009,81 | 681,65 | 656,32 | 656,32 | 681,65 | 605,66 | 905,03 | 879,70 | 11 514,40 |
| TVA déductible immos        |        — |        — |        — |        — |        — |      — |      — |      — |      — |      — |      — |      — |         — |
| TVA déductible achats       |   391,32 |   195,46 |   198,61 |   241,12 |   153,14 | 103,87 | 103,59 | 106,17 | 111,90 | 100,08 | 150,22 | 146,17 |  2 001,62 |
| TVA déductible charges ext. |   597,77 |   594,81 |   597,77 |   616,42 |   576,74 | 553,32 | 551,51 | 551,51 | 553,32 | 547,90 | 569,26 | 567,45 |  6 877,80 |
| TVA nette                   |   315,49 |   472,86 |   508,20 |   708,42 |   279,93 |  24,46 |   1,22 |  -1,36 |  16,43 | -42,32 | 185,56 | 166,08 |  2 634,98 |
| Crédit TVA reporté          | 1 853,50 | 1 380,64 |   872,44 |   164,02 |        — |      — |      — |   1,36 |      — |  42,32 |      — |      — |         — |
| TVA à payer                 |        — |        — |        — |        — |   115,91 |  24,46 |   1,22 |      — |  15,07 |      — | 143,24 | 166,08 |    465,98 |

**2027–2028**

| Désignation                 |      M01 |      M02 |      M03 |      M04 |      M05 |    M06 |    M07 |    M08 |    M09 |    M10 |    M11 |    M12 |     Total |
| --------------------------- | -------: | -------: | -------: | -------: | -------: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | --------: |
| TVA collectée CA            | 1 369,81 | 1 326,29 | 1 369,81 | 1 644,26 | 1 060,30 | 715,74 | 689,14 | 689,14 | 715,74 | 635,94 | 950,28 | 923,69 | 12 090,12 |
| TVA déductible immos        |        — |        — |        — |        — |        — |      — |      — |      — |      — |      — |      — |      — |         — |
| TVA déductible achats       |   227,31 |   219,77 |   226,88 |   272,56 |   175,78 | 118,75 | 114,47 | 114,53 | 118,98 | 105,72 | 157,98 | 153,56 |  2 006,30 |
| TVA déductible charges ext. |   600,58 |   597,47 |   600,58 |   620,16 |   578,50 | 553,91 | 552,01 | 552,01 | 553,91 | 548,22 | 570,64 | 568,75 |  6 896,74 |
| TVA nette                   |   541,92 |   509,04 |   542,35 |   751,53 |   306,03 |  43,08 |  22,66 |  22,59 |  42,85 | -18,00 | 221,66 | 201,38 |  3 187,08 |
| Crédit TVA reporté          |        — |        — |        — |        — |        — |      — |      — |      — |      — |  18,00 |      — |      — |         — |
| TVA à payer                 |   541,92 |   509,04 |   542,35 |   751,53 |   306,03 |  43,08 |  22,66 |  22,59 |  42,85 |      — | 203,66 | 201,38 |  3 187,08 |

**2028–2029**

| Désignation                 |      M01 |      M02 |      M03 |      M04 |      M05 |    M06 |    M07 |    M08 |    M09 |    M10 |    M11 |    M12 |     Total |
| --------------------------- | -------: | -------: | -------: | -------: | -------: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | --------: |
| TVA collectée CA            | 1 438,30 | 1 392,60 | 1 438,30 | 1 726,47 | 1 113,32 | 751,52 | 723,59 | 723,59 | 751,52 | 667,74 | 997,80 | 969,87 | 12 694,63 |
| TVA déductible immos        |        — |        — |        — |        — |        — |      — |      — |      — |      — |      — |      — |      — |         — |
| TVA déductible achats       |   239,59 |   232,34 |   240,08 |   287,92 |   185,65 | 125,21 | 120,41 | 120,34 | 124,95 | 111,01 | 165,88 | 161,24 |  2 114,62 |
| TVA déductible charges ext. |   610,06 |   606,80 |   610,06 |   630,62 |   586,87 | 561,06 | 559,06 | 559,06 | 561,06 | 555,08 | 578,63 | 576,64 |  6 994,99 |
| TVA nette                   |   588,65 |   553,46 |   588,16 |   807,92 |   340,80 |  65,25 |  44,12 |  44,20 |  65,52 |   1,65 | 253,29 | 232,00 |  3 585,01 |
| Crédit TVA reporté          |        — |        — |        — |        — |        — |      — |      — |      — |      — |      — |      — |      — |         — |
| TVA à payer                 |   588,65 |   553,46 |   588,16 |   807,92 |   340,80 |  65,25 |  44,12 |  44,20 |  65,52 |   1,65 | 253,29 | 232,00 |  3 585,01 |

### Vérification CAF (= Résultat net + Dotations − Reprises)

| Désignation                | 2026–2027 | 2027–2028 | 2028–2029 |
| -------------------------- | --------: | --------: | --------: | ------------- |
| Résultat net               |  8 216,01 | 10 689,42 | 14 182,15 |
| + Dotations amortissements |  3 417,20 |  3 417,20 |  3 417,20 |
| + Dotations provisions     |      0,00 |      0,00 |      0,00 |
| − Reprises sur provisions  |      0,00 |      0,00 |      0,00 |
| **= CAF recalculée**       | 11 633,21 | 14 106,62 | 17 599,34 |
| CAF officielle (fc.caf)    | 11 633,21 | 14 106,62 | 17 599,34 |
| Écart                      |      0,00 |      0,00 |     -0,00 | _✅ Cohérent_ |

### SIG — Soldes Intermédiaires de Gestion

> Valeurs issues de **fc** — même moteur que l'application.

| Désignation                           |  2026–2027 |  2027–2028 |  2028–2029 |
| ------------------------------------- | ---------: | ---------: | ---------: | ------------------------------ |
| CA HT                                 | 110 947,00 | 116 494,35 | 122 319,07 |
| − Achats consommés                    |  30 931,45 |  32 478,02 |  34 101,92 |
| **= Marge brute**                     |  80 015,55 |  84 016,33 |  88 217,15 | _tx: 72,1 % / 72,1 % / 72,1 %_ |
| + Production immobilisée              |       0,00 |       0,00 |       0,00 |
| + Transferts de charges               |       0,00 |       0,00 |       0,00 |
| + Autres produits exploitation        |       0,00 |       0,00 |       0,00 |
| − Charges externes                    |  36 447,00 |  36 589,44 |  37 129,59 |
| **= Valeur Ajoutée (VA)**             |  43 568,55 |  47 426,89 |  51 087,56 | _tx: 39,3 % / 40,7 % / 41,8 %_ |
| + Subventions exploitation            |       0,00 |       0,00 |       0,00 |
| − Impôts et taxes                     |   1 623,00 |   1 978,00 |   1 978,00 |
| − Charges de personnel                |  25 063,25 |  26 684,68 |  26 684,68 |
| **= EBE**                             |  16 882,30 |  18 764,21 |  22 424,88 | _tx: 15,2 % / 16,1 % / 18,3 %_ |
| − Dotations amortissements            |   3 417,20 |   3 417,20 |   3 417,20 |
| − Dotations provisions                |       0,00 |       0,00 |       0,00 |
| + Reprises sur provisions             |       0,00 |       0,00 |       0,00 |
| ± Autres charges/produits gestion net |      -0,00 |      -0,00 |      -0,00 |
| **= Résultat d'exploitation (REX)**   |  13 465,10 |  15 347,01 |  19 007,68 | _tx: 12,1 % / 13,2 % / 15,5 %_ |
| + Produits financiers                 |       0,00 |       0,00 |       0,00 |
| − Charges financières                 |   3 799,21 |   2 771,22 |   2 322,80 |
| **= Résultat financier**              |  -3 799,21 |  -2 771,22 |  -2 322,80 |
| **= Résultat courant (RCB)**          |   9 665,89 |  12 575,79 |  16 684,88 |
| + Résultat exceptionnel               |       0,00 |       0,00 |       0,00 |
| +/− Ajustements nets                  |       0,00 |       0,00 |       0,00 |
| − IS                                  |   1 449,88 |   1 886,37 |   2 502,73 |
| **= Résultat net**                    |   8 216,01 |  10 689,42 |  14 182,15 | _tx: 7,4 % / 9,2 % / 11,6 %_   |
| **CAF**                               |  11 633,21 |  14 106,62 |  17 599,34 | _tx: 10,5 % / 12,1 % / 14,4 %_ |

### Détail activités (hypothèses saisies)

| Libellé       | Type              | Tx marge | TVA CA | TVA ach. | Stock j | Cli. j | Fourn. j |      CA N |     CA N+1 |     CA N+2 |
| ------------- | ----------------- | -------: | -----: | -------: | ------: | -----: | -------: | --------: | ---------: | ---------: |
| Vente pizza   | PRODUCTION_VENDUE |     73 % |   10 % |    5.5 % |      15 |      0 |       30 | 98 750,00 | 103 687,50 | 108 871,88 |
| Vente boisson | PRODUCTION_VENDUE |     65 % |   10 % |    5.5 % |      15 |      0 |       30 |  8 000,00 |   8 400,00 |   8 820,00 |
| Vente alcool  | PRODUCTION_VENDUE |     65 % |   20 % |     20 % |      15 |      0 |       30 |  4 197,00 |   4 406,85 |   4 627,19 |

| Désignation                         |  2026–2027 |  2027–2028 |  2028–2029 |
| ----------------------------------- | ---------: | ---------: | ---------: |
| CA total activités actives (saisie) | 110 947,00 | 116 494,35 | 122 319,07 |
| CA total (fc.ca)                    | 110 947,00 | 116 494,35 | 122 319,07 |

### Détail personnel (hypothèses saisies vs fc)

#### Salariés

> _(aucun)_

#### Dirigeants

| Libellé             | Rémunération N |       N+1 |       N+2 |
| ------------------- | -------------: | --------: | --------: |
| Rémunération gérant |      18 000,00 | 18 000,00 | 18 000,00 |

#### Cotisations TNS

| Libellé                                    |        N |      N+1 |      N+2 |
| ------------------------------------------ | -------: | -------: | -------: |
| Allocations familiales                     |     0,00 |     0,00 |     0,00 |
| Maladie-maternité                          |   193,95 |   323,04 |   323,04 |
| Indemnités journalières (IJ)               |    96,12 |    98,73 |    98,73 |
| Retraite (base + compl) + invalidité-décès | 4 168,86 | 5 384,92 | 5 384,92 |
| CSG/CRDS                                   | 1 861,63 | 2 053,48 | 2 053,48 |
| CFP (forfait PASS)                         |   742,69 |   824,51 |   824,51 |
| Cotisations facultatives (Madelin)         |     0,00 |     0,00 |     0,00 |
| Cotisations facultatives (non Madelin)     |     0,00 |     0,00 |     0,00 |

#### Taxes sur salaires

> _(aucune)_

#### Récapitulatif fc.chargesPersonnel

| Désignation                   | 2026–2027 | 2027–2028 | 2028–2029 |
| ----------------------------- | --------: | --------: | --------: |
| Salaires bruts                |      0,00 |      0,00 |      0,00 |
| + Charges patronales          |      0,00 |      0,00 |      0,00 |
| + Rémunération dirigeant      | 18 000,00 | 18 000,00 | 18 000,00 |
| + Cotisations TNS total       |  7 063,25 |  8 684,68 |  8 684,68 |
| + Taxes salaires total        |      0,00 |      0,00 |      0,00 |
| **= Total charges personnel** | 25 063,25 | 26 684,68 | 26 684,68 |

### Plan de financement (= écran)

**BESOINS**

| Désignation                     |   Initial |  2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------- | --------: | ---------: | --------: | --------: |
| + Immobilisations incorporelles | 38 783,00 |       0,00 |      0,00 |      0,00 |
| + Immobilisations corporelles   | 34 171,99 |       0,00 |      0,00 |      0,00 |
| + Immobilisations financières   |  3 200,00 |       0,00 |      0,00 |      0,00 |
| = Total immobilisations         | 76 154,99 |       0,00 |      0,00 |      0,00 |
| + Variation du BFR              |  4 351,50 | -10 388,62 |   -450,22 |   -275,44 |
| + Remboursement des emprunts    |      0,00 |   8 092,26 |  9 172,43 |  9 546,14 |
| **= Total des besoins**         | 80 506,49 |  -2 296,36 |  8 722,21 |  9 270,70 |

**RESSOURCES**

| Désignation                        |   Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| ---------------------------------- | --------: | --------: | --------: | --------: |
| + Apports en capital               |  1 000,00 |      0,00 |      0,00 |      0,00 |
| + Apports en comptes courants      | 19 000,00 |      0,00 |      0,00 |      0,00 |
| + Souscription d'emprunts          | 70 000,00 |      0,00 |      0,00 |      0,00 |
| + Subventions d'investissement     |      0,00 |      0,00 |      0,00 |      0,00 |
| + Capacité d'autofinancement (CAF) |      0,00 | 11 633,21 | 14 106,62 | 17 599,34 |
| **= Total des ressources**         | 90 000,00 | 11 633,21 | 14 106,62 | 17 599,34 |

**TRÉSORERIE**

| Désignation               |  Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------- | -------: | --------: | --------: | --------: |
| = Variation de trésorerie | 9 493,51 | 13 929,57 |  5 384,41 |  8 328,65 |
| **= Solde de trésorerie** | 9 493,51 | 23 423,08 | 28 807,49 | 37 136,14 |

| **= Variation de trésorerie (Ressources − Besoins)** | 9 493,51 | 13 929,57 | 5 384,41 | 8 328,65 | _(= par construction)_ |

### Échéancier emprunts (par exercice)

#### CIC

> Montant : **70 000,00 €** · Taux : **4 %** · Durée : **84 mois** · Déblocage : **01/05/2026** · MENSUEL · AMORTISSABLE

| Exercice                 | Cap. remboursé |      Intérêts |    Assurance | Total mensualités | Cap. restant fin |
| ------------------------ | -------------: | ------------: | -----------: | ----------------: | ---------------: |
| 2026–2027                |       8 092,26 |      2 432,67 |       486,54 |         11 011,51 |        61 907,71 |
| 2027–2028                |       9 172,43 |      2 309,36 |       461,86 |         11 943,68 |        52 735,27 |
| 2028–2029                |       9 546,14 |      1 935,66 |       387,14 |         11 868,92 |        43 189,14 |
| Hors projection          |      43 189,14 |      3 694,89 |            — |         47 622,99 |                — |
| **Total durée emprunts** |  **69 999,97** | **10 372,58** | **2 074,52** |     **82 447,10** |         **0,00** |

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
| 7   | TVA décaissée = tvaAnnuel − ΔDettes TVA  |      ✅      |               — |               — |               — |
| 8   | Trésorerie tableau mensuel = bilan       |      ✅      |               — |               — |               — |
| 9   | Capital emprunts bilan = échéancier      |      ✅      |               — |               — |               — |
| 10  | CA activités saisies = fc.ca             |      ✅      |               — |               — |               — |
| 11  | Plan financement solde tréso = bilan     |      ✅      |               — |               — |               — |

#### ✅ Aucune divergence détectée

Toutes les vérifications de cohérence passent. La modélisation est cohérente.

#### Points de vigilance

Aucun point de vigilance identifié.

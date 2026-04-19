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

|  ✓  | Libellé       | Type              | TVA CA | Tx marge | TVA ach. | Stock j | Cli. j | Fourn. j |      CA N |    CA N+1 |     CA N+2 |
| :-: | ------------- | ----------------- | -----: | -------: | -------: | ------: | -----: | -------: | --------: | --------: | ---------: |
| ✅  | Vente pizza   | PRODUCTION_VENDUE |   10 % |     73 % |    5.5 % |      15 |      0 |       30 | 94 800,00 | 99 540,00 | 104 517,00 |
| ✅  | Vente boisson | PRODUCTION_VENDUE |   10 % |     65 % |    5.5 % |      15 |      0 |       30 |  6 000,00 |  6 300,00 |   6 615,00 |
| ✅  | Vente alcool  | PRODUCTION_VENDUE |   20 % |     65 % |     20 % |      15 |      0 |       30 |  4 197,00 |  4 406,85 |   4 627,19 |

#### Saisonnalité CA (activités non-uniformes)

**Vente pizza**

| Exercice    |       Mai |       Jun |       Jul |       Aoû |      Sep |      Oct |      Nov |      Déc |      Jan |      Fév |      Mar |      Avr |      **Total** |
| :---------- | --------: | --------: | --------: | --------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------------: |
| 2026–2027 % |    11.3 % |    11.0 % |    11.3 % |    13.6 % |    8.8 % |    5.9 % |    5.7 % |    5.7 % |    5.9 % |    5.3 % |    7.9 % |    7.6 % |    **100.0 %** |
| 2026–2027 € | 10 740,84 | 10 399,56 | 10 740,84 | 12 892,80 | 8 313,96 | 5 612,16 | 5 403,60 | 5 403,60 | 5 612,16 | 4 986,48 | 7 451,28 | 7 242,72 |  **94 800,00** |
| 2027–2028 % |    11.3 % |    11.0 % |    11.3 % |    13.6 % |    8.8 % |    5.9 % |    5.7 % |    5.7 % |    5.9 % |    5.3 % |    7.9 % |    7.6 % |    **100.0 %** |
| 2027–2028 € | 11 277,88 | 10 919,54 | 11 277,88 | 13 537,44 | 8 729,66 | 5 892,77 | 5 673,78 | 5 673,78 | 5 892,77 | 5 235,80 | 7 823,84 | 7 604,86 |  **99 540,00** |
| 2028–2029 % |    11.3 % |    11.0 % |    11.3 % |    13.6 % |    8.8 % |    5.9 % |    5.7 % |    5.7 % |    5.9 % |    5.3 % |    7.9 % |    7.6 % |    **100.0 %** |
| 2028–2029 € | 11 841,78 | 11 465,51 | 11 841,78 | 14 214,31 | 9 166,14 | 6 187,41 | 5 957,47 | 5 957,47 | 6 187,41 | 5 497,59 | 8 215,04 | 7 985,10 | **104 517,00** |

**Vente boisson**

| Exercice    |    Mai |    Jun |    Jul |    Aoû |    Sep |    Oct |    Nov |    Déc |    Jan |    Fév |    Mar |    Avr |    **Total** |
| :---------- | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2026–2027 € | 679,80 | 658,20 | 679,80 | 816,00 | 526,20 | 355,20 | 342,00 | 342,00 | 355,20 | 315,60 | 471,60 | 458,40 | **6 000,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2027–2028 € | 713,79 | 691,11 | 713,79 | 856,80 | 552,51 | 372,96 | 359,10 | 359,10 | 372,96 | 331,38 | 495,18 | 481,32 | **6 300,00** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2028–2029 € | 749,48 | 725,67 | 749,48 | 899,64 | 580,14 | 391,61 | 377,06 | 377,06 | 391,61 | 347,95 | 519,94 | 505,39 | **6 615,00** |

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
| ❌  | Serveur 39h (42 repas) CDI        | 19 200,00 |     2 % | 19 584,00 |     2 % | 19 975,68 |         0 % |        67 % | 32 064,00 | 32 705,28 | 33 359,39 |     100 % |    —    |   —   |  —  |

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

**Serveur 39h (42 repas) CDI** _(brut annuel N : 19 200,00 — coût N : 32 064,00)_
| Exercice | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc | Jan | Fév | Mar | Avr | **Total** |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026–2027 Brut/pers. | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | **—** |
| 2026–2027 Brut total | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | **26 760,00** |

> ⚠️ Écart détail/annuel : 26 760,00 vs 19 200,00 (Δ 7 560,00)
> | 2027–2028 Brut/pers. | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | **—** |
> | 2027–2028 Brut total | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | **26 760,00** |
> ⚠️ Écart détail/annuel : 26 760,00 vs 19 584,00 (Δ 7 176,00)
> | 2028–2029 Brut/pers. | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | **—** |
> | 2028–2029 Brut total | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | 2 230,00 | **26 760,00** |
> ⚠️ Écart détail/annuel : 26 760,00 vs 19 975,68 (Δ 6 784,32)

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
| ✅  | Caisse enregistreuse (airkitchen)                                | CORPOREL   | LINEAIRE    | 01/05/2026 |     889,00 |  20 % | 10 ans |  0 mois |
| ✅  | Fond de commerce                                                 | INCORPOREL | AUCUN       | 01/05/2026 |  18 940,00 |   0 % |  0 ans |  0 mois |
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
| Immobilisations corporelles brutes   | 34 171,99 | 34 171,99 | 34 171,99 |
| − Amortissements corporels cumulés   |  3 417,20 |  6 834,40 | 10 251,60 |
| Immobilisations corporelles nettes   | 30 754,79 | 27 337,59 | 23 920,39 |
| Immobilisations financières brutes   |  3 200,00 |  3 200,00 |  3 200,00 |
| − Amortissements financiers cumulés  |      0,00 |      0,00 |      0,00 |
| Immobilisations financières nettes   |  3 200,00 |  3 200,00 |  3 200,00 |
| **Total immobilisations nettes**     | 62 737,79 | 59 320,59 | 55 903,39 |
| Stocks de matières                   |  1 298,71 |  1 275,97 |  1 339,76 |
| Crédit de TVA                        |     27,81 |      0,00 |      0,00 |
| Créances clients                     |      0,00 |      0,00 |      0,00 |
| Disponibilités (trésorerie)          | 21 009,05 | 24 447,02 | 30 484,76 |
| **Total actif circulant**            | 22 335,57 | 25 722,98 | 31 824,52 |
| **TOTAL ACTIF**                      | 85 073,36 | 85 043,58 | 87 727,91 |
| **PASSIF**                           |           |           |           |
| Capital social                       |  1 000,00 |  1 000,00 |  1 000,00 |
| Comptes courants associés            | 19 000,00 | 19 000,00 | 19 000,00 |
| Réserves / Report à nouveau          |      0,00 |  5 048,48 | 12 340,62 |
| Résultat de l'exercice               |  5 048,48 |  7 292,14 | 10 543,76 |
| **Total capitaux propres**           | 25 048,48 | 32 340,62 | 42 884,38 |
| Emprunts (capital restant dû)        | 53 063,76 | 45 201,68 | 37 019,26 |
| Dettes fournisseurs                  |  2 366,41 |  2 485,38 |  2 609,65 |
| Dettes charges externes              |  2 283,38 |  2 309,02 |  2 335,68 |
| Dettes personnel                     |  2 088,60 |  2 223,72 |  2 223,72 |
| Dettes impôts et taxes               |      0,00 |      0,00 |      0,00 |
| TVA à payer                          |      0,00 |    161,44 |    190,06 |
| Impôt sur les sociétés (acompte)     |    222,73 |    321,71 |    465,17 |
| **Total dettes d'exploitation**      |  6 961,12 |  7 501,28 |  7 824,27 |
| **Total des dettes**                 | 60 024,88 | 52 702,96 | 44 843,53 |
| **TOTAL PASSIF**                     | 85 073,36 | 85 043,58 | 87 727,91 |

### Équilibre du bilan

| Exercice  | Statut       |
| --------- | ------------ |
| 2026–2027 | ✅ Équilibré |
| 2027–2028 | ✅ Équilibré |
| 2028–2029 | ✅ Équilibré |

### BFR — Vue d'ensemble (= écran)

| Désignation                    |  Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------ | -------: | --------: | --------: | --------: |
| Stocks matières                | 2 000,00 |  1 298,71 |  1 275,97 |  1 339,76 |
| Créances clients               |     0,00 |      0,00 |      0,00 |      0,00 |
| Crédit TVA                     | 2 351,50 |     27,81 |      0,00 |      0,00 |
| \***\*= Total Besoins\*\***    | 4 351,50 |  1 326,52 |  1 275,97 |  1 339,76 |
| Dettes fournisseurs            |     0,00 |  2 366,41 |  2 485,38 |  2 609,65 |
| Dettes charges ext.            |     0,00 |  2 283,38 |  2 309,02 |  2 335,68 |
| Dettes impôts/taxes            |     0,00 |      0,00 |      0,00 |      0,00 |
| Dettes personnel               |     0,00 |  2 088,60 |  2 223,72 |  2 223,72 |
| TVA à payer                    |     0,00 |      0,00 |    161,44 |    190,06 |
| Dettes IS                      |     0,00 |    222,73 |    321,71 |    465,17 |
| \***\*= Total Ressources\*\*** |     0,00 |  6 961,12 |  7 501,28 |  7 824,27 |
| \***\*= BFR\*\***              | 4 351,50 | -5 634,60 | -6 225,31 | -6 484,51 |
| \***\*Variation BFR\*\***      | 4 351,50 | -9 986,10 |   -590,71 |   -259,20 |

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
| Vente pizza   |       25 596,00 |       26 875,80 |       28 219,59 |       1 000,00 |               0,00 |               0,00 |               0,00 |
| Vente boisson |        2 100,00 |        2 205,00 |        2 315,25 |         500,00 |               0,00 |               0,00 |               0,00 |
| Vente alcool  |        1 468,95 |        1 542,40 |        1 619,52 |         500,00 |               0,00 |               0,00 |               0,00 |
| **Total**     |   **29 164,95** |   **30 623,20** |   **32 154,36** |   **2 000,00** |           **0,00** |           **0,00** |           **0,00** |

#### Stocks fin d'exercice & Dettes fournisseurs

> Stock = achatsConsoHT × joursStock/360 (formule annuelle). DetteFourn = (M12 HT + ΔStock/12) × coefTTC × délaiMois.

| Activité                 |     Stock y0 | Stock 2026–2027 | Stock 2027–2028 | Stock 2028–2029 | DetteFourn 2026–2027 | DetteFourn 2027–2028 | DetteFourn 2028–2029 |
| ------------------------ | -----------: | --------------: | --------------: | --------------: | -------------------: | -------------------: | -------------------: |
| Vente pizza              |     1 000,00 |        1 108,17 |        1 119,83 |        1 175,82 |             2 063,09 |             2 166,24 |             2 274,56 |
| Vente boisson            |       500,00 |          108,37 |           91,88 |           96,47 |               169,10 |               177,73 |               186,61 |
| Vente alcool             |       500,00 |           82,17 |           64,27 |           67,48 |               134,22 |               141,41 |               148,48 |
| **Total**                | **2 000,00** |    **1 298,71** |    **1 275,97** |    **1 339,76** |         **2 366,41** |         **2 485,38** |         **2 609,65** |
| _BFR stocksMatieres_     |   _2 000,00_ |      _1 298,71_ |      _1 275,97_ |      _1 339,76_ |                      |                      |                      |
| _BFR dettesFournisseurs_ |              |      _2 366,41_ |      _2 485,38_ |      _2 609,65_ |                      |                      |                      |

#### TVA déductible achats (recalc par activité)

> TVA déd = (achatsConsoHT + ΔStock) × tvaAchats%.
> ΔStock Y1 = stockFin Y1 − 0 (SI = 0 hors ponctuel). ΔStock Y2 = stockFin Y2 − Y1. etc.
> Comparer le **Total recalc** au **Total moteur TVA** pour détecter les écarts.

| Activité         | TVADed 2026–2027 | TVADed 2027–2028 | TVADed 2028–2029 |
| ---------------- | ---------------: | ---------------: | ---------------: |
| Vente pizza      |         1 468,73 |         1 478,81 |         1 555,16 |
| Vente boisson    |           121,46 |           120,37 |           127,59 |
| Vente alcool     |           310,22 |           304,90 |           324,55 |
| **Total recalc** |     **1 900,41** |     **1 904,08** |     **2 007,29** |

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
| Chiffre d'affaires                  | 104 997,00 | 110 246,85 | 115 759,19 |
| Subventions                         |       0,00 |       0,00 |       0,00 |
| Production immobilisée              |       0,00 |       0,00 |       0,00 |
| Autres produits                     |       0,00 |       0,00 |       0,00 |
| \***\*= Total produits expl.\*\***  | 104 997,00 | 110 246,85 | 115 759,19 |
| Achats consommés                    |  29 164,95 |  30 623,20 |  32 154,36 |
| Charges externes                    |  36 447,00 |  36 589,44 |  37 129,59 |
| Impôts et taxes                     |   1 623,00 |   1 978,00 |   1 978,00 |
| Charges personnel                   |  25 063,25 |  26 684,68 |  26 684,68 |
| Dotations amort.                    |   3 417,20 |   3 417,20 |   3 417,20 |
| Dotations provisions                |       0,00 |       0,00 |       0,00 |
| Reprises                            |       0,00 |       0,00 |       0,00 |
| Autres charges gestion              |       0,00 |       0,00 |       0,00 |
| \***\*= Résultat exploitation\*\*** |   9 281,60 |  10 954,33 |  14 395,36 |
| Produits financiers                 |       0,00 |       0,00 |       0,00 |
| Charges financières                 |   3 342,21 |   2 375,35 |   1 990,94 |
| \***\*= Résultat financier\*\***    |  -3 342,21 |  -2 375,35 |  -1 990,94 |
| \***\*= Résultat courant\*\***      |   5 939,39 |   8 578,98 |  12 404,42 |
| Résultat exceptionnel               |       0,00 |       0,00 |       0,00 |
| Ajustement net                      |       0,00 |       0,00 |       0,00 |
| − IS                                |     890,91 |   1 286,85 |   1 860,66 |
| \***\*= Résultat net\*\***          |   5 048,48 |   7 292,14 |  10 543,76 |

### Vérification compte de résultat

| Désignation                        | 2026–2027 | 2027–2028 | 2028–2029 |
| ---------------------------------- | --------: | --------: | --------: | ---- |
| ResExpl (fc)                       |  9 281,60 | 10 954,33 | 14 395,36 |
| ResExpl recalculé (Prod − Charges) |  9 281,60 | 10 954,33 | 14 395,36 |
| Écart ResExpl                      |      0,00 |      0,00 |     -0,00 | _✅_ |
| ResNet (fc)                        |  5 048,48 |  7 292,14 | 10 543,76 |

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
| Caisse enregistreuse (airkitchen)                                | LINEAIRE |    10 |     889,00 |    88,90 |    88,90 |    88,90 |
| Fond de commerce                                                 | AUCUN    |     0 |  18 940,00 |     0,00 |     0,00 |     0,00 |
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
| Caisse enregistreuse (airkitchen)                                | CORPOREL   | 01/05/2026 |     889,00 |    10 | oui   |
| Fond de commerce                                                 | INCORPOREL | 01/05/2026 |  18 940,00 |     0 | oui   |
| Meuble pizza                                                     | CORPOREL   | 01/05/2026 |   1 222,99 |    10 | oui   |
| Frais de garantie "BPI"                                          | FINANCIER  | 01/05/2026 |   3 200,00 |     0 | oui   |

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
| Enc. production vendue (TTC)                        | 115 916,40 | 121 712,22 | 127 797,83 |
| Enc. subventions exploitation                       |       0,00 |       0,00 |       0,00 |
| Enc. subventions investissement                     |       0,00 |       0,00 |       0,00 |
| Enc. divers                                         |       0,00 |       0,00 |       0,00 |
| \***\*= Total encaissements\*\***                   | 195 916,40 | 121 712,22 | 127 797,83 |
| Dec. immobilisations (TTC)                          |  68 323,99 |       0,00 |       0,00 |
| Dec. emprunts (capital + intérêts + frais)          |  10 278,45 |  10 237,43 |  10 173,36 |
| Dec. achats                                         |  29 997,66 |  32 385,56 |  34 101,18 |
| Dec. charges externes                               |  41 041,42 |  43 460,54 |  44 097,93 |
| Dec. impôts et taxes                                |   1 623,00 |   1 978,00 |   1 978,00 |
| Dec. personnel                                      |  22 974,65 |  26 549,56 |  26 684,68 |
| Dec. TVA nette (collectée − déductible)             |       0,00 |   2 475,30 |   3 007,73 |
| Dec. IS                                             |     668,18 |   1 187,86 |   1 717,21 |
| Dec. divers                                         |       0,00 |       0,00 |       0,00 |
| \***\*= Total décaissements\*\***                   | 174 907,35 | 118 274,26 | 121 760,09 |
| Solde début d'exercice                              |       0,00 |  21 009,05 |  24 447,02 |
| Variation nette (enc − dec)                         |  21 009,05 |   3 437,96 |   6 037,74 |
| \***\*= Solde fin d'exercice (soldeFinal[11])\*\*** |  21 009,05 |  24 447,02 |  30 484,76 |

#### B — Trésorerie bilan (formule cumulative économique)

> Formule : apports + emprunts + CAF cumulatif − immos − BFR besoins + BFR dettes

| Désignation                                      | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------------------------ | --------: | --------: | --------: |
| Apports capital cumulatifs                       |  1 000,00 |  1 000,00 |  1 000,00 |
| Apports CC cumulatifs                            | 19 000,00 | 19 000,00 | 19 000,00 |
| Emprunts débloqués cumulatifs                    | 60 000,00 | 60 000,00 | 60 000,00 |
| + CAF cumulatif                                  |  8 465,68 | 19 175,02 | 33 135,98 |
| dont: CAF Y1                                     |  8 465,68 |  8 465,68 |  8 465,68 |
| dont: CAF Y2                                     |      0,00 | 10 709,33 | 10 709,33 |
| dont: CAF Y3                                     |      0,00 |      0,00 | 13 960,96 |
| + Enc. non-P&L cumulatifs (subv invest + divers) |      0,00 |      0,00 |      0,00 |
| − Dec. non-P&L cumulatifs (divers)               |      0,00 |      0,00 |      0,00 |
| − Immos acquises cumulatives (HT)                | 66 154,99 | 66 154,99 | 66 154,99 |
| − BFR besoins (stocks+crédit TVA+créances)       |  1 326,52 |  1 275,97 |  1 339,76 |
| dont: Stocks de matières                         |  1 298,71 |  1 275,97 |  1 339,76 |
| dont: Crédit de TVA                              |     27,81 |      0,00 |      0,00 |
| dont: Créances clients                           |      0,00 |      0,00 |      0,00 |
| − Remboursements capital cumulatifs              |  6 936,24 | 14 798,32 | 22 980,74 |
| \***\*= Trésorerie brute\*\***                   | 14 047,93 | 16 945,74 | 22 660,48 |
| + BFR dettes expl. (totalRessources)             |  6 961,12 |  7 501,28 |  7 824,27 |
| dont: Dettes fournisseurs                        |  2 366,41 |  2 485,38 |  2 609,65 |
| dont: Dettes charges ext.                        |  2 283,38 |  2 309,02 |  2 335,68 |
| dont: Dettes impôts/taxes                        |      0,00 |      0,00 |      0,00 |
| dont: Dettes personnel                           |  2 088,60 |  2 223,72 |  2 223,72 |
| dont: TVA à payer                                |      0,00 |    161,44 |    190,06 |
| dont: Dettes IS                                  |    222,73 |    321,71 |    465,17 |
| \***\*= Tréso corrigée\*\***                     | 21 009,05 | 24 447,02 | 30 484,76 |
| \***\*= Disponibilités (bilan)\*\***             | 21 009,05 | 24 447,02 | 30 484,76 |

#### C — Réconciliation

| Désignation                     | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------- | --------: | --------: | --------: | ------------- |
| Tableau mensuel soldeFinal[11]  | 21 009,05 | 24 447,02 | 30 484,76 |
| Bilan disponibilités            | 21 009,05 | 24 447,02 | 30 484,76 |
| \***\*Écart (Tab − Bilan)\*\*** |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |

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
| TVA collectée sur CA                  | 10 919,40 | 11 465,37 | 12 038,64 |
| **Total TVA collectée**               | 10 919,40 | 11 465,37 | 12 038,64 |
| ---                                   |      ---: |      ---: |      ---: |
| TVA déductible sur immos              |      0,00 |      0,00 |      0,00 |
| TVA déductible sur achats matières    |  1 900,41 |  1 904,08 |  2 007,29 |
| TVA déductible sur charges ext.       |  6 877,80 |  6 896,74 |  6 994,99 |
| **Total TVA déductible**              |  8 778,21 |  8 800,82 |  9 002,29 |
| ---                                   |      ---: |      ---: |      ---: |
| TVA nette annuelle (∑)                |  2 141,19 |  2 664,55 |  3 036,35 |
| Crédit TVA fin exercice (M12 reporté) |     27,81 |      0,00 |      0,00 |
| **TVA à payer annuelle (∑)**          |      0,00 |  2 636,74 |  3 036,35 |

#### B — Cohérence TVA tableau vs BFR

> Le BFR utilise la valeur de fin d'exercice (M12) : TVA à payer = dette passif ; crédit TVA = actif circulant.

| Désignation                     | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------- | --------: | --------: | --------: | ------------- |
| TVA à payer M12 (tableau TVA)   |      0,00 |    161,44 |    190,06 |
| TVA à payer BFR (bfr.tvaAPayer) |      0,00 |    161,44 |    190,06 |
| Écart TVA à payer               |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |
| Crédit TVA M12 (tableau TVA)    |     27,81 |      0,00 |      0,00 |
| Crédit TVA BFR (bfr.creditTVA)  |     27,81 |      0,00 |      0,00 |
| Écart crédit TVA                |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |

#### C — Cohérence TVA décaissée vs tableau de trésorerie

> Identité : `decTVA = tvaAPayerAnnuel − ΔDettes TVA`
> où `ΔDettes TVA = tvaM12_fin − tvaM12_debut` (variation de la dette TVA bilan entre clôture et ouverture de l'exercice).
> La TVA de M12 est décaissée en début d'exercice suivant — elle n'est pas dans le flux de l'exercice courant.

| Désignation                                     | 2026–2027 | 2027–2028 | 2028–2029 |
| ----------------------------------------------- | --------: | --------: | --------: | ------------- |
| TVA à payer ∑ annuel (tableau TVA)              |      0,00 |  2 636,74 |  3 036,35 |
| − TVA restant à décaisser M12 fin exercice      |      0,00 |    161,44 |    190,06 |
| + TVA en attente M12 exercice précédent         |      0,00 |      0,00 |    161,44 |
| **= TVA à décaisser dans l'exercice (attendu)** |      0,00 |  2 475,30 |  3 007,73 |
| **TVA décaissée (dec.decTVA ∑)**                |      0,00 |  2 475,30 |  3 007,73 |
| Écart                                           |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |

#### D — Détail mensuel

**2026–2027**

| Désignation                 |      M01 |      M02 |      M03 |      M04 |    M05 |    M06 |    M07 |    M08 |    M09 |    M10 |    M11 |    M12 |     Total |
| --------------------------- | -------: | -------: | -------: | -------: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | --------: |
| TVA collectée CA            | 1 237,17 | 1 197,86 | 1 237,17 | 1 485,04 | 957,63 | 646,43 | 622,41 | 622,41 | 646,43 | 574,36 | 858,26 | 834,24 | 10 919,40 |
| TVA déductible immos        |        — |        — |        — |        — |      — |      — |      — |      — |      — |      — |      — |      — |         — |
| TVA déductible achats       |   379,99 |   184,21 |   186,86 |   227,10 | 143,98 |  97,69 |  97,79 | 100,48 | 106,07 |  94,93 | 142,57 | 138,74 |  1 900,41 |
| TVA déductible charges ext. |   597,77 |   594,81 |   597,77 |   616,42 | 576,74 | 553,32 | 551,51 | 551,51 | 553,32 | 547,90 | 569,26 | 567,45 |  6 877,80 |
| TVA nette                   |   259,41 |   418,83 |   452,54 |   641,51 | 236,91 |  -4,58 | -26,90 | -29,59 | -12,97 | -68,47 | 146,44 | 128,05 |  2 141,19 |
| Crédit TVA reporté          | 1 909,59 | 1 490,75 | 1 038,21 |   396,70 | 159,79 | 164,37 | 191,27 | 220,86 | 233,83 | 302,30 | 155,86 |  27,81 |     27,81 |
| TVA à payer                 |        — |        — |        — |        — |      — |      — |      — |      — |      — |      — |      — |      — |         — |

**2027–2028**

| Désignation                 |      M01 |      M02 |      M03 |      M04 |      M05 |    M06 |    M07 |    M08 |    M09 |    M10 |    M11 |    M12 |     Total |
| --------------------------- | -------: | -------: | -------: | -------: | -------: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | --------: |
| TVA collectée CA            | 1 299,03 | 1 257,75 | 1 299,03 | 1 559,29 | 1 005,51 | 678,75 | 653,53 | 653,53 | 678,75 | 603,08 | 901,18 | 875,95 | 11 465,37 |
| TVA déductible immos        |        — |        — |        — |        — |        — |      — |      — |      — |      — |      — |      — |      — |         — |
| TVA déductible achats       |   215,73 |   208,54 |   215,28 |   258,65 |   166,81 | 112,70 | 108,65 | 108,71 | 112,94 | 100,35 | 149,96 | 145,77 |  1 904,08 |
| TVA déductible charges ext. |   600,58 |   597,47 |   600,58 |   620,16 |   578,50 | 553,91 | 552,01 | 552,01 | 553,91 | 548,22 | 570,64 | 568,75 |  6 896,74 |
| TVA nette                   |   482,71 |   451,74 |   483,17 |   680,48 |   260,21 |  12,14 |  -7,13 |  -7,20 |  11,90 | -45,49 | 180,57 | 161,44 |  2 664,55 |
| Crédit TVA reporté          |        — |        — |        — |        — |        — |      — |   7,13 |  14,33 |   2,43 |  47,92 |      — |      — |         — |
| TVA à payer                 |   454,90 |   451,74 |   483,17 |   680,48 |   260,21 |  12,14 |      — |      — |      — |      — | 132,65 | 161,44 |  2 636,74 |

**2028–2029**

| Désignation                 |      M01 |      M02 |      M03 |      M04 |      M05 |    M06 |    M07 |    M08 |    M09 |    M10 |    M11 |    M12 |     Total |
| --------------------------- | -------: | -------: | -------: | -------: | -------: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | --------: |
| TVA collectée CA            | 1 363,98 | 1 320,64 | 1 363,98 | 1 637,25 | 1 055,79 | 712,69 | 686,20 | 686,20 | 712,69 | 633,23 | 946,24 | 919,75 | 12 038,64 |
| TVA déductible immos        |        — |        — |        — |        — |        — |      — |      — |      — |      — |      — |      — |      — |         — |
| TVA déductible achats       |   227,43 |   220,55 |   227,90 |   273,31 |   176,23 | 118,86 | 114,30 | 114,23 | 118,61 | 105,38 | 157,46 | 153,05 |  2 007,29 |
| TVA déductible charges ext. |   610,06 |   606,80 |   610,06 |   630,62 |   586,87 | 561,06 | 559,06 | 559,06 | 561,06 | 555,08 | 578,63 | 576,64 |  6 994,99 |
| TVA nette                   |   526,49 |   493,29 |   526,02 |   733,32 |   292,69 |  32,77 |  12,84 |  12,91 |  33,02 | -27,22 | 210,15 | 190,06 |  3 036,35 |
| Crédit TVA reporté          |        — |        — |        — |        — |        — |      — |      — |      — |      — |  27,22 |      — |      — |         — |
| TVA à payer                 |   526,49 |   493,29 |   526,02 |   733,32 |   292,69 |  32,77 |  12,84 |  12,91 |  33,02 |      — | 182,93 | 190,06 |  3 036,35 |

### Vérification CAF (= Résultat net + Dotations − Reprises)

| Désignation                | 2026–2027 | 2027–2028 | 2028–2029 |
| -------------------------- | --------: | --------: | --------: | ------------- |
| Résultat net               |  5 048,48 |  7 292,14 | 10 543,76 |
| + Dotations amortissements |  3 417,20 |  3 417,20 |  3 417,20 |
| + Dotations provisions     |      0,00 |      0,00 |      0,00 |
| − Reprises sur provisions  |      0,00 |      0,00 |      0,00 |
| **= CAF recalculée**       |  8 465,68 | 10 709,33 | 13 960,96 |
| CAF officielle (fc.caf)    |  8 465,68 | 10 709,33 | 13 960,96 |
| Écart                      |      0,00 |     -0,00 |      0,00 | _✅ Cohérent_ |

### SIG — Soldes Intermédiaires de Gestion

> Valeurs issues de **fc** — même moteur que l'application.

| Désignation                           |  2026–2027 |  2027–2028 |  2028–2029 |
| ------------------------------------- | ---------: | ---------: | ---------: | ------------------------------ |
| CA HT                                 | 104 997,00 | 110 246,85 | 115 759,19 |
| − Achats consommés                    |  29 164,95 |  30 623,20 |  32 154,36 |
| **= Marge brute**                     |  75 832,05 |  79 623,65 |  83 604,83 | _tx: 72,2 % / 72,2 % / 72,2 %_ |
| + Production immobilisée              |       0,00 |       0,00 |       0,00 |
| + Transferts de charges               |       0,00 |       0,00 |       0,00 |
| + Autres produits exploitation        |       0,00 |       0,00 |       0,00 |
| − Charges externes                    |  36 447,00 |  36 589,44 |  37 129,59 |
| **= Valeur Ajoutée (VA)**             |  39 385,05 |  43 034,21 |  46 475,24 | _tx: 37,5 % / 39,0 % / 40,1 %_ |
| + Subventions exploitation            |       0,00 |       0,00 |       0,00 |
| − Impôts et taxes                     |   1 623,00 |   1 978,00 |   1 978,00 |
| − Charges de personnel                |  25 063,25 |  26 684,68 |  26 684,68 |
| **= EBE**                             |  12 698,80 |  14 371,53 |  17 812,56 | _tx: 12,1 % / 13,0 % / 15,4 %_ |
| − Dotations amortissements            |   3 417,20 |   3 417,20 |   3 417,20 |
| − Dotations provisions                |       0,00 |       0,00 |       0,00 |
| + Reprises sur provisions             |       0,00 |       0,00 |       0,00 |
| ± Autres charges/produits gestion net |      -0,00 |      -0,00 |      -0,00 |
| **= Résultat d'exploitation (REX)**   |   9 281,60 |  10 954,33 |  14 395,36 | _tx: 8,8 % / 9,9 % / 12,4 %_   |
| + Produits financiers                 |       0,00 |       0,00 |       0,00 |
| − Charges financières                 |   3 342,21 |   2 375,35 |   1 990,94 |
| **= Résultat financier**              |  -3 342,21 |  -2 375,35 |  -1 990,94 |
| **= Résultat courant (RCB)**          |   5 939,39 |   8 578,98 |  12 404,42 |
| + Résultat exceptionnel               |       0,00 |       0,00 |       0,00 |
| +/− Ajustements nets                  |       0,00 |       0,00 |       0,00 |
| − IS                                  |     890,91 |   1 286,85 |   1 860,66 |
| **= Résultat net**                    |   5 048,48 |   7 292,14 |  10 543,76 | _tx: 4,8 % / 6,6 % / 9,1 %_    |
| **CAF**                               |   8 465,68 |  10 709,33 |  13 960,96 | _tx: 8,1 % / 9,7 % / 12,1 %_   |

### Détail activités (hypothèses saisies)

| Libellé       | Type              | Tx marge | TVA CA | TVA ach. | Stock j | Cli. j | Fourn. j |      CA N |    CA N+1 |     CA N+2 |
| ------------- | ----------------- | -------: | -----: | -------: | ------: | -----: | -------: | --------: | --------: | ---------: |
| Vente pizza   | PRODUCTION_VENDUE |     73 % |   10 % |    5.5 % |      15 |      0 |       30 | 94 800,00 | 99 540,00 | 104 517,00 |
| Vente boisson | PRODUCTION_VENDUE |     65 % |   10 % |    5.5 % |      15 |      0 |       30 |  6 000,00 |  6 300,00 |   6 615,00 |
| Vente alcool  | PRODUCTION_VENDUE |     65 % |   20 % |     20 % |      15 |      0 |       30 |  4 197,00 |  4 406,85 |   4 627,19 |

| Désignation                         |  2026–2027 |  2027–2028 |  2028–2029 |
| ----------------------------------- | ---------: | ---------: | ---------: |
| CA total activités actives (saisie) | 104 997,00 | 110 246,85 | 115 759,19 |
| CA total (fc.ca)                    | 104 997,00 | 110 246,85 | 115 759,19 |

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

| + Immobilisations incorporelles | 28 783,00 | 0,00 | 0,00 | 0,00 |
| + Immobilisations corporelles | 34 171,99 | 0,00 | 0,00 | 0,00 |
| + Immobilisations financières | 3 200,00 | 0,00 | 0,00 | 0,00 |
| = Total immobilisations | 66 154,99 | 0,00 | 0,00 | 0,00 |
| + Variation du BFR | 4 351,50 | -9 986,10 | -590,71 | -259,20 |
| + Remboursement des emprunts | 0,00 | 6 936,24 | 7 862,08 | 8 182,42 |
| **= Total des besoins** | 70 506,49 | -3 049,86 | 7 271,37 | 7 923,22 |

**RESSOURCES**

| Désignation                        |   Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| ---------------------------------- | --------: | --------: | --------: | --------: |
| + Apports en capital               |  1 000,00 |      0,00 |      0,00 |      0,00 |
| + Apports en comptes courants      | 19 000,00 |      0,00 |      0,00 |      0,00 |
| + Souscription d'emprunts          | 60 000,00 |      0,00 |      0,00 |      0,00 |
| + Subventions d'investissement     |      0,00 |      0,00 |      0,00 |      0,00 |
| + Capacité d'autofinancement (CAF) |      0,00 |  8 465,68 | 10 709,33 | 13 960,96 |
| **= Total des ressources**         | 80 000,00 |  8 465,68 | 10 709,33 | 13 960,96 |

**TRÉSORERIE**

| Désignation               |  Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------- | -------: | --------: | --------: | --------: |
| = Variation de trésorerie | 9 493,51 | 11 515,54 |  3 437,96 |  6 037,74 |
| **= Solde de trésorerie** | 9 493,51 | 21 009,05 | 24 447,02 | 30 484,76 |

| **= Variation de trésorerie (Ressources − Besoins)** | 9 493,51 | 11 515,54 | 3 437,96 | 6 037,74 | _(= par construction)_ |

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
| 7   | TVA décaissée = tvaAnnuel − ΔDettes TVA  |      ✅      |               — |               — |               — |
| 8   | Trésorerie tableau mensuel = bilan       |      ✅      |               — |               — |               — |
| 9   | Capital emprunts bilan = échéancier      |      ✅      |               — |               — |               — |
| 10  | CA activités saisies = fc.ca             |      ✅      |               — |               — |               — |
| 11  | Plan financement solde tréso = bilan     |      ✅      |               — |               — |               — |

#### ✅ Aucune divergence détectée

Toutes les vérifications de cohérence passent. La modélisation est cohérente.

#### Points de vigilance

Aucun point de vigilance identifié.

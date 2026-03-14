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
| Mode calcul TNS        | `DEBUT_ACTIVITE_FORFAIT`     |

### Activités

|  ✓  | Libellé       | Type              | TVA CA | Tx marge | TVA ach. | Stock j | Cli. j | Fourn. j |       CA N |     CA N+1 |     CA N+2 |
| :-: | ------------- | ----------------- | -----: | -------: | -------: | ------: | -----: | -------: | ---------: | ---------: | ---------: |
| ✅  | Vente pizza   | PRODUCTION_VENDUE |   10 % |     73 % |    5.5 % |      15 |      0 |       15 | 122 472,00 | 126 146,16 | 129 930,54 |
| ✅  | Vente alcool  | PRODUCTION_VENDUE |   20 % |     65 % |     20 % |      15 |      0 |       15 |   4 898,00 |   5 044,94 |   5 196,29 |
| ✅  | Vente boisson | PRODUCTION_VENDUE |   10 % |     65 % |    5.5 % |      15 |      0 |       15 |   2 632,00 |   2 710,96 |   2 792,29 |

#### Saisonnalité CA (activités non-uniformes)

**Vente pizza**

| Exercice    |       Mai |       Jun |       Jul |       Aoû |       Sep |      Oct |      Nov |      Déc |      Jan |      Fév |       Mar |      Avr |      **Total** |
| :---------- | --------: | --------: | --------: | --------: | --------: | -------: | -------: | -------: | -------: | -------: | --------: | -------: | -------------: |
| 2026–2027 % |    11.3 % |    11.0 % |    11.3 % |    13.6 % |     8.8 % |    5.9 % |    5.7 % |    5.7 % |    5.9 % |    5.3 % |     7.9 % |    7.6 % |    **100.0 %** |
| 2026–2027 € | 13 876,08 | 13 435,18 | 13 876,08 | 16 656,19 | 10 740,79 | 7 250,34 | 6 980,90 | 6 980,90 | 7 250,34 | 6 442,03 |  9 626,30 | 9 356,86 | **122 472,00** |
| 2027–2028 % |    11.3 % |    11.0 % |    11.3 % |    13.6 % |     8.8 % |    5.9 % |    5.7 % |    5.7 % |    5.9 % |    5.3 % |     7.9 % |    7.6 % |    **100.0 %** |
| 2027–2028 € | 14 292,36 | 13 838,23 | 14 292,36 | 17 155,88 | 11 063,02 | 7 467,85 | 7 190,33 | 7 190,33 | 7 467,85 | 6 635,29 |  9 915,09 | 9 637,57 | **126 146,16** |
| 2028–2029 % |    11.3 % |    11.0 % |    11.3 % |    13.6 % |     8.8 % |    5.9 % |    5.7 % |    5.7 % |    5.9 % |    5.3 % |     7.9 % |    7.6 % |    **100.0 %** |
| 2028–2029 € | 14 721,13 | 14 253,38 | 14 721,13 | 17 670,55 | 11 394,91 | 7 691,89 | 7 406,04 | 7 406,04 | 7 691,89 | 6 834,35 | 10 212,54 | 9 926,69 | **129 930,54** |

**Vente alcool**

| Exercice    |    Mai |    Jun |    Jul |    Aoû |    Sep |    Oct |    Nov |    Déc |    Jan |    Fév |    Mar |    Avr |    **Total** |
| :---------- | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2026–2027 € | 554,94 | 537,31 | 554,94 | 666,13 | 429,55 | 289,96 | 279,19 | 279,19 | 289,96 | 257,63 | 384,98 | 374,21 | **4 898,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2027–2028 € | 571,59 | 553,43 | 571,59 | 686,11 | 442,44 | 298,66 | 287,56 | 287,56 | 298,66 | 265,36 | 396,53 | 385,43 | **5 044,94** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2028–2029 € | 588,74 | 570,03 | 588,74 | 706,70 | 455,71 | 307,62 | 296,19 | 296,19 | 307,62 | 273,32 | 408,43 | 397,00 | **5 196,29** |

**Vente boisson**

| Exercice    |    Mai |    Jun |    Jul |    Aoû |    Sep |    Oct |    Nov |    Déc |    Jan |    Fév |    Mar |    Avr |    **Total** |
| :---------- | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2026–2027 € | 298,21 | 288,73 | 298,21 | 357,95 | 230,83 | 155,81 | 150,02 | 150,02 | 155,81 | 138,44 | 206,88 | 201,08 | **2 632,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2027–2028 € | 307,15 | 297,39 | 307,15 | 368,69 | 237,75 | 160,49 | 154,52 | 154,52 | 160,49 | 142,60 | 213,08 | 207,12 | **2 710,96** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % |  8.8 % |  5.9 % |  5.7 % |  5.7 % |  5.9 % |  5.3 % |  7.9 % |  7.6 % |  **100.0 %** |
| 2028–2029 € | 316,37 | 306,31 | 316,37 | 379,75 | 244,88 | 165,30 | 159,16 | 159,16 | 165,30 | 146,87 | 219,47 | 213,33 | **2 792,29** |

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
| ✅  | Honoraires juridiques                      | SERVICE_EXTERIEUR      | MENSUELLE     |      30 |  20 % |  1 500,00 |    600,00 |    630,00 |
| ✅  | Publicité, publications                    | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |  1 000,00 |    500,00 |    500,00 |
| ✅  | Services bancaires                         | SERVICE_EXTERIEUR      | MENSUELLE     |      30 |  20 % |    584,00 |    595,68 |    607,59 |
| ✅  | Frais garantie BPI                         | SERVICE_EXTERIEUR      | PERSONNALISEE |       0 |   0 % |  3 200,00 |      0,00 |      0,00 |
| ✅  | Frais divers                               | SERVICE_EXTERIEUR      | MENSUELLE     |       0 |  20 % |    500,00 |    510,00 |    520,20 |
| ✅  | Frais titre restaurant                     | SERVICE_EXTERIEUR      | PERSONNALISEE |      30 |  20 % |    489,89 |    489,89 |    489,89 |
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

**Frais garantie BPI** _(PERSONNALISEE)_

| Exercice    |      Mai |   Jun |   Jul |   Aoû |   Sep |   Oct |   Nov |   Déc |   Jan |   Fév |   Mar |   Avr |    **Total** |
| :---------- | -------: | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ----: | -----------: |
| 2026–2027 % |  100.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % |  **100.0 %** |
| 2026–2027 € | 3 200,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 | **3 200,00** |
| 2027–2028 % |    8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.4 % |  **100.0 %** |
| 2027–2028 € |     0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |     **0,00** |
| 2028–2029 % |    8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.3 % | 8.4 % |  **100.0 %** |
| 2028–2029 € |     0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |  0,00 |     **0,00** |

**Frais titre restaurant** _(PERSONNALISEE)_

| Exercice    |    Mai |    Jun |    Jul |    Aoû |   Sep |   Oct |   Nov |   Déc |   Jan |   Fév |   Mar |   Avr |   **Total** |
| :---------- | -----: | -----: | -----: | -----: | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ----------: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2026–2027 € |  55,50 |  53,74 |  55,50 |  66,63 | 42,96 | 29,00 | 27,92 | 27,92 | 29,00 | 25,77 | 38,51 | 37,43 |  **489,89** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2027–2028 € |  55,50 |  53,74 |  55,50 |  66,63 | 42,96 | 29,00 | 27,92 | 27,92 | 29,00 | 25,77 | 38,51 | 37,43 |  **489,89** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2028–2029 € |  55,50 |  53,74 |  55,50 |  66,63 | 42,96 | 29,00 | 27,92 | 27,92 | 29,00 | 25,77 | 38,51 | 37,43 |  **489,89** |

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
| ✅  | Serveur saisonnier 39h (42 repas) | 12 391,00 |     2 % | 12 638,82 |     2 % | 12 891,59 |        22 % |        25 % | 15 488,75 | 15 798,53 | 16 114,49 |     100 % |    —    |   —   |  —  |

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
| ✅  | Cotisations facultatives (Madelin)         |   700,00 |   700,00 |   700,00 |
| ✅  | Cotisations facultatives (non Madelin)     |     0,00 |     0,00 |     0,00 |

### Immobilisations

|  ✓  | Libellé                           | Nature     | Mode amort. | Date acq.  | Montant HT | TVA % |  Durée | Différé |
| :-: | --------------------------------- | ---------- | ----------- | ---------- | ---------: | ----: | -----: | ------: |
| ✅  | Fond de commerce                  | INCORPOREL | AUCUN       | 01/05/2026 |  30 000,00 |  20 % |  0 ans |  0 mois |
| ✅  | Fond de commerce (materiel)       | CORPOREL   | LINEAIRE    | 01/05/2026 |  30 000,00 |  20 % | 10 ans |  0 mois |
| ✅  | Meuble pizza                      | CORPOREL   | LINEAIRE    | 01/05/2026 |   1 499,00 |  20 % | 10 ans |  0 mois |
| ✅  | Enseigne et communication         | CORPOREL   | LINEAIRE    | 01/05/2026 |   1 500,00 |  20 % | 10 ans |  0 mois |
| ✅  | Caisse enregistreuse (airkitchen) | CORPOREL   | LINEAIRE    | 01/05/2026 |     889,00 |  20 % |  5 ans |  0 mois |
| ✅  | Frais d'agence                    | INCORPOREL | AUCUN       | 01/05/2026 |   5 833,00 |  20 % |  0 ans |  0 mois |

### Financement — Apports

| Type           | Libellé               |   Montant | Date       | Remboursable |
| -------------- | --------------------- | --------: | ---------- | :----------: |
| CAPITAL        | Apport personnel      |  1 000,00 | 01/05/2026 |      —       |
| COMPTE_COURANT | Apport prêt d'honneur | 10 000,00 | 01/05/2026 |      —       |
| COMPTE_COURANT | Apport personnel      |  9 000,00 | 01/05/2026 |      —       |

### Financement — Emprunts

| Libellé |   Montant | Taux | Assur. |   Durée | Déblocage  | Différé | Type         |
| ------- | --------: | ---: | -----: | ------: | ---------- | :------ | ------------ |
| CIC     | 70 000,00 |  4 % |  0.8 % | 84 mois | 01/05/2026 | —       | AMORTISSABLE |

## Données calculées

> Résultats générés par le moteur de calcul à partir des hypothèses ci-dessus.

### Bilan officiel (= écran)

| Désignation                          | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------------ | --------: | --------: | --------: |
| **ACTIF**                            |           |           |           |
| Immobilisations incorporelles brutes | 35 833,00 | 35 833,00 | 35 833,00 |
| − Amortissements incorporels cumulés |      0,00 |      0,00 |      0,00 |
| Immobilisations incorporelles nettes | 35 833,00 | 35 833,00 | 35 833,00 |
| Immobilisations corporelles brutes   | 33 888,00 | 33 888,00 | 33 888,00 |
| − Amortissements corporels cumulés   |  3 477,70 |  6 955,40 | 10 433,10 |
| Immobilisations corporelles nettes   | 30 410,30 | 26 932,60 | 23 454,90 |
| **Total immobilisations nettes**     | 66 243,30 | 62 765,60 | 59 287,90 |
| Stocks de matières                   |  1 487,62 |  1 532,25 |  1 578,22 |
| Crédit de TVA                        | 10 145,38 |  5 714,62 |    994,35 |
| Créances clients                     |      0,00 |      0,00 |      0,00 |
| Disponibilités (trésorerie)          | 15 512,13 | 22 821,12 | 27 088,64 |
| **Total actif circulant**            | 27 145,13 | 30 068,00 | 29 661,21 |
| **TOTAL ACTIF**                      | 93 388,43 | 92 833,60 | 88 949,11 |
| **PASSIF**                           |           |           |           |
| Capital social                       |  1 000,00 |  1 000,00 |  1 000,00 |
| Comptes courants associés            | 19 000,00 | 19 000,00 | 19 000,00 |
| Réserves / Report à nouveau          |      0,00 |  2 221,31 |  9 341,79 |
| Résultat de l'exercice               |  2 221,31 |  7 120,47 |  9 435,30 |
| **Total capitaux propres**           | 22 221,31 | 29 341,79 | 38 777,09 |
| Emprunts (capital restant dû)        | 61 907,74 | 52 735,31 | 43 189,17 |
| Dettes fournisseurs                  |  1 514,18 |  1 493,79 |  1 538,60 |
| Dettes charges externes              |  2 447,42 |  2 367,26 |  2 380,32 |
| Dettes personnel                     |  5 199,78 |  6 581,32 |  2 647,67 |
| Dettes impôts et taxes               |      0,00 |      0,00 |      0,00 |
| TVA à payer                          |      0,00 |      0,00 |      0,00 |
| Impôt sur les sociétés (acompte)     |     98,00 |    314,14 |    416,26 |
| **Total dettes d'exploitation**      |  9 259,38 | 10 756,50 |  6 982,85 |
| **Total des dettes**                 | 71 167,12 | 63 491,81 | 50 172,02 |
| **TOTAL PASSIF**                     | 93 388,43 | 92 833,60 | 88 949,11 |

### Équilibre du bilan

| Exercice  | Statut       |
| --------- | ------------ |
| 2026–2027 | ✅ Équilibré |
| 2027–2028 | ✅ Équilibré |
| 2028–2029 | ✅ Équilibré |

### BFR — Vue d'ensemble (= écran)

| Désignation                    |   Initial |  2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------ | --------: | ---------: | --------: | --------: |
| Stocks matières                |  1 150,00 |   1 487,62 |  1 532,25 |  1 578,22 |
| Créances clients               |      0,00 |       0,00 |      0,00 |      0,00 |
| Crédit TVA                     | 14 021,95 |  10 145,38 |  5 714,62 |    994,35 |
| \***\*= Total Besoins\*\***    | 15 171,95 |  11 633,00 |  7 246,87 |  2 572,57 |
| Dettes fournisseurs            |      0,00 |   1 514,18 |  1 493,79 |  1 538,60 |
| Dettes charges ext.            |      0,00 |   2 447,42 |  2 367,26 |  2 380,32 |
| Dettes impôts/taxes            |      0,00 |       0,00 |      0,00 |      0,00 |
| Dettes personnel               |      0,00 |   5 199,78 |  6 581,32 |  2 647,67 |
| TVA à payer                    |      0,00 |       0,00 |      0,00 |      0,00 |
| Dettes IS                      |      0,00 |      98,00 |    314,14 |    416,26 |
| \***\*= Total Ressources\*\*** |      0,00 |   9 259,38 | 10 756,50 |  6 982,85 |
| \***\*= BFR\*\***              | 15 171,95 |   2 373,62 | -3 509,63 | -4 410,28 |
| \***\*Variation BFR\*\***      | 15 171,95 | -12 798,33 | -5 883,25 |   -900,66 |

### BFR — Détail Achats / Stocks par activité

#### Paramètres

| Activité      | Coef achat | TVA ach. % | Jours stock | Jours fourn. |
| ------------- | ---------: | ---------: | ----------: | -----------: |
| Vente pizza   |     0.2700 |        5.5 |          15 |           15 |
| Vente alcool  |     0.3500 |         20 |          15 |           15 |
| Vente boisson |     0.3500 |        5.5 |          15 |           15 |

#### Achats HT consommés + ponctuels

> AchHT = CA × coef. StockInit = ponctuelN[0] → BFR initial (y0). PoncFlux N = ponctuelN[1..11].

| Activité      | AchHT 2026–2027 | AchHT 2027–2028 | AchHT 2028–2029 | StockInit (y0) | PoncFlux 2026–2027 | PoncFlux 2027–2028 | PoncFlux 2028–2029 |
| ------------- | --------------: | --------------: | --------------: | -------------: | -----------------: | -----------------: | -----------------: |
| Vente pizza   |       33 067,44 |       34 059,46 |       35 081,25 |       1 000,00 |               0,00 |               0,00 |               0,00 |
| Vente alcool  |        1 714,30 |        1 765,73 |        1 818,70 |         100,00 |               0,00 |               0,00 |               0,00 |
| Vente boisson |          921,20 |          948,84 |          977,30 |          50,00 |               0,00 |               0,00 |               0,00 |
| **Total**     |   **35 702,94** |   **36 774,03** |   **37 877,25** |   **1 150,00** |           **0,00** |           **0,00** |           **0,00** |

#### Stocks fin d'exercice & Dettes fournisseurs

> Stock = achatsConsoHT × joursStock/360 (formule annuelle). DetteFourn = (M12 HT + ΔStock/12) × coefTTC × délaiMois.

| Activité                 |     Stock y0 | Stock 2026–2027 | Stock 2027–2028 | Stock 2028–2029 | DetteFourn 2026–2027 | DetteFourn 2027–2028 | DetteFourn 2028–2029 |
| ------------------------ | -----------: | --------------: | --------------: | --------------: | -------------------: | -------------------: | -------------------: |
| Vente pizza              |     1 000,00 |        1 377,81 |        1 419,14 |        1 461,72 |             1 393,22 |             1 374,45 |             1 415,68 |
| Vente alcool             |       100,00 |           71,43 |           73,57 |           75,78 |                82,15 |                81,05 |                83,48 |
| Vente boisson            |        50,00 |           38,38 |           39,53 |           40,72 |                38,81 |                38,29 |                39,44 |
| **Total**                | **1 150,00** |    **1 487,62** |    **1 532,25** |    **1 578,22** |         **1 514,18** |         **1 493,79** |         **1 538,60** |
| _BFR stocksMatieres_     |   _1 150,00_ |      _1 487,62_ |      _1 532,25_ |      _1 578,22_ |                      |                      |                      |
| _BFR dettesFournisseurs_ |              |      _1 514,18_ |      _1 493,79_ |      _1 538,60_ |                      |                      |                      |

#### TVA déductible achats (recalc par activité)

> TVA déd = (achatsConsoHT + ΔStock) × tvaAchats%.
> ΔStock Y1 = stockFin Y1 − 0 (SI = 0 hors ponctuel). ΔStock Y2 = stockFin Y2 − Y1. etc.
> Comparer le **Total recalc** au **Total moteur TVA** pour détecter les écarts.

| Activité         | TVADed 2026–2027 | TVADed 2027–2028 | TVADed 2028–2029 |
| ---------------- | ---------------: | ---------------: | ---------------: |
| Vente pizza      |         1 894,49 |         1 875,54 |         1 931,81 |
| Vente alcool     |           357,15 |           353,57 |           364,18 |
| Vente boisson    |            52,78 |            52,25 |            53,82 |
| **Total recalc** |     **2 304,41** |     **2 281,37** |     **2 349,81** |

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
| Honoraires juridiques                      |  1 500,00 |    600,00 |    630,00 |    30 |   20 |   150,00 |    60,00 |    63,00 |
| Publicité, publications                    |  1 000,00 |    500,00 |    500,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Services bancaires                         |    584,00 |    595,68 |    607,59 |    30 |   20 |    58,40 |    59,57 |    60,76 |
| Frais garantie BPI                         |  3 200,00 |      0,00 |      0,00 |     0 |    0 |     0,00 |     0,00 |     0,00 |
| Frais divers                               |    500,00 |    510,00 |    520,20 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Frais titre restaurant                     |    489,89 |    489,89 |    489,89 |    30 |   20 |    44,91 |    44,91 |    44,91 |
| Déplacements                               |    200,00 |    200,00 |    200,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Vetements de travail                       |    100,00 |    100,00 |    100,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| Commission CB                              |    658,00 |    677,74 |    698,07 |    30 |   20 |    65,80 |    67,77 |    69,81 |
| Abonnement logiciel de caisse (airkitchen) |    810,00 |    810,00 |    810,00 |     0 |   20 |     0,00 |     0,00 |     0,00 |
| offerts                                    |  3 061,80 |  3 061,80 |  3 061,80 |    30 |   20 |   280,71 |   280,71 |   280,71 |

### Compte de résultat (fc)

| Désignation                         |  2026–2027 |  2027–2028 |  2028–2029 |
| ----------------------------------- | ---------: | ---------: | ---------: |
| Chiffre d'affaires                  | 130 002,00 | 133 902,06 | 137 919,12 |
| Subventions                         |       0,00 |       0,00 |       0,00 |
| Production immobilisée              |       0,00 |       0,00 |       0,00 |
| Autres produits                     |       0,00 |       0,00 |       0,00 |
| \***\*= Total produits expl.\*\***  | 130 002,00 | 133 902,06 | 137 919,12 |
| Achats consommés                    |  35 702,94 |  36 774,03 |  37 877,25 |
| Charges externes                    |  41 533,84 |  37 340,88 |  37 663,85 |
| Impôts et taxes                     |   1 623,00 |   1 978,00 |   1 978,00 |
| Charges personnel                   |  41 252,00 |  43 183,21 |  43 499,17 |
| Dotations amort.                    |   3 477,70 |   3 477,70 |   3 477,70 |
| Dotations provisions                |       0,00 |       0,00 |       0,00 |
| Reprises                            |       0,00 |       0,00 |       0,00 |
| Autres charges gestion              |       0,00 |       0,00 |       0,00 |
| \***\*= Résultat exploitation\*\*** |   6 412,52 |  11 148,25 |  13 423,15 |
| Produits financiers                 |       0,00 |       0,00 |       0,00 |
| Charges financières                 |   3 799,21 |   2 771,22 |   2 322,80 |
| \***\*= Résultat financier\*\***    |  -3 799,21 |  -2 771,22 |  -2 322,80 |
| \***\*= Résultat courant\*\***      |   2 613,31 |   8 377,03 |  11 100,35 |
| Résultat exceptionnel               |       0,00 |       0,00 |       0,00 |
| Ajustement net                      |       0,00 |       0,00 |       0,00 |
| − IS                                |     392,00 |   1 256,55 |   1 665,05 |
| \***\*= Résultat net\*\***          |   2 221,31 |   7 120,47 |   9 435,30 |

### Vérification compte de résultat

| Désignation                        | 2026–2027 | 2027–2028 | 2028–2029 |
| ---------------------------------- | --------: | --------: | --------: | ---- |
| ResExpl (fc)                       |  6 412,52 | 11 148,25 | 13 423,15 |
| ResExpl recalculé (Prod − Charges) |  6 412,52 | 11 148,25 | 13 423,15 |
| Écart ResExpl                      |     -0,00 |     -0,00 |     -0,00 | _✅_ |
| ResNet (fc)                        |  2 221,31 |  7 120,47 |  9 435,30 |

### Détail dotations amortissement (par immobilisation)

> Méthode : `distribuerAmortParExercice` — respecte AUCUN / LINEAIRE / DEGRESSIF.

| Libellé                           | Mode     | Durée | Montant HT |   Dot Y1 |   Dot Y2 |   Dot Y3 |
| --------------------------------- | -------- | ----: | ---------: | -------: | -------: | -------: |
| Fond de commerce                  | AUCUN    |     0 |  30 000,00 |     0,00 |     0,00 |     0,00 |
| Fond de commerce (materiel)       | LINEAIRE |    10 |  30 000,00 | 3 000,00 | 3 000,00 | 3 000,00 |
| Meuble pizza                      | LINEAIRE |    10 |   1 499,00 |   149,90 |   149,90 |   149,90 |
| Enseigne et communication         | LINEAIRE |    10 |   1 500,00 |   150,00 |   150,00 |   150,00 |
| Caisse enregistreuse (airkitchen) | LINEAIRE |     5 |     889,00 |   177,80 |   177,80 |   177,80 |
| Frais d'agence                    | AUCUN    |     0 |   5 833,00 |     0,00 |     0,00 |     0,00 |

### Cohérence dotations amort (distribuerAmortParExercice vs fc.dotationsAmort)

| Désignation       | 2026–2027 | 2027–2028 | 2028–2029 |
| ----------------- | --------: | --------: | --------: | ------------- |
| Σ distribuerAmort |  3 477,70 |  3 477,70 |  3 477,70 |
| fc.dotationsAmort |  3 477,70 |  3 477,70 |  3 477,70 |
| Écart             |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |

### Détail immobilisations actives

| Libellé                           | Nature     | Date acq.  | Montant HT | Durée | Actif |
| --------------------------------- | ---------- | ---------- | ---------: | ----: | ----- |
| Fond de commerce                  | INCORPOREL | 01/05/2026 |  30 000,00 |     0 | oui   |
| Fond de commerce (materiel)       | CORPOREL   | 01/05/2026 |  30 000,00 |    10 | oui   |
| Meuble pizza                      | CORPOREL   | 01/05/2026 |   1 499,00 |    10 | oui   |
| Enseigne et communication         | CORPOREL   | 01/05/2026 |   1 500,00 |    10 | oui   |
| Caisse enregistreuse (airkitchen) | CORPOREL   | 01/05/2026 |     889,00 |     5 | oui   |
| Frais d'agence                    | INCORPOREL | 01/05/2026 |   5 833,00 |     0 | oui   |

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
| Enc. production vendue (TTC)                        | 143 492,00 | 147 796,76 | 152 230,66 |
| Enc. subventions exploitation                       |       0,00 |       0,00 |       0,00 |
| Enc. subventions investissement                     |       0,00 |       0,00 |       0,00 |
| Enc. divers                                         |       0,00 |       0,00 |       0,00 |
| \***\*= Total encaissements\*\***                   | 233 492,00 | 147 796,76 | 152 230,66 |
| Dec. immobilisations (TTC)                          |  83 665,20 |       0,00 |       0,00 |
| Dec. emprunts (capital + intérêts + frais)          |  11 891,47 |  11 943,65 |  11 868,94 |
| Dec. achats                                         |  37 980,79 |  39 120,42 |  40 228,21 |
| Dec. charges externes                               |  46 473,19 |  44 603,61 |  44 892,25 |
| Dec. impôts et taxes                                |   1 623,00 |   1 978,00 |   1 978,00 |
| Dec. personnel                                      |  36 052,22 |  41 801,67 |  47 432,82 |
| Dec. TVA nette (collectée − déductible)             |       0,00 |       0,00 |       0,00 |
| Dec. IS                                             |     294,00 |   1 040,41 |   1 562,93 |
| Dec. divers                                         |       0,00 |       0,00 |       0,00 |
| \***\*= Total décaissements\*\***                   | 217 979,87 | 140 487,77 | 147 963,14 |
| Solde début d'exercice                              |       0,00 |  15 512,13 |  22 821,12 |
| Variation nette (enc − dec)                         |  15 512,13 |   7 308,99 |   4 267,52 |
| \***\*= Solde fin d'exercice (soldeFinal[11])\*\*** |  15 512,13 |  22 821,12 |  27 088,64 |

#### B — Trésorerie bilan (formule cumulative économique)

> Formule : apports + emprunts + CAF cumulatif − immos − BFR besoins + BFR dettes

| Désignation                                      | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------------------------ | --------: | --------: | --------: |
| Apports capital cumulatifs                       |  1 000,00 |  1 000,00 |  1 000,00 |
| Apports CC cumulatifs                            | 19 000,00 | 19 000,00 | 19 000,00 |
| Emprunts débloqués cumulatifs                    | 70 000,00 | 70 000,00 | 70 000,00 |
| + CAF cumulatif                                  |  5 699,01 | 16 297,19 | 29 210,19 |
| dont: CAF Y1                                     |  5 699,01 |  5 699,01 |  5 699,01 |
| dont: CAF Y2                                     |      0,00 | 10 598,17 | 10 598,17 |
| dont: CAF Y3                                     |      0,00 |      0,00 | 12 913,00 |
| + Enc. non-P&L cumulatifs (subv invest + divers) |      0,00 |      0,00 |      0,00 |
| − Dec. non-P&L cumulatifs (divers)               |      0,00 |      0,00 |      0,00 |
| − Immos acquises cumulatives (HT)                | 69 721,00 | 69 721,00 | 69 721,00 |
| − BFR besoins (stocks+crédit TVA+créances)       | 11 633,00 |  7 246,87 |  2 572,57 |
| dont: Stocks de matières                         |  1 487,62 |  1 532,25 |  1 578,22 |
| dont: Crédit de TVA                              | 10 145,38 |  5 714,62 |    994,35 |
| dont: Créances clients                           |      0,00 |      0,00 |      0,00 |
| − Remboursements capital cumulatifs              |  8 092,26 | 17 264,69 | 26 810,83 |
| \***\*= Trésorerie brute\*\***                   |  6 252,75 | 12 064,62 | 20 105,79 |
| + BFR dettes expl. (totalRessources)             |  9 259,38 | 10 756,50 |  6 982,85 |
| dont: Dettes fournisseurs                        |  1 514,18 |  1 493,79 |  1 538,60 |
| dont: Dettes charges ext.                        |  2 447,42 |  2 367,26 |  2 380,32 |
| dont: Dettes impôts/taxes                        |      0,00 |      0,00 |      0,00 |
| dont: Dettes personnel                           |  5 199,78 |  6 581,32 |  2 647,67 |
| dont: TVA à payer                                |      0,00 |      0,00 |      0,00 |
| dont: Dettes IS                                  |     98,00 |    314,14 |    416,26 |
| \***\*= Tréso corrigée\*\***                     | 15 512,13 | 22 821,12 | 27 088,64 |
| \***\*= Disponibilités (bilan)\*\***             | 15 512,13 | 22 821,12 | 27 088,64 |

#### C — Réconciliation

| Désignation                     | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------- | --------: | --------: | --------: | ------------- |
| Tableau mensuel soldeFinal[11]  | 15 512,13 | 22 821,12 | 27 088,64 |
| Bilan disponibilités            | 15 512,13 | 22 821,12 | 27 088,64 |
| \***\*Écart (Tab − Bilan)\*\*** |     -0,00 |     -0,00 |     -0,00 | _✅ Cohérent_ |

### Détail apports

| Type           |   Montant | Date apport |
| -------------- | --------: | ----------- |
| CAPITAL        |  1 000,00 | 01/05/2026  |
| COMPTE_COURANT | 10 000,00 | 01/05/2026  |
| COMPTE_COURANT |  9 000,00 | 01/05/2026  |

### Tableau de TVA

> **Régime TVA :** REEL_NORMAL | **Périodicité déclaration :** trimestriel

#### A — Synthèse annuelle

| Désignation                           |  2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------------- | ---------: | --------: | --------: |
| TVA collectée sur CA                  |  13 490,00 | 13 894,70 | 14 311,54 |
| **Total TVA collectée**               |  13 490,00 | 13 894,70 | 14 311,54 |
| ---                                   |       ---: |      ---: |      ---: |
| TVA déductible sur immos              |  13 944,20 |      0,00 |      0,00 |
| TVA déductible sur achats matières    |   2 304,41 |  2 281,37 |  2 349,81 |
| TVA déductible sur charges ext.       |   7 386,77 |  7 182,58 |  7 241,46 |
| **Total TVA déductible**              |  23 635,38 |  9 463,94 |  9 591,27 |
| ---                                   |       ---: |      ---: |      ---: |
| TVA nette annuelle (∑)                | -10 145,38 |  4 430,76 |  4 720,27 |
| Crédit TVA fin exercice (M12 reporté) |  10 145,38 |  5 714,62 |    994,35 |
| **TVA à payer annuelle (∑)**          |       0,00 |      0,00 |      0,00 |

#### B — Cohérence TVA tableau vs BFR

> Le BFR utilise la valeur de fin d'exercice (M12) : TVA à payer = dette passif ; crédit TVA = actif circulant.

| Désignation                     | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------- | --------: | --------: | --------: | ------------- |
| TVA à payer M12 (tableau TVA)   |      0,00 |      0,00 |      0,00 |
| TVA à payer BFR (bfr.tvaAPayer) |      0,00 |      0,00 |      0,00 |
| Écart TVA à payer               |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |
| Crédit TVA M12 (tableau TVA)    | 10 145,38 |  5 714,62 |    994,35 |
| Crédit TVA BFR (bfr.creditTVA)  | 10 145,38 |  5 714,62 |    994,35 |
| Écart crédit TVA                |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |

#### C — Cohérence TVA décaissée vs tableau de trésorerie

> `dec.decTVA` = TVA payée dans le tableau mensuel. Doit correspondre à `tvaAPayerMonthly` du moteur TVA.

| Désignation                              | 2026–2027 | 2027–2028 | 2028–2029 |
| ---------------------------------------- | --------: | --------: | --------: | ------------- |
| TVA à payer ∑ annuel (tableau TVA)       |      0,00 |      0,00 |      0,00 |
| dec.decTVA ∑ annuel (tableau trésorerie) |      0,00 |      0,00 |      0,00 |
| Écart                                    |      0,00 |      0,00 |      0,00 | _✅ Cohérent_ |

#### D — Détail mensuel

**2026–2027**

| Désignation                 |        M01 |      M02 |       M03 |       M04 |       M05 |       M06 |       M07 |       M08 |       M09 |       M10 |       M11 |       M12 |      Total |
| --------------------------- | ---------: | -------: | --------: | --------: | --------: | --------: | --------: | --------: | --------: | --------: | --------: | --------: | ---------: |
| TVA collectée CA            |   1 528,42 | 1 479,85 |  1 528,42 |  1 834,64 |  1 183,07 |    798,61 |    768,93 |    768,93 |    798,61 |    709,57 |  1 060,31 |  1 030,64 |  13 490,00 |
| TVA déductible immos        |  13 944,20 |        — |         — |         — |         — |         — |         — |         — |         — |         — |         — |         — |  13 944,20 |
| TVA déductible achats       |     258,33 |   250,36 |    258,33 |    308,55 |    201,69 |    138,65 |    133,78 |    133,78 |    138,65 |    124,04 |    181,56 |    176,70 |   2 304,41 |
| TVA déductible charges ext. |     646,10 |   642,43 |    646,10 |    669,23 |    620,01 |    590,97 |    588,73 |    588,73 |    590,97 |    584,25 |    610,74 |    608,50 |   7 386,77 |
| TVA nette                   | -13 320,21 |   587,06 |    623,99 |    856,86 |    361,37 |     68,99 |     46,42 |     46,42 |     68,99 |      1,28 |    268,01 |    245,44 | -10 145,38 |
| Crédit TVA reporté          |          — |        — | 12 109,16 | 12 109,16 | 12 109,16 | 10 821,94 | 10 821,94 | 10 821,94 | 10 660,11 | 10 660,11 | 10 660,11 | 10 145,38 | 110 919,02 |
| TVA à payer                 |          — |        — |         — |         — |         — |         — |         — |         — |         — |         — |         — |         — |          — |

**2027–2028**

| Désignation                 |       M01 |       M02 |      M03 |      M04 |      M05 |      M06 |      M07 |      M08 |      M09 |      M10 |      M11 |      M12 |     Total |
| --------------------------- | --------: | --------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | --------: |
| TVA collectée CA            |  1 574,27 |  1 524,25 | 1 574,27 | 1 889,68 | 1 218,57 |   822,57 |   792,00 |   792,00 |   822,57 |   730,86 | 1 092,12 | 1 061,56 | 13 894,70 |
| TVA déductible immos        |         — |         — |        — |        — |        — |        — |        — |        — |        — |        — |        — |        — |         — |
| TVA déductible achats       |    258,40 |    250,19 |   258,40 |   310,12 |   200,06 |   135,12 |   130,11 |   130,11 |   135,12 |   120,08 |   179,33 |   174,32 |  2 281,37 |
| TVA déductible charges ext. |    629,08 |    625,41 |   629,08 |   652,21 |   603,00 |   573,96 |   571,72 |   571,72 |   573,96 |   567,23 |   593,72 |   591,48 |  7 182,58 |
| TVA nette                   |    686,79 |    648,64 |   686,79 |   927,35 |   415,50 |   113,49 |    90,17 |    90,17 |   113,49 |    43,54 |   319,07 |   295,76 |  4 430,76 |
| Crédit TVA reporté          | 10 145,38 | 10 145,38 | 8 123,16 | 8 123,16 | 8 123,16 | 6 666,82 | 6 666,82 | 6 666,82 | 6 372,99 | 6 372,99 | 6 372,99 | 5 714,62 | 89 494,31 |
| TVA à payer                 |         — |         — |        — |        — |        — |        — |        — |        — |        — |        — |        — |        — |         — |

**2028–2029**

| Désignation                 |      M01 |      M02 |      M03 |      M04 |      M05 |      M06 |      M07 |      M08 |      M09 |      M10 |      M11 |      M12 |     Total |
| --------------------------- | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | -------: | --------: |
| TVA collectée CA            | 1 621,50 | 1 569,98 | 1 621,50 | 1 946,37 | 1 255,12 |   847,24 |   815,76 |   815,76 |   847,24 |   752,79 | 1 124,89 | 1 093,40 | 14 311,54 |
| TVA déductible immos        |        — |        — |        — |        — |        — |        — |        — |        — |        — |        — |        — |        — |         — |
| TVA déductible achats       |   266,15 |   257,70 |   266,15 |   319,42 |   206,07 |   139,18 |   134,01 |   134,01 |   139,18 |   123,69 |   184,71 |   179,55 |  2 349,81 |
| TVA déductible charges ext. |   633,99 |   630,32 |   633,99 |   657,12 |   607,90 |   578,86 |   576,62 |   576,62 |   578,86 |   572,14 |   598,63 |   596,39 |  7 241,46 |
| TVA nette                   |   721,36 |   681,96 |   721,36 |   969,83 |   441,15 |   129,20 |   105,12 |   105,12 |   129,20 |    56,96 |   341,55 |   317,47 |  4 720,27 |
| Crédit TVA reporté          | 5 714,62 | 5 714,62 | 3 589,95 | 3 589,95 | 3 589,95 | 2 049,77 | 2 049,77 | 2 049,77 | 1 710,32 | 1 710,32 | 1 710,32 |   994,35 | 34 473,72 |
| TVA à payer                 |        — |        — |        — |        — |        — |        — |        — |        — |        — |        — |        — |        — |         — |

### Vérification CAF (= Résultat net + Dotations − Reprises)

| Désignation                | 2026–2027 | 2027–2028 | 2028–2029 |
| -------------------------- | --------: | --------: | --------: | ------------- |
| Résultat net               |  2 221,31 |  7 120,47 |  9 435,30 |
| + Dotations amortissements |  3 477,70 |  3 477,70 |  3 477,70 |
| + Dotations provisions     |      0,00 |      0,00 |      0,00 |
| − Reprises sur provisions  |      0,00 |      0,00 |      0,00 |
| **= CAF recalculée**       |  5 699,01 | 10 598,17 | 12 913,00 |
| CAF officielle (fc.caf)    |  5 699,01 | 10 598,17 | 12 913,00 |
| Écart                      |     -0,00 |      0,00 |     -0,00 | _✅ Cohérent_ |

### SIG — Soldes Intermédiaires de Gestion

> Valeurs issues de **fc** — même moteur que l'application.

| Désignation                           |  2026–2027 |  2027–2028 |  2028–2029 |
| ------------------------------------- | ---------: | ---------: | ---------: | ------------------------------ |
| CA HT                                 | 130 002,00 | 133 902,06 | 137 919,12 |
| − Achats consommés                    |  35 702,94 |  36 774,03 |  37 877,25 |
| **= Marge brute**                     |  94 299,06 |  97 128,03 | 100 041,87 | _tx: 72,5 % / 72,5 % / 72,5 %_ |
| + Production immobilisée              |       0,00 |       0,00 |       0,00 |
| + Transferts de charges               |       0,00 |       0,00 |       0,00 |
| + Autres produits exploitation        |       0,00 |       0,00 |       0,00 |
| − Charges externes                    |  41 533,84 |  37 340,88 |  37 663,85 |
| **= Valeur Ajoutée (VA)**             |  52 765,22 |  59 787,15 |  62 378,02 | _tx: 40,6 % / 44,6 % / 45,2 %_ |
| + Subventions exploitation            |       0,00 |       0,00 |       0,00 |
| − Impôts et taxes                     |   1 623,00 |   1 978,00 |   1 978,00 |
| − Charges de personnel                |  41 252,00 |  43 183,21 |  43 499,17 |
| **= EBE**                             |   9 890,22 |  14 625,95 |  16 900,85 | _tx: 7,6 % / 10,9 % / 12,3 %_  |
| − Dotations amortissements            |   3 477,70 |   3 477,70 |   3 477,70 |
| − Dotations provisions                |       0,00 |       0,00 |       0,00 |
| + Reprises sur provisions             |       0,00 |       0,00 |       0,00 |
| ± Autres charges/produits gestion net |      -0,00 |      -0,00 |      -0,00 |
| **= Résultat d'exploitation (REX)**   |   6 412,52 |  11 148,25 |  13 423,15 | _tx: 4,9 % / 8,3 % / 9,7 %_    |
| + Produits financiers                 |       0,00 |       0,00 |       0,00 |
| − Charges financières                 |   3 799,21 |   2 771,22 |   2 322,80 |
| **= Résultat financier**              |  -3 799,21 |  -2 771,22 |  -2 322,80 |
| **= Résultat courant (RCB)**          |   2 613,31 |   8 377,03 |  11 100,35 |
| + Résultat exceptionnel               |       0,00 |       0,00 |       0,00 |
| +/− Ajustements nets                  |       0,00 |       0,00 |       0,00 |
| − IS                                  |     392,00 |   1 256,55 |   1 665,05 |
| **= Résultat net**                    |   2 221,31 |   7 120,47 |   9 435,30 | _tx: 1,7 % / 5,3 % / 6,8 %_    |
| **CAF**                               |   5 699,01 |  10 598,17 |  12 913,00 | _tx: 4,4 % / 7,9 % / 9,4 %_    |

### Détail activités (hypothèses saisies)

| Libellé       | Type              | Tx marge | TVA CA | TVA ach. | Stock j | Cli. j | Fourn. j |       CA N |     CA N+1 |     CA N+2 |
| ------------- | ----------------- | -------: | -----: | -------: | ------: | -----: | -------: | ---------: | ---------: | ---------: |
| Vente pizza   | PRODUCTION_VENDUE |     73 % |   10 % |    5.5 % |      15 |      0 |       15 | 122 472,00 | 126 146,16 | 129 930,54 |
| Vente alcool  | PRODUCTION_VENDUE |     65 % |   20 % |     20 % |      15 |      0 |       15 |   4 898,00 |   5 044,94 |   5 196,29 |
| Vente boisson | PRODUCTION_VENDUE |     65 % |   10 % |    5.5 % |      15 |      0 |       15 |   2 632,00 |   2 710,96 |   2 792,29 |

| Désignation                         |  2026–2027 |  2027–2028 |  2028–2029 |
| ----------------------------------- | ---------: | ---------: | ---------: |
| CA total activités actives (saisie) | 130 002,00 | 133 902,06 | 137 919,12 |
| CA total (fc.ca)                    | 130 002,00 | 133 902,06 | 137 919,12 |

### Détail personnel (hypothèses saisies vs fc)

#### Salariés

| Libellé                           |    Brut N | Côt. Pat. |    Coût N |  Brut N+1 |  Coût N+1 |  Brut N+2 |  Coût N+2 |
| --------------------------------- | --------: | --------: | --------: | --------: | --------: | --------: | --------: |
| Serveur saisonnier 39h (42 repas) | 12 391,00 |      25 % | 15 488,75 | 12 638,82 | 15 798,53 | 12 891,59 | 16 114,49 |

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
| Cotisations facultatives (Madelin)         |   700,00 |   700,00 |   700,00 |
| Cotisations facultatives (non Madelin)     |     0,00 |     0,00 |     0,00 |

#### Taxes sur salaires

> _(aucune)_

#### Récapitulatif fc.chargesPersonnel

| Désignation                   | 2026–2027 | 2027–2028 | 2028–2029 |
| ----------------------------- | --------: | --------: | --------: |
| Salaires bruts                | 12 391,00 | 12 638,82 | 12 891,59 |
| + Charges patronales          |  3 097,75 |  3 159,71 |  3 222,90 |
| + Rémunération dirigeant      | 18 000,00 | 18 000,00 | 18 000,00 |
| + Cotisations TNS total       |  7 763,25 |  9 384,68 |  9 384,68 |
| + Taxes salaires total        |      0,00 |      0,00 |      0,00 |
| **= Total charges personnel** | 41 252,00 | 43 183,21 | 43 499,17 |

### Plan de financement (= écran)

**BESOINS**

| Désignation                     |   Initial |  2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------------- | --------: | ---------: | --------: | --------: |
| + Immobilisations incorporelles | 35 833,00 |       0,00 |      0,00 |      0,00 |
| + Immobilisations corporelles   | 33 888,00 |       0,00 |      0,00 |      0,00 |
| = Total immobilisations         | 69 721,00 |       0,00 |      0,00 |      0,00 |
| + Variation du BFR              | 15 171,95 | -12 798,33 | -5 883,25 |   -900,66 |
| + Remboursement des emprunts    |      0,00 |   8 092,26 |  9 172,43 |  9 546,14 |
| **= Total des besoins**         | 84 892,95 |  -4 706,07 |  3 289,18 |  8 645,48 |

**RESSOURCES**

| Désignation                        |   Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| ---------------------------------- | --------: | --------: | --------: | --------: |
| + Apports en capital               |  1 000,00 |      0,00 |      0,00 |      0,00 |
| + Apports en comptes courants      | 19 000,00 |      0,00 |      0,00 |      0,00 |
| + Souscription d'emprunts          | 70 000,00 |      0,00 |      0,00 |      0,00 |
| + Subventions d'investissement     |      0,00 |      0,00 |      0,00 |      0,00 |
| + Capacité d'autofinancement (CAF) |      0,00 |  5 699,01 | 10 598,17 | 12 913,00 |
| **= Total des ressources**         | 90 000,00 |  5 699,01 | 10 598,17 | 12 913,00 |

**TRÉSORERIE**

| Désignation               |  Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| ------------------------- | -------: | --------: | --------: | --------: |
| = Variation de trésorerie | 5 107,05 | 10 405,08 |  7 308,99 |  4 267,52 |
| **= Solde de trésorerie** | 5 107,05 | 15 512,13 | 22 821,12 | 27 088,64 |

| **Écart (Ressources − Besoins)** | 5 107,05 | 10 405,08 | 7 308,99 | 4 267,52 | _❌ DÉSÉQUILIBRE_ |

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
| 7   | TVA décaissée = tableau TVA annuel       |      ✅      |               — |               — |               — |
| 8   | Trésorerie tableau mensuel = bilan       |      ✅      |               — |               — |               — |
| 9   | Capital emprunts bilan = échéancier      |      ✅      |               — |               — |               — |
| 10  | CA activités saisies = fc.ca             |      ✅      |               — |               — |               — |
| 11  | Plan financement solde tréso = bilan     |      ✅      |               — |               — |               — |

#### ✅ Aucune divergence détectée

Toutes les vérifications de cohérence passent. La modélisation est cohérente.

#### Points de vigilance

Aucun point de vigilance identifié.

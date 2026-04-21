# Diagnostic Compte de Résultat — Dossier `cmmjoradm0001kohp15on2xe1`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`buildCompteResultatRows` · `buildDrilldownRows` · `buildFinCalc`

Exercices : **2026–2027** · **2027–2028** · **2028–2029**
Régime fiscal : **IS** (IS = oui)


## Données saisies

> Snapshot de toutes les hypothèses saisies — données brutes stockées en base. `✅` = actif · `❌` = inactif

### Paramètres généraux

| Paramètre | Valeur |
| --- | --- |
| Date de démarrage | 01/05/2026 |
| Durée projection | 3 exercices |
| Régime fiscal | `IS` |
| Taux IS normal | 25 % |
| Taux IS réduit | 15 % · Plafond : 42 500,00 € |
| Régime TVA | `REEL_NORMAL` |
| Mois paiement salaires | 1 |
| Régime social TNS | `commerce` |
| Mode calcul TNS | `DEFINITIF` |

### Activités

| ✓ | Libellé | Type | TVA CA % | Tx marge % | N | N+1 | N+2 |
| :---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| ✅ | Vente pizza | PRODUCTION_VENDUE | 10 % | 73 % | 94 800,00 | 99 540,00 | 104 517,00 |
| ✅ | Vente boisson | PRODUCTION_VENDUE | 10 % | 65 % | 6 000,00 | 6 300,00 | 6 615,00 |
| ✅ | Vente alcool | PRODUCTION_VENDUE | 20 % | 65 % | 4 197,00 | 4 406,85 | 4 627,19 |
| ✅ | Vente pizza (copie) | PRODUCTION_VENDUE | 10 % | 73 % | 90 850,00 | 95 392,50 | 100 162,13 |
| ✅ | Vente pizza (copie) (copie) | PRODUCTION_VENDUE | 10 % | 73 % | 98 750,00 | 103 687,50 | 108 871,88 |

#### Saisonnalité CA (activités non-uniformes)

**Vente pizza**

| Exercice | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc | Jan | Fév | Mar | Avr | **Total** |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2026–2027 € | 10 740,84 | 10 399,56 | 10 740,84 | 12 892,80 | 8 313,96 | 5 612,16 | 5 403,60 | 5 403,60 | 5 612,16 | 4 986,48 | 7 451,28 | 7 242,72 | **94 800,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2027–2028 € | 11 277,88 | 10 919,54 | 11 277,88 | 13 537,44 | 8 729,66 | 5 892,77 | 5 673,78 | 5 673,78 | 5 892,77 | 5 235,80 | 7 823,84 | 7 604,86 | **99 540,00** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2028–2029 € | 11 841,78 | 11 465,51 | 11 841,78 | 14 214,31 | 9 166,14 | 6 187,41 | 5 957,47 | 5 957,47 | 6 187,41 | 5 497,59 | 8 215,04 | 7 985,10 | **104 517,00** |

**Vente boisson**

| Exercice | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc | Jan | Fév | Mar | Avr | **Total** |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2026–2027 € | 679,80 | 658,20 | 679,80 | 816,00 | 526,20 | 355,20 | 342,00 | 342,00 | 355,20 | 315,60 | 471,60 | 458,40 | **6 000,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2027–2028 € | 713,79 | 691,11 | 713,79 | 856,80 | 552,51 | 372,96 | 359,10 | 359,10 | 372,96 | 331,38 | 495,18 | 481,32 | **6 300,00** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2028–2029 € | 749,48 | 725,67 | 749,48 | 899,64 | 580,14 | 391,61 | 377,06 | 377,06 | 391,61 | 347,95 | 519,94 | 505,39 | **6 615,00** |

**Vente alcool**

| Exercice | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc | Jan | Fév | Mar | Avr | **Total** |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2026–2027 € | 475,52 | 460,41 | 475,52 | 570,79 | 368,08 | 248,46 | 239,23 | 239,23 | 248,46 | 220,76 | 329,88 | 320,65 | **4 197,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2027–2028 € | 499,30 | 483,43 | 499,30 | 599,33 | 386,48 | 260,89 | 251,19 | 251,19 | 260,89 | 231,80 | 346,38 | 336,68 | **4 406,85** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2028–2029 € | 524,26 | 507,60 | 524,26 | 629,30 | 405,80 | 273,93 | 263,75 | 263,75 | 273,93 | 243,39 | 363,70 | 353,52 | **4 627,19** |

**Vente pizza (copie)**

| Exercice | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc | Jan | Fév | Mar | Avr | **Total** |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2026–2027 € | 10 293,31 | 9 966,25 | 10 293,31 | 12 355,60 | 7 967,55 | 5 378,32 | 5 178,45 | 5 178,45 | 5 378,32 | 4 778,71 | 7 140,81 | 6 940,94 | **90 850,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2027–2028 € | 10 807,97 | 10 464,56 | 10 807,97 | 12 973,38 | 8 365,92 | 5 647,24 | 5 437,37 | 5 437,37 | 5 647,24 | 5 017,65 | 7 497,85 | 7 287,99 | **95 392,50** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2028–2029 € | 11 348,37 | 10 987,79 | 11 348,37 | 13 622,05 | 8 784,22 | 5 929,60 | 5 709,24 | 5 709,24 | 5 929,60 | 5 268,53 | 7 872,74 | 7 652,39 | **100 162,13** |

**Vente pizza (copie) (copie)**

| Exercice | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc | Jan | Fév | Mar | Avr | **Total** |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2026–2027 € | 11 188,38 | 10 832,88 | 11 188,38 | 13 430,00 | 8 660,38 | 5 846,00 | 5 628,75 | 5 628,75 | 5 846,00 | 5 194,25 | 7 761,75 | 7 544,50 | **98 750,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2027–2028 € | 11 747,79 | 11 374,52 | 11 747,79 | 14 101,50 | 9 093,39 | 6 138,30 | 5 910,19 | 5 910,19 | 6 138,30 | 5 453,96 | 8 149,84 | 7 921,73 | **103 687,50** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2028–2029 € | 12 335,18 | 11 943,25 | 12 335,18 | 14 806,58 | 9 548,06 | 6 445,22 | 6 205,70 | 6 205,70 | 6 445,22 | 5 726,66 | 8 557,33 | 8 317,81 | **108 871,88** |


### Charges d'exploitation

| ✓ | Libellé | Catégorie | Fréq. | TVA % | N | N+1 | N+2 |
| :---: | --- | --- | --- | ---: | ---: | ---: | ---: |
| ✅ | Embalages | FOURNITURE_CONSOMMABLE | PERSONNALISEE | 20 % | 1 244,25 | 1 306,46 | 1 371,79 |
| ✅ | Electricité | FOURNITURE_CONSOMMABLE | MENSUELLE | 20 % | 4 500,00 | 4 590,00 | 4 681,80 |
| ✅ | Eau | FOURNITURE_CONSOMMABLE | MENSUELLE | 20 % | 250,00 | 255,00 | 260,10 |
| ✅ | Petit équimement | FOURNITURE_CONSOMMABLE | MENSUELLE | 20 % | 450,00 | 459,00 | 468,18 |
| ✅ | Produits d'entretiens | FOURNITURE_CONSOMMABLE | MENSUELLE | 20 % | 600,00 | 612,00 | 624,24 |
| ✅ | Fournitures administratives | FOURNITURE_CONSOMMABLE | MENSUELLE | 20 % | 450,00 | 459,00 | 468,18 |
| ✅ | Vetements de travail | SERVICE_EXTERIEUR | MENSUELLE | 20 % | 100,00 | 100,00 | 100,00 |
| ✅ | Commission CB | SERVICE_EXTERIEUR | MENSUELLE | 0 % | 658,00 | 677,74 | 698,07 |
| ✅ | offerts | SERVICE_EXTERIEUR | PERSONNALISEE | 20 % | 2 468,75 | 2 592,19 | 2 721,80 |
| ✅ | Location immobilière | SERVICE_EXTERIEUR | MENSUELLE | 20 % | 15 126,00 | 15 126,00 | 15 126,00 |
| ✅ | Location TPE + pp | SERVICE_EXTERIEUR | MENSUELLE | 20 % | 231,00 | 235,62 | 240,33 |
| ✅ | Frais de télécommunication | SERVICE_EXTERIEUR | MENSUELLE | 20 % | 480,00 | 600,00 | 600,00 |
| ✅ | Primes d'assurances | SERVICE_EXTERIEUR | MENSUELLE | 0 % | 1 400,00 | 1 428,00 | 1 456,56 |
| ✅ | Entretiens et réparations | SERVICE_EXTERIEUR | MENSUELLE | 20 % | 1 600,00 | 1 632,00 | 1 664,64 |
| ✅ | Honoraires comptable et juridiques | SERVICE_EXTERIEUR | MENSUELLE | 20 % | 2 800,00 | 2 856,00 | 2 913,12 |
| ✅ | Honoraires juridiques | SERVICE_EXTERIEUR | MENSUELLE | 20 % | 600,00 | 630,00 | 661,50 |
| ✅ | Publicité, publications | SERVICE_EXTERIEUR | MENSUELLE | 20 % | 1 000,00 | 500,00 | 500,00 |
| ✅ | Frais divers | SERVICE_EXTERIEUR | MENSUELLE | 20 % | 500,00 | 510,00 | 520,20 |
| ✅ | Déplacements | SERVICE_EXTERIEUR | MENSUELLE | 20 % | 200,00 | 200,00 | 200,00 |
| ✅ | Abonnement logiciel de caisse (airkitchen) | SERVICE_EXTERIEUR | MENSUELLE | 20 % | 810,00 | 810,00 | 810,00 |
| ✅ | Services bancaires | SERVICE_EXTERIEUR | MENSUELLE | 20 % | 584,00 | 595,68 | 607,59 |
| ✅ | Frais titre restaurant | SERVICE_EXTERIEUR | PERSONNALISEE | 20 % | 395,00 | 414,75 | 435,49 |

### Impôts et taxes

| ✓ | Libellé | Date N | N | Date N+1 | N+1 | Date N+2 | N+2 |
| :---: | --- | --- | ---: | --- | ---: | --- | ---: |
| ✅ | CFE | 2026-11-01 | 1 128,00 | 2027-11-01 | 1 128,00 | 2028-11-01 | 1 128,00 |
| ✅ | Taxe foncière | 2026-10-01 | 495,00 | 2027-10-01 | 850,00 | 2028-10-01 | 850,00 |

### Personnel — Salariés

| ✓ | Libellé | Brut N | Cot. sal. % | Cot. pat. % | Coût N | Brut N+1 | Coût N+1 | Brut N+2 | Coût N+2 |
| :---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ❌ | Serveur saisonnier 39h (42 repas) | 12 391,00 | 22 % | 42 % | 17 595,22 | 12 638,82 | 17 947,12 | 12 891,59 | 18 306,06 |
| ❌ | Serveur 39h (42 repas) CDI | 19 200,00 | 0 % | 67 % | 32 064,00 | 19 584,00 | 32 705,28 | 19 975,68 | 33 359,39 |

### Personnel — Dirigeants

| ✓ | Libellé | N | N+1 | N+2 |
| :---: | --- | ---: | ---: | ---: |
| ✅ | Rémunération gérant | 18 000,00 | 18 000,00 | 18 000,00 |

### Personnel — Cotisations TNS

| ✓ | Libellé | N | N+1 | N+2 |
| :---: | --- | ---: | ---: | ---: |
| ✅ | Allocations familiales | 0,00 | 0,00 | 0,00 |
| ✅ | Maladie-maternité | 193,95 | 323,04 | 323,04 |
| ✅ | Indemnités journalières (IJ) | 96,12 | 98,73 | 98,73 |
| ✅ | Retraite (base + compl) + invalidité-décès | 4 168,86 | 5 384,92 | 5 384,92 |
| ✅ | CSG/CRDS | 1 861,63 | 2 053,48 | 2 053,48 |
| ✅ | CFP (forfait PASS) | 742,69 | 824,51 | 824,51 |
| ✅ | Cotisations facultatives (Madelin) | 0,00 | 0,00 | 0,00 |
| ✅ | Cotisations facultatives (non Madelin) | 0,00 | 0,00 | 0,00 |

### Immobilisations

| ✓ | Libellé | Nature | Mode amort. | Date acq. | Montant HT | Durée |
| :---: | --- | --- | --- | --- | ---: | ---: |
| ✅ | Frais d'agence | INCORPOREL | AUCUN | 01/05/2026 | 5 833,00 | 0 ans |
| ✅ | Fond de commerce (materiel) | CORPOREL | LINEAIRE | 01/05/2026 | 31 060,00 | 10 ans |
| ✅ | Débours (provision pour frais de greffe et journal) | INCORPOREL | AUCUN | 01/05/2026 | 500,00 | 0 ans |
| ✅ | Honoraires notaire (vente) | INCORPOREL | AUCUN | 01/05/2026 | 1 200,00 | 0 ans |
| ✅ | Honoraires notaire (constitution société) | INCORPOREL | AUCUN | 01/05/2026 | 700,00 | 0 ans |
| ✅ | Provision pour frais de greffe et journal (constitution société) | INCORPOREL | AUCUN | 01/05/2026 | 500,00 | 0 ans |
| ✅ | Enseigne et communication | CORPOREL | LINEAIRE | 01/05/2026 | 1 000,00 | 10 ans |
| ✅ | Droit d'enregistrement | INCORPOREL | AUCUN | 01/05/2026 | 1 110,00 | 0 ans |
| ✅ | Fond de commerce | INCORPOREL | AUCUN | 01/05/2026 | 28 940,00 | 0 ans |
| ✅ | Caisse enregistreuse (airkitchen) | CORPOREL | LINEAIRE | 01/05/2026 | 889,00 | 10 ans |
| ❌ | Formation HACCP | INCORPOREL | AUCUN | 01/05/2026 | 759,00 | 0 ans |
| ✅ | Meuble pizza | CORPOREL | LINEAIRE | 01/05/2026 | 1 222,99 | 10 ans |
| ❌ | Frais de garantie "France active" | INCORPOREL | AUCUN | 01/05/2026 | 950,00 | 0 ans |
| ✅ | Frais de garantie "BPI" | FINANCIER | AUCUN | 01/05/2026 | 3 200,00 | 0 ans |

### Emprunts

| Libellé | Montant | Taux % | Assur. % | Durée | Déblocage | Différé |
| --- | ---: | ---: | ---: | ---: | --- | :--- |
| CIC | 70 000,00 | 4 % | 0.3 % | 84 mois | 01/05/2026 | — |


## Données calculées

> Résultats générés par le moteur de calcul à partir des hypothèses ci-dessus.


### Compte de résultat — Synthèse (= écran)

| Désignation | 2026–2027 € | 2026–2027 % CA | 2027–2028 € | 2027–2028 % CA | 2028–2029 € | 2028–2029 % CA |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **PRODUITS D'EXPLOITATION** | | | | | | |
| **Chiffre d'affaires** | 104 997,00 | 100.0 % | 110 246,85 | 100.0 % | 115 759,19 | 100.0 % |
| ****= Total produits exploitation**** | 104 997,00 | 100.0 % | 110 246,85 | 100.0 % | 115 759,19 | 100.0 % |

| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **CHARGES D'EXPLOITATION** | | | | | | |
| Achats effectués | 30 463,66 | 29.0 % | 30 600,46 | 27.8 % | 32 218,15 | 27.8 % |
| Variation de stocks | -1 298,71 | -1.2 % | 22,74 | 0.0 % | -63,80 | -0.1 % |
|   dont Achats consommés | 29 164,95 | 27.8 % | 30 623,20 | 27.8 % | 32 154,36 | 27.8 % |
| Fournitures consommables | 7 494,25 | 7.1 % | 7 681,46 | 7.0 % | 7 874,29 | 6.8 % |
| Services extérieurs | 28 952,75 | 27.6 % | 28 907,98 | 26.2 % | 29 255,30 | 25.3 % |
| ****= Charges externes (Total)**** | 65 611,95 | 62.5 % | 67 212,64 | 61.0 % | 69 283,95 | 59.9 % |
| Impôts et taxes | 1 623,00 | 1.5 % | 1 978,00 | 1.8 % | 1 978,00 | 1.7 % |
| Salaires bruts (salariés) | 0,00 | 0.0 % | 0,00 | 0.0 % | 0,00 | 0.0 % |
| Charges sociales (salariés) | 0,00 | 0.0 % | 0,00 | 0.0 % | 0,00 | 0.0 % |
| Rémunération dirigeant | 18 000,00 | 17.1 % | 18 000,00 | 16.3 % | 18 000,00 | 15.5 % |
| Cotisations TNS | 7 063,25 | 6.7 % | 8 684,68 | 7.9 % | 8 684,68 | 7.5 % |
| ****= Charges personnel (Total)**** | 25 063,25 | 23.9 % | 26 684,68 | 24.2 % | 26 684,68 | 23.1 % |
| Dotations aux amortissements | 3 417,20 | 3.3 % | 3 417,20 | 3.1 % | 3 417,20 | 3.0 % |
| ****= Total charges exploitation**** | 95 715,40 | 91.2 % | 99 292,52 | 90.1 % | 101 363,83 | 87.6 % |

| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ****= Résultat d'exploitation**** | 9 281,60 | 8.8 % | 10 954,33 | 9.9 % | 14 395,36 | 12.4 % |

| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **RÉSULTAT FINANCIER** | | | | | | |
| Charges financières (Total) | 2 865,96 | 2.7 % | 2 482,56 | 2.3 % | 2 080,82 | 1.8 % |
|   dont Intérêts emprunts | 2 865,96 | 2.7 % | 2 482,56 | 2.3 % | 2 080,82 | 1.8 % |
| ****= Résultat financier**** | -2 865,96 | -2.7 % | -2 482,56 | -2.3 % | -2 080,82 | -1.8 % |
| ****= Résultat courant**** | 6 415,64 | 6.1 % | 8 471,77 | 7.7 % | 12 314,54 | 10.6 % |

| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| — IS | 962,35 | 0.9 % | 1 270,77 | 1.2 % | 1 847,18 | 1.6 % |
| ****= Résultat net**** | 5 453,29 | 5.2 % | 7 201,01 | 6.5 % | 10 467,36 | 9.0 % |


### Vérifications de cohérence

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Total produits expl. (fc) | 104 997,00 | 110 246,85 | 115 759,19 |
| Total charges expl. (recalc) | 95 715,40 | 99 292,52 | 101 363,83 |
| ResExpl (fc) | 9 281,60 | 10 954,33 | 14 395,36 |
| ResExpl recalculé (Prod − Charges) | 9 281,60 | 10 954,33 | 14 395,36 |
| ****Écart ResExpl**** | 0,00 | -0,00 | -0,00 | *✅ Cohérent*

| ProduitsFinanciers (fc) | 0,00 | 0,00 | 0,00 |
| ChargesFinancières (Intérêts+Frais+Autres) | 2 865,96 | 2 482,56 | 2 080,82 |
| ResFin (fc) | -2 865,96 | -2 482,56 | -2 080,82 |
| ResFin recalculé (ProdFin − ChargesFin) | -2 865,96 | -2 482,56 | -2 080,82 |
| ****Écart ResFin**** | 0,00 | 0,00 | 0,00 | *✅ Cohérent*

| ResExpl (fc) | 9 281,60 | 10 954,33 | 14 395,36 |
| ResFin (fc) | -2 865,96 | -2 482,56 | -2 080,82 |
| ResCourant (fc) | 6 415,64 | 8 471,77 | 12 314,54 |
| ResCourant recalculé (ResExpl + ResFin) | 6 415,64 | 8 471,77 | 12 314,54 |
| ****Écart ResCourant**** | 0,00 | 0,00 | -0,00 | *✅ Cohérent*

| ResCourant (fc) | 6 415,64 | 8 471,77 | 12 314,54 |
| ResExcep (fc) | 0,00 | 0,00 | 0,00 |
| IS (fc) | 962,35 | 1 270,77 | 1 847,18 |
| ResNet (fc) | 5 453,29 | 7 201,01 | 10 467,36 |
| ResNet recalculé | 5 453,29 | 7 201,01 | 10 467,36 |
| ****Écart ResNet**** | 0,00 | 0,00 | 0,00 | *✅ Cohérent*


### Détail Produits d'exploitation

#### CA par activité

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Vente pizza | 94 800,00 | 99 540,00 | 104 517,00 |
| Vente boisson | 6 000,00 | 6 300,00 | 6 615,00 |
| Vente alcool | 4 197,00 | 4 406,85 | 4 627,19 |
| Vente pizza (copie) | 90 850,00 | 95 392,50 | 100 162,13 |
| Vente pizza (copie) (copie) | 98 750,00 | 103 687,50 | 108 871,88 |
| ****= Total CA**** | 294 597,00 | 309 326,85 | 324 793,20 |
| fc.ca | 104 997,00 | 110 246,85 | 115 759,19 | *❌ ÉCART*


### Détail Achats et Charges d'exploitation

#### Achats effectués par activité

> Achats effectués = Achats consommés + Variation de stocks + Achats ponctuels

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Achats – Vente pizza | 26 704,17 | 26 887,46 | 28 275,58 |
| Achats – Vente boisson | 2 208,37 | 2 188,50 | 2 319,84 |
| Achats – Vente alcool | 1 551,12 | 1 524,49 | 1 622,73 |
| Achats – Vente pizza (copie) | 25 593,23 | 25 765,41 | 27 097,43 |
| Achats – Vente pizza (copie) (copie) | 27 815,10 | 28 009,51 | 29 453,73 |
| ****Σ achats lignes drill-down**** | 83 871,99 | 84 375,37 | 88 769,32 |
| fc.achatsEffectues | 30 463,66 | 30 600,46 | 32 218,15 | *❌ ÉCART*
| fc.achatsConsommes (HT) | 29 164,95 | 30 623,20 | 32 154,36 |
| fc.varStock (nette) | 1 298,71 | -22,74 | 63,80 |
| fc.achatsEffectues (= consommés + ΔStock) | 30 463,66 | 30 600,46 | 32 218,15 |

#### Fournitures consommables

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Embalages | 1 244,25 | 1 306,46 | 1 371,79 |
| Electricité | 4 500,00 | 4 590,00 | 4 681,80 |
| Eau | 250,00 | 255,00 | 260,10 |
| Petit équimement | 450,00 | 459,00 | 468,18 |
| Produits d'entretiens | 600,00 | 612,00 | 624,24 |
| Fournitures administratives | 450,00 | 459,00 | 468,18 |
| ****Σ fournitures**** | 7 494,25 | 7 681,46 | 7 874,29 |
| fc.fournitures | 7 494,25 | 7 681,46 | 7 874,29 | *✅*

#### Services extérieurs

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Vetements de travail | 100,00 | 100,00 | 100,00 |
| Commission CB | 658,00 | 677,74 | 698,07 |
| offerts | 2 468,75 | 2 592,19 | 2 721,80 |
| Location immobilière | 15 126,00 | 15 126,00 | 15 126,00 |
| Location TPE + pp | 231,00 | 235,62 | 240,33 |
| Frais de télécommunication | 480,00 | 600,00 | 600,00 |
| Primes d'assurances | 1 400,00 | 1 428,00 | 1 456,56 |
| Entretiens et réparations | 1 600,00 | 1 632,00 | 1 664,64 |
| Honoraires comptable et juridiques | 2 800,00 | 2 856,00 | 2 913,12 |
| Honoraires juridiques | 600,00 | 630,00 | 661,50 |
| Publicité, publications | 1 000,00 | 500,00 | 500,00 |
| Frais divers | 500,00 | 510,00 | 520,20 |
| Déplacements | 200,00 | 200,00 | 200,00 |
| Abonnement logiciel de caisse (airkitchen) | 810,00 | 810,00 | 810,00 |
| Services bancaires | 584,00 | 595,68 | 607,59 |
| Frais titre restaurant | 395,00 | 414,75 | 435,49 |
| ****Σ services**** | 28 952,75 | 28 907,98 | 29 255,30 |
| fc.services | 28 952,75 | 28 907,98 | 29 255,30 | *✅*

#### Impôts et taxes

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| CFE | 1 128,00 | 1 128,00 | 1 128,00 |
| Taxe foncière | 495,00 | 850,00 | 850,00 |
| ****Σ impôts et taxes**** | 1 623,00 | 1 978,00 | 1 978,00 |
| fc.impotsTaxes | 1 623,00 | 1 978,00 | 1 978,00 | *✅*


### Détail Charges de personnel

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Salaires bruts (Σ salariés) | 0,00 | 0,00 | 0,00 |
| fc.salairesBruts | 0,00 | 0,00 | 0,00 | *✅*
| Charges patronales recalc (Σ brut × taux) | 0,00 | 0,00 | 0,00 |
| fc.chargesPatronales | 0,00 | 0,00 | 0,00 | *✅*
| Rémunérations dirigeants (Σ) | 18 000,00 | 18 000,00 | 18 000,00 |
| fc.remuDirigeant | 18 000,00 | 18 000,00 | 18 000,00 | *✅*
| Cotisations TNS (Σ) | 7 063,25 | 8 684,68 | 8 684,68 |
| fc.cotisationsTNSTotal | 7 063,25 | 8 684,68 | 8 684,68 | *✅*
| ****= fc.chargesPersonnel.total**** | 25 063,25 | 26 684,68 | 26 684,68 |
| Personnel recalculé (Σ composantes) | 25 063,25 | 26 684,68 | 26 684,68 |
| ****Écart personnel**** | 0,00 | 0,00 | 0,00 | *✅ Cohérent*


### Détail dotations aux amortissements

> Méthode : `distribuerAmortParExercice` — respecte AUCUN / LINEAIRE / DEGRESSIF.

| Libellé | Nature | Mode | Durée | Montant HT | Dot 2026–2027 | Dot 2027–2028 | Dot 2028–2029 |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| Frais d'agence | INCORPOREL | AUCUN | 0 ans | 5 833,00 | 0,00 | 0,00 | 0,00 |
| Fond de commerce (materiel) | CORPOREL | LINEAIRE | 10 ans | 31 060,00 | 3 106,00 | 3 106,00 | 3 106,00 |
| Débours (provision pour frais de greffe et journal) | INCORPOREL | AUCUN | 0 ans | 500,00 | 0,00 | 0,00 | 0,00 |
| Honoraires notaire (vente) | INCORPOREL | AUCUN | 0 ans | 1 200,00 | 0,00 | 0,00 | 0,00 |
| Honoraires notaire (constitution société) | INCORPOREL | AUCUN | 0 ans | 700,00 | 0,00 | 0,00 | 0,00 |
| Provision pour frais de greffe et journal (constitution société) | INCORPOREL | AUCUN | 0 ans | 500,00 | 0,00 | 0,00 | 0,00 |
| Enseigne et communication | CORPOREL | LINEAIRE | 10 ans | 1 000,00 | 100,00 | 100,00 | 100,00 |
| Droit d'enregistrement | INCORPOREL | AUCUN | 0 ans | 1 110,00 | 0,00 | 0,00 | 0,00 |
| Fond de commerce | INCORPOREL | AUCUN | 0 ans | 28 940,00 | 0,00 | 0,00 | 0,00 |
| Caisse enregistreuse (airkitchen) | CORPOREL | LINEAIRE | 10 ans | 889,00 | 88,90 | 88,90 | 88,90 |
| Meuble pizza | CORPOREL | LINEAIRE | 10 ans | 1 222,99 | 122,30 | 122,30 | 122,30 |
| Frais de garantie "BPI" | FINANCIER | AUCUN | 0 ans | 3 200,00 | 0,00 | 0,00 | 0,00 |

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Σ distribuerAmort (recalc) | 3 417,20 | 3 417,20 | 3 417,20 |
| fc.dotationsAmort | 3 417,20 | 3 417,20 | 3 417,20 | *✅ Cohérent*
|   dont Corporel | 3 417,20 | 3 417,20 | 3 417,20 |


### Détail charges financières (par emprunt)

> Intérêts + assurances affectés par exercice via l'échéancier.

#### Intérêts et assurances

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| CIC | 2 865,96 | 2 482,56 | 2 080,82 |
| ****Σ intérêts emprunts**** | 2 865,96 | 2 482,56 | 2 080,82 |
| fc.interetsEmprunts | 2 865,96 | 2 482,56 | 2 080,82 | *✅*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| ****= Charges financières (Total)**** | 2 865,96 | 2 482,56 | 2 080,82 |
| fc.interetsEmprunts | 2 865,96 | 2 482,56 | 2 080,82 |
| fc.fraisDossierEmprunts | 0,00 | 0,00 | 0,00 |
| fc.autresChargesFinancieres | 0,00 | 0,00 | 0,00 |


### IS — Détail du calcul

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Résultat courant | 6 415,64 | 8 471,77 | 12 314,54 |
| Résultat exceptionnel | 0,00 | 0,00 | 0,00 |
| ****Base imposable avant IS**** | 6 415,64 | 8 471,77 | 12 314,54 |
| IS calculé (fc.isParAnnee) | 962,35 | 1 270,77 | 1 847,18 |
| ****Résultat net**** | 5 453,29 | 7 201,01 | 10 467,36 |
| Base − IS (= ResNet attendu) | 5 453,29 | 7 201,01 | 10 467,36 |
| ****Écart (fc.resNet vs base−IS)**** | 0,00 | 0,00 | 0,00 | *✅ Cohérent*


### Capacité d'autofinancement (CAF)

> CAF = Résultat net + Dotations amort + Dotations provisions − Reprises − PlusValues immo

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Résultat net (fc) | 5 453,29 | 7 201,01 | 10 467,36 |
| + Dotations amortissements | 3 417,20 | 3 417,20 | 3 417,20 |
| ****= CAF (fc)**** | 8 870,49 | 10 618,21 | 13 884,56 |
| CAF recalculée (ResNet+AmortDot+ProvDot−Reprises) | 8 870,49 | 10 618,21 | 13 884,56 |
| ****Écart CAF**** | 0,00 | -0,00 | 0,00 | *✅ Cohérent*


### Récapitulatif des vérifications

| Test | 2026–2027 | 2027–2028 | 2028–2029 | Statut |
| --- | ---: | ---: | ---: | :---: |
| CA Σ activités vs fc.ca | 189 600,00 | 199 080,00 | 209 034,01 | ❌ |
| Achats Σ lignes vs fc.achatsEffectues | 53 408,33 | 53 774,92 | 56 551,17 | ❌ |
| Personnel Σ composantes vs fc.total | 0,00 | 0,00 | 0,00 | ✅ |
| Dotations amort Σ immos vs fc.dotationsAmort | 0,00 | 0,00 | 0,00 | ✅ |
| ResExpl (fc vs recalc) | 0,00 | -0,00 | -0,00 | ✅ |
| ResFin (fc vs recalc) | 0,00 | 0,00 | 0,00 | ✅ |
| ResCourant (fc vs recalc) | 0,00 | 0,00 | -0,00 | ✅ |
| ResNet (fc vs recalc) | 0,00 | 0,00 | 0,00 | ✅ |
| CAF (fc vs recalc) | 0,00 | -0,00 | 0,00 | ✅ |

> ❌ **Des divergences ont été détectées.** Vérifier les lignes marquées ❌ ci-dessus.

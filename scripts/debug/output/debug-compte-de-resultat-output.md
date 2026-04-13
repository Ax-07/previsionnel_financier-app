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
| ✅ | Vente pizza | PRODUCTION_VENDUE | 10 % | 73 % | 98 750,00 | 103 687,50 | 108 871,88 |
| ✅ | Vente boisson | PRODUCTION_VENDUE | 10 % | 65 % | 8 000,00 | 8 400,00 | 8 820,00 |
| ✅ | Vente alcool | PRODUCTION_VENDUE | 20 % | 65 % | 4 197,00 | 4 406,85 | 4 627,19 |

#### Saisonnalité CA (activités non-uniformes)

**Vente pizza**

| Exercice | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc | Jan | Fév | Mar | Avr | **Total** |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2026–2027 € | 11 188,38 | 10 832,88 | 11 188,38 | 13 430,00 | 8 660,38 | 5 846,00 | 5 628,75 | 5 628,75 | 5 846,00 | 5 194,25 | 7 761,75 | 7 544,50 | **98 750,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2027–2028 € | 11 747,79 | 11 374,52 | 11 747,79 | 14 101,50 | 9 093,39 | 6 138,30 | 5 910,19 | 5 910,19 | 6 138,30 | 5 453,96 | 8 149,84 | 7 921,73 | **103 687,50** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2028–2029 € | 12 335,18 | 11 943,25 | 12 335,18 | 14 806,58 | 9 548,06 | 6 445,22 | 6 205,70 | 6 205,70 | 6 445,22 | 5 726,66 | 8 557,33 | 8 317,81 | **108 871,88** |

**Vente boisson**

| Exercice | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc | Jan | Fév | Mar | Avr | **Total** |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2026–2027 € | 906,40 | 877,60 | 906,40 | 1 088,00 | 701,60 | 473,60 | 456,00 | 456,00 | 473,60 | 420,80 | 628,80 | 611,20 | **8 000,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2027–2028 € | 951,72 | 921,48 | 951,72 | 1 142,40 | 736,68 | 497,28 | 478,80 | 478,80 | 497,28 | 441,84 | 660,24 | 641,76 | **8 400,00** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2028–2029 € | 999,31 | 967,55 | 999,31 | 1 199,52 | 773,51 | 522,14 | 502,74 | 502,74 | 522,14 | 463,93 | 693,25 | 673,85 | **8 820,00** |

**Vente alcool**

| Exercice | Mai | Jun | Jul | Aoû | Sep | Oct | Nov | Déc | Jan | Fév | Mar | Avr | **Total** |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026–2027 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2026–2027 € | 475,52 | 460,41 | 475,52 | 570,79 | 368,08 | 248,46 | 239,23 | 239,23 | 248,46 | 220,76 | 329,88 | 320,65 | **4 197,00** |
| 2027–2028 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2027–2028 € | 499,30 | 483,43 | 499,30 | 599,33 | 386,48 | 260,89 | 251,19 | 251,19 | 260,89 | 231,80 | 346,38 | 336,68 | **4 406,85** |
| 2028–2029 % | 11.3 % | 11.0 % | 11.3 % | 13.6 % | 8.8 % | 5.9 % | 5.7 % | 5.7 % | 5.9 % | 5.3 % | 7.9 % | 7.6 % | **100.0 %** |
| 2028–2029 € | 524,26 | 507,60 | 524,26 | 629,30 | 405,80 | 273,93 | 263,75 | 263,75 | 273,93 | 243,39 | 363,70 | 353,52 | **4 627,19** |


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
| ❌ | Serveur 39h (42 repas) CDI | 19 118,00 | 22 % | 42 % | 27 147,56 | 19 500,36 | 27 690,51 | 19 890,37 | 28 244,33 |

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
| CIC | 70 000,00 | 4 % | 0.8 % | 84 mois | 01/05/2026 | — |


## Données calculées

> Résultats générés par le moteur de calcul à partir des hypothèses ci-dessus.


### Compte de résultat — Synthèse (= écran)

| Désignation | 2026–2027 € | 2026–2027 % CA | 2027–2028 € | 2027–2028 % CA | 2028–2029 € | 2028–2029 % CA |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **PRODUITS D'EXPLOITATION** | | | | | | |
| **Chiffre d'affaires** | 110 947,00 | 100.0 % | 116 494,35 | 100.0 % | 122 319,07 | 100.0 % |
| ****= Total produits exploitation**** | 110 947,00 | 100.0 % | 116 494,35 | 100.0 % | 122 319,07 | 100.0 % |

| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **CHARGES D'EXPLOITATION** | | | | | | |
| Achats effectués | 32 303,74 | 29.1 % | 32 458,99 | 27.9 % | 34 169,59 | 27.9 % |
| Variation de stocks | -1 372,29 | -1.2 % | 19,04 | 0.0 % | -67,66 | -0.1 % |
|   dont Achats consommés | 30 931,45 | 27.9 % | 32 478,02 | 27.9 % | 34 101,92 | 27.9 % |
| Fournitures consommables | 7 494,25 | 6.8 % | 7 681,46 | 6.6 % | 7 874,29 | 6.4 % |
| Services extérieurs | 28 952,75 | 26.1 % | 28 907,98 | 24.8 % | 29 255,30 | 23.9 % |
| ****= Charges externes (Total)**** | 67 378,45 | 60.7 % | 69 067,46 | 59.3 % | 71 231,51 | 58.2 % |
| Impôts et taxes | 1 623,00 | 1.5 % | 1 978,00 | 1.7 % | 1 978,00 | 1.6 % |
| Salaires bruts (salariés) | 0,00 | 0.0 % | 0,00 | 0.0 % | 0,00 | 0.0 % |
| Charges sociales (salariés) | 0,00 | 0.0 % | 0,00 | 0.0 % | 0,00 | 0.0 % |
| Rémunération dirigeant | 18 000,00 | 16.2 % | 18 000,00 | 15.5 % | 18 000,00 | 14.7 % |
| Cotisations TNS | 7 063,25 | 6.4 % | 8 684,68 | 7.5 % | 8 684,68 | 7.1 % |
| ****= Charges personnel (Total)**** | 25 063,25 | 22.6 % | 26 684,68 | 22.9 % | 26 684,68 | 21.8 % |
| Dotations aux amortissements | 3 417,20 | 3.1 % | 3 417,20 | 2.9 % | 3 417,20 | 2.8 % |
| ****= Total charges exploitation**** | 97 481,90 | 87.9 % | 101 147,34 | 86.8 % | 103 311,39 | 84.5 % |

| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ****= Résultat d'exploitation**** | 13 465,10 | 12.1 % | 15 347,01 | 13.2 % | 19 007,68 | 15.5 % |

| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **RÉSULTAT FINANCIER** | | | | | | |
| Charges financières (Total) | 3 799,21 | 3.4 % | 2 771,22 | 2.4 % | 2 322,80 | 1.9 % |
|   dont Intérêts emprunts | 3 199,21 | 2.9 % | 2 771,22 | 2.4 % | 2 322,80 | 1.9 % |
|   dont Frais dossier | 600,00 | 0.5 % | 0,00 | 0.0 % | 0,00 | 0.0 % |
| ****= Résultat financier**** | -3 799,21 | -3.4 % | -2 771,22 | -2.4 % | -2 322,80 | -1.9 % |
| ****= Résultat courant**** | 9 665,89 | 8.7 % | 12 575,79 | 10.8 % | 16 684,88 | 13.6 % |

| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| — IS | 1 449,88 | 1.3 % | 1 886,37 | 1.6 % | 2 502,73 | 2.0 % |
| ****= Résultat net**** | 8 216,01 | 7.4 % | 10 689,42 | 9.2 % | 14 182,15 | 11.6 % |


### Vérifications de cohérence

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Total produits expl. (fc) | 110 947,00 | 116 494,35 | 122 319,07 |
| Total charges expl. (recalc) | 97 481,90 | 101 147,34 | 103 311,39 |
| ResExpl (fc) | 13 465,10 | 15 347,01 | 19 007,68 |
| ResExpl recalculé (Prod − Charges) | 13 465,10 | 15 347,01 | 19 007,68 |
| ****Écart ResExpl**** | -0,00 | -0,00 | -0,00 | *✅ Cohérent*

| ProduitsFinanciers (fc) | 0,00 | 0,00 | 0,00 |
| ChargesFinancières (Intérêts+Frais+Autres) | 3 799,21 | 2 771,22 | 2 322,80 |
| ResFin (fc) | -3 799,21 | -2 771,22 | -2 322,80 |
| ResFin recalculé (ProdFin − ChargesFin) | -3 799,21 | -2 771,22 | -2 322,80 |
| ****Écart ResFin**** | 0,00 | 0,00 | 0,00 | *✅ Cohérent*

| ResExpl (fc) | 13 465,10 | 15 347,01 | 19 007,68 |
| ResFin (fc) | -3 799,21 | -2 771,22 | -2 322,80 |
| ResCourant (fc) | 9 665,89 | 12 575,79 | 16 684,88 |
| ResCourant recalculé (ResExpl + ResFin) | 9 665,89 | 12 575,79 | 16 684,88 |
| ****Écart ResCourant**** | 0,00 | 0,00 | -0,00 | *✅ Cohérent*

| ResCourant (fc) | 9 665,89 | 12 575,79 | 16 684,88 |
| ResExcep (fc) | 0,00 | 0,00 | 0,00 |
| IS (fc) | 1 449,88 | 1 886,37 | 2 502,73 |
| ResNet (fc) | 8 216,01 | 10 689,42 | 14 182,15 |
| ResNet recalculé | 8 216,01 | 10 689,42 | 14 182,15 |
| ****Écart ResNet**** | 0,00 | -0,00 | 0,00 | *✅ Cohérent*


### Détail Produits d'exploitation

#### CA par activité

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Vente pizza | 98 750,00 | 103 687,50 | 108 871,88 |
| Vente boisson | 8 000,00 | 8 400,00 | 8 820,00 |
| Vente alcool | 4 197,00 | 4 406,85 | 4 627,19 |
| ****= Total CA**** | 110 947,00 | 116 494,35 | 122 319,07 |
| fc.ca | 110 947,00 | 116 494,35 | 122 319,07 | *✅*


### Détail Achats et Charges d'exploitation

#### Achats effectués par activité

> Achats effectués = Achats consommés + Variation de stocks + Achats ponctuels

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Achats – Vente pizza | 27 815,10 | 28 009,51 | 29 453,73 |
| Achats – Vente boisson | 2 937,51 | 2 924,99 | 3 093,12 |
| Achats – Vente alcool | 1 551,12 | 1 524,49 | 1 622,73 |
| ****Σ achats lignes drill-down**** | 32 303,74 | 32 458,99 | 34 169,59 |
| fc.achatsEffectues | 32 303,74 | 32 458,99 | 34 169,59 | *✅*
| fc.achatsConsommes (HT) | 30 931,45 | 32 478,02 | 34 101,92 |
| fc.varStock (nette) | 1 372,29 | -19,04 | 67,66 |
| fc.achatsEffectues (= consommés + ΔStock) | 32 303,74 | 32 458,99 | 34 169,59 |

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
| CIC | 3 199,21 | 2 771,22 | 2 322,80 |
| ****Σ intérêts emprunts**** | 3 199,21 | 2 771,22 | 2 322,80 |
| fc.interetsEmprunts | 3 199,21 | 2 771,22 | 2 322,80 | *✅*

#### Frais de dossier

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| CIC | 600,00 | 0,00 | 0,00 |
| ****Σ frais de dossier**** | 600,00 | 0,00 | 0,00 |
| fc.fraisDossierEmprunts | 600,00 | 0,00 | 0,00 | *✅*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| ****= Charges financières (Total)**** | 3 799,21 | 2 771,22 | 2 322,80 |
| fc.interetsEmprunts | 3 199,21 | 2 771,22 | 2 322,80 |
| fc.fraisDossierEmprunts | 600,00 | 0,00 | 0,00 |
| fc.autresChargesFinancieres | 0,00 | 0,00 | 0,00 |


### IS — Détail du calcul

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Résultat courant | 9 665,89 | 12 575,79 | 16 684,88 |
| Résultat exceptionnel | 0,00 | 0,00 | 0,00 |
| ****Base imposable avant IS**** | 9 665,89 | 12 575,79 | 16 684,88 |
| IS calculé (fc.isParAnnee) | 1 449,88 | 1 886,37 | 2 502,73 |
| ****Résultat net**** | 8 216,01 | 10 689,42 | 14 182,15 |
| Base − IS (= ResNet attendu) | 8 216,01 | 10 689,42 | 14 182,15 |
| ****Écart (fc.resNet vs base−IS)**** | 0,00 | -0,00 | 0,00 | *✅ Cohérent*


### Capacité d'autofinancement (CAF)

> CAF = Résultat net + Dotations amort + Dotations provisions − Reprises − PlusValues immo

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Résultat net (fc) | 8 216,01 | 10 689,42 | 14 182,15 |
| + Dotations amortissements | 3 417,20 | 3 417,20 | 3 417,20 |
| ****= CAF (fc)**** | 11 633,21 | 14 106,62 | 17 599,34 |
| CAF recalculée (ResNet+AmortDot+ProvDot−Reprises) | 11 633,21 | 14 106,62 | 17 599,34 |
| ****Écart CAF**** | 0,00 | 0,00 | -0,00 | *✅ Cohérent*


### Récapitulatif des vérifications

| Test | 2026–2027 | 2027–2028 | 2028–2029 | Statut |
| --- | ---: | ---: | ---: | :---: |
| CA Σ activités vs fc.ca | -0,00 | 0,00 | 0,00 | ✅ |
| Achats Σ lignes vs fc.achatsEffectues | 0,00 | 0,00 | 0,00 | ✅ |
| Personnel Σ composantes vs fc.total | 0,00 | 0,00 | 0,00 | ✅ |
| Dotations amort Σ immos vs fc.dotationsAmort | 0,00 | 0,00 | 0,00 | ✅ |
| ResExpl (fc vs recalc) | -0,00 | -0,00 | -0,00 | ✅ |
| ResFin (fc vs recalc) | 0,00 | 0,00 | 0,00 | ✅ |
| ResCourant (fc vs recalc) | 0,00 | 0,00 | -0,00 | ✅ |
| ResNet (fc vs recalc) | 0,00 | -0,00 | 0,00 | ✅ |
| CAF (fc vs recalc) | 0,00 | 0,00 | -0,00 | ✅ |

> ✅ **Tous les tests sont cohérents.** Le compte de résultat est valide.

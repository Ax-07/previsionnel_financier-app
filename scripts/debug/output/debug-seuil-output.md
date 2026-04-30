# Diagnostic Seuil de Rentabilité — Dossier `cmo8p96h40001schp26dfdknv`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`calcSeuil` · `buildFinCalc`


## 0. Paramètres généraux

| Paramètre | Valeur |
| --- | --- |
| Dossier ID | `cmo8p96h40001schp26dfdknv` |
| Date de démarrage | 01/05/2026 |
| Mois de début | Mai (5) |
| Régime fiscal | IS |
| Exercices | 2026–2027 · 2027–2028 · 2028–2029 |
| Activités actives | 9 |
| Subventions exploitation | 0 |
| Emprunts | 1 |


## 1. Tableau Seuil de Rentabilité complet


*Montants en € — colonne % exprimée en % des Ventes+Production*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| **Base d'activité** | | | |
| **Ventes + Production réelle** | 104 997,00 *(100,00 %)* | 110 246,85 *(100,00 %)* | 115 759,19 *(100,00 %)* |
| **Coûts variables** | | | |
| \  Achats consommés | 29 164,95 *(27,78 %)* | 30 623,20 *(27,78 %)* | 32 154,36 *(27,78 %)* |
| **= Total coûts variables** | 29 164,95 *(27,78 %)* | 30 623,20 *(27,78 %)* | 32 154,36 *(27,78 %)* |
| **= Marge sur coût variable** | 75 832,05 *(72,22 %)* | 79 623,65 *(72,22 %)* | 83 604,83 *(72,22 %)* |
| Taux de marge sur coût variable | 72,22 % | 72,22 % | 72,22 % |
| **Coûts fixes** | | | |
| \  Charges externes | 36 447,00 *(34,71 %)* | 36 589,44 *(33,19 %)* | 37 129,59 *(32,07 %)* |
| \  Charges de personnel | 7 063,25 *(6,73 %)* | 8 684,68 *(7,88 %)* | 8 684,68 *(7,50 %)* |
| \  Dotations aux amortissements | 3 417,20 *(3,25 %)* | 3 417,20 *(3,10 %)* | 3 417,20 *(2,95 %)* |
| \  Impôts et taxes | 1 623,00 *(1,55 %)* | 1 978,00 *(1,79 %)* | 1 978,00 *(1,71 %)* |
| **= Total coûts fixes** | 48 550,45 *(46,24 %)* | 50 669,32 *(45,96 %)* | 51 209,47 *(44,24 %)* |
| **= Résultat courant avant impôt** | 27 281,60 *(25,98 %)* | 28 954,33 *(26,26 %)* | 32 395,36 *(27,99 %)* |

| **Seuil de rentabilité économique** | | | |
| **Seuil de rentabilité économique** | 67 222,92 | 70 156,70 | 70 904,59 |
| Excédent / insuffisance d'activité | 37 774,08 | 40 090,15 | 44 854,60 |
| Point mort (jours) | 234 j | 232 j | 224 j |

| **Seuil de rentabilité financier** | | | |
| \  + + Remboursement des emprunts (capital) | 8 092,26 | 9 172,43 | 9 546,14 |
| \  + + Impôt sur les sociétés | 3 662,35 | 3 970,77 | 4 547,18 |
| **Seuil de rentabilité financier** | 83 498,33 | 88 354,76 | 90 418,20 |
| Excédent / insuffisance d'activité | 21 498,67 | 21 892,09 | 25 340,99 |
| Point mort financier (jours) | 290 j | 293 j | 285 j |


## 2. Vérifications de cohérence


| Check | Statut | Détail |
| --- | :---: | --- |
| Total CV = Achats consommés (2026–2027) | ✅ | 29 164,95 ≟ 29 164,95 |
| Total CV = Achats consommés (2027–2028) | ✅ | 30 623,20 ≟ 30 623,20 |
| Total CV = Achats consommés (2028–2029) | ✅ | 32 154,36 ≟ 32 154,36 |
| Marge CV = Ventes+Prod − Total CV (2026–2027) | ✅ | 75 832,05 ≟ 75 832,05 |
| Marge CV = Ventes+Prod − Total CV (2027–2028) | ✅ | 79 623,65 ≟ 79 623,65 |
| Marge CV = Ventes+Prod − Total CV (2028–2029) | ✅ | 83 604,83 ≟ 83 604,83 |
| Taux marge CV = Marge CV / Ventes+Prod × 100 (2026–2027) | ✅ | 72,22 % ≟ 72,22 % |
| Taux marge CV = Marge CV / Ventes+Prod × 100 (2027–2028) | ✅ | 72,22 % ≟ 72,22 % |
| Taux marge CV = Marge CV / Ventes+Prod × 100 (2028–2029) | ✅ | 72,22 % ≟ 72,22 % |
| Total CF = Charges ext + Pers + Dot + Impôts (2026–2027) | ✅ | 48 550,45 ≟ 48 550,45 |
| Total CF = Charges ext + Pers + Dot + Impôts (2027–2028) | ✅ | 50 669,32 ≟ 50 669,32 |
| Total CF = Charges ext + Pers + Dot + Impôts (2028–2029) | ✅ | 51 209,47 ≟ 51 209,47 |
| Résultat = Ventes+Prod − Total CV − Total CF (2026–2027) | ✅ | 27 281,60 ≟ 27 281,60 |
| Résultat = Ventes+Prod − Total CV − Total CF (2027–2028) | ✅ | 28 954,33 ≟ 28 954,33 |
| Résultat = Ventes+Prod − Total CV − Total CF (2028–2029) | ✅ | 32 395,36 ≟ 32 395,36 |
| Seuil éco = Total CF / Taux MCV (2026–2027) | ✅ | 67 222,92 ≟ 67 222,92 |
| Seuil éco = Total CF / Taux MCV (2027–2028) | ✅ | 70 156,70 ≟ 70 156,70 |
| Seuil éco = Total CF / Taux MCV (2028–2029) | ✅ | 70 904,59 ≟ 70 904,59 |
| Excédent éco = Ventes+Prod − Seuil éco (2026–2027) | ✅ | 37 774,08 ≟ 37 774,08 |
| Excédent éco = Ventes+Prod − Seuil éco (2027–2028) | ✅ | 40 090,15 ≟ 40 090,15 |
| Excédent éco = Ventes+Prod − Seuil éco (2028–2029) | ✅ | 44 854,60 ≟ 44 854,60 |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2026–2027) | ✅ | 234 j ≟ 234 j |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2027–2028) | ✅ | 232 j ≟ 232 j |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2028–2029) | ✅ | 224 j ≟ 224 j |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2026–2027) | ✅ | 83 498,33 ≟ 83 498,33 |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2027–2028) | ✅ | 88 354,76 ≟ 88 354,76 |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2028–2029) | ✅ | 90 418,20 ≟ 90 418,20 |
| Excédent fin = Ventes+Prod − Seuil fin (2026–2027) | ✅ | 21 498,67 ≟ 21 498,67 |
| Excédent fin = Ventes+Prod − Seuil fin (2027–2028) | ✅ | 21 892,09 ≟ 21 892,09 |
| Excédent fin = Ventes+Prod − Seuil fin (2028–2029) | ✅ | 25 340,99 ≟ 25 340,99 |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2026–2027) | ✅ | 290 j ≟ 290 j |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2027–2028) | ✅ | 293 j ≟ 293 j |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2028–2029) | ✅ | 285 j ≟ 285 j |
| Charges ext (seuil) = fournitures + services (FC) (2026–2027) | ✅ | 36 447,00 ≟ 36 447,00 |
| Charges ext (seuil) = fournitures + services (FC) (2027–2028) | ✅ | 36 589,44 ≟ 36 589,44 |
| Charges ext (seuil) = fournitures + services (FC) (2028–2029) | ✅ | 37 129,59 ≟ 37 129,59 |
| Charges pers (seuil) = chargesPersonnel.total (FC) (2026–2027) | ✅ | 7 063,25 ≟ 7 063,25 |
| Charges pers (seuil) = chargesPersonnel.total (FC) (2027–2028) | ✅ | 8 684,68 ≟ 8 684,68 |
| Charges pers (seuil) = chargesPersonnel.total (FC) (2028–2029) | ✅ | 8 684,68 ≟ 8 684,68 |
| Dotations (seuil) = dotAmort + dotProv (FC) (2026–2027) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dotations (seuil) = dotAmort + dotProv (FC) (2027–2028) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dotations (seuil) = dotAmort + dotProv (FC) (2028–2029) | ✅ | 3 417,20 ≟ 3 417,20 |
| Impôts/taxes (seuil) = impotsTaxes (FC) (2026–2027) | ✅ | 1 623,00 ≟ 1 623,00 |
| Impôts/taxes (seuil) = impotsTaxes (FC) (2027–2028) | ✅ | 1 978,00 ≟ 1 978,00 |
| Impôts/taxes (seuil) = impotsTaxes (FC) (2028–2029) | ✅ | 1 978,00 ≟ 1 978,00 |
| Remb. capital (seuil) = capitalRembourse (FC) (2026–2027) | ✅ | 8 092,26 ≟ 8 092,26 |
| Remb. capital (seuil) = capitalRembourse (FC) (2027–2028) | ✅ | 9 172,43 ≟ 9 172,43 |
| Remb. capital (seuil) = capitalRembourse (FC) (2028–2029) | ✅ | 9 546,14 ≟ 9 546,14 |
| IS (seuil) = isParAnnee (FC) (2026–2027) | ✅ | 3 662,35 ≟ 3 662,35 |
| IS (seuil) = isParAnnee (FC) (2027–2028) | ✅ | 3 970,77 ≟ 3 970,77 |
| IS (seuil) = isParAnnee (FC) (2028–2029) | ✅ | 4 547,18 ≟ 4 547,18 |


## 3. Détail par activité — Base d'activité


| Activité | Type | Taux marge | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: | ---: |
| Vente pizza | PRODUCTION_VENDUE | 73,00 % | 94 800,00 | 99 540,00 | 104 517,00 |
| Vente pizza (copie) | PRODUCTION_VENDUE | 73,00 % | 90 850,00 | 95 392,50 | 100 162,13 |
| Vente pizza (copie) (copie) | PRODUCTION_VENDUE | 73,00 % | 98 750,00 | 103 687,50 | 108 871,88 |
| Vente boisson | PRODUCTION_VENDUE | 65,00 % | 6 000,00 | 6 300,00 | 6 615,00 |
| Vente boisson (copie) | PRODUCTION_VENDUE | 65,00 % | 5 000,00 | 5 250,00 | 5 512,50 |
| Vente boisson (copie) (copie) | PRODUCTION_VENDUE | 65,00 % | 7 000,00 | 7 350,00 | 7 717,50 |
| Vente alcool | PRODUCTION_VENDUE | 65,00 % | 4 197,00 | 4 406,85 | 4 627,19 |
| Vente alcool (copie) | PRODUCTION_VENDUE | 65,00 % | 3 000,00 | 3 150,00 | 3 307,50 |
| Vente alcool (copie) (copie) | PRODUCTION_VENDUE | 65,00 % | 5 000,00 | 5 250,00 | 5 512,50 |
| **Ventes + Production totale** | | | **104 997,00** | **110 246,85** | **115 759,19** |


## 4. Récapitulatif


| Bilan | Valeur |
| --- | --- |
| Total checks | 51 |
| ✅ OK | 51 |
| ❌ KO | 0 |

> ✅ **Tous les checks sont OK.** Les calculs du seuil de rentabilité sont cohérents.


### 4.1 Indicateurs clés


| Indicateur | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Ventes + Production | 104 997,00 | 110 246,85 | 115 759,19 |
| Coûts variables | 29 164,95 | 30 623,20 | 32 154,36 |
| **Marge sur coût variable** | **75 832,05** | **79 623,65** | **83 604,83** |
| Taux de marge / CV | 72,22 % | 72,22 % | 72,22 % |
| Coûts fixes | 48 550,45 | 50 669,32 | 51 209,47 |
| **Résultat courant** | **27 281,60** | **28 954,33** | **32 395,36** |
| **Seuil éco** | **67 222,92** | **70 156,70** | **70 904,59** |
| Excédent éco | 37 774,08 | 40 090,15 | 44 854,60 |
| Point mort éco | 234 j | 232 j | 224 j |
| **Seuil fin** | **83 498,33** | **88 354,76** | **90 418,20** |
| Excédent fin | 21 498,67 | 21 892,09 | 25 340,99 |
| Point mort fin | 290 j | 293 j | 285 j |

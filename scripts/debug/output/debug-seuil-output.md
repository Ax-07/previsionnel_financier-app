# Diagnostic Seuil de Rentabilité — Dossier `cmmjoradm0001kohp15on2xe1`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`calcSeuil` · `buildFinCalc`


## 0. Paramètres généraux

| Paramètre | Valeur |
| --- | --- |
| Dossier ID | `cmmjoradm0001kohp15on2xe1` |
| Date de démarrage | 01/05/2026 |
| Mois de début | Mai (5) |
| Régime fiscal | IS |
| Exercices | 2026–2027 · 2027–2028 · 2028–2029 |
| Activités actives | 3 |
| Subventions exploitation | 0 |
| Emprunts | 1 |


## 1. Tableau Seuil de Rentabilité complet


*Montants en € — colonne % exprimée en % des Ventes+Production*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| **Base d'activité** | | | |
| **Ventes + Production réelle** | 103 136,00 *(100,00 %)* | 108 292,80 *(100,00 %)* | 113 707,44 *(100,00 %)* |
| **Coûts variables** | | | |
| \  Achats consommés | 28 341,20 *(27,48 %)* | 29 758,26 *(27,48 %)* | 31 246,17 *(27,48 %)* |
| **= Total coûts variables** | 28 341,20 *(27,48 %)* | 29 758,26 *(27,48 %)* | 31 246,17 *(27,48 %)* |
| **= Marge sur coût variable** | 74 794,80 *(72,52 %)* | 78 534,54 *(72,52 %)* | 82 461,27 *(72,52 %)* |
| Taux de marge sur coût variable | 72,52 % | 72,52 % | 72,52 % |
| **Coûts fixes** | | | |
| \  Charges externes | 37 359,47 *(36,22 %)* | 37 296,51 *(34,44 %)* | 37 620,98 *(33,09 %)* |
| \  Charges de personnel | 21 940,51 *(21,27 %)* | 27 384,68 *(25,29 %)* | 27 384,68 *(24,08 %)* |
| \  Dotations aux amortissements | 3 583,70 *(3,47 %)* | 3 583,70 *(3,31 %)* | 3 583,70 *(3,15 %)* |
| \  Impôts et taxes | 1 623,00 *(1,57 %)* | 1 978,00 *(1,83 %)* | 1 978,00 *(1,74 %)* |
| **= Total coûts fixes** | 64 506,68 *(62,55 %)* | 70 242,89 *(64,86 %)* | 70 567,36 *(62,06 %)* |
| **= Résultat courant avant impôt** | 10 288,12 *(9,98 %)* | 8 291,65 *(7,66 %)* | 11 893,91 *(10,46 %)* |

| **Seuil de rentabilité économique** | | | |
| **Seuil de rentabilité économique** | 88 949,51 | 96 859,28 | 97 306,70 |
| Excédent / insuffisance d'activité | 14 186,49 | 11 433,52 | 16 400,74 |
| Point mort (jours) | 315 j | 326 j | 312 j |

| **Seuil de rentabilité financier** | | | |
| \  + + Remboursement des emprunts (capital) | 6 936,24 | 7 862,08 | 8 182,42 |
| \  + + Impôt sur les sociétés | 1 041,89 | 887,44 | 1 485,45 |
| **Seuil de rentabilité financier** | 99 950,71 | 108 924,17 | 110 637,91 |
| Excédent / insuffisance d'activité | 3 185,29 | -631,37 | 3 069,53 |
| Point mort financier (jours) | 354 j | 367 j | 355 j |


## 2. Vérifications de cohérence


| Check | Statut | Détail |
| --- | :---: | --- |
| Total CV = Achats consommés (2026–2027) | ✅ | 28 341,20 ≟ 28 341,20 |
| Total CV = Achats consommés (2027–2028) | ✅ | 29 758,26 ≟ 29 758,26 |
| Total CV = Achats consommés (2028–2029) | ✅ | 31 246,17 ≟ 31 246,17 |
| Marge CV = Ventes+Prod − Total CV (2026–2027) | ✅ | 74 794,80 ≟ 74 794,80 |
| Marge CV = Ventes+Prod − Total CV (2027–2028) | ✅ | 78 534,54 ≟ 78 534,54 |
| Marge CV = Ventes+Prod − Total CV (2028–2029) | ✅ | 82 461,27 ≟ 82 461,27 |
| Taux marge CV = Marge CV / Ventes+Prod × 100 (2026–2027) | ✅ | 72,52 % ≟ 72,52 % |
| Taux marge CV = Marge CV / Ventes+Prod × 100 (2027–2028) | ✅ | 72,52 % ≟ 72,52 % |
| Taux marge CV = Marge CV / Ventes+Prod × 100 (2028–2029) | ✅ | 72,52 % ≟ 72,52 % |
| Total CF = Charges ext + Pers + Dot + Impôts (2026–2027) | ✅ | 64 506,68 ≟ 64 506,68 |
| Total CF = Charges ext + Pers + Dot + Impôts (2027–2028) | ✅ | 70 242,89 ≟ 70 242,89 |
| Total CF = Charges ext + Pers + Dot + Impôts (2028–2029) | ✅ | 70 567,36 ≟ 70 567,36 |
| Résultat = Ventes+Prod − Total CV − Total CF (2026–2027) | ✅ | 10 288,12 ≟ 10 288,12 |
| Résultat = Ventes+Prod − Total CV − Total CF (2027–2028) | ✅ | 8 291,65 ≟ 8 291,65 |
| Résultat = Ventes+Prod − Total CV − Total CF (2028–2029) | ✅ | 11 893,91 ≟ 11 893,91 |
| Seuil éco = Total CF / Taux MCV (2026–2027) | ✅ | 88 949,51 ≟ 88 949,51 |
| Seuil éco = Total CF / Taux MCV (2027–2028) | ✅ | 96 859,28 ≟ 96 859,28 |
| Seuil éco = Total CF / Taux MCV (2028–2029) | ✅ | 97 306,70 ≟ 97 306,70 |
| Excédent éco = Ventes+Prod − Seuil éco (2026–2027) | ✅ | 14 186,49 ≟ 14 186,49 |
| Excédent éco = Ventes+Prod − Seuil éco (2027–2028) | ✅ | 11 433,52 ≟ 11 433,52 |
| Excédent éco = Ventes+Prod − Seuil éco (2028–2029) | ✅ | 16 400,74 ≟ 16 400,74 |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2026–2027) | ✅ | 315 j ≟ 315 j |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2027–2028) | ✅ | 326 j ≟ 326 j |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2028–2029) | ✅ | 312 j ≟ 312 j |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2026–2027) | ✅ | 99 950,71 ≟ 99 950,71 |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2027–2028) | ✅ | 108 924,17 ≟ 108 924,17 |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2028–2029) | ✅ | 110 637,91 ≟ 110 637,91 |
| Excédent fin = Ventes+Prod − Seuil fin (2026–2027) | ✅ | 3 185,29 ≟ 3 185,29 |
| Excédent fin = Ventes+Prod − Seuil fin (2027–2028) | ✅ | -631,37 ≟ -631,37 |
| Excédent fin = Ventes+Prod − Seuil fin (2028–2029) | ✅ | 3 069,53 ≟ 3 069,53 |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2026–2027) | ✅ | 354 j ≟ 354 j |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2027–2028) | ✅ | 367 j ≟ 367 j |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2028–2029) | ✅ | 355 j ≟ 355 j |
| Charges ext (seuil) = fournitures + services (FC) (2026–2027) | ✅ | 37 359,47 ≟ 37 359,47 |
| Charges ext (seuil) = fournitures + services (FC) (2027–2028) | ✅ | 37 296,51 ≟ 37 296,51 |
| Charges ext (seuil) = fournitures + services (FC) (2028–2029) | ✅ | 37 620,98 ≟ 37 620,98 |
| Charges pers (seuil) = chargesPersonnel.total (FC) (2026–2027) | ✅ | 21 940,51 ≟ 21 940,51 |
| Charges pers (seuil) = chargesPersonnel.total (FC) (2027–2028) | ✅ | 27 384,68 ≟ 27 384,68 |
| Charges pers (seuil) = chargesPersonnel.total (FC) (2028–2029) | ✅ | 27 384,68 ≟ 27 384,68 |
| Dotations (seuil) = dotAmort + dotProv (FC) (2026–2027) | ✅ | 3 583,70 ≟ 3 583,70 |
| Dotations (seuil) = dotAmort + dotProv (FC) (2027–2028) | ✅ | 3 583,70 ≟ 3 583,70 |
| Dotations (seuil) = dotAmort + dotProv (FC) (2028–2029) | ✅ | 3 583,70 ≟ 3 583,70 |
| Impôts/taxes (seuil) = impotsTaxes (FC) (2026–2027) | ✅ | 1 623,00 ≟ 1 623,00 |
| Impôts/taxes (seuil) = impotsTaxes (FC) (2027–2028) | ✅ | 1 978,00 ≟ 1 978,00 |
| Impôts/taxes (seuil) = impotsTaxes (FC) (2028–2029) | ✅ | 1 978,00 ≟ 1 978,00 |
| Remb. capital (seuil) = capitalRembourse (FC) (2026–2027) | ✅ | 6 936,24 ≟ 6 936,24 |
| Remb. capital (seuil) = capitalRembourse (FC) (2027–2028) | ✅ | 7 862,08 ≟ 7 862,08 |
| Remb. capital (seuil) = capitalRembourse (FC) (2028–2029) | ✅ | 8 182,42 ≟ 8 182,42 |
| IS (seuil) = isParAnnee (FC) (2026–2027) | ✅ | 1 041,89 ≟ 1 041,89 |
| IS (seuil) = isParAnnee (FC) (2027–2028) | ✅ | 887,44 ≟ 887,44 |
| IS (seuil) = isParAnnee (FC) (2028–2029) | ✅ | 1 485,45 ≟ 1 485,45 |


## 3. Détail par activité — Base d'activité


| Activité | Type | Taux marge | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: | ---: |
| Vente pizza | PRODUCTION_VENDUE | 73,00 % | 96 955,00 | 101 802,75 | 106 892,89 |
| Vente boisson | PRODUCTION_VENDUE | 65,00 % | 2 060,00 | 2 163,00 | 2 271,15 |
| Vente alcool | PRODUCTION_VENDUE | 65,00 % | 4 121,00 | 4 327,05 | 4 543,40 |
| **Ventes + Production totale** | | | **103 136,00** | **108 292,80** | **113 707,44** |


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
| Ventes + Production | 103 136,00 | 108 292,80 | 113 707,44 |
| Coûts variables | 28 341,20 | 29 758,26 | 31 246,17 |
| **Marge sur coût variable** | **74 794,80** | **78 534,54** | **82 461,27** |
| Taux de marge / CV | 72,52 % | 72,52 % | 72,52 % |
| Coûts fixes | 64 506,68 | 70 242,89 | 70 567,36 |
| **Résultat courant** | **10 288,12** | **8 291,65** | **11 893,91** |
| **Seuil éco** | **88 949,51** | **96 859,28** | **97 306,70** |
| Excédent éco | 14 186,49 | 11 433,52 | 16 400,74 |
| Point mort éco | 315 j | 326 j | 312 j |
| **Seuil fin** | **99 950,71** | **108 924,17** | **110 637,91** |
| Excédent fin | 3 185,29 | -631,37 | 3 069,53 |
| Point mort fin | 354 j | 367 j | 355 j |

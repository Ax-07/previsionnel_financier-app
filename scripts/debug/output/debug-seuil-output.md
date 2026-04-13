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
| **Ventes + Production réelle** | 110 947,00 *(100,00 %)* | 116 494,35 *(100,00 %)* | 122 319,07 *(100,00 %)* |
| **Coûts variables** | | | |
| \  Achats consommés | 30 931,45 *(27,88 %)* | 32 478,02 *(27,88 %)* | 34 101,92 *(27,88 %)* |
| **= Total coûts variables** | 30 931,45 *(27,88 %)* | 32 478,02 *(27,88 %)* | 34 101,92 *(27,88 %)* |
| **= Marge sur coût variable** | 80 015,55 *(72,12 %)* | 84 016,33 *(72,12 %)* | 88 217,15 *(72,12 %)* |
| Taux de marge sur coût variable | 72,12 % | 72,12 % | 72,12 % |
| **Coûts fixes** | | | |
| \  Charges externes | 36 447,00 *(32,85 %)* | 36 589,44 *(31,41 %)* | 37 129,59 *(30,35 %)* |
| \  Charges de personnel | 25 063,25 *(22,59 %)* | 26 684,68 *(22,91 %)* | 26 684,68 *(21,82 %)* |
| \  Dotations aux amortissements | 3 417,20 *(3,08 %)* | 3 417,20 *(2,93 %)* | 3 417,20 *(2,79 %)* |
| \  Impôts et taxes | 1 623,00 *(1,46 %)* | 1 978,00 *(1,70 %)* | 1 978,00 *(1,62 %)* |
| **= Total coûts fixes** | 66 550,45 *(59,98 %)* | 68 669,32 *(58,95 %)* | 69 209,47 *(56,58 %)* |
| **= Résultat courant avant impôt** | 13 465,10 *(12,14 %)* | 15 347,01 *(13,17 %)* | 19 007,68 *(15,54 %)* |

| **Seuil de rentabilité économique** | | | |
| **Seuil de rentabilité économique** | 92 276,72 | 95 214,68 | 95 963,63 |
| Excédent / insuffisance d'activité | 18 670,28 | 21 279,67 | 26 355,44 |
| Point mort (jours) | 304 j | 298 j | 286 j |

| **Seuil de rentabilité financier** | | | |
| \  + + Remboursement des emprunts (capital) | 8 092,26 | 9 172,43 | 9 546,14 |
| \  + + Impôt sur les sociétés | 1 449,88 | 1 886,37 | 2 502,73 |
| **Seuil de rentabilité financier** | 105 507,55 | 110 548,45 | 112 670,21 |
| Excédent / insuffisance d'activité | 5 439,45 | 5 945,90 | 9 648,86 |
| Point mort financier (jours) | 347 j | 346 j | 336 j |


## 2. Vérifications de cohérence


| Check | Statut | Détail |
| --- | :---: | --- |
| Total CV = Achats consommés (2026–2027) | ✅ | 30 931,45 ≟ 30 931,45 |
| Total CV = Achats consommés (2027–2028) | ✅ | 32 478,02 ≟ 32 478,02 |
| Total CV = Achats consommés (2028–2029) | ✅ | 34 101,92 ≟ 34 101,92 |
| Marge CV = Ventes+Prod − Total CV (2026–2027) | ✅ | 80 015,55 ≟ 80 015,55 |
| Marge CV = Ventes+Prod − Total CV (2027–2028) | ✅ | 84 016,33 ≟ 84 016,33 |
| Marge CV = Ventes+Prod − Total CV (2028–2029) | ✅ | 88 217,15 ≟ 88 217,15 |
| Taux marge CV = Marge CV / Ventes+Prod × 100 (2026–2027) | ✅ | 72,12 % ≟ 72,12 % |
| Taux marge CV = Marge CV / Ventes+Prod × 100 (2027–2028) | ✅ | 72,12 % ≟ 72,12 % |
| Taux marge CV = Marge CV / Ventes+Prod × 100 (2028–2029) | ✅ | 72,12 % ≟ 72,12 % |
| Total CF = Charges ext + Pers + Dot + Impôts (2026–2027) | ✅ | 66 550,45 ≟ 66 550,45 |
| Total CF = Charges ext + Pers + Dot + Impôts (2027–2028) | ✅ | 68 669,32 ≟ 68 669,32 |
| Total CF = Charges ext + Pers + Dot + Impôts (2028–2029) | ✅ | 69 209,47 ≟ 69 209,47 |
| Résultat = Ventes+Prod − Total CV − Total CF (2026–2027) | ✅ | 13 465,10 ≟ 13 465,10 |
| Résultat = Ventes+Prod − Total CV − Total CF (2027–2028) | ✅ | 15 347,01 ≟ 15 347,01 |
| Résultat = Ventes+Prod − Total CV − Total CF (2028–2029) | ✅ | 19 007,68 ≟ 19 007,68 |
| Seuil éco = Total CF / Taux MCV (2026–2027) | ✅ | 92 276,72 ≟ 92 276,72 |
| Seuil éco = Total CF / Taux MCV (2027–2028) | ✅ | 95 214,68 ≟ 95 214,68 |
| Seuil éco = Total CF / Taux MCV (2028–2029) | ✅ | 95 963,63 ≟ 95 963,63 |
| Excédent éco = Ventes+Prod − Seuil éco (2026–2027) | ✅ | 18 670,28 ≟ 18 670,28 |
| Excédent éco = Ventes+Prod − Seuil éco (2027–2028) | ✅ | 21 279,67 ≟ 21 279,67 |
| Excédent éco = Ventes+Prod − Seuil éco (2028–2029) | ✅ | 26 355,44 ≟ 26 355,44 |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2026–2027) | ✅ | 304 j ≟ 304 j |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2027–2028) | ✅ | 298 j ≟ 298 j |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2028–2029) | ✅ | 286 j ≟ 286 j |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2026–2027) | ✅ | 105 507,55 ≟ 105 507,55 |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2027–2028) | ✅ | 110 548,45 ≟ 110 548,45 |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2028–2029) | ✅ | 112 670,21 ≟ 112 670,21 |
| Excédent fin = Ventes+Prod − Seuil fin (2026–2027) | ✅ | 5 439,45 ≟ 5 439,45 |
| Excédent fin = Ventes+Prod − Seuil fin (2027–2028) | ✅ | 5 945,90 ≟ 5 945,90 |
| Excédent fin = Ventes+Prod − Seuil fin (2028–2029) | ✅ | 9 648,86 ≟ 9 648,86 |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2026–2027) | ✅ | 347 j ≟ 347 j |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2027–2028) | ✅ | 346 j ≟ 346 j |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2028–2029) | ✅ | 336 j ≟ 336 j |
| Charges ext (seuil) = fournitures + services (FC) (2026–2027) | ✅ | 36 447,00 ≟ 36 447,00 |
| Charges ext (seuil) = fournitures + services (FC) (2027–2028) | ✅ | 36 589,44 ≟ 36 589,44 |
| Charges ext (seuil) = fournitures + services (FC) (2028–2029) | ✅ | 37 129,59 ≟ 37 129,59 |
| Charges pers (seuil) = chargesPersonnel.total (FC) (2026–2027) | ✅ | 25 063,25 ≟ 25 063,25 |
| Charges pers (seuil) = chargesPersonnel.total (FC) (2027–2028) | ✅ | 26 684,68 ≟ 26 684,68 |
| Charges pers (seuil) = chargesPersonnel.total (FC) (2028–2029) | ✅ | 26 684,68 ≟ 26 684,68 |
| Dotations (seuil) = dotAmort + dotProv (FC) (2026–2027) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dotations (seuil) = dotAmort + dotProv (FC) (2027–2028) | ✅ | 3 417,20 ≟ 3 417,20 |
| Dotations (seuil) = dotAmort + dotProv (FC) (2028–2029) | ✅ | 3 417,20 ≟ 3 417,20 |
| Impôts/taxes (seuil) = impotsTaxes (FC) (2026–2027) | ✅ | 1 623,00 ≟ 1 623,00 |
| Impôts/taxes (seuil) = impotsTaxes (FC) (2027–2028) | ✅ | 1 978,00 ≟ 1 978,00 |
| Impôts/taxes (seuil) = impotsTaxes (FC) (2028–2029) | ✅ | 1 978,00 ≟ 1 978,00 |
| Remb. capital (seuil) = capitalRembourse (FC) (2026–2027) | ✅ | 8 092,26 ≟ 8 092,26 |
| Remb. capital (seuil) = capitalRembourse (FC) (2027–2028) | ✅ | 9 172,43 ≟ 9 172,43 |
| Remb. capital (seuil) = capitalRembourse (FC) (2028–2029) | ✅ | 9 546,14 ≟ 9 546,14 |
| IS (seuil) = isParAnnee (FC) (2026–2027) | ✅ | 1 449,88 ≟ 1 449,88 |
| IS (seuil) = isParAnnee (FC) (2027–2028) | ✅ | 1 886,37 ≟ 1 886,37 |
| IS (seuil) = isParAnnee (FC) (2028–2029) | ✅ | 2 502,73 ≟ 2 502,73 |


## 3. Détail par activité — Base d'activité


| Activité | Type | Taux marge | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: | ---: |
| Vente pizza | PRODUCTION_VENDUE | 73,00 % | 98 750,00 | 103 687,50 | 108 871,88 |
| Vente boisson | PRODUCTION_VENDUE | 65,00 % | 8 000,00 | 8 400,00 | 8 820,00 |
| Vente alcool | PRODUCTION_VENDUE | 65,00 % | 4 197,00 | 4 406,85 | 4 627,19 |
| **Ventes + Production totale** | | | **110 947,00** | **116 494,35** | **122 319,07** |


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
| Ventes + Production | 110 947,00 | 116 494,35 | 122 319,07 |
| Coûts variables | 30 931,45 | 32 478,02 | 34 101,92 |
| **Marge sur coût variable** | **80 015,55** | **84 016,33** | **88 217,15** |
| Taux de marge / CV | 72,12 % | 72,12 % | 72,12 % |
| Coûts fixes | 66 550,45 | 68 669,32 | 69 209,47 |
| **Résultat courant** | **13 465,10** | **15 347,01** | **19 007,68** |
| **Seuil éco** | **92 276,72** | **95 214,68** | **95 963,63** |
| Excédent éco | 18 670,28 | 21 279,67 | 26 355,44 |
| Point mort éco | 304 j | 298 j | 286 j |
| **Seuil fin** | **105 507,55** | **110 548,45** | **112 670,21** |
| Excédent fin | 5 439,45 | 5 945,90 | 9 648,86 |
| Point mort fin | 347 j | 346 j | 336 j |

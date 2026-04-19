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
| **Ventes + Production réelle** | 104 997,00 *(100,00 %)* | 110 246,85 *(100,00 %)* | 115 759,19 *(100,00 %)* |
| **Coûts variables** | | | |
| \  Achats consommés | 29 164,95 *(27,78 %)* | 30 623,20 *(27,78 %)* | 32 154,36 *(27,78 %)* |
| **= Total coûts variables** | 29 164,95 *(27,78 %)* | 30 623,20 *(27,78 %)* | 32 154,36 *(27,78 %)* |
| **= Marge sur coût variable** | 75 832,05 *(72,22 %)* | 79 623,65 *(72,22 %)* | 83 604,83 *(72,22 %)* |
| Taux de marge sur coût variable | 72,22 % | 72,22 % | 72,22 % |
| **Coûts fixes** | | | |
| \  Charges externes | 36 447,00 *(34,71 %)* | 36 589,44 *(33,19 %)* | 37 129,59 *(32,07 %)* |
| \  Charges de personnel | 25 063,25 *(23,87 %)* | 26 684,68 *(24,20 %)* | 26 684,68 *(23,05 %)* |
| \  Dotations aux amortissements | 3 417,20 *(3,25 %)* | 3 417,20 *(3,10 %)* | 3 417,20 *(2,95 %)* |
| \  Impôts et taxes | 1 623,00 *(1,55 %)* | 1 978,00 *(1,79 %)* | 1 978,00 *(1,71 %)* |
| **= Total coûts fixes** | 66 550,45 *(63,38 %)* | 68 669,32 *(62,29 %)* | 69 209,47 *(59,79 %)* |
| **= Résultat courant avant impôt** | 9 281,60 *(8,84 %)* | 10 954,33 *(9,94 %)* | 14 395,36 *(12,44 %)* |

| **Seuil de rentabilité économique** | | | |
| **Seuil de rentabilité économique** | 92 145,70 | 95 079,49 | 95 827,38 |
| Excédent / insuffisance d'activité | 12 851,30 | 15 167,36 | 19 931,81 |
| Point mort (jours) | 320 j | 315 j | 302 j |

| **Seuil de rentabilité financier** | | | |
| \  + + Remboursement des emprunts (capital) | 6 936,24 | 7 862,08 | 8 182,42 |
| \  + + Impôt sur les sociétés | 890,91 | 1 286,85 | 1 860,66 |
| **Seuil de rentabilité financier** | 102 983,17 | 107 747,09 | 109 733,03 |
| Excédent / insuffisance d'activité | 2 013,83 | 2 499,76 | 6 026,16 |
| Point mort financier (jours) | 358 j | 357 j | 346 j |


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
| Total CF = Charges ext + Pers + Dot + Impôts (2026–2027) | ✅ | 66 550,45 ≟ 66 550,45 |
| Total CF = Charges ext + Pers + Dot + Impôts (2027–2028) | ✅ | 68 669,32 ≟ 68 669,32 |
| Total CF = Charges ext + Pers + Dot + Impôts (2028–2029) | ✅ | 69 209,47 ≟ 69 209,47 |
| Résultat = Ventes+Prod − Total CV − Total CF (2026–2027) | ✅ | 9 281,60 ≟ 9 281,60 |
| Résultat = Ventes+Prod − Total CV − Total CF (2027–2028) | ✅ | 10 954,33 ≟ 10 954,33 |
| Résultat = Ventes+Prod − Total CV − Total CF (2028–2029) | ✅ | 14 395,36 ≟ 14 395,36 |
| Seuil éco = Total CF / Taux MCV (2026–2027) | ✅ | 92 145,70 ≟ 92 145,70 |
| Seuil éco = Total CF / Taux MCV (2027–2028) | ✅ | 95 079,49 ≟ 95 079,49 |
| Seuil éco = Total CF / Taux MCV (2028–2029) | ✅ | 95 827,38 ≟ 95 827,38 |
| Excédent éco = Ventes+Prod − Seuil éco (2026–2027) | ✅ | 12 851,30 ≟ 12 851,30 |
| Excédent éco = Ventes+Prod − Seuil éco (2027–2028) | ✅ | 15 167,36 ≟ 15 167,36 |
| Excédent éco = Ventes+Prod − Seuil éco (2028–2029) | ✅ | 19 931,81 ≟ 19 931,81 |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2026–2027) | ✅ | 320 j ≟ 320 j |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2027–2028) | ✅ | 315 j ≟ 315 j |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2028–2029) | ✅ | 302 j ≟ 302 j |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2026–2027) | ✅ | 102 983,17 ≟ 102 983,17 |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2027–2028) | ✅ | 107 747,09 ≟ 107 747,09 |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2028–2029) | ✅ | 109 733,03 ≟ 109 733,03 |
| Excédent fin = Ventes+Prod − Seuil fin (2026–2027) | ✅ | 2 013,83 ≟ 2 013,83 |
| Excédent fin = Ventes+Prod − Seuil fin (2027–2028) | ✅ | 2 499,76 ≟ 2 499,76 |
| Excédent fin = Ventes+Prod − Seuil fin (2028–2029) | ✅ | 6 026,16 ≟ 6 026,16 |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2026–2027) | ✅ | 358 j ≟ 358 j |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2027–2028) | ✅ | 357 j ≟ 357 j |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2028–2029) | ✅ | 346 j ≟ 346 j |
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
| Remb. capital (seuil) = capitalRembourse (FC) (2026–2027) | ✅ | 6 936,24 ≟ 6 936,24 |
| Remb. capital (seuil) = capitalRembourse (FC) (2027–2028) | ✅ | 7 862,08 ≟ 7 862,08 |
| Remb. capital (seuil) = capitalRembourse (FC) (2028–2029) | ✅ | 8 182,42 ≟ 8 182,42 |
| IS (seuil) = isParAnnee (FC) (2026–2027) | ✅ | 890,91 ≟ 890,91 |
| IS (seuil) = isParAnnee (FC) (2027–2028) | ✅ | 1 286,85 ≟ 1 286,85 |
| IS (seuil) = isParAnnee (FC) (2028–2029) | ✅ | 1 860,66 ≟ 1 860,66 |


## 3. Détail par activité — Base d'activité


| Activité | Type | Taux marge | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: | ---: |
| Vente pizza | PRODUCTION_VENDUE | 73,00 % | 94 800,00 | 99 540,00 | 104 517,00 |
| Vente boisson | PRODUCTION_VENDUE | 65,00 % | 6 000,00 | 6 300,00 | 6 615,00 |
| Vente alcool | PRODUCTION_VENDUE | 65,00 % | 4 197,00 | 4 406,85 | 4 627,19 |
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
| Coûts fixes | 66 550,45 | 68 669,32 | 69 209,47 |
| **Résultat courant** | **9 281,60** | **10 954,33** | **14 395,36** |
| **Seuil éco** | **92 145,70** | **95 079,49** | **95 827,38** |
| Excédent éco | 12 851,30 | 15 167,36 | 19 931,81 |
| Point mort éco | 320 j | 315 j | 302 j |
| **Seuil fin** | **102 983,17** | **107 747,09** | **109 733,03** |
| Excédent fin | 2 013,83 | 2 499,76 | 6 026,16 |
| Point mort fin | 358 j | 357 j | 346 j |

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
| Activités actives | 5 |
| Subventions exploitation | 0 |
| Emprunts | 1 |


## 1. Tableau Seuil de Rentabilité complet


*Montants en € — colonne % exprimée en % des Ventes+Production*

| Désignation | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| **Base d'activité** | | | |
| **Ventes + Production réelle** | 294 597,00 *(100,00 %)* | 309 326,85 *(100,00 %)* | 324 793,20 *(100,00 %)* |
| **Coûts variables** | | | |
| \  Achats consommés | 80 356,95 *(27,28 %)* | 84 374,80 *(27,28 %)* | 88 593,54 *(27,28 %)* |
| **= Total coûts variables** | 80 356,95 *(27,28 %)* | 84 374,80 *(27,28 %)* | 88 593,54 *(27,28 %)* |
| **= Marge sur coût variable** | 214 240,05 *(72,72 %)* | 224 952,05 *(72,72 %)* | 236 199,66 *(72,72 %)* |
| Taux de marge sur coût variable | 72,72 % | 72,72 % | 72,72 % |
| **Coûts fixes** | | | |
| \  Charges externes | 36 447,00 *(12,37 %)* | 36 589,44 *(11,83 %)* | 37 129,59 *(11,43 %)* |
| \  Charges de personnel | 25 063,25 *(8,51 %)* | 26 684,68 *(8,63 %)* | 26 684,68 *(8,22 %)* |
| \  Dotations aux amortissements | 3 417,20 *(1,16 %)* | 3 417,20 *(1,10 %)* | 3 417,20 *(1,05 %)* |
| \  Impôts et taxes | 1 623,00 *(0,55 %)* | 1 978,00 *(0,64 %)* | 1 978,00 *(0,61 %)* |
| **= Total coûts fixes** | 66 550,45 *(22,59 %)* | 68 669,32 *(22,20 %)* | 69 209,47 *(21,31 %)* |
| **= Résultat courant avant impôt** | 147 689,60 *(50,13 %)* | 156 282,73 *(50,52 %)* | 166 990,19 *(51,41 %)* |

| **Seuil de rentabilité économique** | | | |
| **Seuil de rentabilité économique** | 91 512,13 | 94 425,74 | 95 168,49 |
| Excédent / insuffisance d'activité | 203 084,87 | 214 901,11 | 229 624,71 |
| Point mort (jours) | 113 j | 111 j | 107 j |

| **Seuil de rentabilité financier** | | | |
| \  + + Remboursement des emprunts (capital) | 8 092,26 | 9 172,43 | 9 546,14 |
| \  + + Impôt sur les sociétés | 962,35 | 1 270,77 | 1 847,18 |
| **Seuil de rentabilité financier** | 103 962,93 | 108 785,96 | 110 835,21 |
| Excédent / insuffisance d'activité | 190 634,07 | 200 540,89 | 213 957,99 |
| Point mort financier (jours) | 129 j | 128 j | 125 j |


## 2. Vérifications de cohérence


| Check | Statut | Détail |
| --- | :---: | --- |
| Total CV = Achats consommés (2026–2027) | ✅ | 80 356,95 ≟ 80 356,95 |
| Total CV = Achats consommés (2027–2028) | ✅ | 84 374,80 ≟ 84 374,80 |
| Total CV = Achats consommés (2028–2029) | ✅ | 88 593,54 ≟ 88 593,54 |
| Marge CV = Ventes+Prod − Total CV (2026–2027) | ✅ | 214 240,05 ≟ 214 240,05 |
| Marge CV = Ventes+Prod − Total CV (2027–2028) | ✅ | 224 952,05 ≟ 224 952,05 |
| Marge CV = Ventes+Prod − Total CV (2028–2029) | ✅ | 236 199,66 ≟ 236 199,66 |
| Taux marge CV = Marge CV / Ventes+Prod × 100 (2026–2027) | ✅ | 72,72 % ≟ 72,72 % |
| Taux marge CV = Marge CV / Ventes+Prod × 100 (2027–2028) | ✅ | 72,72 % ≟ 72,72 % |
| Taux marge CV = Marge CV / Ventes+Prod × 100 (2028–2029) | ✅ | 72,72 % ≟ 72,72 % |
| Total CF = Charges ext + Pers + Dot + Impôts (2026–2027) | ✅ | 66 550,45 ≟ 66 550,45 |
| Total CF = Charges ext + Pers + Dot + Impôts (2027–2028) | ✅ | 68 669,32 ≟ 68 669,32 |
| Total CF = Charges ext + Pers + Dot + Impôts (2028–2029) | ✅ | 69 209,47 ≟ 69 209,47 |
| Résultat = Ventes+Prod − Total CV − Total CF (2026–2027) | ✅ | 147 689,60 ≟ 147 689,60 |
| Résultat = Ventes+Prod − Total CV − Total CF (2027–2028) | ✅ | 156 282,73 ≟ 156 282,73 |
| Résultat = Ventes+Prod − Total CV − Total CF (2028–2029) | ✅ | 166 990,19 ≟ 166 990,19 |
| Seuil éco = Total CF / Taux MCV (2026–2027) | ✅ | 91 512,13 ≟ 91 512,13 |
| Seuil éco = Total CF / Taux MCV (2027–2028) | ✅ | 94 425,74 ≟ 94 425,74 |
| Seuil éco = Total CF / Taux MCV (2028–2029) | ✅ | 95 168,49 ≟ 95 168,49 |
| Excédent éco = Ventes+Prod − Seuil éco (2026–2027) | ✅ | 203 084,87 ≟ 203 084,87 |
| Excédent éco = Ventes+Prod − Seuil éco (2027–2028) | ✅ | 214 901,11 ≟ 214 901,11 |
| Excédent éco = Ventes+Prod − Seuil éco (2028–2029) | ✅ | 229 624,71 ≟ 229 624,71 |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2026–2027) | ✅ | 113 j ≟ 113 j |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2027–2028) | ✅ | 111 j ≟ 111 j |
| Point mort éco = Seuil éco / Ventes+Prod × 365 (2028–2029) | ✅ | 107 j ≟ 107 j |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2026–2027) | ✅ | 103 962,93 ≟ 103 962,93 |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2027–2028) | ✅ | 108 785,96 ≟ 108 785,96 |
| Seuil fin = (Total CF + Remb + IS) / Taux MCV (2028–2029) | ✅ | 110 835,21 ≟ 110 835,21 |
| Excédent fin = Ventes+Prod − Seuil fin (2026–2027) | ✅ | 190 634,07 ≟ 190 634,07 |
| Excédent fin = Ventes+Prod − Seuil fin (2027–2028) | ✅ | 200 540,89 ≟ 200 540,89 |
| Excédent fin = Ventes+Prod − Seuil fin (2028–2029) | ✅ | 213 957,99 ≟ 213 957,99 |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2026–2027) | ✅ | 129 j ≟ 129 j |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2027–2028) | ✅ | 128 j ≟ 128 j |
| Point mort fin = Seuil fin / Ventes+Prod × 365 (2028–2029) | ✅ | 125 j ≟ 125 j |
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
| IS (seuil) = isParAnnee (FC) (2026–2027) | ✅ | 962,35 ≟ 962,35 |
| IS (seuil) = isParAnnee (FC) (2027–2028) | ✅ | 1 270,77 ≟ 1 270,77 |
| IS (seuil) = isParAnnee (FC) (2028–2029) | ✅ | 1 847,18 ≟ 1 847,18 |


## 3. Détail par activité — Base d'activité


| Activité | Type | Taux marge | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: | ---: |
| Vente pizza | PRODUCTION_VENDUE | 73,00 % | 94 800,00 | 99 540,00 | 104 517,00 |
| Vente boisson | PRODUCTION_VENDUE | 65,00 % | 6 000,00 | 6 300,00 | 6 615,00 |
| Vente alcool | PRODUCTION_VENDUE | 65,00 % | 4 197,00 | 4 406,85 | 4 627,19 |
| Vente pizza (copie) | PRODUCTION_VENDUE | 73,00 % | 90 850,00 | 95 392,50 | 100 162,13 |
| Vente pizza (copie) (copie) | PRODUCTION_VENDUE | 73,00 % | 98 750,00 | 103 687,50 | 108 871,88 |
| **Ventes + Production totale** | | | **294 597,00** | **309 326,85** | **324 793,20** |


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
| Ventes + Production | 294 597,00 | 309 326,85 | 324 793,20 |
| Coûts variables | 80 356,95 | 84 374,80 | 88 593,54 |
| **Marge sur coût variable** | **214 240,05** | **224 952,05** | **236 199,66** |
| Taux de marge / CV | 72,72 % | 72,72 % | 72,72 % |
| Coûts fixes | 66 550,45 | 68 669,32 | 69 209,47 |
| **Résultat courant** | **147 689,60** | **156 282,73** | **166 990,19** |
| **Seuil éco** | **91 512,13** | **94 425,74** | **95 168,49** |
| Excédent éco | 203 084,87 | 214 901,11 | 229 624,71 |
| Point mort éco | 113 j | 111 j | 107 j |
| **Seuil fin** | **103 962,93** | **108 785,96** | **110 835,21** |
| Excédent fin | 190 634,07 | 200 540,89 | 213 957,99 |
| Point mort fin | 129 j | 128 j | 125 j |

# Diagnostic Ratios financiers — Dossier `cmmjoradm0001kohp15on2xe1`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`buildRatiosRows` · `calcBfr` · `calcImmosBilan` · `calcApportsCumulatifs`
`calcEmpruntsPassif` · `calcTresorerieBilan` · `calcCapitauxPropres` · `buildFinCalc`


## 0. Paramètres généraux

| Paramètre | Valeur |
| --- | --- |
| Dossier ID | `cmmjoradm0001kohp15on2xe1` |
| Date de démarrage | 01/05/2026 |
| Exercices | 2026–2027 · 2027–2028 · 2028–2029 |
| Activités actives | 5 |
| Emprunts | 1 |
| Immobilisations actives | 12 |
| Apports | 2 |


## 1. Tableau des ratios complet


| Ratio | Unité | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: |
| Délai des stocks de matières | jours | 5,8 | 5,5 | 5,5 |
| Délai des dettes fournisseurs | jours | 29,0 | 29,5 | 29,5 |
| Autonomie financière à long terme | % | 25,8 | 33,6 | 43,7 |
| Solvabilité à moyen terme | % | 134,9 | 150,6 | 177,6 |
| Solvabilité à court terme | % | 231,7 | 235,8 | 265,0 |
| Taux d'endettement | % | 286,9 | 197,7 | 128,8 |
| Capacité de remboursement | années | 6,98 | 4,97 | 3,11 |


## 2. Valeurs intermédiaires (bases de calcul)


| Indicateur | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Achats annuels bruts (€) | 80 356,95 | 84 374,80 | 88 593,54 |
| Achats consommés (€) | 79 058,24 | 84 397,54 | 88 529,74 |
| Stocks matières (€) | 1 298,71 | 1 275,97 | 1 339,76 |
| Dettes fournisseurs (€) | 6 492,59 | 6 817,86 | 7 158,76 |
| Dettes exploitation (€) | 11 105,16 | 11 829,74 | 12 370,02 |
| Capital restant dû (€) | 61 907,74 | 52 735,31 | 43 189,17 |
| Total dettes (€) | 73 012,90 | 64 565,05 | 55 559,19 |
| Immo nette fin exercice (€) | 72 737,79 | 69 320,59 | 65 903,39 |
| Trésorerie nette (€) | 24 401,89 | 26 622,80 | 31 437,69 |
| Actif circulant (€) | 25 700,59 | 27 898,76 | 32 777,46 |
| Total actif (€) | 98 438,39 | 97 219,36 | 98 680,85 |
| Capitaux propres (€) | 25 453,29 | 32 654,30 | 43 121,67 |
| CAF (€) | 8 870,49 | 10 618,21 | 13 884,56 |


## 3. Vérifications de cohérence


| # | Vérification | Statut | Détail |
| --- | --- | --- | --- |
| 1 | [2026–2027] Délai stocks = stocks×365 / achatsConsommés | ❌ | `5,8 ≟ 6,0 j` |
| 2 | [2026–2027] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ❌ | `29,0 ≟ 29,5 j` |
| 3 | [2026–2027] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `25,8 ≟ 25,9 %` |
| 4 | [2026–2027] Solvabilité MT = totalActif×100 / totalDettes | ❌ | `134,9 ≟ 134,8 %` |
| 5 | [2026–2027] Solvabilité CT = actifCirculant×100 / detteExpl | ❌ | `231,7 ≟ 231,4 %` |
| 6 | [2026–2027] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `286,9 ≟ 286,9 %` |
| 7 | [2026–2027] Capacité remboursement = capitalRestantDu / CAF | ✅ | `6,98 ≟ 6,98 ans` |
| 8 | [2027–2028] Délai stocks = stocks×365 / achatsConsommés | ✅ | `5,5 ≟ 5,5 j` |
| 9 | [2027–2028] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ✅ | `29,5 ≟ 29,5 j` |
| 10 | [2027–2028] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `33,6 ≟ 33,6 %` |
| 11 | [2027–2028] Solvabilité MT = totalActif×100 / totalDettes | ✅ | `150,6 ≟ 150,6 %` |
| 12 | [2027–2028] Solvabilité CT = actifCirculant×100 / detteExpl | ✅ | `235,8 ≟ 235,8 %` |
| 13 | [2027–2028] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `197,7 ≟ 197,7 %` |
| 14 | [2027–2028] Capacité remboursement = capitalRestantDu / CAF | ✅ | `4,97 ≟ 4,97 ans` |
| 15 | [2028–2029] Délai stocks = stocks×365 / achatsConsommés | ✅ | `5,5 ≟ 5,5 j` |
| 16 | [2028–2029] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ❌ | `29,5 ≟ 29,5 j` |
| 17 | [2028–2029] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `43,7 ≟ 43,7 %` |
| 18 | [2028–2029] Solvabilité MT = totalActif×100 / totalDettes | ✅ | `177,6 ≟ 177,6 %` |
| 19 | [2028–2029] Solvabilité CT = actifCirculant×100 / detteExpl | ✅ | `265,0 ≟ 265,0 %` |
| 20 | [2028–2029] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `128,8 ≟ 128,8 %` |
| 21 | [2028–2029] Capacité remboursement = capitalRestantDu / CAF | ✅ | `3,11 ≟ 3,11 ans` |
| 22 | [2026–2027] Actif circulant = stocks + max(0, trésorerie) | ✅ | `25 700,59 ≟ 25 700,59` |
| 23 | [2026–2027] Total actif = immo nette + actif circulant | ✅ | `98 438,39 ≟ 98 438,39` |
| 24 | [2026–2027] Total dettes = capital restant dû + dettes exploitation | ✅ | `73 012,90 ≟ 73 012,90` |
| 25 | [2027–2028] Actif circulant = stocks + max(0, trésorerie) | ✅ | `27 898,76 ≟ 27 898,76` |
| 26 | [2027–2028] Total actif = immo nette + actif circulant | ✅ | `97 219,36 ≟ 97 219,36` |
| 27 | [2027–2028] Total dettes = capital restant dû + dettes exploitation | ✅ | `64 565,05 ≟ 64 565,05` |
| 28 | [2028–2029] Actif circulant = stocks + max(0, trésorerie) | ✅ | `32 777,46 ≟ 32 777,46` |
| 29 | [2028–2029] Total actif = immo nette + actif circulant | ✅ | `98 680,85 ≟ 98 680,85` |
| 30 | [2028–2029] Total dettes = capital restant dû + dettes exploitation | ✅ | `55 559,19 ≟ 55 559,19` |

**Total : 25 OK, 5 KO sur 30 vérifications.**


## 4. Détail achats et stocks par activité


| Activité | Coef TTC | Stock (j) | Montant N (€) | Montant N+1 (€) | Montant N+2 (€) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Vente pizza | 0.2700 | 15 | 94 800,00 | 99 540,00 | 104 517,00 |
| Vente boisson | 0.3500 | 15 | 6 000,00 | 6 300,00 | 6 615,00 |
| Vente alcool | 0.3500 | 15 | 4 197,00 | 4 406,85 | 4 627,19 |
| Vente pizza (copie) | 0.2700 | 15 | 90 850,00 | 95 392,50 | 100 162,13 |
| Vente pizza (copie) (copie) | 0.2700 | 15 | 98 750,00 | 103 687,50 | 108 871,88 |


### Achats annuels et consommés (récap)


| Exercice | Achats annuels bruts (€) | Stocks (€) | Achats consommés (€) |
| --- | ---: | ---: | ---: |
| 2026–2027 | 80 356,95 | 1 298,71 | 79 058,24 |
| 2027–2028 | 84 374,80 | 1 275,97 | 84 397,54 |
| 2028–2029 | 88 593,54 | 1 339,76 | 88 529,74 |


## 5. Récapitulatif


| Ratio | Unité | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: |
| **Délai des stocks de matières** | jours | **5,8** | **5,5** | **5,5** |
| **Délai des dettes fournisseurs** | jours | **29,0** | **29,5** | **29,5** |
| **Autonomie financière à long terme** | % | **25,8** | **33,6** | **43,7** |
| **Solvabilité à moyen terme** | % | **134,9** | **150,6** | **177,6** |
| **Solvabilité à court terme** | % | **231,7** | **235,8** | **265,0** |
| **Taux d'endettement** | % | **286,9** | **197,7** | **128,8** |
| **Capacité de remboursement** | années | **6,98** | **4,97** | **3,11** |

**Score : 25/30 checks OK — ⚠ 5 anomalie(s) détectée(s)**

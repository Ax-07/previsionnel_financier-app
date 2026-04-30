# Diagnostic Ratios financiers — Dossier `cmo8p96h40001schp26dfdknv`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`buildRatiosRows` · `calcBfr` · `calcImmosBilan` · `calcApportsCumulatifs`
`calcEmpruntsPassif` · `calcTresorerieBilan` · `calcCapitauxPropres` · `buildFinCalc`


## 0. Paramètres généraux

| Paramètre | Valeur |
| --- | --- |
| Dossier ID | `cmo8p96h40001schp26dfdknv` |
| Date de démarrage | 01/05/2026 |
| Exercices | 2026–2027 · 2027–2028 · 2028–2029 |
| Activités actives | 9 |
| Emprunts | 1 |
| Immobilisations actives | 13 |
| Apports | 2 |


## 1. Tableau des ratios complet


| Ratio | Unité | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: |
| Délai des stocks de matières | jours | 15,6 | 15,2 | 15,2 |
| Délai des dettes fournisseurs | jours | 28,4 | 29,6 | 29,6 |
| Autonomie financière à long terme | % | 36,9 | 50,9 | 63,3 |
| Solvabilité à moyen terme | % | 158,6 | 203,9 | 272,2 |
| Solvabilité à court terme | % | 481,0 | 661,8 | 871,5 |
| Taux d'endettement | % | 170,7 | 96,3 | 58,1 |
| Capacité de remboursement | années | 2,56 | 2,03 | 1,48 |


## 2. Valeurs intermédiaires (bases de calcul)


| Indicateur | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Achats annuels bruts (€) | 29 164,95 | 30 623,20 | 32 154,36 |
| Achats consommés (€) | 27 866,24 | 30 645,94 | 32 090,56 |
| Stocks matières (€) | 1 298,71 | 1 275,97 | 1 339,76 |
| Dettes fournisseurs (€) | 2 366,41 | 2 485,38 | 2 609,65 |
| Dettes exploitation (€) | 7 653,98 | 8 172,26 | 8 495,90 |
| Capital restant dû (€) | 61 907,74 | 52 735,31 | 43 189,17 |
| Total dettes (€) | 69 561,72 | 60 907,57 | 51 685,07 |
| Immo nette fin exercice (€) | 73 496,79 | 70 079,59 | 66 662,39 |
| Trésorerie nette (€) | 35 339,91 | 52 806,31 | 72 704,58 |
| Actif circulant (€) | 36 638,61 | 54 082,28 | 74 044,35 |
| Total actif (€) | 110 135,40 | 124 161,87 | 140 706,74 |
| Capitaux propres (€) | 40 753,29 | 63 254,30 | 89 021,67 |
| CAF (€) | 24 170,49 | 25 918,21 | 29 184,56 |


## 3. Vérifications de cohérence


| # | Vérification | Statut | Détail |
| --- | --- | --- | --- |
| 1 | [2026–2027] Délai stocks = stocks×365 / achatsConsommés | ❌ | `15,6 ≟ 17,0 j` |
| 2 | [2026–2027] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ❌ | `28,4 ≟ 29,6 j` |
| 3 | [2026–2027] Autonomie LT = capitauxPropres×100 / totalActif | ❌ | `36,9 ≟ 37,0 %` |
| 4 | [2026–2027] Solvabilité MT = totalActif×100 / totalDettes | ❌ | `158,6 ≟ 158,3 %` |
| 5 | [2026–2027] Solvabilité CT = actifCirculant×100 / detteExpl | ❌ | `481,0 ≟ 478,7 %` |
| 6 | [2026–2027] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `170,7 ≟ 170,7 %` |
| 7 | [2026–2027] Capacité remboursement = capitalRestantDu / CAF | ✅ | `2,56 ≟ 2,56 ans` |
| 8 | [2027–2028] Délai stocks = stocks×365 / achatsConsommés | ❌ | `15,2 ≟ 15,2 j` |
| 9 | [2027–2028] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ❌ | `29,6 ≟ 29,6 j` |
| 10 | [2027–2028] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `50,9 ≟ 50,9 %` |
| 11 | [2027–2028] Solvabilité MT = totalActif×100 / totalDettes | ✅ | `203,9 ≟ 203,9 %` |
| 12 | [2027–2028] Solvabilité CT = actifCirculant×100 / detteExpl | ✅ | `661,8 ≟ 661,8 %` |
| 13 | [2027–2028] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `96,3 ≟ 96,3 %` |
| 14 | [2027–2028] Capacité remboursement = capitalRestantDu / CAF | ✅ | `2,03 ≟ 2,03 ans` |
| 15 | [2028–2029] Délai stocks = stocks×365 / achatsConsommés | ❌ | `15,2 ≟ 15,2 j` |
| 16 | [2028–2029] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ❌ | `29,6 ≟ 29,6 j` |
| 17 | [2028–2029] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `63,3 ≟ 63,3 %` |
| 18 | [2028–2029] Solvabilité MT = totalActif×100 / totalDettes | ✅ | `272,2 ≟ 272,2 %` |
| 19 | [2028–2029] Solvabilité CT = actifCirculant×100 / detteExpl | ✅ | `871,5 ≟ 871,5 %` |
| 20 | [2028–2029] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `58,1 ≟ 58,1 %` |
| 21 | [2028–2029] Capacité remboursement = capitalRestantDu / CAF | ✅ | `1,48 ≟ 1,48 ans` |
| 22 | [2026–2027] Actif circulant = stocks + max(0, trésorerie) | ✅ | `36 638,61 ≟ 36 638,61` |
| 23 | [2026–2027] Total actif = immo nette + actif circulant | ✅ | `110 135,40 ≟ 110 135,40` |
| 24 | [2026–2027] Total dettes = capital restant dû + dettes exploitation | ✅ | `69 561,72 ≟ 69 561,72` |
| 25 | [2027–2028] Actif circulant = stocks + max(0, trésorerie) | ✅ | `54 082,28 ≟ 54 082,28` |
| 26 | [2027–2028] Total actif = immo nette + actif circulant | ✅ | `124 161,87 ≟ 124 161,87` |
| 27 | [2027–2028] Total dettes = capital restant dû + dettes exploitation | ✅ | `60 907,57 ≟ 60 907,57` |
| 28 | [2028–2029] Actif circulant = stocks + max(0, trésorerie) | ✅ | `74 044,35 ≟ 74 044,35` |
| 29 | [2028–2029] Total actif = immo nette + actif circulant | ✅ | `140 706,74 ≟ 140 706,74` |
| 30 | [2028–2029] Total dettes = capital restant dû + dettes exploitation | ✅ | `51 685,07 ≟ 51 685,07` |

**Total : 21 OK, 9 KO sur 30 vérifications.**


## 4. Détail achats et stocks par activité


| Activité | Coef TTC | Stock (j) | Montant N (€) | Montant N+1 (€) | Montant N+2 (€) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Vente pizza | 0.2700 | 15 | 94 800,00 | 99 540,00 | 104 517,00 |
| Vente boisson | 0.3500 | 15 | 6 000,00 | 6 300,00 | 6 615,00 |
| Vente alcool | 0.3500 | 15 | 4 197,00 | 4 406,85 | 4 627,19 |


### Achats annuels et consommés (récap)


| Exercice | Achats annuels bruts (€) | Stocks (€) | Achats consommés (€) |
| --- | ---: | ---: | ---: |
| 2026–2027 | 29 164,95 | 1 298,71 | 27 866,24 |
| 2027–2028 | 30 623,20 | 1 275,97 | 30 645,94 |
| 2028–2029 | 32 154,36 | 1 339,76 | 32 090,56 |


## 5. Récapitulatif


| Ratio | Unité | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: |
| **Délai des stocks de matières** | jours | **15,6** | **15,2** | **15,2** |
| **Délai des dettes fournisseurs** | jours | **28,4** | **29,6** | **29,6** |
| **Autonomie financière à long terme** | % | **36,9** | **50,9** | **63,3** |
| **Solvabilité à moyen terme** | % | **158,6** | **203,9** | **272,2** |
| **Solvabilité à court terme** | % | **481,0** | **661,8** | **871,5** |
| **Taux d'endettement** | % | **170,7** | **96,3** | **58,1** |
| **Capacité de remboursement** | années | **2,56** | **2,03** | **1,48** |

**Score : 21/30 checks OK — ⚠ 9 anomalie(s) détectée(s)**

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
| Activités actives | 3 |
| Emprunts | 1 |
| Immobilisations actives | 12 |
| Apports | 3 |


## 1. Tableau des ratios complet


| Ratio | Unité | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: |
| Délai des stocks de matières | jours | 15,9 | 15,2 | 15,2 |
| Délai des dettes fournisseurs | jours | 14,8 | 14,8 | 14,8 |
| Autonomie financière à long terme | % | 30,9 | 37,6 | 47,5 |
| Solvabilité à moyen terme | % | 143,1 | 160,2 | 190,3 |
| Solvabilité à court terme | % | 408,4 | 400,9 | 442,1 |
| Taux d'endettement | % | 226,4 | 166,1 | 110,7 |
| Capacité de remboursement | années | 5,59 | 5,25 | 3,08 |


## 2. Valeurs intermédiaires (bases de calcul)


| Indicateur | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Achats annuels bruts (€) | 28 341,20 | 29 758,26 | 31 246,17 |
| Achats consommés (€) | 27 160,32 | 29 699,22 | 31 184,18 |
| Stocks matières (€) | 1 180,88 | 1 239,93 | 1 301,92 |
| Dettes fournisseurs (€) | 1 150,17 | 1 207,68 | 1 268,06 |
| Dettes exploitation (€) | 5 589,61 | 6 187,72 | 6 560,21 |
| Capital restant dû (€) | 53 063,76 | 45 201,68 | 37 019,26 |
| Total dettes (€) | 58 653,37 | 51 389,40 | 43 579,47 |
| Immo nette fin exercice (€) | 61 097,30 | 57 513,60 | 53 929,90 |
| Trésorerie nette (€) | 21 647,25 | 23 568,75 | 27 698,05 |
| Actif circulant (€) | 22 828,13 | 24 808,68 | 28 999,97 |
| Total actif (€) | 83 925,43 | 82 322,28 | 82 929,87 |
| Capitaux propres (€) | 25 904,02 | 30 932,88 | 39 350,40 |
| CAF (€) | 9 487,72 | 8 612,55 | 12 001,22 |


## 3. Vérifications de cohérence


| # | Vérification | Statut | Détail |
| --- | --- | --- | --- |
| 1 | [2026–2027] Délai stocks = stocks×365 / achatsConsommés | ✅ | `15,9 ≟ 15,9 j` |
| 2 | [2026–2027] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ✅ | `14,8 ≟ 14,8 j` |
| 3 | [2026–2027] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `30,9 ≟ 30,9 %` |
| 4 | [2026–2027] Solvabilité MT = totalActif×100 / totalDettes | ✅ | `143,1 ≟ 143,1 %` |
| 5 | [2026–2027] Solvabilité CT = actifCirculant×100 / detteExpl | ✅ | `408,4 ≟ 408,4 %` |
| 6 | [2026–2027] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `226,4 ≟ 226,4 %` |
| 7 | [2026–2027] Capacité remboursement = capitalRestantDu / CAF | ✅ | `5,59 ≟ 5,59 ans` |
| 8 | [2027–2028] Délai stocks = stocks×365 / achatsConsommés | ✅ | `15,2 ≟ 15,2 j` |
| 9 | [2027–2028] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ✅ | `14,8 ≟ 14,8 j` |
| 10 | [2027–2028] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `37,6 ≟ 37,6 %` |
| 11 | [2027–2028] Solvabilité MT = totalActif×100 / totalDettes | ✅ | `160,2 ≟ 160,2 %` |
| 12 | [2027–2028] Solvabilité CT = actifCirculant×100 / detteExpl | ✅ | `400,9 ≟ 400,9 %` |
| 13 | [2027–2028] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `166,1 ≟ 166,1 %` |
| 14 | [2027–2028] Capacité remboursement = capitalRestantDu / CAF | ✅ | `5,25 ≟ 5,25 ans` |
| 15 | [2028–2029] Délai stocks = stocks×365 / achatsConsommés | ✅ | `15,2 ≟ 15,2 j` |
| 16 | [2028–2029] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ✅ | `14,8 ≟ 14,8 j` |
| 17 | [2028–2029] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `47,5 ≟ 47,5 %` |
| 18 | [2028–2029] Solvabilité MT = totalActif×100 / totalDettes | ✅ | `190,3 ≟ 190,3 %` |
| 19 | [2028–2029] Solvabilité CT = actifCirculant×100 / detteExpl | ✅ | `442,1 ≟ 442,1 %` |
| 20 | [2028–2029] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `110,7 ≟ 110,7 %` |
| 21 | [2028–2029] Capacité remboursement = capitalRestantDu / CAF | ✅ | `3,08 ≟ 3,08 ans` |
| 22 | [2026–2027] Actif circulant = stocks + max(0, trésorerie) | ✅ | `22 828,13 ≟ 22 828,13` |
| 23 | [2026–2027] Total actif = immo nette + actif circulant | ✅ | `83 925,43 ≟ 83 925,43` |
| 24 | [2026–2027] Total dettes = capital restant dû + dettes exploitation | ✅ | `58 653,37 ≟ 58 653,37` |
| 25 | [2027–2028] Actif circulant = stocks + max(0, trésorerie) | ✅ | `24 808,68 ≟ 24 808,68` |
| 26 | [2027–2028] Total actif = immo nette + actif circulant | ✅ | `82 322,28 ≟ 82 322,28` |
| 27 | [2027–2028] Total dettes = capital restant dû + dettes exploitation | ✅ | `51 389,40 ≟ 51 389,40` |
| 28 | [2028–2029] Actif circulant = stocks + max(0, trésorerie) | ✅ | `28 999,97 ≟ 28 999,97` |
| 29 | [2028–2029] Total actif = immo nette + actif circulant | ✅ | `82 929,87 ≟ 82 929,87` |
| 30 | [2028–2029] Total dettes = capital restant dû + dettes exploitation | ✅ | `43 579,47 ≟ 43 579,47` |

**Total : 30 OK, 0 KO sur 30 vérifications.**


## 4. Détail achats et stocks par activité


| Activité | Coef TTC | Stock (j) | Montant N (€) | Montant N+1 (€) | Montant N+2 (€) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Vente pizza | 0.2700 | 15 | 96 955,00 | 101 802,75 | 106 892,89 |
| Vente boisson | 0.3500 | 15 | 2 060,00 | 2 163,00 | 2 271,15 |
| Vente alcool | 0.3500 | 15 | 4 121,00 | 4 327,05 | 4 543,40 |


### Achats annuels et consommés (récap)


| Exercice | Achats annuels bruts (€) | Stocks (€) | Achats consommés (€) |
| --- | ---: | ---: | ---: |
| 2026–2027 | 28 341,20 | 1 180,88 | 27 160,32 |
| 2027–2028 | 29 758,26 | 1 239,93 | 29 699,22 |
| 2028–2029 | 31 246,17 | 1 301,92 | 31 184,18 |


## 5. Récapitulatif


| Ratio | Unité | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: |
| **Délai des stocks de matières** | jours | **15,9** | **15,2** | **15,2** |
| **Délai des dettes fournisseurs** | jours | **14,8** | **14,8** | **14,8** |
| **Autonomie financière à long terme** | % | **30,9** | **37,6** | **47,5** |
| **Solvabilité à moyen terme** | % | **143,1** | **160,2** | **190,3** |
| **Solvabilité à court terme** | % | **408,4** | **400,9** | **442,1** |
| **Taux d'endettement** | % | **226,4** | **166,1** | **110,7** |
| **Capacité de remboursement** | années | **5,59** | **5,25** | **3,08** |

**Score : 30/30 checks OK — ✅ aucune anomalie**

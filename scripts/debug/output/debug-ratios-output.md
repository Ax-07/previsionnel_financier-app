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
| Apports | 2 |


## 1. Tableau des ratios complet


| Ratio | Unité | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: |
| Délai des stocks de matières | jours | 15,6 | 15,2 | 15,2 |
| Délai des dettes fournisseurs | jours | 28,4 | 29,6 | 29,6 |
| Autonomie financière à long terme | % | 29,4 | 38,0 | 48,9 |
| Solvabilité à moyen terme | % | 141,7 | 161,4 | 195,6 |
| Solvabilité à court terme | % | 320,9 | 342,9 | 406,7 |
| Taux d'endettement | % | 239,6 | 163,0 | 104,6 |
| Capacité de remboursement | années | 6,27 | 4,22 | 2,65 |


## 2. Valeurs intermédiaires (bases de calcul)


| Indicateur | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Achats annuels bruts (€) | 29 164,95 | 30 623,20 | 32 154,36 |
| Achats consommés (€) | 27 866,24 | 30 645,94 | 32 090,56 |
| Stocks matières (€) | 1 298,71 | 1 275,97 | 1 339,76 |
| Dettes fournisseurs (€) | 2 366,41 | 2 485,38 | 2 609,65 |
| Dettes exploitation (€) | 6 961,12 | 7 501,28 | 7 824,27 |
| Capital restant dû (€) | 53 063,76 | 45 201,68 | 37 019,26 |
| Total dettes (€) | 60 024,88 | 52 702,96 | 44 843,53 |
| Immo nette fin exercice (€) | 62 737,79 | 59 320,59 | 55 903,39 |
| Trésorerie nette (€) | 21 009,05 | 24 447,02 | 30 484,76 |
| Actif circulant (€) | 22 307,76 | 25 722,98 | 31 824,52 |
| Total actif (€) | 85 045,55 | 85 043,58 | 87 727,91 |
| Capitaux propres (€) | 25 048,48 | 32 340,62 | 42 884,38 |
| CAF (€) | 8 465,68 | 10 709,33 | 13 960,96 |


## 3. Vérifications de cohérence


| # | Vérification | Statut | Détail |
| --- | --- | --- | --- |
| 1 | [2026–2027] Délai stocks = stocks×365 / achatsConsommés | ❌ | `15,6 ≟ 17,0 j` |
| 2 | [2026–2027] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ❌ | `28,4 ≟ 29,6 j` |
| 3 | [2026–2027] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `29,4 ≟ 29,5 %` |
| 4 | [2026–2027] Solvabilité MT = totalActif×100 / totalDettes | ❌ | `141,7 ≟ 141,7 %` |
| 5 | [2026–2027] Solvabilité CT = actifCirculant×100 / detteExpl | ❌ | `320,9 ≟ 320,5 %` |
| 6 | [2026–2027] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `239,6 ≟ 239,6 %` |
| 7 | [2026–2027] Capacité remboursement = capitalRestantDu / CAF | ✅ | `6,27 ≟ 6,27 ans` |
| 8 | [2027–2028] Délai stocks = stocks×365 / achatsConsommés | ❌ | `15,2 ≟ 15,2 j` |
| 9 | [2027–2028] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ❌ | `29,6 ≟ 29,6 j` |
| 10 | [2027–2028] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `38,0 ≟ 38,0 %` |
| 11 | [2027–2028] Solvabilité MT = totalActif×100 / totalDettes | ✅ | `161,4 ≟ 161,4 %` |
| 12 | [2027–2028] Solvabilité CT = actifCirculant×100 / detteExpl | ✅ | `342,9 ≟ 342,9 %` |
| 13 | [2027–2028] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `163,0 ≟ 163,0 %` |
| 14 | [2027–2028] Capacité remboursement = capitalRestantDu / CAF | ✅ | `4,22 ≟ 4,22 ans` |
| 15 | [2028–2029] Délai stocks = stocks×365 / achatsConsommés | ❌ | `15,2 ≟ 15,2 j` |
| 16 | [2028–2029] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ❌ | `29,6 ≟ 29,6 j` |
| 17 | [2028–2029] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `48,9 ≟ 48,9 %` |
| 18 | [2028–2029] Solvabilité MT = totalActif×100 / totalDettes | ✅ | `195,6 ≟ 195,6 %` |
| 19 | [2028–2029] Solvabilité CT = actifCirculant×100 / detteExpl | ✅ | `406,7 ≟ 406,7 %` |
| 20 | [2028–2029] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `104,6 ≟ 104,6 %` |
| 21 | [2028–2029] Capacité remboursement = capitalRestantDu / CAF | ✅ | `2,65 ≟ 2,65 ans` |
| 22 | [2026–2027] Actif circulant = stocks + max(0, trésorerie) | ✅ | `22 307,76 ≟ 22 307,76` |
| 23 | [2026–2027] Total actif = immo nette + actif circulant | ✅ | `85 045,55 ≟ 85 045,55` |
| 24 | [2026–2027] Total dettes = capital restant dû + dettes exploitation | ✅ | `60 024,88 ≟ 60 024,88` |
| 25 | [2027–2028] Actif circulant = stocks + max(0, trésorerie) | ✅ | `25 722,98 ≟ 25 722,98` |
| 26 | [2027–2028] Total actif = immo nette + actif circulant | ✅ | `85 043,58 ≟ 85 043,58` |
| 27 | [2027–2028] Total dettes = capital restant dû + dettes exploitation | ✅ | `52 702,96 ≟ 52 702,96` |
| 28 | [2028–2029] Actif circulant = stocks + max(0, trésorerie) | ✅ | `31 824,52 ≟ 31 824,52` |
| 29 | [2028–2029] Total actif = immo nette + actif circulant | ✅ | `87 727,91 ≟ 87 727,91` |
| 30 | [2028–2029] Total dettes = capital restant dû + dettes exploitation | ✅ | `44 843,53 ≟ 44 843,53` |

**Total : 22 OK, 8 KO sur 30 vérifications.**


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
| **Autonomie financière à long terme** | % | **29,4** | **38,0** | **48,9** |
| **Solvabilité à moyen terme** | % | **141,7** | **161,4** | **195,6** |
| **Solvabilité à court terme** | % | **320,9** | **342,9** | **406,7** |
| **Taux d'endettement** | % | **239,6** | **163,0** | **104,6** |
| **Capacité de remboursement** | années | **6,27** | **4,22** | **2,65** |

**Score : 22/30 checks OK — ⚠ 8 anomalie(s) détectée(s)**

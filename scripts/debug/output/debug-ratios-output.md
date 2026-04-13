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
| Délai des stocks de matières | jours | 15,5 | 15,2 | 15,2 |
| Délai des dettes fournisseurs | jours | 28,3 | 29,6 | 29,6 |
| Autonomie financière à long terme | % | 28,9 | 39,1 | 50,8 |
| Solvabilité à moyen terme | % | 140,7 | 164,2 | 203,3 |
| Solvabilité à court terme | % | 334,6 | 384,7 | 471,1 |
| Taux d'endettement | % | 245,7 | 155,7 | 96,8 |
| Capacité de remboursement | années | 5,32 | 3,74 | 2,45 |


## 2. Valeurs intermédiaires (bases de calcul)


| Indicateur | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: |
| Achats annuels bruts (€) | 30 931,45 | 32 478,02 | 34 101,92 |
| Achats consommés (€) | 29 559,16 | 32 497,06 | 34 034,26 |
| Stocks matières (€) | 1 372,29 | 1 353,25 | 1 420,91 |
| Dettes fournisseurs (€) | 2 508,87 | 2 634,88 | 2 766,62 |
| Dettes exploitation (€) | 7 409,41 | 7 840,60 | 8 183,70 |
| Capital restant dû (€) | 61 907,74 | 52 735,31 | 43 189,17 |
| Total dettes (€) | 69 317,15 | 60 575,91 | 51 372,87 |
| Immo nette fin exercice (€) | 72 737,79 | 69 320,59 | 65 903,39 |
| Trésorerie nette (€) | 23 423,08 | 28 807,49 | 37 136,14 |
| Actif circulant (€) | 24 795,37 | 30 160,74 | 38 557,05 |
| Total actif (€) | 97 533,16 | 99 481,33 | 104 460,45 |
| Capitaux propres (€) | 28 216,01 | 38 905,43 | 53 087,57 |
| CAF (€) | 11 633,21 | 14 106,62 | 17 599,34 |


## 3. Vérifications de cohérence


| # | Vérification | Statut | Détail |
| --- | --- | --- | --- |
| 1 | [2026–2027] Délai stocks = stocks×365 / achatsConsommés | ❌ | `15,5 ≟ 16,9 j` |
| 2 | [2026–2027] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ❌ | `28,3 ≟ 29,6 j` |
| 3 | [2026–2027] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `28,9 ≟ 28,9 %` |
| 4 | [2026–2027] Solvabilité MT = totalActif×100 / totalDettes | ✅ | `140,7 ≟ 140,7 %` |
| 5 | [2026–2027] Solvabilité CT = actifCirculant×100 / detteExpl | ✅ | `334,6 ≟ 334,6 %` |
| 6 | [2026–2027] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `245,7 ≟ 245,7 %` |
| 7 | [2026–2027] Capacité remboursement = capitalRestantDu / CAF | ✅ | `5,32 ≟ 5,32 ans` |
| 8 | [2027–2028] Délai stocks = stocks×365 / achatsConsommés | ❌ | `15,2 ≟ 15,2 j` |
| 9 | [2027–2028] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ❌ | `29,6 ≟ 29,6 j` |
| 10 | [2027–2028] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `39,1 ≟ 39,1 %` |
| 11 | [2027–2028] Solvabilité MT = totalActif×100 / totalDettes | ✅ | `164,2 ≟ 164,2 %` |
| 12 | [2027–2028] Solvabilité CT = actifCirculant×100 / detteExpl | ✅ | `384,7 ≟ 384,7 %` |
| 13 | [2027–2028] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `155,7 ≟ 155,7 %` |
| 14 | [2027–2028] Capacité remboursement = capitalRestantDu / CAF | ✅ | `3,74 ≟ 3,74 ans` |
| 15 | [2028–2029] Délai stocks = stocks×365 / achatsConsommés | ❌ | `15,2 ≟ 15,2 j` |
| 16 | [2028–2029] Délai fournisseurs = dettesFourn×365 / achatsAnnuels | ❌ | `29,6 ≟ 29,6 j` |
| 17 | [2028–2029] Autonomie LT = capitauxPropres×100 / totalActif | ✅ | `50,8 ≟ 50,8 %` |
| 18 | [2028–2029] Solvabilité MT = totalActif×100 / totalDettes | ✅ | `203,3 ≟ 203,3 %` |
| 19 | [2028–2029] Solvabilité CT = actifCirculant×100 / detteExpl | ✅ | `471,1 ≟ 471,1 %` |
| 20 | [2028–2029] Taux endettement = totalDettes×100 / capitauxPropres | ✅ | `96,8 ≟ 96,8 %` |
| 21 | [2028–2029] Capacité remboursement = capitalRestantDu / CAF | ✅ | `2,45 ≟ 2,45 ans` |
| 22 | [2026–2027] Actif circulant = stocks + max(0, trésorerie) | ✅ | `24 795,37 ≟ 24 795,37` |
| 23 | [2026–2027] Total actif = immo nette + actif circulant | ✅ | `97 533,16 ≟ 97 533,16` |
| 24 | [2026–2027] Total dettes = capital restant dû + dettes exploitation | ✅ | `69 317,15 ≟ 69 317,15` |
| 25 | [2027–2028] Actif circulant = stocks + max(0, trésorerie) | ✅ | `30 160,74 ≟ 30 160,74` |
| 26 | [2027–2028] Total actif = immo nette + actif circulant | ✅ | `99 481,33 ≟ 99 481,33` |
| 27 | [2027–2028] Total dettes = capital restant dû + dettes exploitation | ✅ | `60 575,91 ≟ 60 575,91` |
| 28 | [2028–2029] Actif circulant = stocks + max(0, trésorerie) | ✅ | `38 557,05 ≟ 38 557,05` |
| 29 | [2028–2029] Total actif = immo nette + actif circulant | ✅ | `104 460,45 ≟ 104 460,45` |
| 30 | [2028–2029] Total dettes = capital restant dû + dettes exploitation | ✅ | `51 372,87 ≟ 51 372,87` |

**Total : 24 OK, 6 KO sur 30 vérifications.**


## 4. Détail achats et stocks par activité


| Activité | Coef TTC | Stock (j) | Montant N (€) | Montant N+1 (€) | Montant N+2 (€) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Vente pizza | 0.2700 | 15 | 98 750,00 | 103 687,50 | 108 871,88 |
| Vente boisson | 0.3500 | 15 | 8 000,00 | 8 400,00 | 8 820,00 |
| Vente alcool | 0.3500 | 15 | 4 197,00 | 4 406,85 | 4 627,19 |


### Achats annuels et consommés (récap)


| Exercice | Achats annuels bruts (€) | Stocks (€) | Achats consommés (€) |
| --- | ---: | ---: | ---: |
| 2026–2027 | 30 931,45 | 1 372,29 | 29 559,16 |
| 2027–2028 | 32 478,02 | 1 353,25 | 32 497,06 |
| 2028–2029 | 34 101,92 | 1 420,91 | 34 034,26 |


## 5. Récapitulatif


| Ratio | Unité | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | --- | ---: | ---: | ---: |
| **Délai des stocks de matières** | jours | **15,5** | **15,2** | **15,2** |
| **Délai des dettes fournisseurs** | jours | **28,3** | **29,6** | **29,6** |
| **Autonomie financière à long terme** | % | **28,9** | **39,1** | **50,8** |
| **Solvabilité à moyen terme** | % | **140,7** | **164,2** | **203,3** |
| **Solvabilité à court terme** | % | **334,6** | **384,7** | **471,1** |
| **Taux d'endettement** | % | **245,7** | **155,7** | **96,8** |
| **Capacité de remboursement** | années | **5,32** | **3,74** | **2,45** |

**Score : 24/30 checks OK — ⚠ 6 anomalie(s) détectée(s)**

# Diagnostic BFR (Besoin en Fonds de Roulement) — Dossier `cmmjoradm0001kohp15on2xe1`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`calcBfr` · `buildBfrRows` · `buildFinCalc`


## 0. Paramètres généraux

| Paramètre | Valeur |
| --- | --- |
| Dossier ID | `cmmjoradm0001kohp15on2xe1` |
| Date de démarrage | 01/05/2026 |
| Mois de début | Mai (5) |
| Régime fiscal | IS |
| Régime TVA | REEL_NORMAL |
| Périodicité TVA | trimestriel |
| Délai paiement salaires | 1 mois |
| Exercices | Initial · 2026–2027 · 2027–2028 · 2028–2029 |
| Activités actives | 3 |
| dont commerce/production | 3 |
| Fournitures & services actifs | 22 |
| Salariés | 1 |
| Dirigeants | 1 |
| Emprunts | 1 |
| Immobilisations actives | 12 |


## 1. Tableau BFR complet


| Désignation | Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: | ---: |
| **BESOINS D'EXPLOITATION** | | | | |
| Stocks de matières | 1 500,00 | 1 180,88 | 1 239,93 | 1 301,92 |
| \  Vente pizza | 1 500,00 | 1 090,74 | 1 145,28 | 1 202,55 |
| \  Vente boisson | 0,00 | 30,04 | 31,54 | 33,12 |
| \  Vente alcool | 0,00 | 60,10 | 63,10 | 66,26 |
| Crédit de TVA | 2 406,70 | 631,96 | 0,00 | 0,00 |
| **= Total des besoins** | 3 906,70 | 1 812,85 | 1 239,93 | 1 301,92 |
| **RESSOURCES D'EXPLOITATION** | | | | |
| Dettes fournisseurs (achats matières) | 0,00 | 1 150,17 | 1 207,68 | 1 268,06 |
| \  Vente pizza | 0,00 | 1 054,99 | 1 107,74 | 1 163,13 |
| \  Vente boisson | 0,00 | 29,06 | 30,51 | 32,04 |
| \  Vente alcool | 0,00 | 66,12 | 69,42 | 72,89 |
| Dettes charges externes | 0,00 | 2 350,60 | 2 363,44 | 2 376,65 |
| \  Embalages | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Electricité | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Eau | 0,00 | 25,00 | 25,50 | 26,01 |
| \  Petit équimement | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Produits d'entretiens | 0,00 | 30,00 | 30,60 | 31,21 |
| \  Fournitures administratives | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Location immobilière | 0,00 | 1 512,60 | 1 512,60 | 1 512,60 |
| \  Location TPE + pp | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Frais de télécommunication | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Primes d'assurances | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Entretiens et réparations | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Honoraires comptable et juridiques | 0,00 | 280,00 | 285,60 | 291,31 |
| \  Honoraires juridiques | 0,00 | 60,00 | 63,00 | 66,15 |
| \  Publicité, publications | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Services bancaires | 0,00 | 58,40 | 59,57 | 60,76 |
| \  Frais divers | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Frais titre restaurant | 0,00 | 38,09 | 38,09 | 38,09 |
| \  Déplacements | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Vetements de travail | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Commission CB | 0,00 | 65,80 | 67,77 | 69,81 |
| \  Abonnement logiciel de caisse (airkitchen) | 0,00 | 0,00 | 0,00 | 0,00 |
| \  offerts | 0,00 | 280,71 | 280,71 | 280,71 |
| Dettes impôts et taxes | 0,00 | 0,00 | 0,00 | 0,00 |
| Dettes personnel | 0,00 | 1 828,38 | 2 282,06 | 2 282,06 |
| TVA à payer | 0,00 | 0,00 | 112,68 | 262,08 |
| Impôt sur les sociétés (dette) | 0,00 | 260,47 | 221,86 | 371,36 |
| **= Total des ressources** | 0,00 | 5 589,61 | 6 187,72 | 6 560,21 |
| Variation du BFR | 3 906,70 | -7 683,47 | -1 171,02 | -310,50 |
| **= Besoin en fonds de roulement (BFR)** | 3 906,70 | -3 776,77 | -4 947,79 | -5 258,29 |


## 2. Vérifications de cohérence


| Check | Statut | Détail |
| --- | :---: | --- |
| Stocks (UI) = calcBfr.stocksMatieres (Initial) | ✅ | 1 500,00 ≟ 1 500,00 |
| Stocks (UI) = calcBfr.stocksMatieres (2026–2027) | ✅ | 1 180,88 ≟ 1 180,88 |
| Stocks (UI) = calcBfr.stocksMatieres (2027–2028) | ✅ | 1 239,93 ≟ 1 239,93 |
| Stocks (UI) = calcBfr.stocksMatieres (2028–2029) | ✅ | 1 301,92 ≟ 1 301,92 |
| Crédit TVA (UI) = calcBfr.creditTVA (Initial) | ✅ | 2 406,70 ≟ 2 406,70 |
| Crédit TVA (UI) = calcBfr.creditTVA (2026–2027) | ✅ | 631,96 ≟ 631,96 |
| Crédit TVA (UI) = calcBfr.creditTVA (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Crédit TVA (UI) = calcBfr.creditTVA (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| Total besoins (UI) = calcBfr.totalBesoins (Initial) | ✅ | 3 906,70 ≟ 3 906,70 |
| Total besoins (UI) = calcBfr.totalBesoins (2026–2027) | ✅ | 1 812,85 ≟ 1 812,85 |
| Total besoins (UI) = calcBfr.totalBesoins (2027–2028) | ✅ | 1 239,93 ≟ 1 239,93 |
| Total besoins (UI) = calcBfr.totalBesoins (2028–2029) | ✅ | 1 301,92 ≟ 1 301,92 |
| Dettes fourn. (UI) = calcBfr.dettesFournisseurs (Initial) | ✅ | 0,00 ≟ 0,00 |
| Dettes fourn. (UI) = calcBfr.dettesFournisseurs (2026–2027) | ✅ | 1 150,17 ≟ 1 150,17 |
| Dettes fourn. (UI) = calcBfr.dettesFournisseurs (2027–2028) | ✅ | 1 207,68 ≟ 1 207,68 |
| Dettes fourn. (UI) = calcBfr.dettesFournisseurs (2028–2029) | ✅ | 1 268,06 ≟ 1 268,06 |
| Dettes charges ext. (UI) = calcBfr.dettesChargesExt. (Initial) | ✅ | 0,00 ≟ 0,00 |
| Dettes charges ext. (UI) = calcBfr.dettesChargesExt. (2026–2027) | ✅ | 2 350,60 ≟ 2 350,60 |
| Dettes charges ext. (UI) = calcBfr.dettesChargesExt. (2027–2028) | ✅ | 2 363,44 ≟ 2 363,44 |
| Dettes charges ext. (UI) = calcBfr.dettesChargesExt. (2028–2029) | ✅ | 2 376,65 ≟ 2 376,65 |
| Dettes impôts (UI) = calcBfr.dettesImpots (Initial) | ✅ | 0,00 ≟ 0,00 |
| Dettes impôts (UI) = calcBfr.dettesImpots (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| Dettes impôts (UI) = calcBfr.dettesImpots (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Dettes impôts (UI) = calcBfr.dettesImpots (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| Dettes personnel (UI) = calcBfr.dettesPersonnel (Initial) | ✅ | 0,00 ≟ 0,00 |
| Dettes personnel (UI) = calcBfr.dettesPersonnel (2026–2027) | ✅ | 1 828,38 ≟ 1 828,38 |
| Dettes personnel (UI) = calcBfr.dettesPersonnel (2027–2028) | ✅ | 2 282,06 ≟ 2 282,06 |
| Dettes personnel (UI) = calcBfr.dettesPersonnel (2028–2029) | ✅ | 2 282,06 ≟ 2 282,06 |
| TVA à payer (UI) = calcBfr.tvaAPayer (Initial) | ✅ | 0,00 ≟ 0,00 |
| TVA à payer (UI) = calcBfr.tvaAPayer (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| TVA à payer (UI) = calcBfr.tvaAPayer (2027–2028) | ✅ | 112,68 ≟ 112,68 |
| TVA à payer (UI) = calcBfr.tvaAPayer (2028–2029) | ✅ | 262,08 ≟ 262,08 |
| Dettes IS (UI) = calcBfr.dettesIS (Initial) | ✅ | 0,00 ≟ 0,00 |
| Dettes IS (UI) = calcBfr.dettesIS (2026–2027) | ✅ | 260,47 ≟ 260,47 |
| Dettes IS (UI) = calcBfr.dettesIS (2027–2028) | ✅ | 221,86 ≟ 221,86 |
| Dettes IS (UI) = calcBfr.dettesIS (2028–2029) | ✅ | 371,36 ≟ 371,36 |
| Total ressources (UI) = calcBfr.totalRessources (Initial) | ✅ | 0,00 ≟ 0,00 |
| Total ressources (UI) = calcBfr.totalRessources (2026–2027) | ✅ | 5 589,61 ≟ 5 589,61 |
| Total ressources (UI) = calcBfr.totalRessources (2027–2028) | ✅ | 6 187,72 ≟ 6 187,72 |
| Total ressources (UI) = calcBfr.totalRessources (2028–2029) | ✅ | 6 560,21 ≟ 6 560,21 |
| BFR (UI) = calcBfr.bfr (Initial) | ✅ | 3 906,70 ≟ 3 906,70 |
| BFR (UI) = calcBfr.bfr (2026–2027) | ✅ | -3 776,77 ≟ -3 776,77 |
| BFR (UI) = calcBfr.bfr (2027–2028) | ✅ | -4 947,79 ≟ -4 947,79 |
| BFR (UI) = calcBfr.bfr (2028–2029) | ✅ | -5 258,29 ≟ -5 258,29 |
| VariationBFR (UI) = calcBfr.variationBFR (Initial) | ✅ | 3 906,70 ≟ 3 906,70 |
| VariationBFR (UI) = calcBfr.variationBFR (2026–2027) | ✅ | -7 683,47 ≟ -7 683,47 |
| VariationBFR (UI) = calcBfr.variationBFR (2027–2028) | ✅ | -1 171,02 ≟ -1 171,02 |
| VariationBFR (UI) = calcBfr.variationBFR (2028–2029) | ✅ | -310,50 ≟ -310,50 |
| Total besoins = Stocks + CréditTVA (Initial) [y0 seulement] | ✅ | 3 906,70 ≟ 3 906,70 |
| Total besoins = Stocks + CréditTVA (2026–2027) [y0 seulement] | ✅ | 1 812,85 ≟ 1 812,85 |
| Total besoins = Stocks + CréditTVA (2027–2028) [y0 seulement] | ✅ | 1 239,93 ≟ 1 239,93 |
| Total besoins = Stocks + CréditTVA (2028–2029) [y0 seulement] | ✅ | 1 301,92 ≟ 1 301,92 |
| Total ressources = Σ dettes (Initial) | ✅ | 0,00 ≟ 0,00 |
| Total ressources = Σ dettes (2026–2027) | ✅ | 5 589,61 ≟ 5 589,61 |
| Total ressources = Σ dettes (2027–2028) | ✅ | 6 187,72 ≟ 6 187,72 |
| Total ressources = Σ dettes (2028–2029) | ✅ | 6 560,21 ≟ 6 560,21 |
| BFR = Total besoins − Total ressources (Initial) | ✅ | 3 906,70 ≟ 3 906,70 |
| BFR = Total besoins − Total ressources (2026–2027) | ✅ | -3 776,77 ≟ -3 776,77 |
| BFR = Total besoins − Total ressources (2027–2028) | ✅ | -4 947,79 ≟ -4 947,79 |
| BFR = Total besoins − Total ressources (2028–2029) | ✅ | -5 258,29 ≟ -5 258,29 |
| Variation BFR (Initial) | ✅ | 3 906,70 ≟ 3 906,70 |
| Variation BFR (2026–2027) | ✅ | -7 683,47 ≟ -7 683,47 |
| Variation BFR (2027–2028) | ✅ | -1 171,02 ≟ -1 171,02 |
| Variation BFR (2028–2029) | ✅ | -310,50 ≟ -310,50 |
| Stocks (BFR y1-y3) = fc.stockFinal (Initial) | ✅ | 1 500,00 ≟ 1 500,00 |
| Stocks (BFR y1-y3) = fc.stockFinal (2026–2027) | ✅ | 1 180,88 ≟ 1 180,88 |
| Stocks (BFR y1-y3) = fc.stockFinal (2027–2028) | ✅ | 1 239,93 ≟ 1 239,93 |
| Stocks (BFR y1-y3) = fc.stockFinal (2028–2029) | ✅ | 1 301,92 ≟ 1 301,92 |
| Stocks total = Σ par activité (2026–2027) | ✅ | 1 180,88 ≟ 1 180,88 |
| Stocks total = Σ par activité (2027–2028) | ✅ | 1 239,93 ≟ 1 239,93 |
| Stocks total = Σ par activité (2028–2029) | ✅ | 1 301,92 ≟ 1 301,92 |
| Dettes fourn. total = Σ par activité (2026–2027) | ✅ | 1 150,17 ≟ 1 150,17 |
| Dettes fourn. total = Σ par activité (2027–2028) | ✅ | 1 207,68 ≟ 1 207,68 |
| Dettes fourn. total = Σ par activité (2028–2029) | ✅ | 1 268,06 ≟ 1 268,06 |
| Dettes charges ext. total = Σ par charge (2026–2027) | ✅ | 2 350,60 ≟ 2 350,60 |
| Dettes charges ext. total = Σ par charge (2027–2028) | ✅ | 2 363,44 ≟ 2 363,44 |
| Dettes charges ext. total = Σ par charge (2028–2029) | ✅ | 2 376,65 ≟ 2 376,65 |


## 3. Détail par activité — Achats & stocks


| Activité | Coef | Jours stock | Jours fourn. | Stock y1 | Stock y2 | Stock y3 | Dette fourn. y1 | Dette fourn. y2 | Dette fourn. y3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vente pizza | 27.0 % | 15 j | 15 j | 1 090,74 | 1 145,28 | 1 202,55 | 1 054,99 | 1 107,74 | 1 163,13 |
| Vente boisson | 35.0 % | 15 j | 15 j | 30,04 | 31,54 | 33,12 | 29,06 | 30,51 | 32,04 |
| Vente alcool | 35.0 % | 15 j | 15 j | 60,10 | 63,10 | 66,26 | 66,12 | 69,42 | 72,89 |
| **Total** | | | | **1 180,88** | **1 239,93** | **1 301,92** | **1 150,17** | **1 207,68** | **1 268,06** |


## 4. Détail charges externes — Dettes fin d'exercice


| Charge | Délai (j) | TVA | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Embalages | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Electricité | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Eau | 30 j | 20 % | 25,00 | 25,50 | 26,01 |
| Petit équimement | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Produits d'entretiens | 15 j | 20 % | 30,00 | 30,60 | 31,21 |
| Fournitures administratives | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Location immobilière | 30 j | 20 % | 1 512,60 | 1 512,60 | 1 512,60 |
| Location TPE + pp | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Frais de télécommunication | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Primes d'assurances | 0 j | 0 % | 0,00 | 0,00 | 0,00 |
| Entretiens et réparations | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Honoraires comptable et juridiques | 30 j | 20 % | 280,00 | 285,60 | 291,31 |
| Honoraires juridiques | 30 j | 20 % | 60,00 | 63,00 | 66,15 |
| Publicité, publications | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Services bancaires | 30 j | 20 % | 58,40 | 59,57 | 60,76 |
| Frais divers | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Frais titre restaurant | 30 j | 20 % | 38,09 | 38,09 | 38,09 |
| Déplacements | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Vetements de travail | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Commission CB | 30 j | 20 % | 65,80 | 67,77 | 69,81 |
| Abonnement logiciel de caisse (airkitchen) | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| offerts | 30 j | 20 % | 280,71 | 280,71 | 280,71 |
| **Total** | | | **2 350,60** | **2 363,44** | **2 376,65** |


## 5. Récapitulatif


| Bilan | Valeur |
| --- | --- |
| Total checks | 77 |
| ✅ OK | 77 |
| ❌ KO | 0 |

> ✅ **Tous les checks sont OK.** Les calculs du BFR sont cohérents.


### 5.1 Indicateurs clés


| Indicateur | Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: | ---: |
| Stocks de matières | 1 500,00 | 1 180,88 | 1 239,93 | 1 301,92 |
| Crédit de TVA | 2 406,70 | 631,96 | 0,00 | 0,00 |
| **Total besoins** | **3 906,70** | **1 812,85** | **1 239,93** | **1 301,92** |
| Dettes fournisseurs | 0,00 | 1 150,17 | 1 207,68 | 1 268,06 |
| Dettes charges ext. | 0,00 | 2 350,60 | 2 363,44 | 2 376,65 |
| Dettes impôts | 0,00 | 0,00 | 0,00 | 0,00 |
| Dettes personnel | 0,00 | 1 828,38 | 2 282,06 | 2 282,06 |
| TVA à payer | 0,00 | 0,00 | 112,68 | 262,08 |
| Dettes IS | 0,00 | 260,47 | 221,86 | 371,36 |
| **Total ressources** | **0,00** | **5 589,61** | **6 187,72** | **6 560,21** |
| **BFR** | **3 906,70** | **-3 776,77** | **-4 947,79** | **-5 258,29** |
| Variation BFR | 3 906,70 | -7 683,47 | -1 171,02 | -310,50 |

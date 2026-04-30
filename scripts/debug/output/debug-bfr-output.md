# Diagnostic BFR (Besoin en Fonds de Roulement) — Dossier `cmo8p96h40001schp26dfdknv`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`calcBfr` · `buildBfrRows` · `buildFinCalc`


## 0. Paramètres généraux

| Paramètre | Valeur |
| --- | --- |
| Dossier ID | `cmo8p96h40001schp26dfdknv` |
| Date de démarrage | 01/05/2026 |
| Mois de début | Mai (5) |
| Régime fiscal | IS |
| Régime TVA | REEL_NORMAL |
| Périodicité TVA | mensuel |
| Délai paiement salaires | 1 mois |
| Exercices | Initial · 2026–2027 · 2027–2028 · 2028–2029 |
| Activités actives | 9 |
| dont commerce/production | 9 |
| Fournitures & services actifs | 22 |
| Salariés | 2 |
| Dirigeants | 1 |
| Emprunts | 1 |
| Immobilisations actives | 13 |


## 1. Tableau BFR complet


| Désignation | Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: | ---: |
| **BESOINS D'EXPLOITATION** | | | | |
| Stocks de matières | 2 000,00 | 1 298,71 | 1 275,97 | 1 339,76 |
| \  Vente pizza | 1 000,00 | 1 108,17 | 1 119,83 | 1 175,82 |
| \  Vente boisson | 500,00 | 108,37 | 91,88 | 96,47 |
| \  Vente alcool | 500,00 | 82,17 | 64,27 | 67,48 |
| Crédit de TVA | 2 503,30 | 179,61 | 0,00 | 0,00 |
| **= Total des besoins** | 4 503,30 | 1 478,32 | 1 275,97 | 1 339,76 |
| **RESSOURCES D'EXPLOITATION** | | | | |
| Dettes fournisseurs (achats matières) | 0,00 | 2 366,41 | 2 485,38 | 2 609,65 |
| \  Vente pizza | 0,00 | 2 063,09 | 2 166,24 | 2 274,56 |
| \  Vente boisson | 0,00 | 169,10 | 177,73 | 186,61 |
| \  Vente alcool | 0,00 | 134,22 | 141,41 | 148,48 |
| Dettes charges externes | 0,00 | 2 283,38 | 2 309,02 | 2 335,68 |
| \  Embalages | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Electricité | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Eau | 0,00 | 25,00 | 25,50 | 26,01 |
| \  Petit équimement | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Produits d'entretiens | 0,00 | 30,00 | 30,60 | 31,21 |
| \  Fournitures administratives | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Vetements de travail | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Frais divers | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Déplacements | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Abonnement logiciel de caisse (airkitchen) | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Services bancaires | 0,00 | 58,40 | 59,57 | 60,76 |
| \  Frais titre restaurant | 0,00 | 36,21 | 38,02 | 39,93 |
| \  Commission CB | 0,00 | 54,83 | 56,48 | 58,17 |
| \  offerts | 0,00 | 226,34 | 237,65 | 249,53 |
| \  Location immobilière | 0,00 | 1 512,60 | 1 512,60 | 1 512,60 |
| \  Location TPE + pp | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Frais de télécommunication | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Primes d'assurances | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Entretiens et réparations | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Honoraires comptable et juridiques | 0,00 | 280,00 | 285,60 | 291,31 |
| \  Honoraires juridiques | 0,00 | 60,00 | 63,00 | 66,15 |
| \  Publicité, publications | 0,00 | 0,00 | 0,00 | 0,00 |
| Dettes impôts et taxes | 0,00 | 0,00 | 0,00 | 0,00 |
| Dettes personnel | 0,00 | 2 088,60 | 2 223,72 | 2 223,72 |
| TVA à payer | 0,00 | 0,00 | 161,44 | 190,06 |
| Impôt sur les sociétés (dette) | 0,00 | 915,59 | 992,69 | 1 136,80 |
| **= Total des ressources** | 0,00 | 7 653,98 | 8 172,26 | 8 495,90 |
| Variation du BFR | 4 503,30 | -10 678,96 | -720,63 | -259,85 |
| **= Besoin en fonds de roulement (BFR)** | 4 503,30 | -6 175,66 | -6 896,29 | -7 156,14 |


## 2. Vérifications de cohérence


| Check | Statut | Détail |
| --- | :---: | --- |
| Stocks (UI) = calcBfr.stocksMatieres (Initial) | ✅ | 2 000,00 ≟ 2 000,00 |
| Stocks (UI) = calcBfr.stocksMatieres (2026–2027) | ✅ | 1 298,71 ≟ 1 298,71 |
| Stocks (UI) = calcBfr.stocksMatieres (2027–2028) | ✅ | 1 275,97 ≟ 1 275,97 |
| Stocks (UI) = calcBfr.stocksMatieres (2028–2029) | ✅ | 1 339,76 ≟ 1 339,76 |
| Crédit TVA (UI) = calcBfr.creditTVA (Initial) | ✅ | 2 503,30 ≟ 2 503,30 |
| Crédit TVA (UI) = calcBfr.creditTVA (2026–2027) | ✅ | 179,61 ≟ 179,61 |
| Crédit TVA (UI) = calcBfr.creditTVA (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Crédit TVA (UI) = calcBfr.creditTVA (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| Total besoins (UI) = calcBfr.totalBesoins (Initial) | ✅ | 4 503,30 ≟ 4 503,30 |
| Total besoins (UI) = calcBfr.totalBesoins (2026–2027) | ✅ | 1 478,32 ≟ 1 478,32 |
| Total besoins (UI) = calcBfr.totalBesoins (2027–2028) | ✅ | 1 275,97 ≟ 1 275,97 |
| Total besoins (UI) = calcBfr.totalBesoins (2028–2029) | ✅ | 1 339,76 ≟ 1 339,76 |
| Dettes fourn. (UI) = calcBfr.dettesFournisseurs (Initial) | ✅ | 0,00 ≟ 0,00 |
| Dettes fourn. (UI) = calcBfr.dettesFournisseurs (2026–2027) | ✅ | 2 366,41 ≟ 2 366,41 |
| Dettes fourn. (UI) = calcBfr.dettesFournisseurs (2027–2028) | ✅ | 2 485,38 ≟ 2 485,38 |
| Dettes fourn. (UI) = calcBfr.dettesFournisseurs (2028–2029) | ✅ | 2 609,65 ≟ 2 609,65 |
| Dettes charges ext. (UI) = calcBfr.dettesChargesExt. (Initial) | ✅ | 0,00 ≟ 0,00 |
| Dettes charges ext. (UI) = calcBfr.dettesChargesExt. (2026–2027) | ✅ | 2 283,38 ≟ 2 283,38 |
| Dettes charges ext. (UI) = calcBfr.dettesChargesExt. (2027–2028) | ✅ | 2 309,02 ≟ 2 309,02 |
| Dettes charges ext. (UI) = calcBfr.dettesChargesExt. (2028–2029) | ✅ | 2 335,68 ≟ 2 335,68 |
| Dettes impôts (UI) = calcBfr.dettesImpots (Initial) | ✅ | 0,00 ≟ 0,00 |
| Dettes impôts (UI) = calcBfr.dettesImpots (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| Dettes impôts (UI) = calcBfr.dettesImpots (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Dettes impôts (UI) = calcBfr.dettesImpots (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| Dettes personnel (UI) = calcBfr.dettesPersonnel (Initial) | ✅ | 0,00 ≟ 0,00 |
| Dettes personnel (UI) = calcBfr.dettesPersonnel (2026–2027) | ✅ | 2 088,60 ≟ 2 088,60 |
| Dettes personnel (UI) = calcBfr.dettesPersonnel (2027–2028) | ✅ | 2 223,72 ≟ 2 223,72 |
| Dettes personnel (UI) = calcBfr.dettesPersonnel (2028–2029) | ✅ | 2 223,72 ≟ 2 223,72 |
| TVA à payer (UI) = calcBfr.tvaAPayer (Initial) | ✅ | 0,00 ≟ 0,00 |
| TVA à payer (UI) = calcBfr.tvaAPayer (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| TVA à payer (UI) = calcBfr.tvaAPayer (2027–2028) | ✅ | 161,44 ≟ 161,44 |
| TVA à payer (UI) = calcBfr.tvaAPayer (2028–2029) | ✅ | 190,06 ≟ 190,06 |
| Dettes IS (UI) = calcBfr.dettesIS (Initial) | ✅ | 0,00 ≟ 0,00 |
| Dettes IS (UI) = calcBfr.dettesIS (2026–2027) | ✅ | 915,59 ≟ 915,59 |
| Dettes IS (UI) = calcBfr.dettesIS (2027–2028) | ✅ | 992,69 ≟ 992,69 |
| Dettes IS (UI) = calcBfr.dettesIS (2028–2029) | ✅ | 1 136,80 ≟ 1 136,80 |
| Total ressources (UI) = calcBfr.totalRessources (Initial) | ✅ | 0,00 ≟ 0,00 |
| Total ressources (UI) = calcBfr.totalRessources (2026–2027) | ✅ | 7 653,98 ≟ 7 653,98 |
| Total ressources (UI) = calcBfr.totalRessources (2027–2028) | ✅ | 8 172,26 ≟ 8 172,26 |
| Total ressources (UI) = calcBfr.totalRessources (2028–2029) | ✅ | 8 495,90 ≟ 8 495,90 |
| BFR (UI) = calcBfr.bfr (Initial) | ✅ | 4 503,30 ≟ 4 503,30 |
| BFR (UI) = calcBfr.bfr (2026–2027) | ✅ | -6 175,66 ≟ -6 175,66 |
| BFR (UI) = calcBfr.bfr (2027–2028) | ✅ | -6 896,29 ≟ -6 896,29 |
| BFR (UI) = calcBfr.bfr (2028–2029) | ✅ | -7 156,14 ≟ -7 156,14 |
| VariationBFR (UI) = calcBfr.variationBFR (Initial) | ✅ | 4 503,30 ≟ 4 503,30 |
| VariationBFR (UI) = calcBfr.variationBFR (2026–2027) | ✅ | -10 678,96 ≟ -10 678,96 |
| VariationBFR (UI) = calcBfr.variationBFR (2027–2028) | ✅ | -720,63 ≟ -720,63 |
| VariationBFR (UI) = calcBfr.variationBFR (2028–2029) | ✅ | -259,85 ≟ -259,85 |
| Total besoins = Stocks + CréditTVA (Initial) [y0 seulement] | ✅ | 4 503,30 ≟ 4 503,30 |
| Total besoins = Stocks + CréditTVA (2026–2027) [y0 seulement] | ✅ | 1 478,32 ≟ 1 478,32 |
| Total besoins = Stocks + CréditTVA (2027–2028) [y0 seulement] | ✅ | 1 275,97 ≟ 1 275,97 |
| Total besoins = Stocks + CréditTVA (2028–2029) [y0 seulement] | ✅ | 1 339,76 ≟ 1 339,76 |
| Total ressources = Σ dettes (Initial) | ✅ | 0,00 ≟ 0,00 |
| Total ressources = Σ dettes (2026–2027) | ✅ | 7 653,98 ≟ 7 653,98 |
| Total ressources = Σ dettes (2027–2028) | ✅ | 8 172,26 ≟ 8 172,26 |
| Total ressources = Σ dettes (2028–2029) | ✅ | 8 495,90 ≟ 8 495,90 |
| BFR = Total besoins − Total ressources (Initial) | ✅ | 4 503,30 ≟ 4 503,30 |
| BFR = Total besoins − Total ressources (2026–2027) | ✅ | -6 175,66 ≟ -6 175,66 |
| BFR = Total besoins − Total ressources (2027–2028) | ✅ | -6 896,29 ≟ -6 896,29 |
| BFR = Total besoins − Total ressources (2028–2029) | ✅ | -7 156,14 ≟ -7 156,14 |
| Variation BFR (Initial) | ✅ | 4 503,30 ≟ 4 503,30 |
| Variation BFR (2026–2027) | ✅ | -10 678,96 ≟ -10 678,96 |
| Variation BFR (2027–2028) | ✅ | -720,63 ≟ -720,63 |
| Variation BFR (2028–2029) | ✅ | -259,85 ≟ -259,85 |
| Stocks (BFR y1-y3) = fc.stockFinal (Initial) | ✅ | 2 000,00 ≟ 2 000,00 |
| Stocks (BFR y1-y3) = fc.stockFinal (2026–2027) | ✅ | 1 298,71 ≟ 1 298,71 |
| Stocks (BFR y1-y3) = fc.stockFinal (2027–2028) | ✅ | 1 275,97 ≟ 1 275,97 |
| Stocks (BFR y1-y3) = fc.stockFinal (2028–2029) | ✅ | 1 339,76 ≟ 1 339,76 |
| Stocks total = Σ par activité (2026–2027) | ✅ | 1 298,71 ≟ 1 298,71 |
| Stocks total = Σ par activité (2027–2028) | ✅ | 1 275,97 ≟ 1 275,97 |
| Stocks total = Σ par activité (2028–2029) | ✅ | 1 339,76 ≟ 1 339,76 |
| Dettes fourn. total = Σ par activité (2026–2027) | ✅ | 2 366,41 ≟ 2 366,41 |
| Dettes fourn. total = Σ par activité (2027–2028) | ✅ | 2 485,38 ≟ 2 485,38 |
| Dettes fourn. total = Σ par activité (2028–2029) | ✅ | 2 609,65 ≟ 2 609,65 |
| Dettes charges ext. total = Σ par charge (2026–2027) | ✅ | 2 283,38 ≟ 2 283,38 |
| Dettes charges ext. total = Σ par charge (2027–2028) | ✅ | 2 309,02 ≟ 2 309,02 |
| Dettes charges ext. total = Σ par charge (2028–2029) | ✅ | 2 335,68 ≟ 2 335,68 |


## 3. Détail par activité — Achats & stocks


| Activité | Coef | Jours stock | Jours fourn. | Stock y1 | Stock y2 | Stock y3 | Dette fourn. y1 | Dette fourn. y2 | Dette fourn. y3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vente pizza | 27.0 % | 15 j | 30 j | 1 108,17 | 1 119,83 | 1 175,82 | 2 063,09 | 2 166,24 | 2 274,56 |
| Vente boisson | 35.0 % | 15 j | 30 j | 108,37 | 91,88 | 96,47 | 169,10 | 177,73 | 186,61 |
| Vente alcool | 35.0 % | 15 j | 30 j | 82,17 | 64,27 | 67,48 | 134,22 | 141,41 | 148,48 |
| **Total** | | | | **1 298,71** | **1 275,97** | **1 339,76** | **2 366,41** | **2 485,38** | **2 609,65** |


## 4. Détail charges externes — Dettes fin d'exercice


| Charge | Délai (j) | TVA | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Embalages | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Electricité | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Eau | 30 j | 20 % | 25,00 | 25,50 | 26,01 |
| Petit équimement | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Produits d'entretiens | 15 j | 20 % | 30,00 | 30,60 | 31,21 |
| Fournitures administratives | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Vetements de travail | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Frais divers | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Déplacements | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Abonnement logiciel de caisse (airkitchen) | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Services bancaires | 30 j | 20 % | 58,40 | 59,57 | 60,76 |
| Frais titre restaurant | 30 j | 20 % | 36,21 | 38,02 | 39,93 |
| Commission CB | 30 j | 0 % | 54,83 | 56,48 | 58,17 |
| offerts | 30 j | 20 % | 226,34 | 237,65 | 249,53 |
| Location immobilière | 30 j | 20 % | 1 512,60 | 1 512,60 | 1 512,60 |
| Location TPE + pp | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Frais de télécommunication | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Primes d'assurances | 0 j | 0 % | 0,00 | 0,00 | 0,00 |
| Entretiens et réparations | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Honoraires comptable et juridiques | 30 j | 20 % | 280,00 | 285,60 | 291,31 |
| Honoraires juridiques | 30 j | 20 % | 60,00 | 63,00 | 66,15 |
| Publicité, publications | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| **Total** | | | **2 283,38** | **2 309,02** | **2 335,68** |


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
| Stocks de matières | 2 000,00 | 1 298,71 | 1 275,97 | 1 339,76 |
| Crédit de TVA | 2 503,30 | 179,61 | 0,00 | 0,00 |
| **Total besoins** | **4 503,30** | **1 478,32** | **1 275,97** | **1 339,76** |
| Dettes fournisseurs | 0,00 | 2 366,41 | 2 485,38 | 2 609,65 |
| Dettes charges ext. | 0,00 | 2 283,38 | 2 309,02 | 2 335,68 |
| Dettes impôts | 0,00 | 0,00 | 0,00 | 0,00 |
| Dettes personnel | 0,00 | 2 088,60 | 2 223,72 | 2 223,72 |
| TVA à payer | 0,00 | 0,00 | 161,44 | 190,06 |
| Dettes IS | 0,00 | 915,59 | 992,69 | 1 136,80 |
| **Total ressources** | **0,00** | **7 653,98** | **8 172,26** | **8 495,90** |
| **BFR** | **4 503,30** | **-6 175,66** | **-6 896,29** | **-7 156,14** |
| Variation BFR | 4 503,30 | -10 678,96 | -720,63 | -259,85 |

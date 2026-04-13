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
| Périodicité TVA | mensuel |
| Délai paiement salaires | 1 mois |
| Exercices | Initial · 2026–2027 · 2027–2028 · 2028–2029 |
| Activités actives | 3 |
| dont commerce/production | 3 |
| Fournitures & services actifs | 22 |
| Salariés | 2 |
| Dirigeants | 1 |
| Emprunts | 1 |
| Immobilisations actives | 12 |


## 1. Tableau BFR complet


| Désignation | Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: | ---: |
| **BESOINS D'EXPLOITATION** | | | | |
| Stocks de matières | 2 000,00 | 1 372,29 | 1 353,25 | 1 420,91 |
| \  Vente pizza | 1 000,00 | 1 152,60 | 1 166,48 | 1 224,81 |
| \  Vente boisson | 500,00 | 137,51 | 122,50 | 128,62 |
| \  Vente alcool | 500,00 | 82,17 | 64,27 | 67,48 |
| Crédit de TVA | 2 351,50 | 0,00 | 0,00 | 0,00 |
| **= Total des besoins** | 4 351,50 | 1 372,29 | 1 353,25 | 1 420,91 |
| **RESSOURCES D'EXPLOITATION** | | | | |
| Dettes fournisseurs (achats matières) | 0,00 | 2 508,87 | 2 634,88 | 2 766,62 |
| \  Vente pizza | 0,00 | 2 149,05 | 2 256,50 | 2 369,33 |
| \  Vente boisson | 0,00 | 225,60 | 236,97 | 248,82 |
| \  Vente alcool | 0,00 | 134,22 | 141,41 | 148,48 |
| Dettes charges externes | 0,00 | 2 283,38 | 2 309,02 | 2 335,68 |
| \  Embalages | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Electricité | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Eau | 0,00 | 25,00 | 25,50 | 26,01 |
| \  Petit équimement | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Produits d'entretiens | 0,00 | 30,00 | 30,60 | 31,21 |
| \  Fournitures administratives | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Vetements de travail | 0,00 | 0,00 | 0,00 | 0,00 |
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
| \  Frais divers | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Déplacements | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Abonnement logiciel de caisse (airkitchen) | 0,00 | 0,00 | 0,00 | 0,00 |
| \  Services bancaires | 0,00 | 58,40 | 59,57 | 60,76 |
| \  Frais titre restaurant | 0,00 | 36,21 | 38,02 | 39,93 |
| Dettes impôts et taxes | 0,00 | 0,00 | 0,00 | 0,00 |
| Dettes personnel | 0,00 | 2 088,60 | 2 223,72 | 2 223,72 |
| TVA à payer | 0,00 | 166,08 | 201,38 | 232,00 |
| Impôt sur les sociétés (dette) | 0,00 | 362,47 | 471,59 | 625,68 |
| **= Total des ressources** | 0,00 | 7 409,41 | 7 840,60 | 8 183,70 |
| Variation du BFR | 4 351,50 | -10 388,62 | -450,22 | -275,44 |
| **= Besoin en fonds de roulement (BFR)** | 4 351,50 | -6 037,12 | -6 487,35 | -6 762,79 |


## 2. Vérifications de cohérence


| Check | Statut | Détail |
| --- | :---: | --- |
| Stocks (UI) = calcBfr.stocksMatieres (Initial) | ✅ | 2 000,00 ≟ 2 000,00 |
| Stocks (UI) = calcBfr.stocksMatieres (2026–2027) | ✅ | 1 372,29 ≟ 1 372,29 |
| Stocks (UI) = calcBfr.stocksMatieres (2027–2028) | ✅ | 1 353,25 ≟ 1 353,25 |
| Stocks (UI) = calcBfr.stocksMatieres (2028–2029) | ✅ | 1 420,91 ≟ 1 420,91 |
| Crédit TVA (UI) = calcBfr.creditTVA (Initial) | ✅ | 2 351,50 ≟ 2 351,50 |
| Crédit TVA (UI) = calcBfr.creditTVA (2026–2027) | ✅ | 0,00 ≟ 0,00 |
| Crédit TVA (UI) = calcBfr.creditTVA (2027–2028) | ✅ | 0,00 ≟ 0,00 |
| Crédit TVA (UI) = calcBfr.creditTVA (2028–2029) | ✅ | 0,00 ≟ 0,00 |
| Total besoins (UI) = calcBfr.totalBesoins (Initial) | ✅ | 4 351,50 ≟ 4 351,50 |
| Total besoins (UI) = calcBfr.totalBesoins (2026–2027) | ✅ | 1 372,29 ≟ 1 372,29 |
| Total besoins (UI) = calcBfr.totalBesoins (2027–2028) | ✅ | 1 353,25 ≟ 1 353,25 |
| Total besoins (UI) = calcBfr.totalBesoins (2028–2029) | ✅ | 1 420,91 ≟ 1 420,91 |
| Dettes fourn. (UI) = calcBfr.dettesFournisseurs (Initial) | ✅ | 0,00 ≟ 0,00 |
| Dettes fourn. (UI) = calcBfr.dettesFournisseurs (2026–2027) | ✅ | 2 508,87 ≟ 2 508,87 |
| Dettes fourn. (UI) = calcBfr.dettesFournisseurs (2027–2028) | ✅ | 2 634,88 ≟ 2 634,88 |
| Dettes fourn. (UI) = calcBfr.dettesFournisseurs (2028–2029) | ✅ | 2 766,62 ≟ 2 766,62 |
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
| TVA à payer (UI) = calcBfr.tvaAPayer (2026–2027) | ✅ | 166,08 ≟ 166,08 |
| TVA à payer (UI) = calcBfr.tvaAPayer (2027–2028) | ✅ | 201,38 ≟ 201,38 |
| TVA à payer (UI) = calcBfr.tvaAPayer (2028–2029) | ✅ | 232,00 ≟ 232,00 |
| Dettes IS (UI) = calcBfr.dettesIS (Initial) | ✅ | 0,00 ≟ 0,00 |
| Dettes IS (UI) = calcBfr.dettesIS (2026–2027) | ✅ | 362,47 ≟ 362,47 |
| Dettes IS (UI) = calcBfr.dettesIS (2027–2028) | ✅ | 471,59 ≟ 471,59 |
| Dettes IS (UI) = calcBfr.dettesIS (2028–2029) | ✅ | 625,68 ≟ 625,68 |
| Total ressources (UI) = calcBfr.totalRessources (Initial) | ✅ | 0,00 ≟ 0,00 |
| Total ressources (UI) = calcBfr.totalRessources (2026–2027) | ✅ | 7 409,41 ≟ 7 409,41 |
| Total ressources (UI) = calcBfr.totalRessources (2027–2028) | ✅ | 7 840,60 ≟ 7 840,60 |
| Total ressources (UI) = calcBfr.totalRessources (2028–2029) | ✅ | 8 183,70 ≟ 8 183,70 |
| BFR (UI) = calcBfr.bfr (Initial) | ✅ | 4 351,50 ≟ 4 351,50 |
| BFR (UI) = calcBfr.bfr (2026–2027) | ✅ | -6 037,12 ≟ -6 037,12 |
| BFR (UI) = calcBfr.bfr (2027–2028) | ✅ | -6 487,35 ≟ -6 487,35 |
| BFR (UI) = calcBfr.bfr (2028–2029) | ✅ | -6 762,79 ≟ -6 762,79 |
| VariationBFR (UI) = calcBfr.variationBFR (Initial) | ✅ | 4 351,50 ≟ 4 351,50 |
| VariationBFR (UI) = calcBfr.variationBFR (2026–2027) | ✅ | -10 388,62 ≟ -10 388,62 |
| VariationBFR (UI) = calcBfr.variationBFR (2027–2028) | ✅ | -450,22 ≟ -450,22 |
| VariationBFR (UI) = calcBfr.variationBFR (2028–2029) | ✅ | -275,44 ≟ -275,44 |
| Total besoins = Stocks + CréditTVA (Initial) [y0 seulement] | ✅ | 4 351,50 ≟ 4 351,50 |
| Total besoins = Stocks + CréditTVA (2026–2027) [y0 seulement] | ✅ | 1 372,29 ≟ 1 372,29 |
| Total besoins = Stocks + CréditTVA (2027–2028) [y0 seulement] | ✅ | 1 353,25 ≟ 1 353,25 |
| Total besoins = Stocks + CréditTVA (2028–2029) [y0 seulement] | ✅ | 1 420,91 ≟ 1 420,91 |
| Total ressources = Σ dettes (Initial) | ✅ | 0,00 ≟ 0,00 |
| Total ressources = Σ dettes (2026–2027) | ✅ | 7 409,41 ≟ 7 409,41 |
| Total ressources = Σ dettes (2027–2028) | ✅ | 7 840,60 ≟ 7 840,60 |
| Total ressources = Σ dettes (2028–2029) | ✅ | 8 183,70 ≟ 8 183,70 |
| BFR = Total besoins − Total ressources (Initial) | ✅ | 4 351,50 ≟ 4 351,50 |
| BFR = Total besoins − Total ressources (2026–2027) | ✅ | -6 037,12 ≟ -6 037,12 |
| BFR = Total besoins − Total ressources (2027–2028) | ✅ | -6 487,35 ≟ -6 487,35 |
| BFR = Total besoins − Total ressources (2028–2029) | ✅ | -6 762,79 ≟ -6 762,79 |
| Variation BFR (Initial) | ✅ | 4 351,50 ≟ 4 351,50 |
| Variation BFR (2026–2027) | ✅ | -10 388,62 ≟ -10 388,62 |
| Variation BFR (2027–2028) | ✅ | -450,22 ≟ -450,22 |
| Variation BFR (2028–2029) | ✅ | -275,44 ≟ -275,44 |
| Stocks (BFR y1-y3) = fc.stockFinal (Initial) | ✅ | 2 000,00 ≟ 2 000,00 |
| Stocks (BFR y1-y3) = fc.stockFinal (2026–2027) | ✅ | 1 372,29 ≟ 1 372,29 |
| Stocks (BFR y1-y3) = fc.stockFinal (2027–2028) | ✅ | 1 353,25 ≟ 1 353,25 |
| Stocks (BFR y1-y3) = fc.stockFinal (2028–2029) | ✅ | 1 420,91 ≟ 1 420,91 |
| Stocks total = Σ par activité (2026–2027) | ✅ | 1 372,29 ≟ 1 372,29 |
| Stocks total = Σ par activité (2027–2028) | ✅ | 1 353,25 ≟ 1 353,25 |
| Stocks total = Σ par activité (2028–2029) | ✅ | 1 420,91 ≟ 1 420,91 |
| Dettes fourn. total = Σ par activité (2026–2027) | ✅ | 2 508,87 ≟ 2 508,87 |
| Dettes fourn. total = Σ par activité (2027–2028) | ✅ | 2 634,88 ≟ 2 634,88 |
| Dettes fourn. total = Σ par activité (2028–2029) | ✅ | 2 766,62 ≟ 2 766,62 |
| Dettes charges ext. total = Σ par charge (2026–2027) | ✅ | 2 283,38 ≟ 2 283,38 |
| Dettes charges ext. total = Σ par charge (2027–2028) | ✅ | 2 309,02 ≟ 2 309,02 |
| Dettes charges ext. total = Σ par charge (2028–2029) | ✅ | 2 335,68 ≟ 2 335,68 |


## 3. Détail par activité — Achats & stocks


| Activité | Coef | Jours stock | Jours fourn. | Stock y1 | Stock y2 | Stock y3 | Dette fourn. y1 | Dette fourn. y2 | Dette fourn. y3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vente pizza | 27.0 % | 15 j | 30 j | 1 152,60 | 1 166,48 | 1 224,81 | 2 149,05 | 2 256,50 | 2 369,33 |
| Vente boisson | 35.0 % | 15 j | 30 j | 137,51 | 122,50 | 128,62 | 225,60 | 236,97 | 248,82 |
| Vente alcool | 35.0 % | 15 j | 30 j | 82,17 | 64,27 | 67,48 | 134,22 | 141,41 | 148,48 |
| **Total** | | | | **1 372,29** | **1 353,25** | **1 420,91** | **2 508,87** | **2 634,88** | **2 766,62** |


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
| Frais divers | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Déplacements | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Abonnement logiciel de caisse (airkitchen) | 0 j | 20 % | 0,00 | 0,00 | 0,00 |
| Services bancaires | 30 j | 20 % | 58,40 | 59,57 | 60,76 |
| Frais titre restaurant | 30 j | 20 % | 36,21 | 38,02 | 39,93 |
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
| Stocks de matières | 2 000,00 | 1 372,29 | 1 353,25 | 1 420,91 |
| Crédit de TVA | 2 351,50 | 0,00 | 0,00 | 0,00 |
| **Total besoins** | **4 351,50** | **1 372,29** | **1 353,25** | **1 420,91** |
| Dettes fournisseurs | 0,00 | 2 508,87 | 2 634,88 | 2 766,62 |
| Dettes charges ext. | 0,00 | 2 283,38 | 2 309,02 | 2 335,68 |
| Dettes impôts | 0,00 | 0,00 | 0,00 | 0,00 |
| Dettes personnel | 0,00 | 2 088,60 | 2 223,72 | 2 223,72 |
| TVA à payer | 0,00 | 166,08 | 201,38 | 232,00 |
| Dettes IS | 0,00 | 362,47 | 471,59 | 625,68 |
| **Total ressources** | **0,00** | **7 409,41** | **7 840,60** | **8 183,70** |
| **BFR** | **4 351,50** | **-6 037,12** | **-6 487,35** | **-6 762,79** |
| Variation BFR | 4 351,50 | -10 388,62 | -450,22 | -275,44 |

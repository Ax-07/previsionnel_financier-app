# Diagnostic Tableau de Financement — Dossier `cmo8p96h40001schp26dfdknv`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`buildTableauFinancementRows` · `buildFinCalc`


## 0. Paramètres généraux

| Paramètre | Valeur |
| --- | --- |
| Dossier ID | `cmo8p96h40001schp26dfdknv` |
| Date de démarrage | 01/05/2026 |
| Exercices | Initial · 2026–2027 · 2027–2028 · 2028–2029 |
| Apports | 2 |
| Emprunts | 1 |
| Immobilisations actives | 13 |
| Subventions | 0 |


## 1. Tableau de financement complet


| Désignation | Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: | ---: |
| **RESSOURCES** | | | | |
| + Apports en capital | 20 000,00 | 0,00 | 0,00 | 0,00 |
| + Apports en comptes courants | 0,00 | 0,00 | 0,00 | 0,00 |
| + Souscription d'emprunts | 70 000,00 | 0,00 | 0,00 | 0,00 |
| + Subventions d'investissement | 0,00 | 0,00 | 0,00 | 0,00 |
| + Capacité d'autofinancement (CAF) | 0,00 | 24 170,49 | 25 918,21 | 29 184,56 |
| **= Total des ressources** | **90 000,00** | **24 170,49** | **25 918,21** | **29 184,56** |
| **EMPLOIS** | | | | |
| + Immobilisations incorporelles | 39 542,00 | 0,00 | 0,00 | 0,00 |
| + Immobilisations corporelles | 34 171,99 | 0,00 | 0,00 | 0,00 |
| + Immobilisations financières | 3 200,00 | 0,00 | 0,00 | 0,00 |
| **= Total immobilisations** | **76 913,99** | **0,00** | **0,00** | **0,00** |
| + Remboursement des emprunts | 0,00 | 8 092,26 | 9 172,43 | 9 546,14 |
| **= Total des emplois** | **76 913,99** | **8 092,26** | **9 172,43** | **9 546,14** |
| **FONDS DE ROULEMENT** | | | | |
| **= Variation du fonds de roulement** | **13 086,01** | **16 078,23** | **16 745,78** | **19 638,42** |
| **= Fonds de roulement** | **13 086,01** | **29 164,24** | **45 910,02** | **65 548,44** |


## 2. Vérifications de cohérence


| # | Vérification | Statut | Détail |
| --- | --- | --- | --- |
| 1 | [Initial] Total ressources = apports K + apports CC + emprunts + CAF + subv invest | ✅ | `90 000,00 ≟ 90 000,00` |
| 2 | [Initial] Total immo = incorporelles + corporelles | ❌ | `76 913,99 ≟ 73 713,99` |
| 3 | [Initial] Total emplois = total immo + remb. capital | ✅ | `76 913,99 ≟ 76 913,99` |
| 4 | [Initial] Variation FR = total ressources − total emplois | ✅ | `13 086,01 ≟ 13 086,01` |
| 5 | [2026–2027] Total ressources = apports K + apports CC + emprunts + CAF + subv invest | ✅ | `24 170,49 ≟ 24 170,49` |
| 6 | [2026–2027] Total immo = incorporelles + corporelles | ✅ | `0,00 ≟ 0,00` |
| 7 | [2026–2027] Total emplois = total immo + remb. capital | ✅ | `8 092,26 ≟ 8 092,26` |
| 8 | [2026–2027] Variation FR = total ressources − total emplois | ✅ | `16 078,23 ≟ 16 078,23` |
| 9 | [2027–2028] Total ressources = apports K + apports CC + emprunts + CAF + subv invest | ✅ | `25 918,21 ≟ 25 918,21` |
| 10 | [2027–2028] Total immo = incorporelles + corporelles | ✅ | `0,00 ≟ 0,00` |
| 11 | [2027–2028] Total emplois = total immo + remb. capital | ✅ | `9 172,43 ≟ 9 172,43` |
| 12 | [2027–2028] Variation FR = total ressources − total emplois | ✅ | `16 745,78 ≟ 16 745,78` |
| 13 | [2028–2029] Total ressources = apports K + apports CC + emprunts + CAF + subv invest | ✅ | `29 184,56 ≟ 29 184,56` |
| 14 | [2028–2029] Total immo = incorporelles + corporelles | ✅ | `0,00 ≟ 0,00` |
| 15 | [2028–2029] Total emplois = total immo + remb. capital | ✅ | `9 546,14 ≟ 9 546,14` |
| 16 | [2028–2029] Variation FR = total ressources − total emplois | ✅ | `19 638,42 ≟ 19 638,42` |
| 17 | FR Initial = variation FR Initial | ✅ | `13 086,01 ≟ 13 086,01` |
| 18 | FR 2026–2027 = FR Initial + variation 2026–2027 | ✅ | `29 164,24 ≟ 29 164,24` |
| 19 | FR 2027–2028 = FR 2026–2027 + variation 2027–2028 | ✅ | `45 910,02 ≟ 45 910,02` |
| 20 | FR 2028–2029 = FR 2027–2028 + variation 2028–2029 | ✅ | `65 548,44 ≟ 65 548,44` |
| 21 | CAF Initial = 0 (aucune CAF avant démarrage) | ✅ | `0,00 ≟ 0,00` |
| 22 | CAF [2026–2027] = fc.caf.y1 | ✅ | `24 170,49 ≟ 24 170,49` |
| 23 | CAF [2027–2028] = fc.caf.y2 | ✅ | `25 918,21 ≟ 25 918,21` |
| 24 | CAF [2028–2029] = fc.caf.y3 | ✅ | `29 184,56 ≟ 29 184,56` |
| 25 | Remb. capital [2026–2027] = fc.capitalRembourse.y1 | ✅ | `8 092,26 ≟ 8 092,26` |
| 26 | Remb. capital [2027–2028] = fc.capitalRembourse.y2 | ✅ | `9 172,43 ≟ 9 172,43` |
| 27 | Remb. capital [2028–2029] = fc.capitalRembourse.y3 | ✅ | `9 546,14 ≟ 9 546,14` |

**Total : 26 OK, 1 KO sur 27 vérifications.**


## 3. Détail des apports


| Libellé | Type | Montant (€) | Date | Exercice |
| --- | --- | ---: | --- | --- |
| Apport personnel | CAPITAL | 20 000,00 | 01/05/2026 | Initial |
| Apport personnel | COMPTE_COURANT | 0,00 | 01/05/2026 | Initial |


## 4. Détail des emprunts



### CIC — 70 000,00 €


- Montant souscrit : **70 000,00 €** (Initial – 01/05/2026)

| Exercice | Capital remboursé (€) |
| --- | ---: |
| Initial | 0,00 |
| 2026–2027 | 8 092,26 |
| 2027–2028 | 9 172,43 |
| 2028–2029 | 9 546,14 |
| **Total** | **26 810,83** |


### Récapitulatif emprunts par exercice


| Exercice | Souscriptions (€) | Remboursements capital (€) |
| --- | ---: | ---: |
| Initial | 70 000,00 | 0,00 |
| 2026–2027 | 0,00 | 8 092,26 |
| 2027–2028 | 0,00 | 9 172,43 |
| 2028–2029 | 0,00 | 9 546,14 |


## 5. Détail des immobilisations


| Libellé | Nature | Montant HT (€) | Date acquisition | Exercice |
| --- | --- | ---: | --- | --- |
| Frais d'agence | INCORPOREL | 5 833,00 | 01/05/2026 | Initial |
| Fond de commerce (materiel) | CORPOREL | 31 060,00 | 01/05/2026 | Initial |
| Débours (provision pour frais de greffe et journal) | INCORPOREL | 500,00 | 01/05/2026 | Initial |
| Honoraires notaire (vente) | INCORPOREL | 1 200,00 | 01/05/2026 | Initial |
| Honoraires notaire (constitution société) | INCORPOREL | 700,00 | 01/05/2026 | Initial |
| Provision pour frais de greffe et journal (constitution société) | INCORPOREL | 500,00 | 01/05/2026 | Initial |
| Enseigne et communication | CORPOREL | 1 000,00 | 01/05/2026 | Initial |
| Droit d'enregistrement | INCORPOREL | 1 110,00 | 01/05/2026 | Initial |
| Caisse enregistreuse (airkitchen) | CORPOREL | 889,00 | 01/05/2026 | Initial |
| Fond de commerce | INCORPOREL | 28 940,00 | 01/05/2026 | Initial |
| Meuble pizza | CORPOREL | 1 222,99 | 01/05/2026 | Initial |
| Frais de garantie "BPI" | FINANCIER | 3 200,00 | 01/05/2026 | Initial |
| Formation HACCP | INCORPOREL | 759,00 | 01/05/2026 | Initial |


### 5b. Totaux immo par nature et exercice


| Exercice | Incorporelles (€) | Corporelles (€) | Total (€) |
| --- | ---: | ---: | ---: |
| Initial | 39 542,00 | 34 171,99 | **76 913,99** |
| 2026–2027 | 0,00 | 0,00 | **0,00** |
| 2027–2028 | 0,00 | 0,00 | **0,00** |
| 2028–2029 | 0,00 | 0,00 | **0,00** |


## 6. Récapitulatif


| Exercice | Total ressources (€) | Total emplois (€) | Variation FR (€) | Fonds de roulement (€) |
| --- | ---: | ---: | ---: | ---: |
| Initial | 90 000,00 | 76 913,99 | 13 086,01 | **13 086,01** |
| 2026–2027 | 24 170,49 | 8 092,26 | 16 078,23 | **29 164,24** |
| 2027–2028 | 25 918,21 | 9 172,43 | 16 745,78 | **45 910,02** |
| 2028–2029 | 29 184,56 | 9 546,14 | 19 638,42 | **65 548,44** |

**Score : 26/27 checks OK — ⚠ 1 anomalie(s) détectée(s)**

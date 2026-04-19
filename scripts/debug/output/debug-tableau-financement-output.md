# Diagnostic Tableau de Financement — Dossier `cmmjoradm0001kohp15on2xe1`

> **⚠ Ce fichier est généré automatiquement — ne pas modifier manuellement.**

Toutes les valeurs sont calculées via **les mêmes fonctions que l'application** :
`buildTableauFinancementRows` · `buildFinCalc`


## 0. Paramètres généraux

| Paramètre | Valeur |
| --- | --- |
| Dossier ID | `cmmjoradm0001kohp15on2xe1` |
| Date de démarrage | 01/05/2026 |
| Exercices | Initial · 2026–2027 · 2027–2028 · 2028–2029 |
| Apports | 2 |
| Emprunts | 1 |
| Immobilisations actives | 12 |
| Subventions | 0 |


## 1. Tableau de financement complet


| Désignation | Initial | 2026–2027 | 2027–2028 | 2028–2029 |
| --- | ---: | ---: | ---: | ---: |
| **RESSOURCES** | | | | |
| + Apports en capital | 1 000,00 | 0,00 | 0,00 | 0,00 |
| + Apports en comptes courants | 19 000,00 | 0,00 | 0,00 | 0,00 |
| + Souscription d'emprunts | 60 000,00 | 0,00 | 0,00 | 0,00 |
| + Subventions d'investissement | 0,00 | 0,00 | 0,00 | 0,00 |
| + Capacité d'autofinancement (CAF) | 0,00 | 8 465,68 | 10 709,33 | 13 960,96 |
| **= Total des ressources** | **80 000,00** | **8 465,68** | **10 709,33** | **13 960,96** |
| **EMPLOIS** | | | | |
| + Immobilisations incorporelles | 28 783,00 | 0,00 | 0,00 | 0,00 |
| + Immobilisations corporelles | 34 171,99 | 0,00 | 0,00 | 0,00 |
| + Immobilisations financières | 3 200,00 | 0,00 | 0,00 | 0,00 |
| **= Total immobilisations** | **66 154,99** | **0,00** | **0,00** | **0,00** |
| + Remboursement des emprunts | 0,00 | 6 936,24 | 7 862,08 | 8 182,42 |
| **= Total des emplois** | **66 154,99** | **6 936,24** | **7 862,08** | **8 182,42** |
| **FONDS DE ROULEMENT** | | | | |
| **= Variation du fonds de roulement** | **13 845,01** | **1 529,44** | **2 847,25** | **5 778,54** |
| **= Fonds de roulement** | **13 845,01** | **15 374,45** | **18 221,71** | **24 000,25** |


## 2. Vérifications de cohérence


| # | Vérification | Statut | Détail |
| --- | --- | --- | --- |
| 1 | [Initial] Total ressources = apports K + apports CC + emprunts + CAF + subv invest | ✅ | `80 000,00 ≟ 80 000,00` |
| 2 | [Initial] Total immo = incorporelles + corporelles | ❌ | `66 154,99 ≟ 62 954,99` |
| 3 | [Initial] Total emplois = total immo + remb. capital | ✅ | `66 154,99 ≟ 66 154,99` |
| 4 | [Initial] Variation FR = total ressources − total emplois | ✅ | `13 845,01 ≟ 13 845,01` |
| 5 | [2026–2027] Total ressources = apports K + apports CC + emprunts + CAF + subv invest | ✅ | `8 465,68 ≟ 8 465,68` |
| 6 | [2026–2027] Total immo = incorporelles + corporelles | ✅ | `0,00 ≟ 0,00` |
| 7 | [2026–2027] Total emplois = total immo + remb. capital | ✅ | `6 936,24 ≟ 6 936,24` |
| 8 | [2026–2027] Variation FR = total ressources − total emplois | ✅ | `1 529,44 ≟ 1 529,44` |
| 9 | [2027–2028] Total ressources = apports K + apports CC + emprunts + CAF + subv invest | ✅ | `10 709,33 ≟ 10 709,33` |
| 10 | [2027–2028] Total immo = incorporelles + corporelles | ✅ | `0,00 ≟ 0,00` |
| 11 | [2027–2028] Total emplois = total immo + remb. capital | ✅ | `7 862,08 ≟ 7 862,08` |
| 12 | [2027–2028] Variation FR = total ressources − total emplois | ✅ | `2 847,25 ≟ 2 847,25` |
| 13 | [2028–2029] Total ressources = apports K + apports CC + emprunts + CAF + subv invest | ✅ | `13 960,96 ≟ 13 960,96` |
| 14 | [2028–2029] Total immo = incorporelles + corporelles | ✅ | `0,00 ≟ 0,00` |
| 15 | [2028–2029] Total emplois = total immo + remb. capital | ✅ | `8 182,42 ≟ 8 182,42` |
| 16 | [2028–2029] Variation FR = total ressources − total emplois | ✅ | `5 778,54 ≟ 5 778,54` |
| 17 | FR Initial = variation FR Initial | ✅ | `13 845,01 ≟ 13 845,01` |
| 18 | FR 2026–2027 = FR Initial + variation 2026–2027 | ✅ | `15 374,45 ≟ 15 374,45` |
| 19 | FR 2027–2028 = FR 2026–2027 + variation 2027–2028 | ✅ | `18 221,71 ≟ 18 221,71` |
| 20 | FR 2028–2029 = FR 2027–2028 + variation 2028–2029 | ✅ | `24 000,25 ≟ 24 000,25` |
| 21 | CAF Initial = 0 (aucune CAF avant démarrage) | ✅ | `0,00 ≟ 0,00` |
| 22 | CAF [2026–2027] = fc.caf.y1 | ✅ | `8 465,68 ≟ 8 465,68` |
| 23 | CAF [2027–2028] = fc.caf.y2 | ✅ | `10 709,33 ≟ 10 709,33` |
| 24 | CAF [2028–2029] = fc.caf.y3 | ✅ | `13 960,96 ≟ 13 960,96` |
| 25 | Remb. capital [2026–2027] = fc.capitalRembourse.y1 | ✅ | `6 936,24 ≟ 6 936,24` |
| 26 | Remb. capital [2027–2028] = fc.capitalRembourse.y2 | ✅ | `7 862,08 ≟ 7 862,08` |
| 27 | Remb. capital [2028–2029] = fc.capitalRembourse.y3 | ✅ | `8 182,42 ≟ 8 182,42` |

**Total : 26 OK, 1 KO sur 27 vérifications.**


## 3. Détail des apports


| Libellé | Type | Montant (€) | Date | Exercice |
| --- | --- | ---: | --- | --- |
| Apport personnel | CAPITAL | 1 000,00 | 01/05/2026 | Initial |
| Apport personnel | COMPTE_COURANT | 19 000,00 | 01/05/2026 | Initial |


## 4. Détail des emprunts



### CIC — 60 000,00 €


- Montant souscrit : **60 000,00 €** (Initial – 01/05/2026)

| Exercice | Capital remboursé (€) |
| --- | ---: |
| Initial | 0,00 |
| 2026–2027 | 6 936,24 |
| 2027–2028 | 7 862,08 |
| 2028–2029 | 8 182,42 |
| **Total** | **22 980,74** |


### Récapitulatif emprunts par exercice


| Exercice | Souscriptions (€) | Remboursements capital (€) |
| --- | ---: | ---: |
| Initial | 60 000,00 | 0,00 |
| 2026–2027 | 0,00 | 6 936,24 |
| 2027–2028 | 0,00 | 7 862,08 |
| 2028–2029 | 0,00 | 8 182,42 |


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
| Fond de commerce | INCORPOREL | 18 940,00 | 01/05/2026 | Initial |
| Meuble pizza | CORPOREL | 1 222,99 | 01/05/2026 | Initial |
| Frais de garantie "BPI" | FINANCIER | 3 200,00 | 01/05/2026 | Initial |


### 5b. Totaux immo par nature et exercice


| Exercice | Incorporelles (€) | Corporelles (€) | Total (€) |
| --- | ---: | ---: | ---: |
| Initial | 28 783,00 | 34 171,99 | **66 154,99** |
| 2026–2027 | 0,00 | 0,00 | **0,00** |
| 2027–2028 | 0,00 | 0,00 | **0,00** |
| 2028–2029 | 0,00 | 0,00 | **0,00** |


## 6. Récapitulatif


| Exercice | Total ressources (€) | Total emplois (€) | Variation FR (€) | Fonds de roulement (€) |
| --- | ---: | ---: | ---: | ---: |
| Initial | 80 000,00 | 66 154,99 | 13 845,01 | **13 845,01** |
| 2026–2027 | 8 465,68 | 6 936,24 | 1 529,44 | **15 374,45** |
| 2027–2028 | 10 709,33 | 7 862,08 | 2 847,25 | **18 221,71** |
| 2028–2029 | 13 960,96 | 8 182,42 | 5 778,54 | **24 000,25** |

**Score : 26/27 checks OK — ⚠ 1 anomalie(s) détectée(s)**

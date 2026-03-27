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
| Apports | 3 |
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
| + Capacité d'autofinancement (CAF) | 0,00 | 9 487,72 | 8 612,55 | 12 001,22 |
| **= Total des ressources** | **80 000,00** | **9 487,72** | **8 612,55** | **12 001,22** |
| **EMPLOIS** | | | | |
| + Immobilisations incorporelles | 28 783,00 | 0,00 | 0,00 | 0,00 |
| + Immobilisations corporelles | 35 898,00 | 0,00 | 0,00 | 0,00 |
| **= Total immobilisations** | **64 681,00** | **0,00** | **0,00** | **0,00** |
| + Remboursement des emprunts | 0,00 | 6 936,24 | 7 862,08 | 8 182,42 |
| **= Total des emplois** | **64 681,00** | **6 936,24** | **7 862,08** | **8 182,42** |
| **FONDS DE ROULEMENT** | | | | |
| **= Variation du fonds de roulement** | **15 319,00** | **2 551,48** | **750,47** | **3 818,80** |
| **= Fonds de roulement** | **15 319,00** | **17 870,48** | **18 620,96** | **22 439,76** |


## 2. Vérifications de cohérence


| # | Vérification | Statut | Détail |
| --- | --- | --- | --- |
| 1 | [Initial] Total ressources = apports K + apports CC + emprunts + CAF + subv invest | ✅ | `80 000,00 ≟ 80 000,00` |
| 2 | [Initial] Total immo = incorporelles + corporelles | ✅ | `64 681,00 ≟ 64 681,00` |
| 3 | [Initial] Total emplois = total immo + remb. capital | ✅ | `64 681,00 ≟ 64 681,00` |
| 4 | [Initial] Variation FR = total ressources − total emplois | ✅ | `15 319,00 ≟ 15 319,00` |
| 5 | [2026–2027] Total ressources = apports K + apports CC + emprunts + CAF + subv invest | ✅ | `9 487,72 ≟ 9 487,72` |
| 6 | [2026–2027] Total immo = incorporelles + corporelles | ✅ | `0,00 ≟ 0,00` |
| 7 | [2026–2027] Total emplois = total immo + remb. capital | ✅ | `6 936,24 ≟ 6 936,24` |
| 8 | [2026–2027] Variation FR = total ressources − total emplois | ✅ | `2 551,48 ≟ 2 551,48` |
| 9 | [2027–2028] Total ressources = apports K + apports CC + emprunts + CAF + subv invest | ✅ | `8 612,55 ≟ 8 612,55` |
| 10 | [2027–2028] Total immo = incorporelles + corporelles | ✅ | `0,00 ≟ 0,00` |
| 11 | [2027–2028] Total emplois = total immo + remb. capital | ✅ | `7 862,08 ≟ 7 862,08` |
| 12 | [2027–2028] Variation FR = total ressources − total emplois | ✅ | `750,47 ≟ 750,47` |
| 13 | [2028–2029] Total ressources = apports K + apports CC + emprunts + CAF + subv invest | ✅ | `12 001,22 ≟ 12 001,22` |
| 14 | [2028–2029] Total immo = incorporelles + corporelles | ✅ | `0,00 ≟ 0,00` |
| 15 | [2028–2029] Total emplois = total immo + remb. capital | ✅ | `8 182,42 ≟ 8 182,42` |
| 16 | [2028–2029] Variation FR = total ressources − total emplois | ✅ | `3 818,80 ≟ 3 818,80` |
| 17 | FR Initial = variation FR Initial | ✅ | `15 319,00 ≟ 15 319,00` |
| 18 | FR 2026–2027 = FR Initial + variation 2026–2027 | ✅ | `17 870,48 ≟ 17 870,48` |
| 19 | FR 2027–2028 = FR 2026–2027 + variation 2027–2028 | ✅ | `18 620,96 ≟ 18 620,96` |
| 20 | FR 2028–2029 = FR 2027–2028 + variation 2028–2029 | ✅ | `22 439,76 ≟ 22 439,76` |
| 21 | CAF Initial = 0 (aucune CAF avant démarrage) | ✅ | `0,00 ≟ 0,00` |
| 22 | CAF [2026–2027] = fc.caf.y1 | ✅ | `9 487,72 ≟ 9 487,72` |
| 23 | CAF [2027–2028] = fc.caf.y2 | ✅ | `8 612,55 ≟ 8 612,55` |
| 24 | CAF [2028–2029] = fc.caf.y3 | ✅ | `12 001,22 ≟ 12 001,22` |
| 25 | Remb. capital [2026–2027] = fc.capitalRembourse.y1 | ✅ | `6 936,24 ≟ 6 936,24` |
| 26 | Remb. capital [2027–2028] = fc.capitalRembourse.y2 | ✅ | `7 862,08 ≟ 7 862,08` |
| 27 | Remb. capital [2028–2029] = fc.capitalRembourse.y3 | ✅ | `8 182,42 ≟ 8 182,42` |

**Total : 27 OK, 0 KO sur 27 vérifications.**


## 3. Détail des apports


| Libellé | Type | Montant (€) | Date | Exercice |
| --- | --- | ---: | --- | --- |
| Apport personnel | CAPITAL | 1 000,00 | 01/05/2026 | Initial |
| Apport prêt d'honneur | COMPTE_COURANT | 10 000,00 | 01/05/2026 | Initial |
| Apport personnel | COMPTE_COURANT | 9 000,00 | 01/05/2026 | Initial |


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
| Meuble pizza | CORPOREL | 1 499,00 | 01/05/2026 | Initial |
| Enseigne et communication | CORPOREL | 1 500,00 | 01/05/2026 | Initial |
| Caisse enregistreuse (airkitchen) | CORPOREL | 889,00 | 01/05/2026 | Initial |
| Frais d'agence | INCORPOREL | 5 833,00 | 01/05/2026 | Initial |
| Fond de commerce (materiel) | CORPOREL | 31 060,00 | 01/05/2026 | Initial |
| Débours (provision pour frais de greffe et journal) | INCORPOREL | 500,00 | 01/05/2026 | Initial |
| Honoraires notaire (vente) | INCORPOREL | 1 200,00 | 01/05/2026 | Initial |
| Honoraires notaire (constitution société) | INCORPOREL | 700,00 | 01/05/2026 | Initial |
| Provision pour frais de greffe et journal (constitution société) | INCORPOREL | 500,00 | 01/05/2026 | Initial |
| Frais de garantie "France active" | FINANCIER | 950,00 | 01/05/2026 | Initial |
| Droit d'enregistrement | INCORPOREL | 1 110,00 | 01/05/2026 | Initial |
| Fond de commerce | INCORPOREL | 18 940,00 | 01/05/2026 | Initial |


### 5b. Totaux immo par nature et exercice


| Exercice | Incorporelles (€) | Corporelles (€) | Total (€) |
| --- | ---: | ---: | ---: |
| Initial | 28 783,00 | 35 898,00 | **64 681,00** |
| 2026–2027 | 0,00 | 0,00 | **0,00** |
| 2027–2028 | 0,00 | 0,00 | **0,00** |
| 2028–2029 | 0,00 | 0,00 | **0,00** |


## 6. Récapitulatif


| Exercice | Total ressources (€) | Total emplois (€) | Variation FR (€) | Fonds de roulement (€) |
| --- | ---: | ---: | ---: | ---: |
| Initial | 80 000,00 | 64 681,00 | 15 319,00 | **15 319,00** |
| 2026–2027 | 9 487,72 | 6 936,24 | 2 551,48 | **17 870,48** |
| 2027–2028 | 8 612,55 | 7 862,08 | 750,47 | **18 620,96** |
| 2028–2029 | 12 001,22 | 8 182,42 | 3 818,80 | **22 439,76** |

**Score : 27/27 checks OK — ✅ aucune anomalie**

# Règles de Calcul — Moteur de Paie 2026

> Documentation exhaustive des formules, constantes et règles métier du moteur de simulation de fiche de paie.
>
> Sources : Code du travail, Code de la Sécurité sociale, BOSS (Bulletin Officiel de la Sécurité Sociale), Urssaf, Agirc-Arrco, Service Public.
>
> Millésime : **2026** — Fichier source : `src/lib/paie/params/2026.ts`

---

## Table des matières

1. [Pipeline de simulation (11 étapes)](#1-pipeline-de-simulation)
2. [Paramètres légaux 2026](#2-paramètres-légaux-2026)
3. [Assiettes de cotisations](#3-assiettes-de-cotisations)
4. [Cotisations sociales (Urssaf + Agirc-Arrco)](#4-cotisations-sociales)
5. [Réduction Générale Dégressive Unique (RGDU)](#5-réduction-générale-dégressive-unique-rgdu)
6. [Exonérations heures supplémentaires](#6-exonérations-heures-supplémentaires)
7. [Profils spécialisés (apprenti, stage, Alsace-Moselle)](#7-profils-spécialisés)
8. [Prévoyance et mutuelle](#8-prévoyance-et-mutuelle)
9. [Calcul fiscal (net social → net à payer)](#9-calcul-fiscal)
10. [Conversion net → brut (dichotomie)](#10-conversion-net--brut)
11. [Absences et maintien de salaire](#11-absences-et-maintien-de-salaire)
12. [Conventions collectives (10 IDCC)](#12-conventions-collectives)
13. [Règles d'arrondi](#13-règles-darrondi)

---

## 1. Pipeline de simulation

Le moteur exécute **11 étapes séquentielles** (fonction pure `simulate()` dans `simulate.ts`) :

| Étape | Module                       | Responsabilité                                                  |
| ----- | ---------------------------- | --------------------------------------------------------------- |
| 1     | `ProfileEngine`              | Qualification du profil (général, apprenti, stagiaire, spécial) |
| 2     | —                            | Chargement du rule set standard                                 |
| 3     | `RuleOverrideEngine`         | Surcharges profil / spécialité                                  |
| 4     | `ConventionRuleResolver`     | Surcharges conventionnelles (IDCC)                              |
| 5     | `buildAssiettes`             | Construction des assiettes (brut soumis, CSG, T1/T2, PMSS)      |
| 6     | —                            | Cumuls / plafonds inter-périodes (placeholder)                  |
| 7     | `calcCotisations`            | Calcul de toutes les lignes de cotisations                      |
| 8     | `calcRGDU` + exonérations HS | Réduction patronale + exonérations HS                           |
| 9     | `LeaveAndBenefitsEngine`     | Absences / IJSS / maintien (si événement d'absence)             |
| 10    | `buildTotaux`                | Net social, net imposable, PAS, net à payer, coût employeur     |
| 11    | —                            | Assemblage du résultat `SimulationResultat`                     |

---

## 2. Paramètres légaux 2026

### 2.1 Salaires minimaux et plafonds

| Paramètre                   | Valeur      | Source               |
| --------------------------- | ----------- | -------------------- |
| SMIC horaire brut           | 12,02 €     | Décret annuel        |
| SMIC mensuel (151,67 h)     | 1 823,03 €  |                      |
| SMIC annuel                 | 21 876,40 € |                      |
| PASS annuel                 | 48 060 €    | Arrêté SS            |
| PASS mensuel                | 4 005 €     |                      |
| Heures légales mensuelles   | 151,67 h    | Art. L3121-27 C.Trav |
| Gratification stage horaire | 4,50 €      | Art. L124-6 C.Éduc   |

### 2.2 Taux de cotisations Urssaf

| Cotisation                  | Taux employeur | Taux salarié | Assiette     | Déductible |
| --------------------------- | -------------- | ------------ | ------------ | ---------- |
| Assurance maladie           | 13,00 %        | 0 %          | Totalité     | —          |
| CSA (solidarité autonomie)  | 0,30 %         | 0 %          | Totalité     | —          |
| Vieillesse plafonnée        | 8,55 %         | 6,90 %       | ≤ 1 PASS     | ✓          |
| Vieillesse déplafonnée      | 2,11 %         | 0,40 %       | Totalité     | ✓          |
| Allocations familiales      | 5,25 %         | 0 %          | Totalité     | —          |
| Assurance chômage           | 4,00 %         | 0 %          | ≤ 4 PASS     | —          |
| AGS                         | 0,25 %         | 0 %          | ≤ 4 PASS     | —          |
| FNAL (< 50 sal.)            | 0,10 %         | 0 %          | ≤ 1 PASS     | —          |
| FNAL (≥ 50 sal.)            | 0,50 %         | 0 %          | Totalité     | —          |
| Dialogue social             | 0,016 %        | 0 %          | Totalité     | —          |
| CSG déductible              | 0 %            | 6,80 %       | Assiette CSG | ✓          |
| CSG non déductible          | 0 %            | 2,40 %       | Assiette CSG | ✗          |
| CRDS                        | 0 %            | 0,50 %       | Assiette CSG | ✗          |
| AT/MP                       | Variable       | 0 %          | Totalité     | —          |
| Versement mobilité          | Variable       | 0 %          | Totalité     | —          |
| Taxe d'apprentissage        | 0,68 %         | 0 %          | Totalité     | —          |
| Formation prof. (< 11 sal.) | 0,55 %         | 0 %          | Totalité     | —          |
| Formation prof. (≥ 11 sal.) | 1,00 %         | 0 %          | Totalité     | —          |

### 2.3 Taux Agirc-Arrco

| Ligne       | Taux salarié | Taux employeur | Assiette             | Condition         |
| ----------- | ------------ | -------------- | -------------------- | ----------------- |
| Retraite T1 | 3,15 %       | 4,72 %         | Tranche 1 (0–1 PASS) | Si T1 > 0         |
| CEG T1      | 0,86 %       | 1,29 %         | Tranche 1            | Si T1 > 0         |
| Retraite T2 | 8,64 %       | 12,95 %        | Tranche 2 (1–8 PASS) | Si T2 > 0         |
| CEG T2      | 1,08 %       | 1,62 %         | Tranche 2            | Si T2 > 0         |
| CET         | 0,14 %       | 0,21 %         | Totalité             | Si brut > PASS    |
| APEC        | 0,024 %      | 0,036 %        | min(T1+T2, 4 PASS)   | Cadres uniquement |

### 2.4 Paramètres RGDU

| Paramètre                    | Valeur            |
| ---------------------------- | ----------------- |
| Taux minimum (T_min)         | 0,02              |
| T_delta (< 50 sal.)          | 0,3781            |
| T_delta (≥ 50 sal.)          | 0,3821            |
| Coefficient max (< 50 sal.)  | 0,3981            |
| Coefficient max (≥ 50 sal.)  | 0,4021            |
| Exposant de dégressivité (P) | 1,75              |
| Facteur de sortie            | 3 (× SMIC annuel) |

### 2.5 Tranches heures supplémentaires (régime légal)

| Heures hebdomadaires | Majoration |
| -------------------- | ---------- |
| h36 – h43            | +25 %      |
| h44+                 | +50 %      |

---

## 3. Assiettes de cotisations

> Fichier : `engine/assiettes.ts`

### 3.1 Brut soumis à cotisations

```
brut_soumis = salaire_base
            + heures_sup_majorées
            + primes_soumises
            + avantages_en_nature
            − absences_non_rémunérées
```

### 3.2 Salaire de base proratisé

Si le salarié a travaillé moins que ses heures contractuelles :

```
si heures_travaillées < heures_contrat :
    salaire_base = brut_mensuel × (heures_travaillées / heures_contrat)
sinon :
    salaire_base = brut_mensuel
```

### 3.3 Heures supplémentaires — régime légal

```
heures_normales = min(heures_contrat, 151,67)
taux_horaire    = brut_mensuel / heures_normales
heures_sup      = nb_heures_sup × taux_horaire × (1 + taux_majoration)
```

Exemple : 10 HS à 25 % avec brut 2 000 € → `10 × (2000/151,67) × 1,25 = 164,84 €`

### 3.4 Heures supplémentaires — multi-tranches conventionnelles

Pour les conventions avec grille dérogatoire (ex : HCR h36–39 à 10 %, h40–43 à 20 %, h44+ à 50 %) :

```
SEMAINES_PAR_MOIS = 52 / 12  (≈ 4,333)

hs_par_semaine = nb_heures_sup / SEMAINES_PAR_MOIS
total_hebdo    = heures_légales_hebdo + hs_par_semaine

Pour chaque tranche [heure_début, heure_fin, taux] :
    hs_hebdo_dans_tranche = max(0, min(total_hebdo, heure_fin) − (heure_début − 1))
    hs_mensuel_dans_tranche = hs_hebdo_dans_tranche × SEMAINES_PAR_MOIS
    total += hs_mensuel_dans_tranche × taux_horaire × (1 + taux)
```

### 3.5 Assiette CSG/CRDS

```
assiette_csg = brut_soumis × 0,9825 + part_patronale_complémentaire
```

La **part patronale complémentaire** inclut :

- Part employeur de la mutuelle obligatoire
- Part employeur de la prévoyance complémentaire

> Ces montants sont ajoutés **sans** l'abattement de 98,25 % (seul le brut soumis est abattu).

### 3.6 Tranches Agirc-Arrco

```
base_T1 = min(brut_soumis, PMSS_proratisé)
base_T2 = max(0, min(brut_soumis − PMSS_proratisé, 7 × PMSS_proratisé))
```

### 3.7 PMSS proratisé

```
facteur_temps_partiel = si heures_contrat < 151,67
                        alors heures_contrat / 151,67
                        sinon 1

facteur_présence = facteur_prorata (entrée/sortie en cours de mois)

PMSS_proratisé = 4 005 × facteur_temps_partiel × facteur_présence
```

### 3.8 Facteur de proratisation (entrée/sortie)

```
si pas de date d'entrée ni de sortie : facteur = 1

sinon :
    total_jours = jours_calendaires_du_mois
    jour_début  = date_entrée.jour  (ou 1 si pas d'entrée ce mois)
    jour_fin    = date_sortie.jour  (ou dernier jour du mois)
    jours_actifs = max(0, jour_fin − jour_début + 1)
    facteur = jours_actifs / total_jours
```

---

## 4. Cotisations sociales

> Fichier : `engine/cotisations.ts`

### 4.1 Formule générale d'une ligne de cotisation

```
assiette        = arrondi_2_déc(assiette_applicable)
montant_salarié = arrondi_2_déc(assiette × taux_salarié)
montant_patron  = arrondi_2_déc(assiette × taux_employeur)
```

### 4.2 Lignes Urssaf (17 lignes)

| Code                     | Libellé                | Assiette       | Taux emp.      | Taux sal. | Déductible | Notes            |
| ------------------------ | ---------------------- | -------------- | -------------- | --------- | ---------- | ---------------- |
| `MALADIE_PAT`            | Assurance maladie      | Totalité       | 13 %           | 0 %       | —          |                  |
| `CSA_PAT`                | Solidarité autonomie   | Totalité       | 0,30 %         | 0 %       | —          |                  |
| `VIEILL_PLAF_SAL`        | Vieillesse plafonnée   | ≤ PMSS         | 8,55 %         | 6,90 %    | ✓          |                  |
| `VIEILL_DEPLAF`          | Vieillesse déplafonnée | Totalité       | 2,11 %         | 0,40 %    | ✓          |                  |
| `ALLOC_FAM_PAT`          | Allocations familiales | Totalité       | 5,25 %         | 0 %       | —          |                  |
| `CHOMAGE_PAT`            | Assurance chômage      | ≤ 4 PASS       | 4 %            | 0 %       | —          |                  |
| `AGS_PAT`                | AGS                    | ≤ 4 PASS       | 0,25 %         | 0 %       | —          |                  |
| `FNAL_PAT`               | FNAL                   | Selon effectif | Selon effectif | 0 %       | —          | Voir §2.2        |
| `DIAL_SOC_PAT`           | Dialogue social        | Totalité       | 0,016 %        | 0 %       | —          |                  |
| `CSG_DED_SAL`            | CSG déductible         | Assiette CSG   | 0 %            | 6,80 %    | ✓          |                  |
| `CSG_NDED_SAL`           | CSG non déductible     | Assiette CSG   | 0 %            | 2,40 %    | ✗          |                  |
| `CRDS_SAL`               | CRDS                   | Assiette CSG   | 0 %            | 0,50 %    | ✗          |                  |
| `ATMP_PAT`               | AT/MP                  | Totalité       | Variable       | 0 %       | —          | Taux par secteur |
| `MOBILITE_PAT`           | Versement mobilité     | Totalité       | Variable       | 0 %       | —          | Si défini        |
| `TAXE_APPRENTISSAGE_PAT` | Taxe apprentissage     | Totalité       | 0,68 %         | 0 %       | —          |                  |
| `FORMATION_PRO_PAT`      | Formation pro.         | Totalité       | 0,55 / 1 %     | 0 %       | —          | Seuil 11 sal.    |

### 4.3 Lignes Agirc-Arrco (jusqu'à 6 lignes)

| Code           | Libellé                            | Assiette           | Condition         |
| -------------- | ---------------------------------- | ------------------ | ----------------- |
| `ARRCO_T1_SAL` | Retraite complémentaire T1         | Base T1            | Si T1 > 0         |
| `CEG_T1`       | Contribution d'équilibre T1        | Base T1            | Si T1 > 0         |
| `ARRCO_T2_SAL` | Retraite complémentaire T2         | Base T2            | Si T2 > 0         |
| `CEG_T2`       | Contribution d'équilibre T2        | Base T2            | Si T2 > 0         |
| `CET`          | Contribution d'équilibre technique | Totalité           | Si brut > PASS    |
| `APEC`         | APEC                               | min(T1+T2, 4 PASS) | Cadres uniquement |

---

## 5. Réduction Générale Dégressive Unique (RGDU)

> Fichier : `engine/rgdu.ts` — Sources : art. L241-13 CSS, BOSS

### 5.1 Éligibilité

```
si typeContrat = "stage"         → non éligible
si brut_annuel ≥ 3 × SMIC_annuel → non éligible

SMIC_annuel = SMIC_horaire × heures_contrat × 12
            = 12,02 × heures_contrat × 12

seuil_sortie = 3 × SMIC_annuel × facteur_prorata
éligible     = (brut_mensuel × 12) < seuil_sortie
```

### 5.2 Coefficient de réduction

```
remun_annuelle = brut_mensuel × 12
facteur        = 0,5 × ((3 × SMIC_annuel / remun_annuelle) − 1)

si facteur ≤ 0 → coefficient = 0 (au-dessus du seuil)

coefficient = T_min + T_delta × facteur ^ P
            = 0,02 + T_delta × facteur ^ 1,75

Plafonner à coeffMax :
  - < 50 sal. : min(coefficient, 0,3981)
  - ≥ 50 sal. : min(coefficient, 0,4021)

Arrondir à 4 décimales.
```

### 5.3 Montant mensuel

```
RGDU_annuel  = remun_annuelle × coefficient
RGDU_mensuel = arrondi_2_déc(RGDU_annuel / 12)
```

La RGDU est un **crédit employeur** : `montantEmployeur = −RGDU_mensuel` dans la ligne de bulletin.

---

## 6. Exonérations heures supplémentaires

> Fichier : `engine/exoneration-hs.ts`

### 6.1 Exonération fiscale IR (art. 81 quater CGI)

Les heures supplémentaires sont exonérées d'impôt sur le revenu dans la limite d'un plafond annuel.

```
PLAFOND_ANNUEL = 7 500 €

reste_disponible = max(0, PLAFOND_ANNUEL − cumul_HS_avant_ce_mois)
exoneration_IR   = min(remunération_HS, reste_disponible)
```

**Impact** : réduit le net imposable (base PAS) — les HS restent dans le brut soumis à cotisations.

### 6.2 Réduction des cotisations salariales (art. L241-17 CSS)

Cotisations salariales éligibles à la réduction :

| Cotisation             | Taux        |
| ---------------------- | ----------- |
| Vieillesse plafonnée   | 6,90 %      |
| Vieillesse déplafonnée | 0,40 %      |
| ARRCO T1               | 3,15 %      |
| CEG T1                 | 0,86 %      |
| **Total maximal**      | **11,31 %** |

```
brut_sans_HS = brut_soumis − remunération_HS

# Part de la HS dans l'assiette plafonnée (PASS)
ass_plaf_total   = min(brut_soumis, PMSS)
ass_plaf_sans_HS = min(max(0, brut_sans_HS), PMSS)
delta_plaf       = max(0, ass_plaf_total − ass_plaf_sans_HS)

# Cotisations théoriques sur la part HS
cot_vieill_plaf   = delta_plaf × 0,069
cot_vieill_deplaf = remHS × 0,004
cot_arrco_T1      = delta_plaf × 0,0315
cot_ceg_T1        = delta_plaf × 0,0086

total_théorique = somme des 4 cotisations

# Plafonnement à 11,31 % de la HS
réduction = min(total_théorique, remHS × 0,1131)
```

**Impact** : crédit salarié → `montantSalarie = −réduction` (augmente le net social).

### 6.3 Déduction forfaitaire patronale (art. L241-18 CSS)

| Effectif de l'entreprise | Déduction par heure sup |
| ------------------------ | ----------------------- |
| < 20 salariés            | 1,50 €                  |
| 20 – 249 salariés        | 0,50 €                  |
| ≥ 250 salariés           | 0 € (non éligible)      |

```
déduction = nb_heures_sup × montant_par_heure
```

**Impact** : crédit employeur → `montantEmployeur = −déduction`.

---

## 7. Profils spécialisés

### 7.1 Apprentissage

> Fichier : `profiles/apprenti.ts`

#### Rémunération minimale

| Année de contrat | 16–17 ans | 18–20 ans | 21–25 ans | 26+ ans    |
| ---------------- | --------- | --------- | --------- | ---------- |
| 1ère année       | 27 % SMIC | 43 % SMIC | 53 % SMIC | 100 % SMIC |
| 2ème année       | 39 % SMIC | 51 % SMIC | 61 % SMIC | 100 % SMIC |
| 3ème année       | 55 % SMIC | 67 % SMIC | 78 % SMIC | 100 % SMIC |

#### Exonérations de cotisations salariales

Deux régimes selon la génération du contrat :

**Avant mars 2025 :**

- Seuil d'exonération : 79 % du SMIC mensuel
- Cotisations exonérées : vieillesse plafonnée, vieillesse déplafonnée, CSG déductible, CSG non déductible, CRDS

**Depuis mars 2025 :**

- Seuil d'exonération : 50 % du SMIC mensuel

```
seuil_exo    = fraction × SMIC_mensuel
fraction_exo = min(1, seuil_exo / brut_soumis)

Pour chaque cotisation éligible :
    montant_exo = montant_salarié × fraction_exo
    Ligne d'exonération : montantSalarie = −montant_exo
```

### 7.2 Stage

> Fichier : `profiles/stage.ts`

**Seuil de franchise** : `4,50 × 151,67 = 682,52 €`

- Si `brut ≤ seuil_franchise` → **aucune cotisation** (aucune ligne)
- Si `brut > seuil_franchise` → CSG/CRDS sur la fraction excédentaire uniquement

```
fraction_excédent = (brut − seuil_franchise) / brut

Pour CSG/CRDS :
    nouvelle_assiette = assiette_initiale × fraction_excédent
    montant = nouvelle_assiette × taux
```

**Cotisations exclues pour les stages** (même au-delà du seuil) :

- Chômage, AGS
- Arrco T1/T2, CEG T1/T2, CET, APEC
- Maladie, CSA, Vieillesse plaf/déplaf
- Alloc. familiales, FNAL, Dialogue social, AT/MP
- Taxe d'apprentissage, Formation professionnelle

### 7.3 Régime local Alsace-Moselle

> Fichier : `profiles/alsace-moselle.ts`

Cotisation **supplémentaire** salariale uniquement :

```
Assurance maladie — régime local
    Assiette : brut_soumis (totalité)
    Taux salarié : 1,50 %
    Taux employeur : 0 %
```

---

## 8. Prévoyance et mutuelle

> Fichier : `params/prevoyance.ts`

### 8.1 Prévoyance complémentaire

Chaque garantie produit une ligne de cotisation :

```
montant_salarié  = brut_soumis × taux_salarié
montant_employeur = brut_soumis × taux_employeur
```

Les garanties sont définies par convention (organisme, taux, déductibilité).

### 8.2 Mutuelle obligatoire (ANI 2013)

Modèle **forfaitaire** (montant mensuel fixe, pas de taux sur brut) :

```
part_employeur_min = 50 %  (obligation légale ANI 2013)

montant_employeur = arrondi(montant_mensuel × part_employeur)
montant_salarié   = montant_mensuel − montant_employeur
```

> La part patronale de la mutuelle et de la prévoyance est intégrée dans l'assiette CSG
> **sans** l'abattement de 98,25 % (voir §3.5).

---

## 9. Calcul fiscal

> Fichier : `engine/fiscal.ts`

### 9.1 Total des cotisations salariales

```
total_cot_salariales = Σ (ligne.montantSalarie)  pour toutes les lignes
```

> Inclut les lignes négatives (réductions HS, exonérations apprenti).

### 9.2 Net social

```
net_social = arrondi_2_déc(brut_soumis − total_cot_salariales)
```

### 9.3 Net imposable

```
déductible = Σ (montantSalarie)  pour les lignes où deductible = true
non_déductible_sal = Σ (montantSalarie)  pour CSG non déductible + CRDS

net_imposable = arrondi_2_déc(
    brut_soumis
    − déductible
    + non_déductible_sal
    − exonération_HS_IR
)
```

### 9.4 Prélèvement à la Source (PAS)

```
PAS = arrondi_euro(net_imposable × taux_PAS)
```

> Arrondi à l'euro le plus proche (0 décimale) — art. BOI-IR-PAS-20-20-30-10.

### 9.5 Net à payer

```
net_à_payer = arrondi_2_déc(
    net_social
    − avantages_en_nature
    − PAS
)
```

> Les avantages en nature sont déduits car ils sont valorisés dans le brut mais non versés en numéraire.

### 9.6 Coût employeur

```
total_cot_patronales = Σ (montantEmployeur)
    pour toutes les lignes sauf RGDU

montant_RGDU = |montantEmployeur|  de la ligne RGDU (si elle existe)

coût_employeur = arrondi_2_déc(
    brut_soumis
    + total_cot_patronales
    − montant_RGDU
)
```

### 9.7 Taux de cotisations patronales effectif

```
taux_effectif = (coût_employeur − brut_soumis) / brut_soumis
```

---

## 10. Conversion net → brut

> Fichier : `engine/net-to-gross.ts`

Algorithme de **dichotomie** (recherche binaire) :

```
TOLÉRANCE      = 0,01 €
MAX_ITÉRATIONS = 80

borne_basse = SMIC × 0,5
borne_haute = max(net_cible × 2,5 , SMIC × 5)

Répéter :
    milieu = (borne_basse + borne_haute) / 2
    résultat = simulate({ brutMensuel: milieu })
    écart = résultat.netAPayer − net_cible

    si |écart| ≤ TOLÉRANCE → convergence ✓

    si écart < 0 :
        borne_basse = milieu   (net trop faible → augmenter brut)
    sinon :
        borne_haute = milieu   (net trop élevé → diminuer brut)

    si (borne_haute − borne_basse) < TOLÉRANCE/10 → arrêt
```

---

## 11. Absences et maintien de salaire

> Fichiers : `absence/` + `params/ijss-2026.ts`

### 11.1 Types d'absence

- `maladie_ordinaire` — Arrêt maladie standard
- `maladie_longue_duree` — Affection longue durée
- `at_mp` — Accident du travail / maladie professionnelle
- `maternite` — Congé maternité
- `paternite_accueil` — Congé paternité / accueil de l'enfant
- `adoption` — Congé d'adoption
- `conge_pathologique` — Congé pathologique

### 11.2 Calcul des IJSS

```
# 1. Salaire Journalier de Référence
SJR_brut = brut_mensuel / 30,42

# 2. Plafonnement
si maternité/paternité :
    plafond = PASS_annuel / 360
sinon :
    plafond = PASS_annuel / 730

SJR_plafonné = min(SJR_brut, plafond)

# 3. Carence SS
jours_carence_SS = 0 (AT/MP, maternité, paternité)
                 = 3 (maladie)

jours_indemnisés = max(0, jours_civils − jours_carence_SS)

# 4. IJ brute journalière
si AT/MP :
    Phase 1 (28 premiers jours) : 60 % du SJR
    Phase 2 (au-delà)           : 80 % du SJR
si maternité/paternité :
    100 % du SJR
si maladie :
    50 % du SJR

IJ_brute_totale = IJ_journalière × jours_indemnisés

# 5. Prélèvements sociaux
CSG sur IJ = 6,2 %
CRDS sur IJ = 0,5 %
IJ_nette = IJ_brute × (1 − 0,067)
```

### 11.3 Maintien de salaire légal (art. L1226-1 C.Trav)

#### Grille d'ancienneté

| Ancienneté  | Taux plein (90 %) | Taux partiel (66,67 %) |
| ----------- | ----------------- | ---------------------- |
| 1 – 6 ans   | 30 jours          | 30 jours               |
| 6 – 11 ans  | 40 jours          | 40 jours               |
| 11 – 16 ans | 50 jours          | 50 jours               |
| 16 – 21 ans | 60 jours          | 60 jours               |
| 21 – 26 ans | 70 jours          | 70 jours               |
| 26 – 31 ans | 80 jours          | 80 jours               |
| 31+ ans     | 90 jours          | 90 jours               |

#### Carence employeur

| Type d'absence      | Carence employeur |
| ------------------- | ----------------- |
| Maladie ordinaire   | 7 jours           |
| AT/MP               | 0 jour            |
| Maternité/paternité | 0 jour            |

#### Formule

```
brut_journalier = brut_mensuel / 30,42

jours_après_carence = max(0, jours_civils − carence_employeur)
jours_taux_plein    = min(jours_après_carence, durée_taux_plein)
jours_taux_partiel  = min(jours_après_carence − jours_taux_plein, durée_taux_partiel)

maintien_taux_plein   = brut_journalier × jours_taux_plein × 0,90
maintien_taux_partiel = brut_journalier × jours_taux_partiel × 0,6667

maintien_total = maintien_taux_plein + maintien_taux_partiel
```

---

## 12. Conventions collectives

Le moteur supporte **10 conventions collectives** via le système d'overrides (`ConventionRuleResolver`).

Chaque convention peut surcharger :

- Grilles de classification et minima conventionnels
- Majorations heures supplémentaires
- Primes obligatoires (repas, ancienneté, vacances, salissure, trajet…)
- Prévoyance / mutuelle (organisme, taux)
- Carence et maintien de salaire

### IDCC supportés

| IDCC | Convention                       | Particularités                                         |
| ---- | -------------------------------- | ------------------------------------------------------ |
| 1979 | HCR (Hôtels-Cafés-Restaurants)   | HS 10/20/50 %, indemnité repas 4,25 €, carence 3j      |
| 1486 | Syntec (IT, Conseil, Ingénierie) | Prime vacances 10 %, forfait jours 218, carence 0j     |
| 1266 | Restauration collective          | Prime ancienneté 1 %/an dès 3 ans, carence 3j          |
| 3043 | Propreté                         | Indemnité salissure 12,02 €, carence AT 0j dès 12 mois |
| 2941 | Aide à domicile (BAD/ADMR)       | 3 filières                                             |
| 1597 | BTP Ouvriers                     | Indemnité trajet ~45 €, carence AT 0j                  |
| 1245 | Commerce de détail               | Partiel                                                |
| 3248 | Métallurgie                      | Partiel                                                |
| 1351 | Sécurité privée                  | Partiel                                                |
| 16   | Transport routier                | Partiel                                                |

---

## 13. Règles d'arrondi

> Fichier : `engine/arrondi.ts`

| Fonction           | Précision   | Usage                                      |
| ------------------ | ----------- | ------------------------------------------ |
| `roundMontant(v)`  | 2 décimales | Montants en euros (cotisations, net, brut) |
| `roundAssiette(v)` | 2 décimales | Assiettes de cotisations                   |
| `roundCoeff(v)`    | 4 décimales | Coefficients et taux (RGDU)                |
| `roundEuro(v)`     | 0 décimale  | PAS (arrondi à l'euro le plus proche)      |

Formules :

```
roundMontant(v)  = Math.round(v × 100) / 100
roundAssiette(v) = Math.round(v × 100) / 100
roundCoeff(v)    = Math.round(v × 10 000) / 10 000
roundEuro(v)     = Math.round(v)
```

---

## Annexe — Structure des fichiers

```
src/lib/paie/
├── params/
│   ├── 2026.ts                  Constantes légales 2026
│   ├── ijss-2026.ts             IJSS + maintien légal
│   └── prevoyance.ts            Prévoyance / mutuelle
├── engine/
│   ├── assiettes.ts             Brut, PMSS, CSG, T1/T2
│   ├── cotisations.ts           Lignes Urssaf + Agirc-Arrco
│   ├── rgdu.ts                  Coefficient + montant RGDU
│   ├── exoneration-hs.ts        IR + cot. sal. + forfaitaire patronale
│   ├── fiscal.ts                Net social / imposable / PAS / coût employeur
│   ├── net-to-gross.ts          Dichotomie inverse
│   ├── arrondi.ts               Fonctions d'arrondi
│   └── pipeline-context.ts      Contexte d'exécution
├── profiles/
│   ├── profile-engine.ts        Résolution du profil
│   ├── apprenti.ts              Exonérations apprentissage
│   ├── stage.ts                 Filtrage cotisations stage
│   └── alsace-moselle.ts        Cotisation maladie locale
├── conventions/
│   ├── registry.ts              registerConvention()
│   ├── catalog.ts               Catalogue 10 IDCC
│   └── idcc/                    Fichiers par convention
├── overrides/
│   ├── rule-override-engine.ts  Fusion des rule sets
│   └── convention-rule-resolver.ts  Résolution IDCC → rule set
├── absence/
│   ├── leave-benefits-engine.ts Orchestrateur moteur absence
│   ├── ijss-subrogation-engine.ts  Calcul IJSS
│   ├── legal-maintenance.ts     Maintien L1226-1
│   └── ...
├── simulate.ts                  Pipeline principal (11 étapes)
├── types.ts                     Types TypeScript
└── __tests__/                   498 tests unitaires
```

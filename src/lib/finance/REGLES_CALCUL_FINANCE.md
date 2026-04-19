# Règles de Calcul — Moteur Financier Prévisionnel

> Documentation exhaustive des formules, constantes et règles métier du moteur de calcul
> financier prévisionnel (compte de résultat, SIG, BFR, bilan, trésorerie, TVA, seuil de rentabilité).
>
> Sources : Plan Comptable Général (PCG), Code Général des Impôts (CGI), logiciel RCA Prévisionnel.
>
> Fichiers source : `src/lib/finance/`

---

## Table des matières

1. [Architecture du pipeline (10 étapes)](#1-architecture-du-pipeline)
2. [Types de séries temporelles](#2-types-de-séries-temporelles)
3. [Calendrier et exercice fiscal](#3-calendrier-et-exercice-fiscal)
4. [Distribution mensuelle des charges et produits](#4-distribution-mensuelle-des-charges-et-produits)
5. [Chiffre d'affaires et achats](#5-chiffre-daffaires-et-achats)
6. [Stocks et achats consommés](#6-stocks-et-achats-consommés)
7. [Charges d'exploitation](#7-charges-dexploitation)
8. [Personnel](#8-personnel)
9. [Soldes Intermédiaires de Gestion (SIG)](#9-soldes-intermédiaires-de-gestion-sig)
10. [Amortissements](#10-amortissements)
11. [Résultats comptables](#11-résultats-comptables)
12. [Impôt sur les Sociétés (IS)](#12-impôt-sur-les-sociétés-is)
13. [Capacité d'Autofinancement (CAF)](#13-capacité-dautofinancement-caf)
14. [TVA](#14-tva)
15. [Besoin en Fonds de Roulement (BFR)](#15-besoin-en-fonds-de-roulement-bfr)
16. [Seuil de rentabilité](#16-seuil-de-rentabilité)
17. [Bilan prévisionnel](#17-bilan-prévisionnel)
18. [Trésorerie](#18-trésorerie)
19. [Utilitaires partagés](#19-utilitaires-partagés)
20. [Annexe — Structure des fichiers](#20-annexe--structure-des-fichiers)

---

## 1. Architecture du pipeline

Le moteur exécute **10 étapes séquentielles** (fonction pure `buildFinCalc()` dans `pipeline/build.ts`) :

| Étape | Module / Fonction                     | Responsabilité                                                                      |
| ----- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| 1     | `makeExerciceHelpers(dateDemarrage)`  | Calendrier fiscal : bornes d'exercice, `toExerciceKey()`, prorata `pFin`/`pDeb`     |
| 2     | `calcTVA(data, helpers)`              | TVA collectée, déductible, crédit initial — source unique de vérité                 |
| 3     | `calcCapitalRembourse(data, toExKey)` | Capital amorti des emprunts par exercice (depuis échéanciers)                       |
| 4     | `calcResExcep(data)`                  | Résultat exceptionnel pré-calculé                                                   |
| 5     | `calcAjustementNet(data)`             | Ajustements fiscaux (réintégrations − déductions)                                   |
| 6     | `buildMonthlyCalc(data, date, IS=0)`  | **Passe 1** — Moteur mensuel complet avec IS=0 → `resCourant` provisoire            |
| 7     | `calcISParAnnee(resCourant, ...)`     | IS réel calculé sur la base du résultat courant provisoire (avec report de déficit) |
| 8     | `buildMonthlyCalc(data, date, IS)`    | **Passe 2** — Re-calcul complet avec IS réel → séries mensuelles définitives        |
| 9     | `monthlyToYearAcc()` × ~30 séries     | Agrégation des séries mensuelles en accumulateurs annuels (`YearAcc`)               |
| 10    | `calcBfr(data, fc)`                   | BFR et variation BFR (avec y0 = situation initiale)                                 |

> **Pourquoi deux passes ?** L'IS dépend du résultat courant, mais le résultat net dépend de l'IS.
> La dépendance circulaire est résolue par itération : passe 1 calcule `resCourant` sans IS,
> passe 2 injecte l'IS réel pour obtenir le `resNet` et la `CAF` définitifs.

Le pipeline retourne un objet `FinCalcResult` — intersection de 9 interfaces spécialisées (~50 champs).

---

## 2. Types de séries temporelles

| Type            | Définition                       | Usage                                             |
| --------------- | -------------------------------- | ------------------------------------------------- |
| `YearKey`       | `"y1" \| "y2" \| "y3"`           | Clé d'exercice fiscal (3 exercices de projection) |
| `YearKey4`      | `"y0" \| "y1" \| "y2" \| "y3"`   | Clé avec situation initiale (BFR)                 |
| `YearAcc`       | `Record<YearKey, number>`        | Accumulateur annuel sur 3 exercices               |
| `YearAcc4`      | `Record<YearKey4, number>`       | Accumulateur annuel avec y0 (situation initiale)  |
| `MonthlySeries` | `readonly number[]`              | 12 valeurs mensuelles pour un exercice            |
| `MutableSeries` | `number[]`                       | Version mutable de `MonthlySeries`                |
| `MonthlyAcc`    | `Record<YearKey, MonthlySeries>` | Séries mensuelles sur 3 exercices                 |

**Fichier source** : `types/series.ts`

### Fonctions d'accumulation

| Fonction              | Formule                          | Fichier      |
| --------------------- | -------------------------------- | ------------ |
| `zeroAcc()`           | `{ y1: 0, y2: 0, y3: 0 }`        | `utils.ts`   |
| `zeroAcc4()`          | `{ y0: 0, y1: 0, y2: 0, y3: 0 }` | `utils.ts`   |
| `zeroSeries()`        | `Array(12).fill(0)`              | `monthly.ts` |
| `sumSeries(a, b)`     | `a[i] + b[i]` pour i = 0..11     | `monthly.ts` |
| `subSeries(a, b)`     | `a[i] - b[i]` pour i = 0..11     | `monthly.ts` |
| `sumAll(...series)`   | `reduce(sumSeries)`              | `monthly.ts` |
| `totalOf(s)`          | `Σ s[i]` (somme des 12 mois)     | `monthly.ts` |
| `monthlyToYearAcc`    | `{ y1: totalOf(m.y1), ... }`     | `monthly.ts` |
| `lastMonthToYearAcc`  | `{ y1: m.y1[11], ... }`          | `monthly.ts` |
| `firstMonthToYearAcc` | `{ y1: m.y1[0], ... }`           | `monthly.ts` |

---

## 3. Calendrier et exercice fiscal

**Fichier source** : `pipeline/calendar.ts`

### Paramètres de l'exercice

Le projet supporte des exercices fiscaux démarrant **n'importe quel mois de l'année** (pas uniquement janvier).

```txt
dateDemarrage    = date fournie par l'utilisateur
anneeDebut       = dateDemarrage.getFullYear()
moisDebut        = dateDemarrage.getMonth()           // 0-indexé (0 = janvier)
```

### Bornes d'exercice

Chaque exercice couvre exactement 12 mois :

```txt
exBorne1 = dateDemarrage + 1 an    // fin Y1 / début Y2
exBorne2 = dateDemarrage + 2 ans   // fin Y2 / début Y3
exBorne3 = dateDemarrage + 3 ans   // fin Y3
```

### Prorata d'exercice fiscal

Quand l'exercice ne commence pas en janvier, le prorata sert aux calculs d'amortissement
chevauchant les années civiles :

```txt
pFin = moisDebut / 12          // proportion fin d'année civile (0 si janvier)
pDeb = 1 − pFin                // proportion début d'année civile
```

> Exemple : exercice commençant en avril (moisDebut = 3) → `pFin = 0.25`, `pDeb = 0.75`.

### Mappeur date → exercice fiscal

```txt
toExerciceKey(date) :
  Si dateDemarrage ≤ date < exBorne1 → "y1"
  Si exBorne1 ≤ date < exBorne2      → "y2"
  Si exBorne2 ≤ date < exBorne3      → "y3"
  Sinon                               → null
```

### Labels d'exercice

```txt
fmtExercice(year, moisDebut) :
  Si moisDebut === 0 → "2026"           (exercice calé sur l'année civile)
  Sinon              → "2026–2027"       (exercice à cheval)
```

### Contexte temporel (trésorerie)

```ts
TemporelCtx {
  anneeDebut, moisDebut,
  yearStarts: [Date, Date, Date, Date],   // début de chaque exercice
  isFranchise: boolean,                    // franchise TVA
  defaultDelaiClients: number,             // délai moyen encaissement (jours)
}
```

```txt
dateToSlot(date, yearStarts) :
  Pour i = 0..2 :
    Si yearStarts[i] ≤ date < yearStarts[i+1] :
      yk = ["y1", "y2", "y3"][i]
      mi = (date.year − yearStarts[i].year) × 12 + (date.month − yearStarts[i].month)
      Retourner { yk, mi: clamp(mi, 0, 11) }
  Retourner { yk: null, mi: -1 }
```

---

## 4. Distribution mensuelle des charges et produits

**Fichier source** : `calculs/monthly.ts`

Toutes les données saisies en montant annuel doivent être ventilées sur 12 mois.
Le moteur supporte 4 modes de distribution :

### 4.1 Distribution uniforme

```txt
uniformMonthly(total) :
  Retourner [total/12, total/12, ..., total/12]  // 12 valeurs identiques
```

### 4.2 Distribution saisonnière

Utilise des pourcentages mensuels saisis par l'utilisateur (somme libre, pas forcément 100%).

```txt
seasonalMonthly(total, saisonnalite, yearKey) :
  pcts = saisonnalite[yearKey]   // Array(12) de pourcentages

  Si pcts existe ET length ≥ 12 :
    Retourner [total × pcts[0]/100, total × pcts[1]/100, ..., total × pcts[11]/100]
  Sinon :
    Retourner uniformMonthly(total)
```

> **Important** : la somme des pourcentages peut dépasser ou être inférieure à 100%.
> C'est un choix de saisie — le moteur ne normalise pas.

### 4.3 Distribution par fréquence

Répartit le montant annuel selon une fréquence de paiement, en tenant compte du mois de paiement :

```txt
distributeByFrequency(total, frequence, moisPaiement) :
  mois = moisPaiement ?? 1   // défaut janvier

  MENSUELLE :
    total/12 uniforme

  TRIMESTRIELLE :
    total/4 aux mois [(mois−1), (mois+2), (mois+5), (mois+8)] modulo 12

  SEMESTRIELLE :
    total/2 aux mois [(mois−1), (mois−1+6)] modulo 12

  ANNUELLE :
    total entier au mois (mois−1) modulo 12

  défaut :
    uniforme
```

### 4.4 Distribution charges d'exploitation

Combinaison intelligente selon le mode de calcul de la charge :

```txt
chargeExplMonthly(montant, row, yearKey) :
  Si row.detailCalc.modeCalc === "POURCENTAGE_CA" :
    Retourner seasonalMonthly(montant, detailCalc.saisonnaliteCA, yearKey)
  Sinon :
    Retourner distributeByFrequency(montant, row.frequence, row.moisPaiement)
```

### 4.5 Distribution ponctuelle

Pour les montants saisis mois par mois (achats ponctuels de stock, etc.) :

```txt
ponctuelMonthly(ponctuel, yearKey) :
  vals = ponctuel[yearKey]   // Array de montants bruts (pas des %)
  Si absent → zeroSeries()
  Sinon → copier vals[0..11] dans un zeroSeries
```

---

## 5. Chiffre d'affaires et achats

**Fichier source** : `calculs/ca.ts`, `calculs/monthly.ts`

### 5.1 CA annuel (agrégat)

```txt
calcCA(data) :
  rows = activités actives (actif !== false)
  y1 = Σ rows.montantN
  y2 = Σ rows.montantN1
  y3 = Σ rows.montantN2
```

### 5.2 CA par type d'activité

```txt
calcCAByType(data, type) :
  rows = activités actives ET typeActivite === type
  Même agrégation que calcCA
```

Types supportés : `"PRODUCTION_VENDUE"`, `"PRESTATION_SERVICES"`, `"VENTES_MARCHANDISES"`.

### 5.3 CA mensuel (moteur)

```txt
Pour chaque activité active :
  caMonthly = seasonalMonthly(montantN, saisonnaliteCA, "N")
  Accumule dans caAcc[yk]
  Ventile par type (productionVendue / prestationServices / ventesMarchandises)
```

### 5.4 Commissions sur CA

```txt
calcCommissions(data) :
  rows = commissions actives
  y1 = Σ rows.montantN,  y2 = Σ rows.montantN1,  y3 = Σ rows.montantN2
```

### 5.5 Productions immobilisées

```txt
calcProdImmo(data, toExerciceKey) :
  Pour chaque production immobilisée active :
    yk = toExerciceKey(production.date)
    Si yk → acc[yk] += montant
```

---

## 6. Stocks et achats consommés

**Fichier source** : `calculs/ca.ts` (annuel), `calculs/monthly.ts` (mensuel)

### 6.1 Achats consommés (annuel simplifié)

```txt
achatsConsommés = CA × (1 − tauxMarge / 100)
```

> Seules les activités hors `PRESTATION_SERVICES` génèrent des achats.
> Le `tauxMarge` est un pourcentage (0-100). Si `tauxMarge = 30%`, les achats = 70% du CA.

### 6.2 Stock final (convention 360 jours — RCA)

Convention commerciale RCA : le stock est valorisé en jours d'achats consommés sur 360 jours.

```txt
stockFinal_annual = achatsConsommés × joursStock / 360
```

### 6.3 Stock initial et variation

```txt
stockInitial = { y1: 0, y2: stockFinal.y1, y3: stockFinal.y2 }
varStock     = { y1: SF.y1, y2: SF.y2 − SF.y1, y3: SF.y3 − SF.y2 }
```

### 6.4 Achats effectués

```txt
achatsEffectués = achatsConsommés + stockFinal − stockInitial
```

### 6.5 Calcul mensuel RCA cumulatif (`computeStocksAchatsSeries`)

Le calcul mensuel des stocks suit un algorithme cumulatif propre à RCA :

```txt
Pour j = 0..11 :
  stockInitial[j] = j === 0 ? stockInitialExercice : stockFinal[j-1]
  cumulConsommes += consommesMonthly[j]

  stockFinalBase[j] = totalConsommes > 0
    ? (cumulConsommes × joursStockCible) / 360
    : 0

  ratioCumul[j] = cumulConsommes / (totalConsommes + totalPonctuels)   // si denom > 0

  stockFinal[j] = stockFinalBase[j] + (ponctuel[j] + stockInitial[j]) × (1 − ratioCumul[j])

  achatsEffectués[j] = consommes[j] + stockFinal[j] − stockInitial[j]
```

**Chaînage inter-exercices** : `stockFinal[11]` de Y1 devient le stock initial de Y2, etc.

### 6.6 Marge de production

```txt
margeProduction = CA − achatsConsommés
```

---

## 7. Charges d'exploitation

**Fichier source** : `calculs/ca.ts` (annuel), `calculs/monthly.ts` (mensuel)

### 7.1 Charges externes

```txt
chargesExternes = fournitures + services
```

```txt
fournitures = Σ (fournitures actives).montantN/N1/N2
services    = Σ (services actifs).montantN/N1/N2
```

### 7.2 Distribution mensuelle des charges

Chaque charge d'exploitation est distribuée mensuellement via `chargeExplMonthly` :

- Mode `POURCENTAGE_CA` → `seasonalMonthly` (suit la saisonnalité du CA)
- Mode standard → `distributeByFrequency` (fréquence + mois de paiement)

### 7.3 Subventions d'exploitation

```txt
subventions = Σ (subventions actives).montantN/N1/N2
```

### 7.4 Impôts et taxes

```txt
impotsTaxes = Σ (impôtsTaxes actifs).montantN/N1/N2
```

### 7.5 Transferts de charges, produits/charges de gestion

```txt
transferts          = Σ (transferts actifs).montantN/N1/N2
autresProdGestion   = Σ (produits gestion courante actifs).montantN/N1/N2
autresChargesGestion = Σ (charges gestion courante actives).montantN/N1/N2
```

---

## 8. Personnel

**Fichier source** : `calculs/personnel.ts`, `calculs/monthly.ts`

### 8.1 Salariés (bruts + charges patronales)

```txt
salairesBruts      = Σ (salariés actifs).montantN/N1/N2
chargesPatronales  = Σ (salariés actifs).montantN × tauxCotPat / 100
```

> Distribution mensuelle : `uniformMonthly(montantAnnuel)` par défaut.
> Si `detailMensuel` est renseigné : `effectif[i] × brutIndividuel[i]`.

### 8.2 Dirigeants (rémunération)

```txt
remuDirigeant = Σ (dirigeants actifs).montantN/N1/N2
```

### 8.3 Cotisations TNS

```txt
cotisationsTNS = Σ (cotisations TNS actives).montantN/N1/N2
```

### 8.4 Taxes sur salaires

```txt
taxesSalaires = Σ (taxes salaires actives).montantN/N1/N2
```

### 8.5 Total charges de personnel

```txt
chargesPersonnel = salairesBruts + chargesPatronales + remuDirigeant + cotisationsTNS + taxesSalaires
```

---

## 9. Soldes Intermédiaires de Gestion (SIG)

**Fichier source** : `calculs/sig.ts`, `calculs/monthly.ts`

Les SIG sont calculés en cascade, conformément au PCG :

### 9.1 Valeur Ajoutée (VA)

```txt
VA = CA − AchatsConsommés − ChargesExternes
```

### 9.2 Excédent Brut d'Exploitation (EBE)

```txt
EBE = VA + Subventions − ImpôtsTaxes − ChargesPersonnel
```

### 9.3 Résultat d'Exploitation

```txt
ResExpl = EBE − DotationsAmort − DotationsProvisions + Reprises
        + Commissions + ProdImmo + Transferts + AutresProdGestion − AutresChargesGestion
```

> **Note** : le résultat d'exploitation dans le moteur mensuel (`monthly.ts`) intègre
> tous les produits et charges d'exploitation en une seule passe pour obtenir des séries cohérentes.

### 9.4 Total produits d'exploitation

```txt
TotalProduitsExpl = CA + Commissions + ProdImmo + Subventions + Reprises + Transferts + AutresProdGestion
```

### 9.5 Total charges d'exploitation

```txt
TotalChargesExpl = TotalProduitsExpl − ResExpl
```

---

## 10. Amortissements

**Fichier source** : `calculs/amortissements.ts`, `calculs/monthly.ts`

### 10.1 Amortissement linéaire

Distribution uniforme sur la durée d'amortissement, au mois près :

```txt
dotationMensuelle = montantHT / (duréeAmortissement × 12)

Pour k = 0..(durée × 12 − 1) :
  moisAbsolu = (annéeAcquisition × 12 + moisAcquisition) + k
  Affecter dotationMensuelle à l'exercice fiscal contenant moisAbsolu
```

### 10.2 Amortissement dégressif

Distribution depuis les lignes d'amortissement calculées par le tableau d'amortissement (DB) :

```txt
Pour chaque ligne de l'échéancier :
  dotationAnnuelle = ligne.dotationAnnuelle
  Si année === annéeAcquisition :
    nbMois = 12 − moisAcquisition
    moisDébut = moisAcquisition
  Sinon si année === fin amortissement :
    nbMois = moisAcquisition
    moisDébut = 0
  Sinon :
    nbMois = 12
    moisDébut = 0

  dotMensuelle = dotationAnnuelle / nbMois
  Distribuer dotMensuelle sur les mois civils → exercice fiscal
```

### 10.3 Mode AUCUN

Pas d'amortissement calculé.

### 10.4 Dotations aux provisions

```txt
dotationsProvisions = Σ (provisions actives).montantN/N1/N2
```

### 10.5 Reprises sur provisions

```txt
reprises = Σ (reprises actives).montantN/N1/N2
```

---

## 11. Résultats comptables

**Fichier source** : `calculs/resultats.ts`, `calculs/monthly.ts`

### 11.1 Produits financiers

```txt
produitsFinanciers = Σ (produits financiers actifs).montantN/N1/N2
```

### 11.2 Charges financières

```txt
chargesFinTotal = intérêtsEmprunts + fraisDossierEmprunts + autresChargesFinancières
```

#### Intérêts d'emprunts (depuis échéancier)

```txt
Pour chaque emprunt actif :
  Pour chaque ligne d'échéancier :
    yk = toExerciceKey(dateEchéance)
    Si yk → acc[yk] += intérêtsMois + assuranceMois
```

#### Frais de dossier

```txt
Pour chaque emprunt actif avec fraisDossier > 0 :
  yk = toExerciceKey(dateDéblocage)
  Si yk → acc[yk] += fraisDossier
```

#### Capital remboursé

```txt
Pour chaque emprunt actif :
  Pour chaque ligne d'échéancier :
    yk = toExerciceKey(dateEchéance)
    Si yk → acc[yk] += capitalRemboursé
```

### 11.3 Résultat financier

```txt
ResFin = ProduitsFinanciers − IntérêtsEmprunts − FraisDossier − AutresChargesFin
```

### 11.4 Résultat courant

```txt
ResCourant = ResExpl + ResFin
```

### 11.5 Résultat exceptionnel

```txt
ResExcep = Σ (produits exceptionnels actifs) − Σ (charges exceptionnelles actives)
```

### 11.6 Résultat net

```txt
ResNet = ResCourant + ResExcep − IS
```

---

## 12. Impôt sur les Sociétés (IS)

**Fichier source** : `calculs/is.ts`, `utils.ts`

### 12.1 Ajustements fiscaux

```txt
ajustementNet = Σ réintégrations − Σ déductions
```

Chaque ajustement porte un type (`REINTEGRATION` = +1, `DEDUCTION` = -1).

### 12.2 Résultat fiscal

```txt
résultatFiscal = resCourant + resExcep + ajustementNet + reportDéficitAntérieur
```

### 12.3 Calcul de l'IS (fonction `calcIS`)

L'IS s'applique en deux tranches (CGI art. 219) :

```txt
Si résultatFiscal ≤ 0 → IS = 0

Tranche 1 = min(résultatFiscal, plafondRéduit)                   // 42 500 € par défaut
Tranche 2 = max(0, résultatFiscal − plafondRéduit)

IS = max(0, T1 × tauxRéduit/100 + T2 × tauxNormal/100 + contribution − créditImpôt)
```

### 12.4 Paramètres IS par défaut

| Paramètre           | Valeur par défaut | Référence      |
| ------------------- | ----------------- | -------------- |
| Plafond taux réduit | 42 500 €          | CGI art. 219 I |
| Taux réduit         | 15 %              | CGI art. 219 I |
| Taux normal         | 25 %              | CGI art. 219 I |
| Crédit d'impôt      | 0 €               | Paramétrable   |
| Contribution vol.   | 0 €               | Paramétrable   |

> Les paramètres sont personnalisables par exercice (N, N+1, N+2).

### 12.5 Report de déficit en avant (CGI art. 209 I)

```txt
reportY1 = min(0, baseFiscale_Y1)        // négatif si déficit
baseFiscale_Y2 = resCourant.y2 + resExcep.y2 + ajustement.y2 + reportY1
reportY2 = min(0, baseFiscale_Y2)
baseFiscale_Y3 = resCourant.y3 + resExcep.y3 + ajustement.y3 + reportY2
```

### 12.6 Distribution mensuelle de l'IS

```txt
isMensuel = uniformMonthly(isParAnnee.yX)    // IS / 12 par mois
```

### 12.7 IS en trésorerie (4 acomptes)

```txt
isQuarterly(isTotal) :
  isTotal/4 aux indices [2, 5, 8, 11]    // M3, M6, M9, M12

isQuarterlyDecaissement(isCurrent, isPrevious) :
  M3, M6, M9 → isCurrent / 4            // 3 acomptes exercice courant
  M12        → isPrevious / 4            // solde exercice précédent
```

---

## 13. Capacité d'Autofinancement (CAF)

**Fichier source** : `calculs/caf.ts`, `pipeline/build.ts`

### 13.1 Formule CAF (méthode additive)

```txt
CAF = RésultatNet + DotationsAmort + DotationsProvisions − Reprises
```

### 13.2 Autofinancement

```txt
Autofinancement = CAF − CapitalRemboursé
```

### 13.3 Drill-down

Le moteur fournit un détail par immobilisation (dotations) et par emprunt (capital remboursé)
pour le drill-down dans l'interface de contrôle.

---

## 14. TVA

**Fichier source** : `calculs/calc-tva.ts`, `tva-engine.ts`

### 14.1 Franchise de TVA

Si le dossier est en franchise de TVA (`isFranchise = true`), toutes les valeurs TVA sont à zéro.

### 14.2 TVA collectée

```txt
Pour chaque activité active :
  tvaCollectée_mensuelle = seasonalMonthly(montantN × tauxTVA/100, saisonnalitéCA, yearKey)
  Accumule dans tvaCollectée[yk]
```

### 14.3 TVA déductible sur achats

Utilise le calcul exact via `computeStocksAchatsSeries` (méthode RCA des achats effectués) :

```txt
Pour chaque activité avec achats (hors PRESTATION_SERVICES) :
  coef = max(0, 1 − tauxMarge/100)
  taux = tauxTVAAchats / 100    // défaut 20%
  consommés = seasonalMonthly(montantN × coef, saisonnalitéAchats)
  ponctuel  = ponctuelMonthly(achatsStockPonctuel)

  rY1 = computeStocksAchatsSeries(consommés, ponctuel, joursStock, stockInitial=0)
  rY2 = computeStocksAchatsSeries(consommés, ponctuel, joursStock, rY1.sfFinal)
  rY3 = computeStocksAchatsSeries(consommés, ponctuel, joursStock, rY2.sfFinal)

  tvaAchats.yX[i] += rYX.achatsEffSeries[i] × taux
```

### 14.4 TVA déductible sur charges

```txt
Pour chaque fourniture/service actif :
  chargeExplMonthly(montantN × tauxTVA/100, {frequence, detailCalc}, yearKey)
```

### 14.5 TVA déductible sur immobilisations

```txt
Pour chaque immobilisation RÉCUPÉRABLE :
  tva = montantHT × tauxTVA / 100

  Si dateAcquisition ≤ dateDemarrage :
    créditInitial += tva
  Sinon :
    tvaDeductibleImmos[yk][moisIndex] += tva
```

### 14.6 TVA stock initial Y0

```txt
tvaY0StockInit = Σ (activités avec achats ponctuels N[0] × tauxTVAAchats / 100)
```

### 14.7 TVA totale déductible

```txt
tvaDeductible = tvaDeductibleAchats + tvaDeductibleCharges + tvaDeductibleImmos
```

### 14.8 Calcul mensuel de la TVA due (`computeTVAMonthly`)

**Mode MENSUEL :**

```txt
crédit = créditInitial
Pour m = 0..11 :
  brute = collectée[m] − déductible[m]

  netAvecCrédit = brute − crédit

  Si netAvecCrédit < 0 :
    créditReporté[m] = −netAvecCrédit
    tvaAPayer[m] = 0
    crédit = −netAvecCrédit
  Sinon :
    créditReporté[m] = 0
    tvaAPayer[m] = netAvecCrédit
    crédit = 0

finalCrédit = crédit
```

**Mode TRIMESTRIEL :**

```txt
crédit = créditInitial
accumTrimestre = 0
Pour m = 0..11 :
  brute = collectée[m] − déductible[m]
  accumTrimestre += brute

  Si (m+1) % 3 === 0 :   // fin de trimestre
    netAvecCrédit = accumTrimestre − crédit
    Si netAvecCrédit < 0 :
      créditReporté[m] = −netAvecCrédit ; tvaAPayer[m] = 0 ; crédit = −netAvecCrédit
    Sinon :
      créditReporté[m] = 0 ; tvaAPayer[m] = netAvecCrédit ; crédit = 0
    accumTrimestre = 0
  Sinon :   // mois intermédiaire
    créditReporté[m] = crédit
    tvaAPayer[m] = 0

finalCrédit = crédit
```

### 14.9 Chaînage inter-exercices

```txt
y1 = computeTVAMonthly(collectée.y1, déductible.y1, périodicité, créditInitial)
y2 = computeTVAMonthly(collectée.y2, déductible.y2, périodicité, y1.finalCrédit)
y3 = computeTVAMonthly(collectée.y3, déductible.y3, périodicité, y2.finalCrédit)
```

---

## 15. Besoin en Fonds de Roulement (BFR)

**Fichier source** : `calculs/bfr.ts`

> **Règle impérative** : le BFR est une **photo instantanée à la clôture de l'exercice**.
> Toute dette ou créance doit refléter la situation réelle au **dernier mois de l'exercice** (index 11),
> pas une moyenne annuelle.
>
> **Ne jamais calculer** un encours BFR par `montant_annuel × jours / 360` quand la charge est
> saisonnière, ponctuelle ou à date précise.

### 15.1 Actif circulant (Besoins)

#### Stocks de matières

```txt
stocksMatieres.y0 = stockInitialPonctuel    // stock de départ saisi
stocksMatieres.y1 = stockFinal.y1           // issu du calcul mensuel
stocksMatieres.y2 = stockFinal.y2
stocksMatieres.y3 = stockFinal.y3
```

#### Créances clients

```txt
Pour chaque activité active :
  sérieMensuelle = seasonalMonthly(montantN, saisonnalitéCA)
  coefTTC = 1 + tauxTVA / 100
  délaiMois = joursRèglement / 30

  créancesClients.yX += sérieMensuelle[11] × coefTTC × délaiMois
```

> **Règle du dernier mois réel** : on prend `série[11]` (le dernier mois), pas le montant annuel / 12.

#### Crédit de TVA

```txt
créditTVA.y0 = créditInitial + tvaY0StockInit
créditTVA.yX = fc.tva.yX.finalCredit
```

### 15.2 Passif circulant (Ressources)

#### Dettes fournisseurs

```txt
Pour chaque activité avec achats :
  achatsEffMensuel = computeStocksAchatsSeries(...)
  coefTTC = 1 + tvaAchats / 100
  délaiMois = joursFournisseur / 30

  dettesFournisseurs.yX += achatsEffMensuel[11] × coefTTC × délaiMois
```

#### Dettes charges externes

```txt
Pour chaque fourniture/service actif :
  sérieMensuelle = chargeExplMonthly(montant, row, yearKey)
  coefTTC = 1 + tauxTVA / 100
  délaiMois = délaiRèglement / 30

  dettesChargesExt.yX += sérieMensuelle[11] × coefTTC × délaiMois
```

#### Dettes impôts et taxes

```txt
Si pas de date précise :
  dettesImpots.yX = montant / 12      // un mois de charge en transit
Sinon :
  dettesImpots.yX = 0                  // dette soldée avant clôture
```

#### Dettes personnel

Calcul détaillé par catégorie :

```txt
Salariés :
  brut mensuel = salarieMonthlyBrut(montantAnnuel, detailMensuel, moisDebut)
  totalChargesMensuelles = brut × (1 + tauxCotPat / 100)
  dette = totalChargesMensuelles[11] × sumLastMonths(délaiPaie)

Dirigeants :
  brut mensuel = salarieMonthlyBrut(montantAnnuel, detailMensuel, moisDebut)
  dette = brutMensuel[11] × sumLastMonths(délaiPaie)

TNS mode DÉFINITIF :
  dette = tnsDefAnnuel / 12 × délaiPaie

TNS mode DÉBUT_ACTIVITÉ_FORFAIT :
  Simulation Urssaf sur 3 ans :
    dette = max(0, DÉFINITIF − PROVISIONNEL) + totalPayé / 12 × délaiPaie

Taxes sur salaires :
  Si pas de date précise : dette = montant / 12 × délaiPaie
```

#### TVA à payer

```txt
tvaAPayer.yX = fc.tva.yX.tvaAPayerMonthly[11]
```

#### Dettes IS

```txt
dettesIS.yX = isParAnnee.yX / 4     // 1 acompte sur 4 restant en fin d'exercice
```

### 15.3 BFR et variation

```txt
totalBesoins    = stocksMatieres + créancesClients + créditTVA
totalRessources = dettesFournisseurs + dettesChargesExt + dettesImpots + dettesPersonnel + tvaAPayer + dettesIS

BFR = totalBesoins − totalRessources

variationBFR :
  y0 = BFR.y0
  y1 = BFR.y1 − BFR.y0
  y2 = BFR.y2 − BFR.y1
  y3 = BFR.y3 − BFR.y2
```

---

## 16. Seuil de rentabilité

**Fichier source** : `calculs/seuil.ts`

### 16.1 Base d'activité

```txt
ventesProduction = CA + Subventions
```

### 16.2 Coûts variables

```txt
achatsConsommés = CA × (1 − tauxMarge/100)    // excl. prestations de services
totalCoûtsVariables = achatsConsommés
```

### 16.3 Marge sur coûts variables

```txt
margeCV = ventesProduction − totalCoûtsVariables
tauxMargeCVPct = (margeCV / ventesProduction) × 100
```

### 16.4 Coûts fixes

```txt
totalCoûtsFixes = chargesExternes + chargesPersonnel + dotationsAmort + dotationsProvisions
                + impôtsTaxes − reprises
```

### 16.5 Seuil de rentabilité économique

```txt
seuilÉconomique = totalCoûtsFixes / (tauxMargeCVPct / 100)
```

> Retourne `null` si `tauxMargeCVPct === 0` (division par zéro impossible).

### 16.6 Excédent économique

```txt
excédentÉco = ventesProduction − seuilÉconomique
```

### 16.7 Point mort économique (en jours)

```txt
pointMortÉco = (seuilÉconomique / ventesProduction) × 365
```

### 16.8 Charges supplémentaires financières

```txt
chargesSupp = capitalRemboursé + IS
```

### 16.9 Seuil de rentabilité financier

```txt
seuilFinancier = (totalCoûtsFixes + chargesSupp) / (tauxMargeCVPct / 100)
```

### 16.10 Excédent financier et point mort financier

```txt
excédentFin = ventesProduction − seuilFinancier
pointMortFin = (seuilFinancier / ventesProduction) × 365
```

---

## 17. Bilan prévisionnel

**Fichier source** : `calculs/bilan.ts`

### 17.1 Immobilisations

```txt
Pour chaque immobilisation active :
  Classer par nature (INCORPOREL / CORPOREL / FINANCIER)

  Brutes (cumulatif) :
    Si dateAcquisition ≤ borneExercice → brutes.yX += montantHT

  Amort cumulés :
    amortCumul.y1 = dotY1
    amortCumul.y2 = dotY1 + dotY2
    amortCumul.y3 = dotY1 + dotY2 + dotY3

  Nettes :
    nettes = brutes − amortCumul
```

### 17.2 Apports (capital et comptes courants)

```txt
Apports Capital :
  Pour chaque apport actif :
    Si dateApport ≤ borneExercice → acc.yX += montant
    Nature : capital social, apports en nature, primes d'émission

Comptes Courants :
  CC = compteCourantAssociés + prêtsHonneur − remboursementsCC
  Chaque flux est cumulé selon sa date
```

### 17.3 Emprunts au passif

```txt
empruntsDebloqués (cumulatif) :
  Si dateDéblocage ≤ borneExercice → acc.yX += montantCapital

remboursementsCumul (cumulatif) :
  Σ capitalRemboursé par ligne d'échéancier, cumulé

capitalRestantDû = empruntsDebloqués − remboursementsCumul
```

### 17.4 Provisions cumulées

```txt
netProvisions_i = dotationsProvisions.yi − reprises.yi

provisionsCumul :
  y1 = netProvisions_1
  y2 = netProvisions_1 + netProvisions_2
  y3 = netProvisions_1 + netProvisions_2 + netProvisions_3
```

### 17.5 Capitaux propres

```txt
reportÀNouveau :
  y1 = 0
  y2 = résultatNet.y1
  y3 = résultatNet.y1 + résultatNet.y2

capitauxPropres = capital + compteCourant + reportÀNouveau + résultatNet
```

### 17.6 Trésorerie au bilan

```txt
trésorerie = apports + cafCumul + empruntsDebloqués + encFluxNonPL
           − immoAcquises − stocks − remboursements − decFluxNonPL

trésoCorrigée = trésorerie + totalDettesExploitation

disponibilités = max(0, trésorerie)
découvert      = max(0, −trésorerie)
```

### 17.7 Flux non Plan de Lancement (PL)

```txt
Subventions d'investissement (hors PRÊT_HONNEUR) + divers encaissements − divers décaissements
Tous cumulatifs, positionnés par date.
```

---

## 18. Trésorerie

**Fichier source** : `tresorerie-engine.ts`

### 18.1 Décalage de séries (`shiftSeries`)

Décale une série mensuelle de `n` mois entiers (modélise le délai de paiement) :

```txt
shiftSeries(series, delayMonths, prevYearOverflow?) :
  Les mois 0..(delay−1) reçoivent le overflow de l'exercice précédent
  Les mois delay..11 reçoivent series[m−delay]
  Ce qui déborde (m + delay ≥ 12) → overflow pour l'exercice suivant
```

### 18.2 Décalage pondéré (`shiftSeriesWeighted`)

Pour les délais fractionnaires (ex : 45 jours = 1,5 mois) :

```txt
floor = Math.floor(delayMonths)
frac  = delayMonths − floor
w0 = 1 − frac,  w1 = frac

Mois m :
  target0 = m + floor     → series[m] × w0
  target1 = m + floor + 1 → series[m] × w1

Si target ≥ 12 → overflow pour l'exercice suivant
```

### 18.3 Solde mensuel cumulé

```txt
computeSoldeMonthly(variation, initialSolde) :
  running = initialSolde
  Pour m = 0..11 :
    soldePrécédent[m] = running
    soldeFinal[m] = running + variation[m]
    running = soldeFinal[m]
```

### 18.4 Salariés — brut mensuel

```txt
salarieMonthlyBrut(montantAnnuel, detailMensuel, moisDebut) :
  Si detailMensuel renseigné :
    Retourner effectif[i] × brutIndividuel[i] (pivot calendaire si moisDebut > 0)
  Sinon :
    Retourner uniformMonthly(montantAnnuel)
```

---

## 19. Utilitaires partagés

**Fichier source** : `utils.ts`

### 19.1 Conversion Decimal Prisma → number (`n`)

```txt
n(v) :
  null / undefined → 0
  number           → v (0 si NaN)
  objet .toNumber() → résultat (0 si erreur ou NaN)
  autre            → Number(v) (0 si NaN)
```

> Utilisé systématiquement pour convertir les `Decimal` Prisma en `number` JavaScript.

### 19.2 Pourcentage (`pct`)

```txt
pct(amount, base) :
  Si base !== 0 → (amount / base) × 100
  Sinon         → null
```

### 19.3 Somme par propriété (`sumBy`)

```txt
sumBy(array, fn) :
  array.reduce((s, x) => s + fn(x), 0)
```

### 19.4 Constantes

```txt
YEAR_KEYS_3 = ["y1", "y2", "y3"]
YEAR_KEYS_4 = ["y0", "y1", "y2", "y3"]
FR_MONTHS   = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]
```

---

## 20. Annexe — Structure des fichiers

```txt
src/lib/finance/
├── REGLES_CALCUL_FINANCE.md         # ← ce fichier
├── fetch-scenario.ts                # Server action unique : fetchScenarioData()
├── tresorerie-engine.ts             # Moteur trésorerie (shifts, soldes)
├── tresorerie-types.ts              # Types trésorerie
├── tva-engine.ts                    # computeTVAMonthly (source unique TVA)
├── utils.ts                         # n(), pct(), sumBy(), zeroAcc(), calcIS()
│
├── types/                           # Couche 1 — Types purs (nœud feuille)
│   ├── results.ts                   #   FinCalcResult (9 interfaces composables)
│   ├── scenario.ts                  #   ScenarioFinData
│   └── series.ts                    #   YearAcc, MonthlySeries, MonthlyAcc
│
├── normalize/                       # Couche 2 — Normalisation DB → domaine
│   ├── activite.ts
│   ├── charges.ts
│   ├── emprunts.ts
│   ├── immobilisations.ts
│   └── personnel.ts
│
├── calculs/                         # Couche 3 — Calculs atomiques purs
│   ├── amortissements.ts            #   distribuerAmortParExercice, dotProv, reprises
│   ├── bfr.ts                       #   calcBfr → BfrCalcResult
│   ├── bilan.ts                     #   calcImmosBilan, calcApports, calcEmpruntsPassif, ...
│   ├── ca.ts                        #   calcCA, calcCAByType, calcChargesExt, ...
│   ├── caf.ts                       #   calcCAF
│   ├── calc-tva.ts                  #   calcTVA → TVACalcResult
│   ├── emprunts.ts                  #   calcInteretsEmprunts, calcCapitalRembourse, calcFraisDossier
│   ├── is.ts                        #   calcISParAnnee, calcAjustementNet
│   ├── monthly.ts                   #   buildMonthlyCalc → MonthlyCalcResult (~980 lignes)
│   ├── personnel.ts                 #   calcSalaires, calcDirigeants, calcCotTNS, calcChargesPersonnel
│   ├── resultats.ts                 #   calcResFin, calcResCourant, calcResExcep, calcResNet
│   ├── seuil.ts                     #   calcSeuil → BreakEvenData
│   └── sig.ts                       #   calcVA, calcEBE, calcResExpl
│
├── pipeline/                        # Couche 4 — Orchestrateur
│   ├── build.ts                     #   buildFinCalc() → FinCalcResult (10 étapes, 2 passes)
│   └── calendar.ts                  #   makeExerciceHelpers, fmtExercice, buildTemporelCtx
│
├── aggregations/                    # Couche 5 — Builders de tableaux UI
│   ├── helpers/                     #   shared-helpers, extract, financement-helpers
│   ├── bfr/                         #   build-rows.ts, helpers.ts, types.ts
│   ├── bilan/                       #   build-rows.ts, context.ts, helpers.ts, types.ts
│   ├── budget/                      #   build-tree.ts, helpers.ts, types.ts
│   ├── caf/                         #   build-rows.ts, helpers.ts, types.ts
│   ├── compte-resultat/             #   build-rows.ts, drilldown.ts, helpers.ts, types.ts
│   ├── plan-financement/            #   build-rows.ts, types.ts
│   ├── ratios/                      #   build-rows.ts, helpers.ts, types.ts
│   ├── sig/                         #   build-rows.ts, drilldown.ts, helpers.ts, types.ts
│   ├── tableau-financement/         #   build-rows.ts, helpers.ts, types.ts
│   ├── tresorerie/                  #   build-rows.ts, helpers.ts, types.ts
│   └── tva/                         #   build-rows.ts, helpers.ts, types.ts
│
└── __tests__/                       # Tests unitaires (622 tests)
    ├── aggregations/
    ├── calculs/
    ├── fixtures/
    ├── normalize/
    └── pipeline/
```

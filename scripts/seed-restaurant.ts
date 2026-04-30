/**
 * Script de seed — Dossier de reprise de restaurant
 *
 * Crée un dossier prévisionnel complet pour un projet de rachat de restaurant
 * avec des données réalistes : activités (salle + terrasse), charges d'exploitation,
 * personnel (cuisinier, serveurs, dirigeant), investissements (fonds de commerce,
 * aménagement, matériel), financement (apport capital, emprunt bancaire).
 *
 * Usage :
 *   pnpm tsx scripts/seed-restaurant.ts
 *
 * Prérequis : variable d'environnement DATABASE_URL configurée.
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma";

// ─── Constantes ────────────────────────────────────────────────────────────────

/** Date de démarrage de l'activité : 1er septembre 2026 */
const DATE_DEMARRAGE = new Date("2026-09-01");

/** Projection sur 3 exercices */
const DUREE_PROJECTION = 3;

/** Nom du dossier */
const NOM_DOSSIER = "Le Bistrot de Paul — Reprise restaurant";

// ─── Saisonnalité restaurant type ──────────────────────────────────────────────

/**
 * Saisonnalité mensuelle typique d'un restaurant.
 * Creux en janvier/février, pic estival, décembre festif.
 * Les coefficients représentent le % du CA annuel par mois (total ≈ 100%).
 */
const SAISONNALITE_RESTAURANT = [
  6.0, // Janvier
  6.0, // Février
  7.5, // Mars
  8.5, // Avril
  9.0, // Mai
  10.0, // Juin
  11.0, // Juillet
  11.0, // Août
  9.5, // Septembre
  8.0, // Octobre
  6.5, // Novembre
  7.0, // Décembre
];

// ─── Script principal ──────────────────────────────────────────────────────────

async function main() {
  console.log("🍽️  Seed restaurant — Création du dossier de reprise...\n");

  // ── 1. Cabinet ──
  let cabinet = await prisma.cabinet.findFirst({ select: { id: true } });
  if (!cabinet) {
    cabinet = await prisma.cabinet.create({
      data: { nom: "Cabinet Expertise Comptable Démo" },
      select: { id: true },
    });
    console.log("✅ Cabinet créé :", cabinet.id);
  } else {
    console.log("✅ Cabinet existant :", cabinet.id);
  }

  // ── 2. Dossier ──
  const dossier = await prisma.dossier.create({
    data: {
      nom: NOM_DOSSIER,
      typeDossier: "REPRISE",
      dateDemarrage: DATE_DEMARRAGE,
      dureeProjection: DUREE_PROJECTION,
      reference: `REST-${Date.now().toString(36).toUpperCase()}`,
      cabinetId: cabinet.id,
      raisonSociale: "SARL Le Bistrot de Paul",
      activiteSociete: "Restauration traditionnelle",
      responsableCivilite: "M.",
      responsableNom: "Dupont",
      responsablePrenom: "Paul",
      responsableFonction: "Gérant",
      adresse1: "12 rue de la Gaité",
      codePostal: "75014",
      ville: "Paris",
      email: "paul.dupont@lebistrotdepaul.fr",
      telephone: "01 45 67 89 00",
    },
    select: { id: true },
  });
  console.log("✅ Dossier créé :", dossier.id);

  // ── 3. Scénario par défaut ──
  const scenario = await prisma.scenario.create({
    data: {
      nom: "Scénario réaliste",
      isDefault: true,
      dossierId: dossier.id,
    },
    select: { id: true },
  });
  console.log("✅ Scénario créé :", scenario.id);

  // ── 4. Paramètres entreprise ──
  const parametres = await prisma.parametresEntreprise.create({
    data: {
      scenarioId: scenario.id,
      formeJuridique: "SARL",
      regimeFiscal: "IS",
      regimeTVA: "REEL_NORMAL",
      periodiciteDeclarationTVA: "mensuel",
      moisPaiementSalaires: 0, // Salaires payés le mois même
      dureePrevisionnelle: DUREE_PROJECTION,
      tnsRegimeSocial: "commerce",
      tnsModeCalcul: "DEBUT_ACTIVITE_FORFAIT",
    },
    select: { id: true },
  });

  // Exercices prévisionnels (le 1er exercice est court : sept → déc)
  await prisma.exercicePrevisionnel.createMany({
    data: [
      {
        ordre: 1,
        dateCloture: new Date("2026-12-31"),
        duree: 4, // Sept → Déc = 4 mois
        annee: 2026,
        parametresId: parametres.id,
      },
      {
        ordre: 2,
        dateCloture: new Date("2027-12-31"),
        duree: 12,
        annee: 2027,
        parametresId: parametres.id,
      },
      {
        ordre: 3,
        dateCloture: new Date("2028-12-31"),
        duree: 12,
        annee: 2028,
        parametresId: parametres.id,
      },
    ],
  });
  console.log("✅ Paramètres entreprise + exercices créés");

  // ── 5. Activités (CA) ──

  // Activité 1 : Restauration salle
  await prisma.activite.create({
    data: {
      scenarioId: scenario.id,
      libelle: "Restauration salle",
      typeActivite: "PRODUCTION_VENDUE",
      secteur: "PRODUCTION",
      hypothese: "COMMUNE",
      montantN: 280000, // CA année N (proratisé 4 mois ≈ 93 333 €)
      evolutionN1: 5.0,
      montantN1: 294000,
      evolutionN2: 3.0,
      montantN2: 302820,
      tauxMarge: 70.0, // Marge brute restauration
      reglementClients: 0, // Paiement comptant
      reglementFournisseurs: 30,
      tauxTVA: 10.0, // TVA réduite restauration sur place
      tvaAchats: 5.5, // TVA réduite produits alimentaires
      stocks: 7,
      actif: true,
      ordre: 0,
      saisonnaliteCA: {
        N: SAISONNALITE_RESTAURANT,
        N1: SAISONNALITE_RESTAURANT,
        N2: SAISONNALITE_RESTAURANT,
      },
      saisonnaliteAchats: {
        N: SAISONNALITE_RESTAURANT,
        N1: SAISONNALITE_RESTAURANT,
        N2: SAISONNALITE_RESTAURANT,
      },
    },
  });

  // Activité 2 : Vente à emporter / livraison
  await prisma.activite.create({
    data: {
      scenarioId: scenario.id,
      libelle: "Vente à emporter",
      typeActivite: "VENTE_MARCHANDISES",
      secteur: "NEGOCE",
      hypothese: "COMMUNE",
      montantN: 60000,
      evolutionN1: 10.0,
      montantN1: 66000,
      evolutionN2: 8.0,
      montantN2: 71280,
      tauxMarge: 65.0,
      reglementClients: 0,
      reglementFournisseurs: 30,
      tauxTVA: 10.0,
      tvaAchats: 5.5,
      stocks: 5,
      actif: true,
      ordre: 1,
      saisonnaliteCA: {
        N: SAISONNALITE_RESTAURANT,
        N1: SAISONNALITE_RESTAURANT,
        N2: SAISONNALITE_RESTAURANT,
      },
      saisonnaliteAchats: {
        N: SAISONNALITE_RESTAURANT,
        N1: SAISONNALITE_RESTAURANT,
        N2: SAISONNALITE_RESTAURANT,
      },
    },
  });

  console.log("✅ 2 activités créées (salle + emporter)");

  // ── 6. Charges d'exploitation ──

  const chargesExploitation = [
    // Fournitures & consommables
    {
      libelle: "Petit matériel de cuisine",
      categorie: "FOURNITURE_CONSOMMABLE" as const,
      montantN: 3600,
      evolutionN1: 2.0,
      montantN1: 3672,
      evolutionN2: 2.0,
      montantN2: 3745.44,
      frequence: "MENSUELLE" as const,
      tauxTVA: 20.0,
      typeTVA: "FACTURATION" as const,
      delaiReglement: 30,
    },
    {
      libelle: "Produits d'entretien & hygiène",
      categorie: "FOURNITURE_CONSOMMABLE" as const,
      montantN: 2400,
      evolutionN1: 2.0,
      montantN1: 2448,
      evolutionN2: 2.0,
      montantN2: 2496.96,
      frequence: "MENSUELLE" as const,
      tauxTVA: 20.0,
      typeTVA: "FACTURATION" as const,
      delaiReglement: 30,
    },
    {
      libelle: "Emballages à emporter",
      categorie: "FOURNITURE_CONSOMMABLE" as const,
      montantN: 3000,
      evolutionN1: 5.0,
      montantN1: 3150,
      evolutionN2: 5.0,
      montantN2: 3307.5,
      frequence: "MENSUELLE" as const,
      tauxTVA: 20.0,
      typeTVA: "FACTURATION" as const,
      delaiReglement: 30,
    },
    // Services extérieurs
    {
      libelle: "Loyer local commercial",
      categorie: "SERVICE_EXTERIEUR" as const,
      montantN: 36000,
      evolutionN1: 2.5,
      montantN1: 36900,
      evolutionN2: 2.5,
      montantN2: 37822.5,
      frequence: "MENSUELLE" as const,
      tauxTVA: 20.0,
      typeTVA: "FACTURATION" as const,
      delaiReglement: 0,
    },
    {
      libelle: "Assurance RC Pro + multirisque",
      categorie: "SERVICE_EXTERIEUR" as const,
      montantN: 4800,
      evolutionN1: 3.0,
      montantN1: 4944,
      evolutionN2: 3.0,
      montantN2: 5092.32,
      frequence: "ANNUELLE" as const,
      tauxTVA: 0.0,
      typeTVA: "FACTURATION" as const,
      delaiReglement: 0,
    },
    {
      libelle: "Expert-comptable",
      categorie: "SERVICE_EXTERIEUR" as const,
      montantN: 6000,
      evolutionN1: 2.0,
      montantN1: 6120,
      evolutionN2: 2.0,
      montantN2: 6242.4,
      frequence: "ANNUELLE" as const,
      tauxTVA: 20.0,
      typeTVA: "FACTURATION" as const,
      delaiReglement: 30,
    },
    {
      libelle: "Eau / Électricité / Gaz",
      categorie: "SERVICE_EXTERIEUR" as const,
      montantN: 9600,
      evolutionN1: 5.0,
      montantN1: 10080,
      evolutionN2: 3.0,
      montantN2: 10382.4,
      frequence: "MENSUELLE" as const,
      tauxTVA: 20.0,
      typeTVA: "FACTURATION" as const,
      delaiReglement: 30,
    },
    {
      libelle: "Téléphone / Internet",
      categorie: "SERVICE_EXTERIEUR" as const,
      montantN: 1200,
      evolutionN1: 0.0,
      montantN1: 1200,
      evolutionN2: 0.0,
      montantN2: 1200,
      frequence: "MENSUELLE" as const,
      tauxTVA: 20.0,
      typeTVA: "FACTURATION" as const,
      delaiReglement: 30,
    },
    {
      libelle: "Publicité / Communication",
      categorie: "SERVICE_EXTERIEUR" as const,
      montantN: 4000,
      evolutionN1: -10.0,
      montantN1: 3600,
      evolutionN2: -5.0,
      montantN2: 3420,
      frequence: "MENSUELLE" as const,
      tauxTVA: 20.0,
      typeTVA: "FACTURATION" as const,
      delaiReglement: 30,
    },
    {
      libelle: "Entretien & réparations",
      categorie: "SERVICE_EXTERIEUR" as const,
      montantN: 3000,
      evolutionN1: 3.0,
      montantN1: 3090,
      evolutionN2: 3.0,
      montantN2: 3182.7,
      frequence: "MENSUELLE" as const,
      tauxTVA: 20.0,
      typeTVA: "FACTURATION" as const,
      delaiReglement: 30,
    },
    {
      libelle: "Blanchisserie / Linge",
      categorie: "SERVICE_EXTERIEUR" as const,
      montantN: 3600,
      evolutionN1: 2.0,
      montantN1: 3672,
      evolutionN2: 2.0,
      montantN2: 3745.44,
      frequence: "MENSUELLE" as const,
      tauxTVA: 20.0,
      typeTVA: "FACTURATION" as const,
      delaiReglement: 30,
    },
  ];

  await prisma.chargeExploitation.createMany({
    data: chargesExploitation.map((c, i) => ({
      scenarioId: scenario.id,
      libelle: c.libelle,
      categorie: c.categorie,
      actif: true,
      hypothese: "COMMUNE",
      montantN: c.montantN,
      evolutionN1: c.evolutionN1,
      montantN1: c.montantN1,
      evolutionN2: c.evolutionN2,
      montantN2: c.montantN2,
      tauxFixe: 100,
      frequence: c.frequence,
      delaiReglement: c.delaiReglement,
      tauxTVA: c.tauxTVA,
      typeTVA: c.typeTVA,
      ordre: i,
    })),
  });

  console.log(`✅ ${chargesExploitation.length} charges d'exploitation créées`);

  // ── 7. Impôts & taxes ──
  await prisma.impotTaxe.createMany({
    data: [
      {
        scenarioId: scenario.id,
        libelle: "CFE (Cotisation Foncière des Entreprises)",
        actif: true,
        hypothese: "COMMUNE",
        isCFE: true,
        dateN: "2026-12-15",
        montantN: 1200,
        dateN1: "2027-12-15",
        montantN1: 1250,
        dateN2: "2028-12-15",
        montantN2: 1300,
        ordre: 0,
      },
      {
        scenarioId: scenario.id,
        libelle: "Taxe foncière (quote-part locataire)",
        actif: true,
        hypothese: "COMMUNE",
        dateN: "2026-10-15",
        montantN: 800,
        dateN1: "2027-10-15",
        montantN1: 820,
        dateN2: "2028-10-15",
        montantN2: 840,
        ordre: 1,
      },
      {
        scenarioId: scenario.id,
        libelle: "Contribution AGEFIPH",
        actif: true,
        hypothese: "COMMUNE",
        dateN: "2026-12-31",
        montantN: 0,
        dateN1: "2027-03-01",
        montantN1: 400,
        dateN2: "2028-03-01",
        montantN2: 400,
        ordre: 2,
      },
    ],
  });
  console.log("✅ 3 impôts & taxes créés");

  // ── 8. Personnel — Dirigeant (gérant TNS) ──
  await prisma.ligneDirigeant.create({
    data: {
      scenarioId: scenario.id,
      libelle: "Paul Dupont — Gérant",
      actif: true,
      hypothese: "COMMUNE",
      montantN: 30000, // Rémunération annuelle brute année N
      evolutionN1: 5.0,
      montantN1: 31500,
      evolutionN2: 3.0,
      montantN2: 32445,
      tauxFixe: 100,
      ordre: 0,
      // Rémunération mensuelle répartie uniformément
      detailMensuelN: {
        effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        brutIndividuel: [2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500],
      },
      detailMensuelN1: {
        effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        brutIndividuel: [2625, 2625, 2625, 2625, 2625, 2625, 2625, 2625, 2625, 2625, 2625, 2625],
      },
      detailMensuelN2: {
        effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        brutIndividuel: [2703.75, 2703.75, 2703.75, 2703.75, 2703.75, 2703.75, 2703.75, 2703.75, 2703.75, 2703.75, 2703.75, 2703.75],
      },
    },
  });
  console.log("✅ 1 dirigeant créé (gérant TNS)");

  // ── 9. Personnel — Salariés ──
  await prisma.ligneSalarie.createMany({
    data: [
      {
        scenarioId: scenario.id,
        libelle: "Chef cuisinier",
        actif: true,
        hypothese: "COMMUNE",
        montantN: 30000, // Brut annuel
        evolutionN1: 3.0,
        montantN1: 30900,
        evolutionN2: 2.0,
        montantN2: 31518,
        tauxCotSal: 22.0,
        tauxCotPat: 42.0,
        tauxFixe: 100,
        hasCommission: false,
        hasPrime: false,
        cotisationConges: false,
        ordre: 0,
        detailMensuelN: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500],
        },
        detailMensuelN1: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [2575, 2575, 2575, 2575, 2575, 2575, 2575, 2575, 2575, 2575, 2575, 2575],
        },
        detailMensuelN2: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [2626.5, 2626.5, 2626.5, 2626.5, 2626.5, 2626.5, 2626.5, 2626.5, 2626.5, 2626.5, 2626.5, 2626.5],
        },
      },
      {
        scenarioId: scenario.id,
        libelle: "Commis de cuisine",
        actif: true,
        hypothese: "COMMUNE",
        montantN: 22000,
        evolutionN1: 2.0,
        montantN1: 22440,
        evolutionN2: 2.0,
        montantN2: 22888.8,
        tauxCotSal: 22.0,
        tauxCotPat: 42.0,
        tauxFixe: 100,
        hasCommission: false,
        hasPrime: false,
        cotisationConges: false,
        ordre: 1,
        detailMensuelN: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [1833.33, 1833.33, 1833.33, 1833.33, 1833.33, 1833.33, 1833.33, 1833.33, 1833.33, 1833.33, 1833.33, 1833.37],
        },
        detailMensuelN1: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [1870, 1870, 1870, 1870, 1870, 1870, 1870, 1870, 1870, 1870, 1870, 1870],
        },
        detailMensuelN2: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [1907.4, 1907.4, 1907.4, 1907.4, 1907.4, 1907.4, 1907.4, 1907.4, 1907.4, 1907.4, 1907.4, 1907.4],
        },
      },
      {
        scenarioId: scenario.id,
        libelle: "Serveur(se) 1",
        actif: true,
        hypothese: "COMMUNE",
        montantN: 21600,
        evolutionN1: 2.0,
        montantN1: 22032,
        evolutionN2: 2.0,
        montantN2: 22472.64,
        tauxCotSal: 22.0,
        tauxCotPat: 42.0,
        tauxFixe: 100,
        hasCommission: false,
        hasPrime: false,
        cotisationConges: false,
        ordre: 2,
        detailMensuelN: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800],
        },
        detailMensuelN1: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [1836, 1836, 1836, 1836, 1836, 1836, 1836, 1836, 1836, 1836, 1836, 1836],
        },
        detailMensuelN2: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72],
        },
      },
      {
        scenarioId: scenario.id,
        libelle: "Serveur(se) 2",
        actif: true,
        hypothese: "COMMUNE",
        montantN: 21600,
        evolutionN1: 2.0,
        montantN1: 22032,
        evolutionN2: 2.0,
        montantN2: 22472.64,
        tauxCotSal: 22.0,
        tauxCotPat: 42.0,
        tauxFixe: 100,
        hasCommission: false,
        hasPrime: false,
        cotisationConges: false,
        ordre: 3,
        detailMensuelN: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800],
        },
        detailMensuelN1: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [1836, 1836, 1836, 1836, 1836, 1836, 1836, 1836, 1836, 1836, 1836, 1836],
        },
        detailMensuelN2: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72, 1872.72],
        },
      },
      {
        scenarioId: scenario.id,
        libelle: "Plongeur (mi-temps)",
        actif: true,
        hypothese: "COMMUNE",
        montantN: 12000,
        evolutionN1: 2.0,
        montantN1: 12240,
        evolutionN2: 2.0,
        montantN2: 12484.8,
        tauxCotSal: 22.0,
        tauxCotPat: 42.0,
        tauxFixe: 50, // Mi-temps → 50%
        hasCommission: false,
        hasPrime: false,
        cotisationConges: false,
        ordre: 4,
        detailMensuelN: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
        },
        detailMensuelN1: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020, 1020],
        },
        detailMensuelN2: {
          effectif: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          brutIndividuel: [1040.4, 1040.4, 1040.4, 1040.4, 1040.4, 1040.4, 1040.4, 1040.4, 1040.4, 1040.4, 1040.4, 1040.4],
        },
      },
    ],
  });
  console.log("✅ 5 salariés créés (chef, commis, 2 serveurs, plongeur)");

  // ── 10. Cotisations TNS ──
  await prisma.ligneCotisationTNS.createMany({
    data: [
      {
        scenarioId: scenario.id,
        libelle: "Maladie-maternité",
        actif: true,
        calcAuto: true,
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        ordre: 0,
      },
      {
        scenarioId: scenario.id,
        libelle: "Retraite de base",
        actif: true,
        calcAuto: true,
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        ordre: 1,
      },
      {
        scenarioId: scenario.id,
        libelle: "Retraite complémentaire",
        actif: true,
        calcAuto: true,
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        ordre: 2,
      },
      {
        scenarioId: scenario.id,
        libelle: "Invalidité-décès",
        actif: true,
        calcAuto: true,
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        ordre: 3,
      },
      {
        scenarioId: scenario.id,
        libelle: "Allocations familiales",
        actif: true,
        calcAuto: true,
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        ordre: 4,
      },
      {
        scenarioId: scenario.id,
        libelle: "CSG-CRDS",
        actif: true,
        calcAuto: true,
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        ordre: 5,
      },
    ],
  });
  console.log("✅ 6 cotisations TNS créées (calcul auto)");

  // ── 11. Investissements (immobilisations) ──

  // Fonds de commerce (incorporel, non amortissable)
  const fondsCommerce = await prisma.immobilisation.create({
    data: {
      scenarioId: scenario.id,
      libelle: "Fonds de commerce restaurant",
      nature: "INCORPOREL",
      montantHT: 120000,
      tauxTVA: 0.0,
      typeTva: "EXONEREE",
      dateAcquisition: DATE_DEMARRAGE,
      modeAmortissement: "AUCUN", // Fonds de commerce non amortissable
      dureeAmortissement: 0,
      differe: 0,
      actif: true,
      groupe: "Reprise",
      ordre: 0,
    },
    select: { id: true },
  });

  // Aménagement & travaux (corporel, amortissable 10 ans)
  const amenagement = await prisma.immobilisation.create({
    data: {
      scenarioId: scenario.id,
      libelle: "Travaux d'aménagement salle",
      nature: "CORPOREL",
      montantHT: 35000,
      tauxTVA: 20.0,
      typeTva: "RECUPERABLE",
      dateAcquisition: DATE_DEMARRAGE,
      modeAmortissement: "LINEAIRE",
      dureeAmortissement: 10,
      differe: 0,
      actif: true,
      groupe: "Aménagement",
      ordre: 1,
    },
    select: { id: true },
  });

  // Matériel de cuisine (corporel, amortissable 7 ans)
  const materielCuisine = await prisma.immobilisation.create({
    data: {
      scenarioId: scenario.id,
      libelle: "Matériel de cuisine professionnel",
      nature: "CORPOREL",
      montantHT: 25000,
      tauxTVA: 20.0,
      typeTva: "RECUPERABLE",
      dateAcquisition: DATE_DEMARRAGE,
      modeAmortissement: "LINEAIRE",
      dureeAmortissement: 7,
      differe: 0,
      actif: true,
      groupe: "Équipement",
      ordre: 2,
    },
    select: { id: true },
  });

  // Mobilier de salle (corporel, amortissable 10 ans)
  const mobilier = await prisma.immobilisation.create({
    data: {
      scenarioId: scenario.id,
      libelle: "Mobilier de salle (tables, chaises, bar)",
      nature: "CORPOREL",
      montantHT: 15000,
      tauxTVA: 20.0,
      typeTva: "RECUPERABLE",
      dateAcquisition: DATE_DEMARRAGE,
      modeAmortissement: "LINEAIRE",
      dureeAmortissement: 10,
      differe: 0,
      actif: true,
      groupe: "Équipement",
      ordre: 3,
    },
    select: { id: true },
  });

  // Matériel informatique (caisse, tablettes commande)
  const informatique = await prisma.immobilisation.create({
    data: {
      scenarioId: scenario.id,
      libelle: "Caisse enregistreuse + tablettes",
      nature: "CORPOREL",
      montantHT: 5000,
      tauxTVA: 20.0,
      typeTva: "RECUPERABLE",
      dateAcquisition: DATE_DEMARRAGE,
      modeAmortissement: "LINEAIRE",
      dureeAmortissement: 3,
      differe: 0,
      actif: true,
      groupe: "Équipement",
      ordre: 4,
    },
    select: { id: true },
  });

  console.log("✅ 5 immobilisations créées (fonds, travaux, cuisine, mobilier, informatique)");

  // ── 12. Financement — Apports ──
  await prisma.apport.createMany({
    data: [
      {
        scenarioId: scenario.id,
        libelle: "Apport en capital — Paul Dupont",
        type: "CAPITAL",
        montant: 50000,
        dateApport: DATE_DEMARRAGE,
        description: "Apport personnel du gérant",
        remboursable: false,
      },
      {
        scenarioId: scenario.id,
        libelle: "Apport en capital — Associé",
        type: "CAPITAL",
        montant: 20000,
        dateApport: DATE_DEMARRAGE,
        description: "Apport d'un associé minoritaire",
        remboursable: false,
      },
      {
        scenarioId: scenario.id,
        libelle: "Compte courant d'associé — Paul Dupont",
        type: "COMPTE_COURANT",
        montant: 15000,
        dateApport: DATE_DEMARRAGE,
        description: "Prêt du gérant à la société",
        remboursable: true,
      },
    ],
  });
  console.log("✅ 3 apports créés (2 capital + 1 compte courant)");

  // ── 13. Financement — Emprunt bancaire ──
  const emprunt = await prisma.emprunt.create({
    data: {
      scenarioId: scenario.id,
      libelle: "Emprunt bancaire — Rachat fonds + travaux",
      montant: 150000,
      tauxAnnuel: 3.5,
      tauxAssurance: 0.3,
      dureeEnMois: 84, // 7 ans
      periodicite: "MENSUEL",
      dateDéblocage: DATE_DEMARRAGE,
      typeEmprunt: "AMORTISSABLE",
      modaliteRemboursement: "ECHEANCE_CONSTANTE",
      typeDiffere: "PARTIEL",
      dureeDiffereEnMois: 6, // 6 mois de différé partiel
      fraisDossier: 1500,
      garanties: "Nantissement fonds de commerce",
      description: "Financement du rachat du fonds de commerce et des travaux",
      modeAssurance: "CAPITAL_RESTANT",
    },
    select: { id: true },
  });
  console.log("✅ 1 emprunt créé (150 000 € / 7 ans / 3,5%)");

  // ── 14. Financement — Subvention ──
  await prisma.subvention.create({
    data: {
      scenarioId: scenario.id,
      libelle: "Prêt d'honneur Initiative France",
      type: "PRET_HONNEUR",
      montant: 15000,
      dateObtention: DATE_DEMARRAGE,
      dateEncaissement: DATE_DEMARRAGE,
      description: "Prêt d'honneur à taux 0% sur 5 ans",
      imposable: false,
    },
  });
  console.log("✅ 1 subvention créée (prêt d'honneur)");

  // ── 15. Taxes sur salaires ──
  await prisma.ligneTaxeSalaire.createMany({
    data: [
      {
        scenarioId: scenario.id,
        libelle: "Formation professionnelle",
        actif: true,
        hypothese: "COMMUNE",
        calcAuto: true,
        taux: 1.0,
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        ordre: 0,
      },
      {
        scenarioId: scenario.id,
        libelle: "Taxe d'apprentissage",
        actif: true,
        hypothese: "COMMUNE",
        calcAuto: true,
        taux: 0.68,
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        ordre: 1,
      },
      {
        scenarioId: scenario.id,
        libelle: "Effort construction (PEEC)",
        actif: true,
        hypothese: "COMMUNE",
        calcAuto: true,
        taux: 0.45,
        montantN: 0,
        montantN1: 0,
        montantN2: 0,
        ordre: 2,
      },
    ],
  });
  console.log("✅ 3 taxes sur salaires créées");

  // ── 16. Charges de personnel ──
  await prisma.ligneChargePersonnel.createMany({
    data: [
      {
        scenarioId: scenario.id,
        libelle: "Médecine du travail",
        actif: true,
        hypothese: "COMMUNE",
        type: "AUTRE",
        calcAuto: false,
        montantN: 500,
        montantN1: 500,
        montantN2: 500,
        ordre: 0,
      },
      {
        scenarioId: scenario.id,
        libelle: "Mutuelle obligatoire (part employeur)",
        actif: true,
        hypothese: "COMMUNE",
        type: "AUTRE",
        calcAuto: false,
        montantN: 2400,
        montantN1: 2500,
        montantN2: 2600,
        ordre: 1,
      },
    ],
  });
  console.log("✅ 2 charges de personnel créées");

  // ── 17. Paramètres IS ──
  await prisma.parametresIS.create({
    data: {
      scenarioId: scenario.id,
      isEnabled: true,
      tauxReduitN: 15,
      plafondReduitN: 42500,
      tauxNormalN: 25,
      tauxReduitN1: 15,
      plafondReduitN1: 42500,
      tauxNormalN1: 25,
      tauxReduitN2: 15,
      plafondReduitN2: 42500,
      tauxNormalN2: 25,
    },
  });
  console.log("✅ Paramètres IS créés");

  // ── 18. Divers — Remboursement compte courant ──
  await prisma.diversFluxDate.create({
    data: {
      scenarioId: scenario.id,
      libelle: "Remboursement compte courant gérant",
      actif: true,
      type: "REMBOURSEMENT_CC",
      dateN1: "2027-12-31",
      montantN: 0,
      montantN1: 5000,
      dateN2: "2028-12-31",
      montantN2: 5000,
      ordre: 0,
    },
  });
  console.log("✅ 1 flux divers créé (remboursement CC)");

  // ── 19. Unités d'œuvre (indicateurs métier restaurant) ──
  await prisma.uniteDOeuvre.createMany({
    data: [
      {
        scenarioId: scenario.id,
        libelle: "Couverts servis",
        actif: true,
        typeUnite: "COUVERT",
        typeIndicateur: "CHIFFRE_AFFAIRES",
        typeDuree: "JOURS_AN",
        ordre: 0,
        indicateurBaseN: 280000,
        partPctN: 82.35,
        chiffreAffairesN: 280000,
        nbJoursN: 300, // ~300 jours d'ouverture
        parJourN: 933.33,
        prixMoyenN: 18.5,
        quantiteN: 15135,
        indicateurBaseN1: 294000,
        partPctN1: 81.67,
        chiffreAffairesN1: 294000,
        nbJoursN1: 310,
        parJourN1: 948.39,
        prixMoyenN1: 19.0,
        quantiteN1: 15473,
        indicateurBaseN2: 302820,
        partPctN2: 80.94,
        chiffreAffairesN2: 302820,
        nbJoursN2: 310,
        parJourN2: 976.84,
        prixMoyenN2: 19.5,
        quantiteN2: 15529,
      },
      {
        scenarioId: scenario.id,
        libelle: "Ticket moyen emporter",
        actif: true,
        typeUnite: "CLIENT",
        typeIndicateur: "CHIFFRE_AFFAIRES",
        typeDuree: "JOURS_AN",
        ordre: 1,
        indicateurBaseN: 60000,
        partPctN: 17.65,
        chiffreAffairesN: 60000,
        nbJoursN: 300,
        parJourN: 200,
        prixMoyenN: 12.5,
        quantiteN: 4800,
        indicateurBaseN1: 66000,
        partPctN1: 18.33,
        chiffreAffairesN1: 66000,
        nbJoursN1: 310,
        parJourN1: 212.9,
        prixMoyenN1: 13.0,
        quantiteN1: 5076,
        indicateurBaseN2: 71280,
        partPctN2: 19.06,
        chiffreAffairesN2: 71280,
        nbJoursN2: 310,
        parJourN2: 229.94,
        prixMoyenN2: 13.5,
        quantiteN2: 5280,
      },
    ],
  });
  console.log("✅ 2 unités d'œuvre créées (couverts + ticket moyen)");

  // ── Résumé ──
  console.log("\n" + "═".repeat(60));
  console.log("🎉 Dossier de reprise de restaurant créé avec succès !");
  console.log("═".repeat(60));
  console.log(`   Dossier ID : ${dossier.id}`);
  console.log(`   Nom        : ${NOM_DOSSIER}`);
  console.log(`   Type       : REPRISE`);
  console.log(`   Démarrage  : ${DATE_DEMARRAGE.toLocaleDateString("fr-FR")}`);
  console.log(`   Projection : ${DUREE_PROJECTION} exercices`);
  console.log("");
  console.log("   📊 Données saisies :");
  console.log("     • 2 activités (salle + emporter)");
  console.log("     • 11 charges d'exploitation");
  console.log("     • 3 impôts & taxes");
  console.log("     • 1 dirigeant TNS + 5 salariés");
  console.log("     • 6 cotisations TNS (auto)");
  console.log("     • 3 taxes sur salaires");
  console.log("     • 2 charges de personnel");
  console.log("     • 5 immobilisations");
  console.log("     • 3 apports + 1 emprunt + 1 subvention");
  console.log("     • 1 flux divers");
  console.log("     • 2 unités d'œuvre");
  console.log("     • Paramètres IS configurés");
  console.log("═".repeat(60));
  console.log("\n💡 Pour lancer le diagnostic :");
  console.log(`   pnpm tsx scripts/debug/debug-saisie.ts ${dossier.id}\n`);
}

main()
  .catch((err) => {
    console.error("❌ Erreur lors du seed :", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

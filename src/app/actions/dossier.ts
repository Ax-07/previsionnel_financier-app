"use server";

import { prisma } from "@/lib/prisma";
import {
  createDossierSchema,
  updateDossierSchema,
  type CreateDossierValues,
  type UpdateDossierValues,
} from "@/lib/schemas/dossier";
import { recalculerTousLesPlans } from "@/app/actions/investissement";
import { isPrismaError } from "@/lib/utils/prisma-error";
import {
  buildDefaultExercices,
  parseDateInput,
} from "@/lib/entreprise/default-exercices";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ── Types partagés ────────────────────────────────────────────────────────────

export type DossierListItem = {
  id: string;
  nom: string;
  reference: string | null;
  typeDossier: "CREATION" | "REPRISE";
  statut: "ACTIF" | "ARCHIVE" | "SUPPRIME";
  dateDemarrage: Date;
  dureeProjection: number;
  updatedAt: Date;
};

export type DossierDetail = DossierListItem;

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Retourne la liste de tous les dossiers actifs triés par date de mise à jour.
 * TODO: filtrer par cabinet/utilisateur une fois Better Auth intégré.
 */
export async function fetchDossiers(): Promise<DossierListItem[]> {
  const rows = await prisma.dossier.findMany({
    where: { statut: "ACTIF" },
    select: {
      id: true,
      nom: true,
      reference: true,
      typeDossier: true,
      statut: true,
      dateDemarrage: true,
      dureeProjection: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows as DossierListItem[];
}

/**
 * Retourne un dossier par son id.
 * Retourne null si introuvable.
 */
export async function fetchDossierById(
  id: string
): Promise<DossierDetail | null> {
  const row = await prisma.dossier.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      reference: true,
      typeDossier: true,
      statut: true,
      dateDemarrage: true,
      dureeProjection: true,
      updatedAt: true,
    },
  });
  return row as DossierDetail | null;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export type CreateDossierResult =
  | { success: true; dossierId: string }
  | { success: false; error: string };



/**
 * Récupère ou crée un cabinet de démonstration.
 * À remplacer par `getServerSession()` une fois Better Auth configuré.
 */
async function getOrCreateDemoCabinet(): Promise<string> {
  const existing = await prisma.cabinet.findFirst({
    select: { id: true },
  });
  if (existing) return existing.id;

  const demo = await prisma.cabinet.create({
    data: { nom: "Cabinet Démo" },
    select: { id: true },
  });
  return demo.id;
}

/**
 * Crée un nouveau dossier prévisionnel.
 * Valide les données côté serveur, insère en base, puis redirige vers
 * la page du dossier créé.
 */
export async function createDossier(
  rawData: CreateDossierValues
): Promise<CreateDossierResult> {
  // Validation serveur
  const parsed = createDossierSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Données invalides";
    return { success: false, error: firstError };
  }

  const data = parsed.data;

  // Vérification de l'unicité de la référence (si fournie)
  if (data.reference) {
    const exists = await prisma.dossier.findUnique({
      where: { reference: data.reference },
      select: { id: true },
    });
    if (exists) {
      return {
        success: false,
        error: `La référence « ${data.reference} » est déjà utilisée.`,
      };
    }
  }

  // Résolution du cabinet (TODO: remplacer par la session utilisateur)
  const cabinetId = await getOrCreateDemoCabinet();

  try {
    const startDate = parseDateInput(data.dateDemarrage);
    const exercices = buildDefaultExercices(data.dateDemarrage, data.dureeProjection);

    const dossier = await prisma.$transaction(async (tx) => {
      const createdDossier = await tx.dossier.create({
        data: {
          nom: data.nom,
          typeDossier: data.typeDossier,
          dateDemarrage: startDate,
          dureeProjection: data.dureeProjection,
          reference: data.reference || null,
          cabinetId,
        },
        select: { id: true },
      });

      const scenario = await tx.scenario.create({
        data: {
          nom: "ScÃ©nario rÃ©aliste",
          isDefault: true,
          dossierId: createdDossier.id,
        },
        select: { id: true },
      });

      const parametres = await tx.parametresEntreprise.create({
        data: {
          scenarioId: scenario.id,
          dateDebutExerciceN: startDate,
          dureePrevisionnelle: data.dureeProjection,
        },
        select: { id: true },
      });

      await tx.exercicePrevisionnel.createMany({
        data: exercices.map((exercice, index) => ({
          ordre: index + 1,
          dateCloture: exercice.dateCloture,
          duree: exercice.duree,
          annee: exercice.annee,
          parametresId: parametres.id,
        })),
      });

      return createdDossier;
    });

    return { success: true, dossierId: dossier.id };
  } catch (err) {
    console.error("[createDossier]", err);

    if (isPrismaError(err, "P2002")) {
      return {
        success: false,
        error: "Cette référence est déjà utilisée par un autre dossier.",
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inattendue.",
    };
  }
}

/**
 * Crée un dossier puis redirige vers sa page (pour usage server-side).
 * Utilisation : dans un Server Component ou une action de formulaire HTML.
 */
export async function createDossierAndRedirect(
  rawData: CreateDossierValues
): Promise<never | CreateDossierResult> {
  const result = await createDossier(rawData);
  if (result.success) {
    redirect(`/app/dossier/${result.dossierId}`);
  }
  return result;
}

// ── Mise à jour d'un dossier ──────────────────────────────────────────────────

export type UpdateDossierResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Met à jour les paramètres d'un dossier.
 * Si `dureeProjection` ou `dateDemarrage` changent, recalcule tous les plans
 * d'amortissement pour que les dotations restent cohérentes.
 */
export async function updateDossier(
  dossierId: string,
  rawData: UpdateDossierValues,
): Promise<UpdateDossierResult> {
  const parsed = updateDossierSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  try {
    const current = await prisma.dossier.findUniqueOrThrow({
      where: { id: dossierId },
      select: { dateDemarrage: true, dureeProjection: true },
    });

    const payload: Record<string, unknown> = {};
    if (data.nom !== undefined) payload.nom = data.nom;
    if (data.reference !== undefined) payload.reference = data.reference || null;
    if (data.typeDossier !== undefined) payload.typeDossier = data.typeDossier;
    if (data.dateDemarrage !== undefined) payload.dateDemarrage = new Date(data.dateDemarrage);
    if (data.dureeProjection !== undefined) payload.dureeProjection = data.dureeProjection;

    await prisma.dossier.update({ where: { id: dossierId }, data: payload });

    // Recalcul des plans si la fenêtre temporelle a changé
    const dateChanged =
      data.dateDemarrage !== undefined &&
      new Date(data.dateDemarrage).getTime() !== new Date(current.dateDemarrage).getTime();
    const dureeChanged =
      data.dureeProjection !== undefined && data.dureeProjection !== current.dureeProjection;

    if (dateChanged || dureeChanged) {
      await recalculerTousLesPlans(dossierId);
    }

    return { success: true };
  } catch (err) {
    console.error("[updateDossier]", err);
    if (isPrismaError(err, "P2025")) return { success: false, error: "Dossier introuvable." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inattendue." };
  }
}

// ── Duplication d'un dossier ─────────────────────────────────────────────────

export type DuplicateDossierResult =
  | { success: true; dossierId: string }
  | { success: false; error: string };

/**
 * Calcule un nom sans collision pour la copie.
 * "Mon dossier" → "Mon dossier (copie)" → "Mon dossier (copie 2)" → …
 */
async function buildCopieName(
  baseName: string,
  cabinetId: string
): Promise<string> {
  const base = baseName.replace(/ \(copie(?: \d+)?\)$/, "");
  const prefix = `${base} (copie`;

  const existing = await prisma.dossier.findMany({
    where: { cabinetId, nom: { startsWith: prefix } },
    select: { nom: true },
  });

  if (existing.length === 0) return `${base} (copie)`;

  const numbers = existing.map((d) => {
    const m = d.nom.match(/ \(copie(?: (\d+))?\)$/);
    if (!m) return 0;
    return m[1] ? parseInt(m[1], 10) : 1;
  });

  return `${base} (copie ${Math.max(...numbers) + 1})`;
}

/** Retire id / scenarioId / createdAt / updatedAt et injecte le nouveau scenarioId. */
function rebase(items: any[], newScenarioId: string): any[] {
  return items.map(
    ({ id: _id, scenarioId: _sid, createdAt: _ca, updatedAt: _ua, ...rest }) => ({
      ...rest,
      scenarioId: newScenarioId,
    })
  );
}

/**
 * Duplique un dossier et l'ensemble de ses données saisies :
 * tous les scénarios (avec toutes les entités métier imbriquées),
 * les commentaires racines et la checklist.
 * Les données calculées (résultats, bilan, trésorerie…) ne sont pas copiées.
 * La référence unique est effacée sur la copie.
 */
export async function duplicateDossier(
  sourceDossierId: string
): Promise<DuplicateDossierResult> {
  try {
    // ── 1. Chargement complet de la source ──────────────────────────────────
    const source = await prisma.dossier.findUnique({
      where: { id: sourceDossierId },
      include: {
        checklistPieces: true,
        commentaires: { where: { parentId: null } },
        scenarios: {
          include: {
            activites: {
              include: {
                volumesAnnuels: true,
                saisonnalites: true,
                croissances: true,
              },
            },
            activitesCommission: true,
            apports: true,
            subventions: true,
            emprunts: { include: { lignesEcheancier: true } },
            immobilisations: { include: { lignesAmortissement: true } },
            cessions: true,
            creditsBaux: true,
            chargesFixes: true,
            chargesVariables: true,
            autresCharges: true,
            autresChargesProvisions: true,
            autresChargesDatees: true,
            autresChargesBilan: true,
            autresProduits: true,
            autreProduitReprises: true,
            autreProduitDates: true,
            autreProduitConstates: true,
            chargesExploitation: true,
            impotsTaxes: true,
            lignesCotisationsTNS: true,
            lignesChargesPersonnel: true,
            lignesSalaries: true,
            lignesDirigeants: true,
            lignesTaxesSalaires: true,
            salaries: { include: { primes: true } },
            dirigeants: { include: { primes: true } },
            productionsImmobilisees: true,
            subventionsExploitation: true,
            unitesDOeuvre: true,
            ajustementsFiscaux: true,
            diversFluxDates: true,
            diversOperationsCapital: true,
            diversPrets: true,
            tableauxLibres: {
              include: { lignes: { include: { details: true } } },
            },
            parametres: { include: { exercices: true } },
            parametresIS: true,
          },
        },
      },
    });

    if (!source) {
      return { success: false, error: "Dossier source introuvable." };
    }

    // ── 2. Nom sans collision ───────────────────────────────────────────────
    const newNom = await buildCopieName(source.nom, source.cabinetId);

    // ── 3. Copie en transaction ─────────────────────────────────────────────
    const newDossier = await prisma.$transaction(
      async (tx) => {
        // Scalaires du dossier (sans id, meta et relations)
        const {
          id: _dId,
          createdAt: _dCA,
          updatedAt: _dUA,
          checklistPieces,
          commentaires,
          scenarios,
          ...dossierScalars
        } = source;

        const newD = await tx.dossier.create({
          data: { ...dossierScalars, nom: newNom, reference: null },
          select: { id: true },
        });

        // ── ChecklistPieces ─────────────────────────────────────────────────
        if (checklistPieces.length > 0) {
          await tx.checklistPiece.createMany({
            data: checklistPieces.map(({ id: _id, dossierId: _did, createdAt: _ca, updatedAt: _ua, ...r }) => ({
              ...r,
              dossierId: newD.id,
            })) as any,
          });
        }

        // ── Commentaires racines ────────────────────────────────────────────
        if (commentaires.length > 0) {
          await tx.commentaire.createMany({
            data: commentaires.map(({ id: _id, dossierId: _did, parentId: _pid, createdAt: _ca, updatedAt: _ua, ...r }) => ({
              ...r,
              dossierId: newD.id,
              parentId: null,
            })) as any,
          });
        }

        // ── Scénarios ───────────────────────────────────────────────────────
        for (const scenario of scenarios) {
          const {
            id: _sId,
            dossierId: _sDId,
            createdAt: _sCA,
            updatedAt: _sUA,
            activites,
            activitesCommission,
            apports,
            subventions,
            emprunts,
            immobilisations,
            cessions,
            creditsBaux,
            chargesFixes,
            chargesVariables,
            autresCharges,
            autresChargesProvisions,
            autresChargesDatees,
            autresChargesBilan,
            autresProduits,
            autreProduitReprises,
            autreProduitDates,
            autreProduitConstates,
            chargesExploitation,
            impotsTaxes,
            lignesCotisationsTNS,
            lignesChargesPersonnel,
            lignesSalaries,
            lignesDirigeants,
            lignesTaxesSalaires,
            salaries,
            dirigeants,
            productionsImmobilisees,
            subventionsExploitation,
            unitesDOeuvre,
            ajustementsFiscaux,
            diversFluxDates,
            diversOperationsCapital,
            diversPrets,
            tableauxLibres,
            parametres,
            parametresIS,
            // données calculées — supprimées (architecture cible)
            ...scenarioScalars
          } = scenario;

          const newS = await tx.scenario.create({
            data: { ...scenarioScalars, dossierId: newD.id },
            select: { id: true },
          });

          // ── Activités (avec sous-tables) ──────────────────────────────────
          for (const activite of activites) {
            const {
              id: _aId,
              scenarioId: _aSid,
              createdAt: _aCA,
              updatedAt: _aUA,
              volumesAnnuels,
              saisonnalites,
              croissances,
              ...activiteScalars
            } = activite;
            const newA = await tx.activite.create({
              data: { ...activiteScalars, scenarioId: newS.id } as any,
              select: { id: true },
            });
            if (volumesAnnuels.length > 0) {
              await tx.volumeActivite.createMany({
                data: volumesAnnuels.map(({ id: _, activiteId: __, ...r }) => ({ ...r, activiteId: newA.id })) as any,
              });
            }
            if (saisonnalites.length > 0) {
              await tx.saisonnaliteActivite.createMany({
                data: saisonnalites.map(({ id: _, activiteId: __, ...r }) => ({ ...r, activiteId: newA.id })) as any,
              });
            }
            if (croissances.length > 0) {
              await tx.croissanceActivite.createMany({
                data: croissances.map(({ id: _, activiteId: __, ...r }) => ({ ...r, activiteId: newA.id })) as any,
              });
            }
          }

          // ── Emprunts (avec échéancier) ─────────────────────────────────────
          for (const emprunt of emprunts) {
            const {
              id: _eId,
              scenarioId: _eSid,
              createdAt: _eCA,
              updatedAt: _eUA,
              lignesEcheancier,
              ...empruntScalars
            } = emprunt;
            const newE = await tx.emprunt.create({
              data: { ...empruntScalars, scenarioId: newS.id },
              select: { id: true },
            });
            if (lignesEcheancier.length > 0) {
              await tx.ligneEcheancier.createMany({
                data: lignesEcheancier.map(({ id: _, empruntId: __, ...r }) => ({ ...r, empruntId: newE.id })) as any,
              });
            }
          }

          // ── Immobilisations (avec amortissements) ─────────────────────────
          for (const immo of immobilisations) {
            const {
              id: _iId,
              scenarioId: _iSid,
              createdAt: _iCA,
              updatedAt: _iUA,
              lignesAmortissement,
              ...immoScalars
            } = immo;
            const newI = await tx.immobilisation.create({
              data: { ...immoScalars, scenarioId: newS.id },
              select: { id: true },
            });
            if (lignesAmortissement.length > 0) {
              await tx.ligneAmortissement.createMany({
                data: lignesAmortissement.map(({ id: _, immobilisationId: __, ...r }) => ({ ...r, immobilisationId: newI.id })) as any,
              });
            }
          }

          // ── Salariés (avec primes) ─────────────────────────────────────────
          for (const salarie of salaries) {
            const {
              id: _salId,
              scenarioId: _salSid,
              createdAt: _salCA,
              updatedAt: _salUA,
              primes,
              ...salarieScalars
            } = salarie;
            const newSal = await tx.salarie.create({
              data: { ...salarieScalars, scenarioId: newS.id },
              select: { id: true },
            });
            if (primes.length > 0) {
              await tx.prime.createMany({
                data: primes.map(({ id: _, salarieId: __, dirigeantId: ___, createdAt: ____, ...r }) => ({
                  ...r,
                  salarieId: newSal.id,
                  dirigeantId: null,
                })) as any,
              });
            }
          }

          // ── Dirigeants (avec primes) ───────────────────────────────────────
          for (const dirigeant of dirigeants) {
            const {
              id: _dgId,
              scenarioId: _dgSid,
              createdAt: _dgCA,
              updatedAt: _dgUA,
              primes,
              ...dirigeantScalars
            } = dirigeant;
            const newDir = await tx.dirigeant.create({
              data: { ...dirigeantScalars, scenarioId: newS.id },
              select: { id: true },
            });
            if (primes.length > 0) {
              await tx.prime.createMany({
                data: primes.map(({ id: _, salarieId: __, dirigeantId: ___, createdAt: ____, ...r }) => ({
                  ...r,
                  dirigeantId: newDir.id,
                  salarieId: null,
                })) as any,
              });
            }
          }

          // ── Tableaux libres (lignes → détails) ────────────────────────────
          for (const tableau of tableauxLibres) {
            const {
              id: _tId,
              scenarioId: _tSid,
              createdAt: _tCA,
              updatedAt: _tUA,
              lignes,
              ...tableauScalars
            } = tableau;
            const newT = await tx.tableauLibre.create({
              data: { ...tableauScalars, scenarioId: newS.id },
              select: { id: true },
            });
            for (const ligne of lignes) {
              const {
                id: _lId,
                tableauId: _lTId,
                createdAt: _lCA,
                updatedAt: _lUA,
                details,
                ...ligneScalars
              } = ligne;
              const newL = await tx.tableauLibreLigne.create({
                data: { ...ligneScalars, tableauId: newT.id },
                select: { id: true },
              });
              if (details.length > 0) {
                await tx.tableauLibreDetail.createMany({
                  data: details.map(({ id: _, ligneId: __, ...r }) => ({ ...r, ligneId: newL.id })) as any,
                });
              }
            }
          }

          // ── ParametresEntreprise (avec exercices prévisionnels) ───────────
          if (parametres) {
            const {
              id: _pId,
              scenarioId: _pSid,
              createdAt: _pCA,
              updatedAt: _pUA,
              exercices,
              ...parametresScalars
            } = parametres;
            const newP = await tx.parametresEntreprise.create({
              data: { ...parametresScalars, scenarioId: newS.id },
              select: { id: true },
            });
            if (exercices.length > 0) {
              await tx.exercicePrevisionnel.createMany({
                data: exercices.map(({ id: _, parametresId: __, ...r }) => ({ ...r, parametresId: newP.id })) as any,
              });
            }
          }

          // ── ParametresIS (1:1 plat) ────────────────────────────────────────
          if (parametresIS) {
            const {
              id: _pisId,
              scenarioId: _pisSid,
              createdAt: _pisCA,
              updatedAt: _pisUA,
              ...parametresISScalars
            } = parametresIS;
            await tx.parametresIS.create({
              data: { ...parametresISScalars, scenarioId: newS.id } as any,
            });
          }

          // ── Modèles plats (createMany) ─────────────────────────────────────
          const sid = newS.id;
          if (activitesCommission.length > 0)
            await tx.activiteCommission.createMany({ data: rebase(activitesCommission, sid) as any });
          if (apports.length > 0)
            await tx.apport.createMany({ data: rebase(apports, sid) as any });
          if (subventions.length > 0)
            await tx.subvention.createMany({ data: rebase(subventions, sid) as any });
          if (cessions.length > 0)
            await tx.cessionImmobilisation.createMany({ data: rebase(cessions, sid) as any });
          if (creditsBaux.length > 0)
            await tx.creditBail.createMany({ data: rebase(creditsBaux, sid) as any });
          if (chargesFixes.length > 0)
            await tx.chargeFixe.createMany({ data: rebase(chargesFixes, sid) as any });
          if (chargesVariables.length > 0)
            await tx.chargeVariable.createMany({ data: rebase(chargesVariables, sid) as any });
          if (autresCharges.length > 0)
            await tx.autreCharge.createMany({ data: rebase(autresCharges, sid) as any });
          if (autresChargesProvisions.length > 0)
            await tx.autreChargeProvision.createMany({ data: rebase(autresChargesProvisions, sid) as any });
          if (autresChargesDatees.length > 0)
            await tx.autreChargeDatee.createMany({ data: rebase(autresChargesDatees, sid) as any });
          if (autresChargesBilan.length > 0)
            await tx.autreChargeBilan.createMany({ data: rebase(autresChargesBilan, sid) as any });
          if (autresProduits.length > 0)
            await tx.autreProduit.createMany({ data: rebase(autresProduits, sid) as any });
          if (autreProduitReprises.length > 0)
            await tx.autreProduitReprise.createMany({ data: rebase(autreProduitReprises, sid) as any });
          if (autreProduitDates.length > 0)
            await tx.autreProduitDate.createMany({ data: rebase(autreProduitDates, sid) as any });
          if (autreProduitConstates.length > 0)
            await tx.autreProduitConstate.createMany({ data: rebase(autreProduitConstates, sid) as any });
          if (chargesExploitation.length > 0)
            await tx.chargeExploitation.createMany({ data: rebase(chargesExploitation, sid) as any });
          if (impotsTaxes.length > 0)
            await tx.impotTaxe.createMany({ data: rebase(impotsTaxes, sid) as any });
          if (lignesCotisationsTNS.length > 0)
            await tx.ligneCotisationTNS.createMany({ data: rebase(lignesCotisationsTNS, sid) as any });
          if (lignesChargesPersonnel.length > 0)
            await tx.ligneChargePersonnel.createMany({ data: rebase(lignesChargesPersonnel, sid) as any });
          if (lignesSalaries.length > 0)
            await tx.ligneSalarie.createMany({ data: rebase(lignesSalaries, sid) as any });
          if (lignesDirigeants.length > 0)
            await tx.ligneDirigeant.createMany({ data: rebase(lignesDirigeants, sid) as any });
          if (lignesTaxesSalaires.length > 0)
            await tx.ligneTaxeSalaire.createMany({ data: rebase(lignesTaxesSalaires, sid) as any });
          if (productionsImmobilisees.length > 0)
            await tx.productionImmobilisee.createMany({ data: rebase(productionsImmobilisees, sid) as any });
          if (subventionsExploitation.length > 0)
            await tx.subventionExploitation.createMany({ data: rebase(subventionsExploitation, sid) as any });
          if (unitesDOeuvre.length > 0)
            await tx.uniteDOeuvre.createMany({ data: rebase(unitesDOeuvre, sid) as any });
          if (ajustementsFiscaux.length > 0)
            await tx.ajustementFiscal.createMany({ data: rebase(ajustementsFiscaux, sid) as any });
          if (diversFluxDates.length > 0)
            await tx.diversFluxDate.createMany({ data: rebase(diversFluxDates, sid) as any });
          if (diversOperationsCapital.length > 0)
            await tx.diversOperationCapital.createMany({ data: rebase(diversOperationsCapital, sid) as any });
          if (diversPrets.length > 0)
            await tx.diversPret.createMany({ data: rebase(diversPrets, sid) as any });
        }

        return newD;
      },
      { timeout: 30000 }
    );

    revalidatePath("/previsionnel");
    return { success: true, dossierId: newDossier.id };
  } catch (err) {
    console.error("[duplicateDossier]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inattendue.",
    };
  }
}

// ── Suppression d'un dossier ──────────────────────────────────────────────────

export type DeleteDossierResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Supprime définitivement un dossier et toutes ses données associées.
 * Les AuditLogs conservent une trace (dossierId mis à null).
 * Cascade Prisma : Scenario → toutes les entités métier enfants.
 */
export async function deleteDossier(
  dossierId: string
): Promise<DeleteDossierResult> {
  try {
    // Vérification d'existence avant suppression
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      select: { id: true },
    });

    if (!dossier) {
      return { success: false, error: "Dossier introuvable." };
    }

    await prisma.dossier.delete({ where: { id: dossierId } });

    revalidatePath("/previsionnel");
    return { success: true };
  } catch (err) {
    console.error("[deleteDossier]", err);
    if (isPrismaError(err, "P2025")) {
      return { success: false, error: "Dossier introuvable." };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inattendue.",
    };
  }
}

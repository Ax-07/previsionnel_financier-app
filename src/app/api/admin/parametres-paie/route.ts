/**
 * Route API : /api/admin/parametres-paie
 *
 * GET  → Retourne le catalogue des millésimes (métadonnées + bundle courant)
 * POST → Valide un jeu de paramètres et génère le code TypeScript source
 *        correspondant (fichier YYYY.ts à intégrer dans params/)
 *        ⚠️ Pas d'écriture disque (serverless) — retourne le code pour copy-paste
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AVAILABLE_MILLESIMES,
  METADATA_MILLESIMES,
  REGISTRE_MILLESIMES,
  DEFAULT_MILLESIME,
} from "@/lib/paie/params/index";

// ─────────────────────────────────────────────────────────────────────────────
// GET — catalogue des millésimes
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  const courant = REGISTRE_MILLESIMES[DEFAULT_MILLESIME];

  return NextResponse.json({
    millesimes: AVAILABLE_MILLESIMES,
    metadata: METADATA_MILLESIMES,
    courant: courant
      ? {
          millesime: courant.millesime,
          depuis: courant.depuis.toISOString(),
          smic: courant.params.smicHoraire,
          passMensuel: courant.params.passMensuel,
          passAnnuel: courant.params.passAnnuel,
          heuresLegalesMensuelles: courant.params.heuresLegalesMensuelles,
          tauxUrssaf: courant.tauxUrssaf,
          tauxArrco: courant.tauxArrco,
          rgdu: courant.rgdu,
          abattementCsg: courant.abattementCsg,
        }
      : null,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Schéma Zod pour la validation du POST
// ─────────────────────────────────────────────────────────────────────────────

const taux2Schema = z.object({
  salarie: z.number().nonnegative(),
  patronal: z.number().nonnegative(),
});

const postSchema = z.object({
  millesime: z
    .string()
    .regex(/^\d{4}$/, "Le millésime doit être une année sur 4 chiffres"),
  smicHoraire: z.number().positive("Le SMIC horaire doit être positif"),
  passMensuel: z.number().positive("Le PASS mensuel doit être positif"),
  passAnnuel: z.number().positive("Le PASS annuel doit être positif"),
  heuresLegalesMois: z.number().positive(),
  tauxUrssaf: z.object({
    maladieNonCadre: taux2Schema,
    maladieCadre: taux2Schema,
    vieillessePlafonnee: taux2Schema,
    vieillesseDeplafonnee: taux2Schema,
    accidentsTravail: z.object({ patronal: z.number().nonnegative() }),
    allocationsFamiliales: z.object({ patronal: z.number().nonnegative() }),
    chomage: taux2Schema,
    agsPeninsulair: z.object({ patronal: z.number().nonnegative() }),
  }),
  tauxArrco: z.object({
    t1: taux2Schema,
    t2: taux2Schema,
    ceg: taux2Schema,
    cet: taux2Schema,
    apec: taux2Schema.optional(),
  }),
});

type PostBody = z.infer<typeof postSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// POST — génération du code TypeScript source
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const code = generateParamsSource(data);

  return NextResponse.json({
    millesime: data.millesime,
    fichier: `src/lib/paie/params/${data.millesime}.ts`,
    code,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Générateur de code TypeScript source
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toString();
}

function generateParamsSource(data: PostBody): string {
  const y = data.millesime;
  const u = data.tauxUrssaf;
  const a = data.tauxArrco;

  return `/**
 * Paramètres réglementaires ${y}
 * ⚠️ Fichier généré automatiquement — vérifier avant intégration.
 *
 * Sources :
 *   - Circulaire Urssaf ${y}
 *   - BOSS (Bulletin Officiel de la Sécurité Sociale) — janvier ${y}
 *   - Accord national interprofessionnel Agirc-Arrco
 */

import type { ParamsReglementaires, TauxCotisation } from "@/lib/paie/types";

// ─── Paramètres généraux ────────────────────────────────────────────────────

export const PARAMS_${y}: ParamsReglementaires = {
  smicHoraire: ${fmt(data.smicHoraire)},
  passMensuel: ${fmt(data.passMensuel)},
  passAnnuel: ${fmt(data.passAnnuel)},
  heuresLegalesMois: ${fmt(data.heuresLegalesMois)},
};

export const ABATTEMENT_CSG = 0.9825;

// ─── Taux Urssaf ${y} ────────────────────────────────────────────────────────

export const TAUX_URSSAF_${y} = {
  maladieNonCadre:        { salarie: ${fmt(u.maladieNonCadre.salarie)},        patronal: ${fmt(u.maladieNonCadre.patronal)} },
  maladieCadre:           { salarie: ${fmt(u.maladieCadre.salarie)},           patronal: ${fmt(u.maladieCadre.patronal)} },
  vieillessePlafonnee:    { salarie: ${fmt(u.vieillessePlafonnee.salarie)},    patronal: ${fmt(u.vieillessePlafonnee.patronal)} },
  vieillesseDeplafonnee:  { salarie: ${fmt(u.vieillesseDeplafonnee.salarie)},  patronal: ${fmt(u.vieillesseDeplafonnee.patronal)} },
  accidentsTravail:       { patronal: ${fmt(u.accidentsTravail.patronal)} },
  allocationsFamiliales:  { patronal: ${fmt(u.allocationsFamiliales.patronal)} },
  chomage:                { salarie: ${fmt(u.chomage.salarie)},                patronal: ${fmt(u.chomage.patronal)} },
  agsPeninsulair:         { patronal: ${fmt(u.agsPeninsulair.patronal)} },
} satisfies Record<string, Partial<TauxCotisation>>;

// ─── Taux Agirc-Arrco ${y} ───────────────────────────────────────────────────

export const TAUX_ARRCO_${y} = {
  t1:   { salarie: ${fmt(a.t1.salarie)},   patronal: ${fmt(a.t1.patronal)} },
  t2:   { salarie: ${fmt(a.t2.salarie)},   patronal: ${fmt(a.t2.patronal)} },
  ceg:  { salarie: ${fmt(a.ceg.salarie)},  patronal: ${fmt(a.ceg.patronal)} },
  cet:  { salarie: ${fmt(a.cet.salarie)},  patronal: ${fmt(a.cet.patronal)} },${a.apec ? `\n  apec: { salarie: ${fmt(a.apec.salarie)}, patronal: ${fmt(a.apec.patronal)} },` : ""}
} satisfies Record<string, TauxCotisation>;

// ─── RGDU ${y} — À compléter si les barèmes changent ──────────────────────────
// TODO: copier et adapter depuis params/${Number(y) - 1}.ts
`;
}

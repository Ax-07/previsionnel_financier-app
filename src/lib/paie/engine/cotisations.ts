/**
 * Moteur de calcul des cotisations sociales 2026.
 *
 * Produit la liste complète des lignes de bulletin :
 *   - Cotisations Urssaf (maladie, vieillesse, AF, chômage, AGS, FNAL, CSA, dial. social)
 *   - CSG déductible / non déductible / CRDS
 *   - AT/MP et versement mobilité
 *   - Agirc-Arrco T1/T2 + CEG + CET + APEC (cadres)
 *
 * Chaque ligne expose assiette, taux salarié, taux employeur, montants, traçabilité.
 */

import {
  PARAMS_2026,
  TAUX_URSSAF_2026,
  TAUX_ARRCO_2026,
} from "@/lib/paie/params/2026";
import type {
  LigneCotisation,
  FamilleCotisation,
  SalarieInput,
  EntrepriseInput,
} from "@/lib/paie/types";
import type { AssiettesResult } from "@/lib/paie/engine/assiettes";

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaire interne : construction d'une ligne
// ─────────────────────────────────────────────────────────────────────────────

function ligne(
  code: string,
  libelle: string,
  famille: FamilleCotisation,
  organisme: string,
  assiette: number,
  tranche: string,
  tauxSalarie: number,
  tauxEmployeur: number,
  deductible: boolean,
  regleCode: string,
): LigneCotisation {
  return {
    code,
    libelle,
    famille,
    organisme,
    assiette: round2(assiette),
    tranche,
    tauxSalarie,
    tauxEmployeur,
    montantSalarie: round2(assiette * tauxSalarie),
    montantEmployeur: round2(assiette * tauxEmployeur),
    deductible,
    regleCode,
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cotisations Urssaf
// ─────────────────────────────────────────────────────────────────────────────

function cotisationsUrssaf(
  a: AssiettesResult,
  entreprise: EntrepriseInput,
): LigneCotisation[] {
  const { brutSoumis, pmssProratise, assietteCsg } = a;
  const plafond4Pass = Math.min(brutSoumis, 4 * PARAMS_2026.passMensuel);
  const estGrand = entreprise.effectif >= 50;

  return [
    // Assurance maladie
    ligne(
      "MALADIE_PAT",
      "Assurance maladie, maternité, invalidité, décès",
      "assurance_maladie",
      "Urssaf",
      brutSoumis,
      "totalite",
      TAUX_URSSAF_2026.assuranceMaladie.salarie,
      TAUX_URSSAF_2026.assuranceMaladie.employeur,
      false,
      "URSSAF_MALADIE_2026",
    ),

    // CSA
    ligne(
      "CSA_PAT",
      "Contribution solidarité autonomie",
      "csa",
      "Urssaf",
      brutSoumis,
      "totalite",
      TAUX_URSSAF_2026.csa.salarie,
      TAUX_URSSAF_2026.csa.employeur,
      false,
      "URSSAF_CSA_2026",
    ),

    // Vieillesse plafonnée
    ligne(
      "VIEILL_PLAF_SAL",
      "Assurance vieillesse plafonnée — salarié",
      "assurance_vieillesse",
      "Urssaf",
      Math.min(brutSoumis, pmssProratise),
      "PASS",
      TAUX_URSSAF_2026.vieillessePlafonnee.salarie,
      TAUX_URSSAF_2026.vieillessePlafonnee.employeur,
      true,
      "URSSAF_VIEILL_PLAF_2026",
    ),

    // Vieillesse déplafonnée
    ligne(
      "VIEILL_DEPLAF",
      "Assurance vieillesse déplafonnée",
      "assurance_vieillesse",
      "Urssaf",
      brutSoumis,
      "totalite",
      TAUX_URSSAF_2026.vieillesseDeplafonee.salarie,
      TAUX_URSSAF_2026.vieillesseDeplafonee.employeur,
      true,
      "URSSAF_VIEILL_DEPLAF_2026",
    ),

    // Allocations familiales
    ligne(
      "ALLOC_FAM_PAT",
      "Allocations familiales",
      "allocations_familiales",
      "Urssaf",
      brutSoumis,
      "totalite",
      TAUX_URSSAF_2026.allocationsFamiliales.salarie,
      TAUX_URSSAF_2026.allocationsFamiliales.employeur,
      false,
      "URSSAF_AF_2026",
    ),

    // Assurance chômage — plafonné 4 PASS
    ligne(
      "CHOMAGE_PAT",
      "Assurance chômage",
      "assurance_chomage",
      "Urssaf",
      plafond4Pass,
      "4PASS",
      TAUX_URSSAF_2026.assuranceChomage.salarie,
      TAUX_URSSAF_2026.assuranceChomage.employeur,
      false,
      "URSSAF_CHOMAGE_2026",
    ),

    // AGS — plafonné 4 PASS
    ligne(
      "AGS_PAT",
      "AGS (garantie des créances des salariés)",
      "ags",
      "Urssaf",
      plafond4Pass,
      "4PASS",
      TAUX_URSSAF_2026.ags.salarie,
      TAUX_URSSAF_2026.ags.employeur,
      false,
      "URSSAF_AGS_2026",
    ),

    // FNAL
    ...(estGrand
      ? [
          ligne(
            "FNAL_PAT",
            "FNAL (≥ 50 salariés — totalité)",
            "fnal",
            "Urssaf",
            brutSoumis,
            "totalite",
            TAUX_URSSAF_2026.fnalSuperieurOuEgal50.salarie,
            TAUX_URSSAF_2026.fnalSuperieurOuEgal50.employeur,
            false,
            "URSSAF_FNAL_50_2026",
          ),
        ]
      : [
          ligne(
            "FNAL_PAT",
            "FNAL (< 50 salariés — plafonné PASS)",
            "fnal",
            "Urssaf",
            Math.min(brutSoumis, pmssProratise),
            "PASS",
            TAUX_URSSAF_2026.fnalInferieur50.salarie,
            TAUX_URSSAF_2026.fnalInferieur50.employeur,
            false,
            "URSSAF_FNAL_INF50_2026",
          ),
        ]),

    // Contribution dialogue social
    ligne(
      "DIAL_SOC_PAT",
      "Contribution au dialogue social",
      "dialogue_social",
      "Urssaf",
      brutSoumis,
      "totalite",
      TAUX_URSSAF_2026.dialogueSocial.salarie,
      TAUX_URSSAF_2026.dialogueSocial.employeur,
      false,
      "URSSAF_DIAL_SOC_2026",
    ),

    // CSG déductible
    ligne(
      "CSG_DED_SAL",
      "CSG déductible du revenu imposable",
      "csg_deductible",
      "Urssaf",
      assietteCsg,
      "assietteCsg",
      TAUX_URSSAF_2026.csgDeductible.salarie,
      TAUX_URSSAF_2026.csgDeductible.employeur,
      true,
      "URSSAF_CSG_DED_2026",
    ),

    // CSG non déductible
    ligne(
      "CSG_NDED_SAL",
      "CSG non déductible du revenu imposable",
      "csg_non_deductible",
      "Urssaf",
      assietteCsg,
      "assietteCsg",
      TAUX_URSSAF_2026.csgNonDeductible.salarie,
      TAUX_URSSAF_2026.csgNonDeductible.employeur,
      false,
      "URSSAF_CSG_NDED_2026",
    ),

    // CRDS
    ligne(
      "CRDS_SAL",
      "CRDS",
      "crds",
      "Urssaf",
      assietteCsg,
      "assietteCsg",
      TAUX_URSSAF_2026.crds.salarie,
      TAUX_URSSAF_2026.crds.employeur,
      false,
      "URSSAF_CRDS_2026",
    ),

    // AT/MP
    ligne(
      "ATMP_PAT",
      "Accident du travail / maladie professionnelle",
      "at_mp",
      "Urssaf",
      brutSoumis,
      "totalite",
      0,
      entreprise.tauxATMP,
      false,
      "URSSAF_ATMP_2026",
    ),

    // Versement mobilité (si > 0)
    ...(entreprise.tauxMobilite && entreprise.tauxMobilite > 0
      ? [
          ligne(
            "MOBILITE_PAT",
            "Versement mobilité",
            "versement_mobilite",
            "Autorité organisatrice",
            brutSoumis,
            "totalite",
            0,
            entreprise.tauxMobilite,
            false,
            "MOBILITE_2026",
          ),
        ]
      : []),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Cotisations Agirc-Arrco
// ─────────────────────────────────────────────────────────────────────────────

function cotisationsArrco(
  a: AssiettesResult,
  salarié: SalarieInput,
): LigneCotisation[] {
  const { baseT1, baseT2, brutSoumis, pmssProratise } = a;
  const estCadre = salarié.statut === "cadre";
  const lignes: LigneCotisation[] = [];

  // T1
  if (baseT1 > 0) {
    lignes.push(
      ligne(
        "ARRCO_T1_SAL",
        "Retraite complémentaire Agirc-Arrco T1",
        "retraite_complementaire",
        "Agirc-Arrco",
        baseT1,
        "T1",
        TAUX_ARRCO_2026.t1.salarie,
        TAUX_ARRCO_2026.t1.employeur,
        true,
        "ARRCO_T1_2026",
      ),
      ligne(
        "CEG_T1",
        "Contribution d'équilibre généralisée T1",
        "ceg",
        "Agirc-Arrco",
        baseT1,
        "T1",
        TAUX_ARRCO_2026.cegT1.salarie,
        TAUX_ARRCO_2026.cegT1.employeur,
        true,
        "ARRCO_CEG_T1_2026",
      ),
    );
  }

  // T2
  if (baseT2 > 0) {
    lignes.push(
      ligne(
        "ARRCO_T2_SAL",
        "Retraite complémentaire Agirc-Arrco T2",
        "retraite_complementaire",
        "Agirc-Arrco",
        baseT2,
        "T2",
        TAUX_ARRCO_2026.t2.salarie,
        TAUX_ARRCO_2026.t2.employeur,
        true,
        "ARRCO_T2_2026",
      ),
      ligne(
        "CEG_T2",
        "Contribution d'équilibre généralisée T2",
        "ceg",
        "Agirc-Arrco",
        baseT2,
        "T2",
        TAUX_ARRCO_2026.cegT2.salarie,
        TAUX_ARRCO_2026.cegT2.employeur,
        true,
        "ARRCO_CEG_T2_2026",
      ),
    );
  }

  // CET — si rémunération > PASS
  if (brutSoumis > pmssProratise) {
    lignes.push(
      ligne(
        "CET",
        "Contribution d'équilibre technique (CET)",
        "cet",
        "Agirc-Arrco",
        brutSoumis,
        "totalite",
        TAUX_ARRCO_2026.cet.salarie,
        TAUX_ARRCO_2026.cet.employeur,
        true,
        "ARRCO_CET_2026",
      ),
    );
  }

  // APEC — cadres uniquement, assiette limitée à 4 PASS
  if (estCadre) {
    const assiette4Pass = Math.min(
      baseT1 + baseT2,
      4 * PARAMS_2026.passMensuel,
    );
    if (assiette4Pass > 0) {
      lignes.push(
        ligne(
          "APEC",
          "APEC (Association Pour l'Emploi des Cadres)",
          "apec",
          "APEC",
          assiette4Pass,
          "4PASS",
          TAUX_ARRCO_2026.apec.salarie,
          TAUX_ARRCO_2026.apec.employeur,
          true,
          "APEC_2026",
        ),
      );
    }
  }

  return lignes;
}

// ─────────────────────────────────────────────────────────────────────────────
// Point d'entrée public
// ─────────────────────────────────────────────────────────────────────────────

export function calcCotisations(
  assiettes: AssiettesResult,
  salarié: SalarieInput,
  entreprise: EntrepriseInput,
): LigneCotisation[] {
  return [
    ...cotisationsUrssaf(assiettes, entreprise),
    ...cotisationsArrco(assiettes, salarié),
  ];
}

/**
 * Registre des profils salariés spéciaux.
 *
 * Source de vérité pour tous les profils supportés par le moteur.
 * Les lots futurs (5–12) ajouteront leurs profils ici.
 *
 * Référence spec : Specifications Hors Perimetre Paie 2026.md §12.2 (table special_profiles)
 */

import type { SpecialProfile } from "./types";

export const PROFILE_REGISTRY = new Map<string, SpecialProfile>([
  // ── Régime général (Lots 0–4 — terminés) ────────────────────────────────
  [
    "regime_general",
    {
      code: "regime_general",
      label: "Régime général",
      description: "Salarié du secteur privé — régime général Urssaf, Agirc-Arrco",
    },
  ],
  [
    "apprentissage",
    {
      code: "apprentissage",
      label: "Apprentissage",
      parentProfile: "regime_general",
      description:
        "Contrat d'apprentissage — exonérations SS salariales, grille minimale légale",
    },
  ],
  [
    "contrat_pro",
    {
      code: "contrat_pro",
      label: "Contrat de professionnalisation",
      parentProfile: "regime_general",
      description:
        "Contrat pro — cotisations allégées, rémunération minimale légale",
    },
  ],
  [
    "stage",
    {
      code: "stage",
      label: "Stage",
      parentProfile: "regime_general",
      description:
        "Stagiaire — cotisations filtrées, seuil de gratification (Lot 0)",
    },
  ],

  // ── Lot 7 — BTP ──────────────────────────────────────────────────────────
  [
    "btp_ouvrier",
    {
      code: "btp_ouvrier",
      label: "Ouvrier BTP — caisse congés payés",
      description:
        "Affiliation caisse CP (Pro-BTP / CNETP) — provision CP interne neutralisée, contribution caisse",
    },
  ],

  // ── Lot 10 — Intermittents du spectacle ──────────────────────────────────
  [
    "intermittent_artiste",
    {
      code: "intermittent_artiste",
      label: "Intermittent du spectacle — artiste (annexe 8)",
      description:
        "Annexe 8 Unédic — cachets artiste, AFDAS, congés spectacle AUDIENS",
    },
  ],
  [
    "intermittent_technicien",
    {
      code: "intermittent_technicien",
      label: "Intermittent du spectacle — technicien (annexe 10)",
      description:
        "Annexe 10 Unédic — cachets technicien, taux chômage spécifiques",
    },
  ],

  // ── Lot 11 — Profils spéciaux ─────────────────────────────────────────────
  [
    "vrp_multicarte",
    {
      code: "vrp_multicarte",
      label: "VRP multicarte",
      description:
        "Multi-employeurs — abattement forfaitaire frais 30 % sur assiette SS",
    },
  ],
  [
    "journaliste",
    {
      code: "journaliste",
      label: "Journaliste professionnel",
      description:
        "Carte de presse — abattement fiscal spécifique 7 650 €/an, assiette SS inchangée",
    },
  ],
  [
    "marin",
    {
      code: "marin",
      label: "Marin — régime ENIM",
      description:
        "Établissement national des invalides de la marine — embarquement/débarquement",
    },
  ],

  // ── Lot 9 — Mobilité internationale ──────────────────────────────────────
  [
    "international_expatrie",
    {
      code: "international_expatrie",
      label: "Salarié expatrié",
      description:
        "Hors convention internationale — CFE, règles fiscales spécifiques, net garanti possible",
    },
  ],
  [
    "international_detache",
    {
      code: "international_detache",
      label: "Salarié détaché",
      description:
        "Maintien cotisations SS françaises, formulaire A1, convention européenne ou bilatérale",
    },
  ],
  [
    "international_impatie",
    {
      code: "international_impatie",
      label: "Salarié impatrié",
      description:
        "Régime fiscal impatrié, cotisations SS françaises maintenues",
    },
  ],
  [
    "international_split",
    {
      code: "international_split",
      label: "Split payroll",
      description:
        "Rémunération ventilée entre paie France et paie locale (plusieurs devises)",
    },
  ],

  // ── Lot 12 — Secteur public ───────────────────────────────────────────────
  [
    "public_fpe_titulaire",
    {
      code: "public_fpe_titulaire",
      label: "Fonctionnaire FPE titulaire",
      description:
        "Pension civile, RAFP — pas d'Agirc-Arrco, pas de cotisation chômage",
    },
  ],
  [
    "public_fpt_titulaire",
    {
      code: "public_fpt_titulaire",
      label: "Fonctionnaire FPT titulaire",
      description:
        "CNRACL (30,65 % employeur), RAFP — pas d'Agirc-Arrco ni chômage",
    },
  ],
  [
    "public_fph_titulaire",
    {
      code: "public_fph_titulaire",
      label: "Fonctionnaire FPH titulaire",
      description:
        "CNRACL, RAFP — pas d'Agirc-Arrco ni chômage",
    },
  ],
  [
    "public_contractuel",
    {
      code: "public_contractuel",
      label: "Agent public contractuel",
      description:
        "IRCANTEC (taux spécifiques TA/TB), cotisation chômage Unédic applicable",
    },
  ],
]);

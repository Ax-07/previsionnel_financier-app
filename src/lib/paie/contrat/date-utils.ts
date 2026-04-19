/**
 * Utilitaires de calcul de dates pour la simulation multi-mois.
 *
 * Fonctions pures pour :
 * - calculer les jours ouvrés d'un mois (hors week-ends et jours fériés français)
 * - déterminer les mois couverts par une période de contrat
 * - calculer le prorata d'un mois partiel (entrée/sortie en cours de mois)
 * - formater les labels de mois en français
 */

// ─────────────────────────────────────────────────────────────────────────────
// Jours fériés français
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule la date de Pâques pour une année donnée (algorithme de Meeus/Jones/Butcher).
 */
function datePaques(annee: number): Date {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(annee, mois - 1, jour);
}

/**
 * Retourne la liste des jours fériés français pour une année donnée.
 * Inclut les jours fériés fixes et les jours mobiles (Pâques, Ascension, Pentecôte).
 */
export function joursFeries(annee: number): Date[] {
  const paques = datePaques(annee);
  const lundiPaques = new Date(paques);
  lundiPaques.setDate(paques.getDate() + 1);
  const ascension = new Date(paques);
  ascension.setDate(paques.getDate() + 39);
  const lundiPentecote = new Date(paques);
  lundiPentecote.setDate(paques.getDate() + 50);

  return [
    new Date(annee, 0, 1),   // Jour de l'An
    lundiPaques,              // Lundi de Pâques
    new Date(annee, 4, 1),   // Fête du Travail
    new Date(annee, 4, 8),   // Victoire 1945
    ascension,                // Ascension
    lundiPentecote,           // Lundi de Pentecôte
    new Date(annee, 6, 14),  // Fête nationale
    new Date(annee, 7, 15),  // Assomption
    new Date(annee, 10, 1),  // Toussaint
    new Date(annee, 10, 11), // Armistice
    new Date(annee, 11, 25), // Noël
  ];
}

/** Crée une clé YYYY-MM-DD pour comparaison rapide */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Jours ouvrés
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le nombre de jours ouvrés (lundi–vendredi, hors fériés) pour un mois complet.
 *
 * @param annee - Année (ex. 2026)
 * @param mois  - Mois (0-based : 0 = janvier, 11 = décembre)
 */
export function joursOuvresMois(annee: number, mois: number): number {
  const feries = new Set(joursFeries(annee).map(dateKey));
  const dernierJour = new Date(annee, mois + 1, 0).getDate();
  let count = 0;
  for (let j = 1; j <= dernierJour; j++) {
    const d = new Date(annee, mois, j);
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5 && !feries.has(dateKey(d))) {
      count++;
    }
  }
  return count;
}

/**
 * Calcule le nombre de jours ouvrés entre deux dates (incluses).
 *
 * @param debut - Date de début (ISO 8601)
 * @param fin   - Date de fin (ISO 8601)
 */
export function joursOuvresEntre(debut: string, fin: string): number {
  const dDebut = parseDate(debut);
  const dFin = parseDate(fin);
  if (dDebut > dFin) return 0;

  const annees = new Set<number>();
  const cursor = new Date(dDebut);
  while (cursor <= dFin) {
    annees.add(cursor.getFullYear());
    cursor.setDate(cursor.getDate() + 1);
  }

  const feries = new Set<string>();
  for (const a of annees) {
    for (const f of joursFeries(a)) {
      feries.add(dateKey(f));
    }
  }

  let count = 0;
  const c = new Date(dDebut);
  while (c <= dFin) {
    const dow = c.getDay();
    if (dow >= 1 && dow <= 5 && !feries.has(dateKey(c))) {
      count++;
    }
    c.setDate(c.getDate() + 1);
  }
  return count;
}

/**
 * Calcule le nombre de jours ouvrables (lundi–samedi, hors fériés) pour un mois complet.
 * Utilisé pour le calcul d'acquisition des congés payés.
 *
 * @param annee - Année (ex. 2026)
 * @param mois  - Mois (0-based : 0 = janvier, 11 = décembre)
 */
export function joursOuvrablesMois(annee: number, mois: number): number {
  const feries = new Set(joursFeries(annee).map(dateKey));
  const dernierJour = new Date(annee, mois + 1, 0).getDate();
  let count = 0;
  for (let j = 1; j <= dernierJour; j++) {
    const d = new Date(annee, mois, j);
    const dow = d.getDay();
    if (dow >= 1 && dow <= 6 && !feries.has(dateKey(d))) {
      count++;
    }
  }
  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mois couverts par une période
// ─────────────────────────────────────────────────────────────────────────────

/** Descripteur d'un mois dans la période de contrat */
export interface MoisContrat {
  /** Clé temporelle (ex. "2026-03") */
  cle: string;
  /** Année */
  annee: number;
  /** Mois (0-based) */
  mois: number;
  /** Premier mois du contrat */
  estEntree: boolean;
  /** Dernier mois du contrat */
  estSortie: boolean;
  /** Date d'entrée effective dans ce mois (1er jour ou date d'entrée contrat) */
  dateDebutMois: string;
  /** Date de sortie effective dans ce mois (dernier jour ouvré ou date de sortie contrat) */
  dateFinMois: string;
  /** Jours ouvrés travaillés dans ce mois */
  joursOuvresTravailles: number;
  /** Jours ouvrés totaux du mois calendaire */
  joursOuvresDuMois: number;
  /** Facteur de prorata (joursOuvresTravailles / joursOuvresDuMois) */
  facteurProrata: number;
}

/**
 * Décompose une période de contrat en mois individuels avec prorata.
 *
 * @param dateDebut - Date de début du contrat (ISO 8601 : "YYYY-MM-DD")
 * @param dateFin   - Date de fin du contrat (ISO 8601 : "YYYY-MM-DD")
 * @returns Liste ordonnée des mois couverts avec les métadonnées de prorata
 */
export function decomposerPeriode(dateDebut: string, dateFin: string): MoisContrat[] {
  const dDebut = parseDate(dateDebut);
  const dFin = parseDate(dateFin);

  if (dDebut > dFin) return [];

  const moisList: MoisContrat[] = [];
  const cursor = new Date(dDebut.getFullYear(), dDebut.getMonth(), 1);
  const finMoisFin = new Date(dFin.getFullYear(), dFin.getMonth(), 1);

  while (cursor <= finMoisFin) {
    const annee = cursor.getFullYear();
    const mois = cursor.getMonth();
    const dernierJourMois = new Date(annee, mois + 1, 0).getDate();

    const estEntree = annee === dDebut.getFullYear() && mois === dDebut.getMonth();
    const estSortie = annee === dFin.getFullYear() && mois === dFin.getMonth();

    const jourDebut = estEntree ? dDebut.getDate() : 1;
    const jourFin = estSortie ? dFin.getDate() : dernierJourMois;

    const dateDebutMois = formatISO(annee, mois, jourDebut);
    const dateFinMois = formatISO(annee, mois, jourFin);

    const joursOuvresDuMois = joursOuvresMois(annee, mois);
    const joursOuvresTravailles = joursOuvresEntre(dateDebutMois, dateFinMois);
    const facteurProrata = joursOuvresDuMois > 0
      ? Math.min(joursOuvresTravailles / joursOuvresDuMois, 1)
      : 0;

    const cle = `${annee}-${String(mois + 1).padStart(2, "0")}`;

    moisList.push({
      cle,
      annee,
      mois,
      estEntree,
      estSortie,
      dateDebutMois,
      dateFinMois,
      joursOuvresTravailles,
      joursOuvresDuMois,
      facteurProrata,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return moisList;
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatage
// ─────────────────────────────────────────────────────────────────────────────

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
] as const;

/**
 * Formate un mois pour l'affichage (ex. "Janvier 2026").
 *
 * @param annee - Année
 * @param mois  - Mois (0-based)
 */
export function labelMois(annee: number, mois: number): string {
  return `${MOIS_FR[mois]} ${annee}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────────────────────────────────────

/** Parse une date ISO "YYYY-MM-DD" en objet Date local (sans décalage UTC) */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Formate une date en ISO "YYYY-MM-DD" */
function formatISO(annee: number, mois: number, jour: number): string {
  return `${annee}-${String(mois + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

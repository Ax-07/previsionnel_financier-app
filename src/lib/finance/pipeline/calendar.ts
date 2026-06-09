/**
 * Canonical fiscal calendar for the finance engine.
 *
 * Priority:
 * 1. ParametresEntreprise.dateDebutExerciceN + exercices
 * 2. Legacy Dossier.dateDemarrage + 3 x 12 months fallback
 *
 * The v1 model remains capped to y1/y2/y3 because business data is still
 * stored as montantN/montantN1/montantN2.
 */

import type { YearKey } from "@/lib/finance/types/series";

export const YEAR_KEYS = ["y1", "y2", "y3"] as const satisfies readonly YearKey[];

const DEFAULT_EXERCISE_MONTHS = 12;
const MAX_SUPPORTED_EXERCISES = 3;

export interface CalendarExerciceInput {
  dateCloture: Date | string;
  duree?: number | null;
  ordre?: number | null;
  annee?: number | null;
}

export interface ScenarioCalendarParams {
  dateDebutExerciceN?: Date | string | null;
  dureePrevisionnelle?: number | null;
  exercices?: CalendarExerciceInput[] | null;
}

export interface BuildScenarioCalendarInput {
  dossierDateDemarrage: Date | string;
  dossierDureeProjection?: number | null;
  parametres?: ScenarioCalendarParams | null;
}

export interface ExerciceHelpers {
  /** First day after exercice N. */
  exBorne1: Date;
  /** First day after exercice N+1. */
  exBorne2: Date;
  /** First day after exercice N+2. */
  exBorne3: Date;
  toExerciceKey: (date: Date | string) => YearKey | null;
  pFin: number;
  pDeb: number;
}

export interface ScenarioCalendarExercise {
  key: YearKey;
  ordre: number;
  dateDebut: Date;
  dateCloture: Date;
  duree: number;
  annee: number;
  label: string;
  isFallback: boolean;
}

export interface ScenarioCalendar extends ExerciceHelpers {
  source: "parametres" | "dossier";
  dateDebut: Date;
  exercices: readonly ScenarioCalendarExercise[];
  dureesMois: Record<YearKey, number>;
  bornes: readonly [Date, Date, Date, Date];
  yearStarts: readonly [Date, Date, Date, Date];
  yearLabels: Record<YearKey, string>;
  monthLabels: Record<YearKey, string[]>;
  dureeProjection: 1 | 2 | 3;
  dateToSlot: (date: Date | string) => { yk: YearKey | null; mi: number };
}

/** Labels used by monthly tables. */
export const FR_MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aou",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function parseDateLocal(value: Date | string): Date {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const raw = String(value);
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(raw);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function cloneDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const result = cloneDate(d);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
}

function clampProjection(value: number | null | undefined): 1 | 2 | 3 {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(MAX_SUPPORTED_EXERCISES, Math.max(1, Math.trunc(n))) as 1 | 2 | 3;
}

function monthsInclusive(start: Date, close: Date): number {
  return Math.max(
    1,
    (close.getFullYear() - start.getFullYear()) * 12 +
      (close.getMonth() - start.getMonth()) +
      1,
  );
}

function labelExercise(start: Date, close: Date): string {
  const startYear = start.getFullYear();
  const closeYear = close.getFullYear();
  return startYear === closeYear ? `${closeYear}` : `${startYear}\u2013${closeYear}`;
}

function buildMonthLabelsFor(start: Date, nMois: number): string[] {
  return Array.from({ length: nMois }, (_, i) => {
    const m = (start.getMonth() + i) % 12;
    const y = start.getFullYear() + Math.floor((start.getMonth() + i) / 12);
    return `${FR_MONTHS[m]} ${y}`;
  });
}

/**
 * Legacy label helper kept for compatibility with existing tests/imports.
 * - moisDebut = 0 -> "2026"
 * - moisDebut > 0 -> "2026-2027" with an en dash
 */
export const fmtExercice = (start: number, moisDebut: number): string =>
  moisDebut === 0 ? `${start}` : `${start}\u2013${start + 1}`;

function sortExercices(
  exercices: readonly CalendarExerciceInput[] | null | undefined,
): CalendarExerciceInput[] {
  return [...(exercices ?? [])]
    .filter((ex) => Boolean(ex?.dateCloture))
    .sort((a, b) => {
      const oa = a.ordre ?? Number.MAX_SAFE_INTEGER;
      const ob = b.ordre ?? Number.MAX_SAFE_INTEGER;
      if (oa !== ob) return oa - ob;
      return parseDateLocal(a.dateCloture).getTime() - parseDateLocal(b.dateCloture).getTime();
    })
    .slice(0, MAX_SUPPORTED_EXERCISES);
}

export function buildScenarioCalendar(input: BuildScenarioCalendarInput): ScenarioCalendar {
  const rawExercices = sortExercices(input.parametres?.exercices);
  const hasParamCalendar =
    Boolean(input.parametres?.dateDebutExerciceN) && rawExercices.length > 0;

  const source: ScenarioCalendar["source"] = hasParamCalendar ? "parametres" : "dossier";
  const dateDebut = parseDateLocal(
    hasParamCalendar
      ? input.parametres!.dateDebutExerciceN!
      : input.dossierDateDemarrage,
  );
  const dureeProjection = hasParamCalendar
    ? clampProjection(rawExercices.length)
    : clampProjection(input.dossierDureeProjection ?? 3);

  const exercices: ScenarioCalendarExercise[] = [];
  let currentStart = cloneDate(dateDebut);

  for (let i = 0; i < MAX_SUPPORTED_EXERCISES; i++) {
    const key = YEAR_KEYS[i]!;
    const raw = hasParamCalendar ? rawExercices[i] : undefined;
    const rawCloture = raw?.dateCloture ? parseDateLocal(raw.dateCloture) : null;
    const rawDuree = Number(raw?.duree ?? 0);
    const dateCloture =
      rawCloture ??
      addDays(addMonths(currentStart, DEFAULT_EXERCISE_MONTHS), -1);
    const duree =
      Number.isFinite(rawDuree) && rawDuree > 0
        ? Math.trunc(rawDuree)
        : monthsInclusive(currentStart, dateCloture);

    exercices.push({
      key,
      ordre: i + 1,
      dateDebut: cloneDate(currentStart),
      dateCloture,
      duree,
      annee: raw?.annee ?? dateCloture.getFullYear(),
      label: labelExercise(currentStart, dateCloture),
      isFallback: !raw,
    });

    currentStart = addDays(dateCloture, 1);
  }

  const bornes = [
    cloneDate(exercices[0]!.dateDebut),
    addDays(exercices[0]!.dateCloture, 1),
    addDays(exercices[1]!.dateCloture, 1),
    addDays(exercices[2]!.dateCloture, 1),
  ] as const;

  function toExerciceKey(date: Date | string): YearKey | null {
    const d = parseDateLocal(date);
    for (let i = 0; i < MAX_SUPPORTED_EXERCISES; i++) {
      if (d >= bornes[i]! && d < bornes[i + 1]!) return YEAR_KEYS[i]!;
    }
    return null;
  }

  function dateToSlotForCalendar(date: Date | string): { yk: YearKey | null; mi: number } {
    return dateToSlot(parseDateLocal(date), bornes);
  }

  const moisDebut = dateDebut.getMonth();
  const pFin = moisDebut === 0 ? 0 : moisDebut / 12;
  const pDeb = 1 - pFin;

  const dureesMois = {
    y1: exercices[0]!.duree,
    y2: exercices[1]!.duree,
    y3: exercices[2]!.duree,
  };

  const yearLabels = {
    y1: exercices[0]!.label,
    y2: exercices[1]!.label,
    y3: exercices[2]!.label,
  };

  const monthLabels = {
    y1: buildMonthLabelsFor(exercices[0]!.dateDebut, dureesMois.y1),
    y2: buildMonthLabelsFor(exercices[1]!.dateDebut, dureesMois.y2),
    y3: buildMonthLabelsFor(exercices[2]!.dateDebut, dureesMois.y3),
  };

  return {
    source,
    dateDebut,
    exercices,
    dureesMois,
    bornes,
    yearStarts: bornes,
    yearLabels,
    monthLabels,
    dureeProjection,
    exBorne1: bornes[1],
    exBorne2: bornes[2],
    exBorne3: bornes[3],
    toExerciceKey,
    dateToSlot: dateToSlotForCalendar,
    pFin,
    pDeb,
  };
}

/**
 * Compatibility wrapper for older callers. New code should prefer
 * buildScenarioCalendar().
 */
export function makeExerciceHelpers(
  dateDemarrage: Date,
  exercices?: Array<{ dateCloture: Date | string; duree?: number | null; ordre?: number | null; annee?: number | null }>,
): ExerciceHelpers {
  const calendar = buildScenarioCalendar({
    dossierDateDemarrage: dateDemarrage,
    dossierDureeProjection: 3,
    parametres: exercices?.length
      ? { dateDebutExerciceN: dateDemarrage, exercices }
      : null,
  });

  return {
    exBorne1: calendar.exBorne1,
    exBorne2: calendar.exBorne2,
    exBorne3: calendar.exBorne3,
    toExerciceKey: calendar.toExerciceKey,
    pFin: calendar.pFin,
    pDeb: calendar.pDeb,
  };
}

export interface TemporelCtx {
  anneeDebut: number;
  moisDebut: number;
  yearStarts: readonly [Date, Date, Date, Date];
  isFranchise: boolean;
  dureesMois: Record<YearKey, number>;
  yearLabels: Record<YearKey, string>;
}

export function buildTemporelCtx(
  dateOrCalendar: Date | ScenarioCalendar,
  isFranchise: boolean,
): TemporelCtx {
  const calendar =
    dateOrCalendar instanceof Date
      ? buildScenarioCalendar({ dossierDateDemarrage: dateOrCalendar, dossierDureeProjection: 3 })
      : dateOrCalendar;

  return {
    anneeDebut: calendar.dateDebut.getFullYear(),
    moisDebut: calendar.dateDebut.getMonth(),
    yearStarts: calendar.yearStarts,
    isFranchise,
    dureesMois: calendar.dureesMois,
    yearLabels: calendar.yearLabels,
  };
}

/**
 * Map a date to a fiscal slot (year key + zero-based month index).
 * Returns { yk: null, mi: -1 } outside the three projected exercises.
 */
export function dateToSlot(
  d: Date,
  yearStarts: TemporelCtx["yearStarts"],
): { yk: YearKey | null; mi: number } {
  for (let i = 0; i < MAX_SUPPORTED_EXERCISES; i++) {
    if (d >= yearStarts[i]! && d < yearStarts[i + 1]!) {
      const dy = d.getFullYear() - yearStarts[i]!.getFullYear();
      const dm = d.getMonth() - yearStarts[i]!.getMonth();
      return { yk: YEAR_KEYS[i]!, mi: Math.max(0, dy * 12 + dm) };
    }
  }
  return { yk: null, mi: -1 };
}

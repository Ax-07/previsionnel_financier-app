export type ExerciceKey = "N" | "N1" | "N2";

export interface ExerciceCalendrierEntry {
  dateCloture: string;
  duree: number;
  annee: number;
}

export interface ExerciceConfig {
  startMonth: number;
  startYear: number;
  duree: number;
}

export type ExercicesConfig = Record<ExerciceKey, ExerciceConfig>;

export const EXERCICE_KEYS = ["N", "N1", "N2"] as const satisfies readonly ExerciceKey[];

const MONTH_LABELS = [
  "Jan.",
  "Fev.",
  "Mar.",
  "Avr.",
  "Mai",
  "Juin",
  "Juil.",
  "Aou.",
  "Sep.",
  "Oct.",
  "Nov.",
  "Dec.",
] as const;

function parseLocalDate(value: string | undefined): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

function addOneDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next;
}

function normalizeDuree(value: number | undefined, fallback = 12): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(24, Math.max(1, Math.round(value ?? fallback)));
}

export function buildMoisLabels(
  startMonth: number,
  startYear: number,
  duree: number,
): readonly string[] {
  const safeDuree = normalizeDuree(duree);
  return Array.from({ length: safeDuree }, (_, i) => {
    const monthIndex = (startMonth + i) % 12;
    const yearOffset = Math.floor((startMonth + i) / 12);
    const yy = String((startYear + yearOffset) % 100).padStart(2, "0");
    return `${MONTH_LABELS[monthIndex]} ${yy}`;
  });
}

export function buildEvenSaisonnalite(duree: number): number[] {
  const safeDuree = normalizeDuree(duree);
  const value = +(100 / safeDuree).toFixed(2);
  const last = +(100 - value * (safeDuree - 1)).toFixed(2);
  return [...Array(safeDuree - 1).fill(value), last];
}

export function buildExercicesConfig(
  dateDebutN: string | undefined,
  exercices: ExerciceCalendrierEntry[] | undefined,
): ExercicesConfig {
  const fallbackStart = new Date(new Date().getFullYear(), 0, 1);
  const startN = parseLocalDate(dateDebutN) ?? fallbackStart;
  const starts: Date[] = [startN];
  const durations = EXERCICE_KEYS.map((_, index) => normalizeDuree(exercices?.[index]?.duree));

  for (let index = 1; index < EXERCICE_KEYS.length; index++) {
    const previousCloture = parseLocalDate(exercices?.[index - 1]?.dateCloture);
    starts[index] = previousCloture
      ? addOneDay(previousCloture)
      : addMonths(starts[index - 1]!, durations[index - 1]!);
  }

  return {
    N: {
      startMonth: starts[0]!.getMonth(),
      startYear: starts[0]!.getFullYear(),
      duree: durations[0]!,
    },
    N1: {
      startMonth: starts[1]!.getMonth(),
      startYear: starts[1]!.getFullYear(),
      duree: durations[1]!,
    },
    N2: {
      startMonth: starts[2]!.getMonth(),
      startYear: starts[2]!.getFullYear(),
      duree: durations[2]!,
    },
  };
}

export function resampleSaisonnalite(source: number[], targetLen: number): number[] {
  const safeTargetLen = normalizeDuree(targetLen);
  if (safeTargetLen === source.length) return [...source];
  if (source.length === 0) return buildEvenSaisonnalite(safeTargetLen);

  const result: number[] = [];
  const sourceLength = source.length;
  for (let i = 0; i < safeTargetLen; i++) {
    const ratio = (i / safeTargetLen) * sourceLength;
    const lo = Math.floor(ratio);
    const hi = Math.min(lo + 1, sourceLength - 1);
    const frac = ratio - lo;
    result.push(source[lo]! * (1 - frac) + source[hi]! * frac);
  }

  const total = result.reduce((sum, value) => sum + value, 0);
  if (total === 0) return buildEvenSaisonnalite(safeTargetLen);
  return result.map((value) => +((value / total) * 100).toFixed(4));
}

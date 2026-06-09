export interface DefaultExercice {
  dateCloture: Date;
  duree: number;
  annee: number;
}

export interface DefaultExerciceForm {
  dateCloture: string;
  duree: number;
  annee: number;
}

export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function diffMois(from: Date, to: Date): number {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    1;
  return Math.max(1, months);
}

function normalizeDureeProjection(value: number): 1 | 2 | 3 {
  return Math.min(3, Math.max(1, Math.round(value))) as 1 | 2 | 3;
}

export function buildDefaultExercices(
  dateDebut: string,
  dureeProjection: number,
): DefaultExercice[] {
  const debut = parseDateInput(dateDebut);
  const duree = normalizeDureeProjection(dureeProjection);

  return Array.from({ length: duree }, (_, index) => {
    const annee = debut.getFullYear() + index;
    const from = index === 0 ? debut : new Date(debut.getFullYear() + index, 0, 1);
    const cloture = new Date(annee, 11, 31);

    return {
      dateCloture: cloture,
      duree: diffMois(from, cloture),
      annee,
    };
  });
}

export function buildDefaultExercicesForm(
  dateDebut: string,
  dureeProjection: number,
): DefaultExerciceForm[] {
  return buildDefaultExercices(dateDebut, dureeProjection).map((exercice) => ({
    dateCloture: toDateInputValue(exercice.dateCloture),
    duree: exercice.duree,
    annee: exercice.annee,
  }));
}

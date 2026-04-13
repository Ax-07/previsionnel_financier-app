/**
 * Moteur de calcul des amortissements
 * Supporte les modes linéaire et dégressif (coefficients fiscaux France).
 */

import type { LigneAmortissement } from "@/lib/schemas/investissement";

function coefficientDegressif(duree: number): number {
  // Cherche le coefficient en parcourant les seuils
  if (duree <= 4) return 1.25;
  if (duree <= 6) return 1.75;
  return 2.25;
}

/**
 * Calcule le plan d'amortissement linéaire.
 * La dotation est proratisée pour l'année d'acquisition (au mois près).
 */
export function calculerAmortissementLineaire(params: {
  montantHT: number;
  duree: number;
  dateAcquisition: Date;
  anneeDebut: number; // Année de départ du prévisionnel (ex : 2025)
  nbAnnees: number;   // Nombre d'années du prévisionnel (3, 4 ou 5)
}): LigneAmortissement[] {
  const { montantHT, duree, dateAcquisition, anneeDebut, nbAnnees } = params;
  const dotationAnnuelle = montantHT / duree;

  // Prorata de l'année d'acquisition (mois restants / 12)
  const moisAcquisition = dateAcquisition.getMonth() + 1; // 1-12
  const prorataAcquisition = (13 - moisAcquisition) / 12;

  const lignes: LigneAmortissement[] = [];
  let amortissementCumule = 0;

  for (let i = 0; i < nbAnnees; i++) {
    const anneeCalendrier = anneeDebut + i;
    const anneeRelative    = anneeCalendrier - dateAcquisition.getFullYear();

    if (anneeRelative < 0) {
      // L'immobilisation n'est pas encore acquise
      lignes.push({
        annee: anneeCalendrier,
        valeurBruteDebut: montantHT,
        dotationAnnuelle: 0,
        amortissementCumule: 0,
        valeurNette: montantHT,
      });
      continue;
    }

    const anneeDuContrat = anneeRelative + 1; // 1-based

    let dotation = 0;
    if (anneeDuContrat === 1) {
      dotation = dotationAnnuelle * prorataAcquisition;
    } else if (anneeDuContrat <= duree) {
      dotation = dotationAnnuelle;
    } else if (anneeDuContrat === duree + 1 && prorataAcquisition < 1) {
      // Solde résiduel si acquisition faite en cours d'année
      const alreadyAmortized = dotationAnnuelle * prorataAcquisition + dotationAnnuelle * (duree - 1);
      dotation = Math.max(0, montantHT - alreadyAmortized);
    }

    // Arrondir à 2 décimales pour éviter les flottants parasites
    dotation = Math.round(dotation * 100) / 100;
    const valeurBruteDebut = montantHT;
    amortissementCumule = Math.min(
      Math.round((amortissementCumule + dotation) * 100) / 100,
      montantHT
    );

    lignes.push({
      annee: anneeCalendrier,
      valeurBruteDebut,
      dotationAnnuelle: dotation,
      amortissementCumule,
      valeurNette: Math.max(0, Math.round((montantHT - amortissementCumule) * 100) / 100),
    });
  }

  return lignes;
}

/**
 * Calcule le plan d'amortissement dégressif (méthode fiscale française).
 * Bascule automatiquement en linéaire quand la dotation dégressive
 * devient inférieure à la dotation linéaire résiduelle.
 */
export function calculerAmortissementDegressif(params: {
  montantHT: number;
  duree: number;
  dateAcquisition: Date;
  anneeDebut: number;
  nbAnnees: number;
}): LigneAmortissement[] {
  const { montantHT, duree, dateAcquisition, anneeDebut, nbAnnees } = params;
  const coefficient = coefficientDegressif(duree);
  const tauxLineaire = 1 / duree;
  const tauxDegressif = tauxLineaire * coefficient;

  const moisAcquisition = dateAcquisition.getMonth() + 1;
  const prorataAcquisition = (13 - moisAcquisition) / 12;

  const lignes: LigneAmortissement[] = [];
  let valeurResiduelle = montantHT;
  let anneesRestantes  = duree;

  for (let i = 0; i < nbAnnees; i++) {
    const anneeCalendrier = anneeDebut + i;
    const anneeRelative   = anneeCalendrier - dateAcquisition.getFullYear();

    if (anneeRelative < 0 || valeurResiduelle <= 0) {
      lignes.push({
        annee: anneeCalendrier,
        valeurBruteDebut: montantHT,
        dotationAnnuelle: 0,
        amortissementCumule: montantHT - valeurResiduelle,
        valeurNette: valeurResiduelle,
      });
      continue;
    }

    const anneeDuContrat = anneeRelative + 1;

    // Dotation dégressive
    let dotationDeg = valeurResiduelle * tauxDegressif;
    // Prorata l'année d'acquisition (affecte uniquement la dotation, pas le décompte des années)
    if (anneeDuContrat === 1) {
      dotationDeg *= prorataAcquisition;
    }

    // Dotation linéaire résiduelle (sur années restantes)
    // anneesRestantes décrémente toujours de 1 entier pour que la bascule
    // linéaire se produise au bon moment et que sum(dotations) === montantHT
    const dotationLin = anneesRestantes > 0 ? valeurResiduelle / anneesRestantes : 0;

    // Bascule vers linéaire si avantageux
    let dotation = dotationDeg >= dotationLin ? dotationDeg : dotationLin;
    dotation = Math.min(dotation, valeurResiduelle);
    dotation = Math.round(dotation * 100) / 100;

    valeurResiduelle = Math.max(0, Math.round((valeurResiduelle - dotation) * 100) / 100);
    anneesRestantes -= 1; // toujours 1, jamais prorataAcquisition

    lignes.push({
      annee: anneeCalendrier,
      valeurBruteDebut: montantHT,
      dotationAnnuelle: dotation,
      amortissementCumule: Math.round((montantHT - valeurResiduelle) * 100) / 100,
      valeurNette: valeurResiduelle,
    });
  }

  return lignes;
}

/**
 * Point d'entrée unique : délègue selon le mode d'amortissement.
 * Retourne un tableau vide si le mode est AUCUN.
 */
export function calculerPlanAmortissement(params: {
  montantHT: number;
  duree: number;
  mode: "AUCUN" | "LINEAIRE" | "DEGRESSIF";
  dateAcquisition: Date;
  anneeDebut: number;
  nbAnnees: number;
}): LigneAmortissement[] {
  if (params.mode === "AUCUN") return [];

  if (params.mode === "DEGRESSIF") {
    return calculerAmortissementDegressif({
      montantHT: params.montantHT,
      duree: params.duree,
      dateAcquisition: params.dateAcquisition,
      anneeDebut: params.anneeDebut,
      nbAnnees: params.nbAnnees,
    });
  }

  return calculerAmortissementLineaire({
    montantHT: params.montantHT,
    duree: params.duree,
    dateAcquisition: params.dateAcquisition,
    anneeDebut: params.anneeDebut,
    nbAnnees: params.nbAnnees,
  });
}

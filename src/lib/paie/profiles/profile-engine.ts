/**
 * ProfileEngine — qualification du régime réglementaire du salarié.
 *
 * Étape 1 du pipeline simulate() (spec §13).
 * Détermine le SpecialProfile effectif à partir des paramètres d'entrée.
 * Garantit la compatibilité ascendante avec les Lots 0–4.
 */

import type { SalarieInput } from "@/lib/paie/types";
import type { ProfileCode, SpecialProfile } from "./types";
import { PROFILE_REGISTRY } from "./registry";

export class ProfileEngine {
  /**
   * Résout le profil actif pour un salarié donné.
   *
   * Ordre de priorité :
   *   1. `profileCode` explicitement fourni dans SalarieInput (Lot P — extension)
   *   2. Déduction automatique depuis `typeContrat` (compatibilité ascendante Lots 0–4)
   *   3. Fallback : régime général
   */
  static resolve(salarié: SalarieInput): SpecialProfile {
    // 1. Profil explicite (lots futurs 5–12)
    const { profileCode } = salarié;
    if (profileCode) {
      const found = PROFILE_REGISTRY.get(profileCode);
      if (found) return found;
      // Profil inconnu : log en dev, fallback gracieux
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[ProfileEngine] ProfileCode inconnu : "${profileCode}" — fallback regime_general`,
        );
      }
    }

    // 2. Déduction depuis typeContrat (backwards compat Lots 0–4)
    const fromContrat = ProfileEngine.fromTypeContrat(salarié);
    if (fromContrat) {
      const found = PROFILE_REGISTRY.get(fromContrat);
      if (found) return found;
    }

    // 3. Fallback régime général
    return PROFILE_REGISTRY.get("regime_general")!;
  }

  /**
   * Détermine le ProfileCode depuis typeContrat pour la compatibilité ascendante.
   * Retourne null si le typeContrat ne correspond à aucun profil spécifique.
   */
  static fromTypeContrat(salarié: SalarieInput): ProfileCode | null {
    switch (salarié.typeContrat) {
      case "apprentissage":
        return "apprentissage";
      case "contrat_pro":
        return "contrat_pro";
      case "stage":
        return "stage";
      case "CDI":
      case "CDD":
        return "regime_general";
      default:
        return null;
    }
  }

  /**
   * Vérifie si un profil donné est actif ou hérite d'un profil parent.
   *
   * @param profile  - Profil à vérifier
   * @param targetCode - Code à tester
   */
  static isOrInherits(profile: SpecialProfile, targetCode: ProfileCode): boolean {
    if (profile.code === targetCode) return true;
    if (profile.parentProfile) {
      const parent = PROFILE_REGISTRY.get(profile.parentProfile);
      if (parent) return ProfileEngine.isOrInherits(parent, targetCode);
    }
    return false;
  }
}

/**
 * Barrel d'enregistrement des conventions collectives (Lot 6).
 *
 * Importer ce module déclenche l'auto-enregistrement de tous les IDCC
 * via `registerConvention()` → `ConventionRuleResolver` est prêt.
 *
 * Usage :
 *   import "@/lib/paie/conventions";
 */

// ── Enregistrement automatique de chaque IDCC à l'import ──────────────────
import "./idcc/hcr-1979";
import "./idcc/syntec-1486";
import "./idcc/restauration-coll-1266";
import "./idcc/proprete-3043";
import "./idcc/aide-domicile-2941";
import "./idcc/btp-1597";
import "./idcc/commerce-1245";
import "./idcc/metallurgie-3248";
import "./idcc/securite-privee-1351";
import "./idcc/transport-16";

// ── Ré-export public du catalogue ──────────────────────────────────────────
export { CONVENTION_CATALOG } from "./catalog";
export type { ConventionMetadata } from "./types";

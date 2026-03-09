-- CreateEnum
CREATE TYPE "FrequenceCA" AS ENUM ('JOURNALIER', 'HEBDOMADAIRE', 'MENSUEL', 'TRIMESTRIEL', 'ANNUEL', 'PONCTUEL');

-- CreateEnum
CREATE TYPE "TypeActivite" AS ENUM ('VENTE_MARCHANDISES', 'PRODUCTION_VENDUE', 'PRESTATION_SERVICES', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeAction" AS ENUM ('CREATION', 'MODIFICATION', 'SUPPRESSION', 'DUPLICATION', 'EXPORT', 'VALIDATION', 'INVITATION', 'CONNEXION');

-- CreateEnum
CREATE TYPE "TypeExport" AS ENUM ('PDF', 'EXCEL', 'CSV');

-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('ADMIN_CABINET', 'COLLABORATEUR', 'EXPERT_COMPTABLE', 'CLIENT', 'LECTEUR');

-- CreateEnum
CREATE TYPE "PeriodiciteCharge" AS ENUM ('MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL', 'PONCTUEL');

-- CreateEnum
CREATE TYPE "TypeChargeVariable" AS ENUM ('POURCENTAGE_CA', 'COUT_UNITAIRE', 'MONTANT_FIXE');

-- CreateEnum
CREATE TYPE "StatutPiece" AS ENUM ('A_FOURNIR', 'RECU', 'VALIDE', 'REFUSE');

-- CreateEnum
CREATE TYPE "TypeCommentaire" AS ENUM ('GENERAL', 'HYPOTHESE', 'ALERTE', 'VALIDATION');

-- CreateEnum
CREATE TYPE "TypeDossier" AS ENUM ('CREATION', 'REPRISE');

-- CreateEnum
CREATE TYPE "FormeJuridique" AS ENUM ('SAS', 'SASU', 'SARL', 'EURL', 'EI', 'MICRO', 'SNC', 'AUTRE');

-- CreateEnum
CREATE TYPE "RegimeFiscal" AS ENUM ('IS', 'IR');

-- CreateEnum
CREATE TYPE "RegimeTVA" AS ENUM ('FRANCHISE', 'REEL_SIMPLIFIE', 'REEL_NORMAL');

-- CreateEnum
CREATE TYPE "StatutDossier" AS ENUM ('ACTIF', 'ARCHIVE', 'SUPPRIME');

-- CreateEnum
CREATE TYPE "StatutValidation" AS ENUM ('BROUILLON', 'A_VALIDER', 'VALIDE');

-- CreateEnum
CREATE TYPE "TypeApport" AS ENUM ('CAPITAL', 'COMPTE_COURANT', 'APPORT_NATURE');

-- CreateEnum
CREATE TYPE "TypeSubvention" AS ENUM ('SUBVENTION_INVESTISSEMENT', 'SUBVENTION_EXPLOITATION', 'AIDE_DEMARRAGE', 'PRET_HONNEUR', 'AUTRE');

-- CreateEnum
CREATE TYPE "PeriodiciteEmprunt" AS ENUM ('MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL');

-- CreateEnum
CREATE TYPE "TypeDifferé" AS ENUM ('AUCUN', 'PARTIEL', 'TOTAL');

-- CreateEnum
CREATE TYPE "CategorieImmobilisation" AS ENUM ('MATERIEL_BUREAU', 'MATERIEL_INDUSTRIEL', 'MOBILIER', 'LOGICIEL', 'VEHICULE', 'AGENCEMENT', 'TERRAIN', 'CONSTRUCTION', 'INCORPOREL', 'AUTRE');

-- CreateEnum
CREATE TYPE "ModeAmortissement" AS ENUM ('LINEAIRE', 'DEGRESSIF');

-- CreateEnum
CREATE TYPE "StatutSalarie" AS ENUM ('ACTIF', 'INACTIF', 'EN_CONGE');

-- CreateEnum
CREATE TYPE "StatutDirigeant" AS ENUM ('TNS', 'ASSIMILE_SALARIE');

-- CreateEnum
CREATE TYPE "TypePrime" AS ENUM ('PRIME_ANNUELLE', 'PRIME_VARIABLE', 'TREIZIEME_MOIS', 'PARTICIPATION', 'INTERESSEMENT', 'AUTRE');

-- CreateTable
CREATE TABLE "activite" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "typeActivite" "TypeActivite" NOT NULL DEFAULT 'PRESTATION_SERVICES',
    "unite" TEXT,
    "prixUnitaireHT" DECIMAL(15,4) NOT NULL,
    "tauxTVA" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "frequence" "FrequenceCA" NOT NULL DEFAULT 'MENSUEL',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "activite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volume_activite" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "volume" DECIMAL(15,4) NOT NULL,
    "activiteId" TEXT NOT NULL,

    CONSTRAINT "volume_activite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saisonnalite_activite" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "janvier" DECIMAL(6,4) NOT NULL DEFAULT 8.33,
    "fevrier" DECIMAL(6,4) NOT NULL DEFAULT 8.33,
    "mars" DECIMAL(6,4) NOT NULL DEFAULT 8.33,
    "avril" DECIMAL(6,4) NOT NULL DEFAULT 8.33,
    "mai" DECIMAL(6,4) NOT NULL DEFAULT 8.33,
    "juin" DECIMAL(6,4) NOT NULL DEFAULT 8.33,
    "juillet" DECIMAL(6,4) NOT NULL DEFAULT 8.33,
    "aout" DECIMAL(6,4) NOT NULL DEFAULT 8.33,
    "septembre" DECIMAL(6,4) NOT NULL DEFAULT 8.33,
    "octobre" DECIMAL(6,4) NOT NULL DEFAULT 8.33,
    "novembre" DECIMAL(6,4) NOT NULL DEFAULT 8.33,
    "decembre" DECIMAL(6,4) NOT NULL DEFAULT 8.37,
    "activiteId" TEXT NOT NULL,

    CONSTRAINT "saisonnalite_activite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "croissance_activite" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "tauxCroissance" DECIMAL(6,4) NOT NULL,
    "activiteId" TEXT NOT NULL,

    CONSTRAINT "croissance_activite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autre_produit" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DECIMAL(15,2) NOT NULL,
    "annee" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "autre_produit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "action" "TypeAction" NOT NULL,
    "entiteType" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "valeurAvant" JSONB,
    "valeurApres" JSONB,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilisateurId" TEXT NOT NULL,
    "dossierId" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapport_exporte" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "typeExport" "TypeExport" NOT NULL,
    "fichierUrl" TEXT,
    "tailleFichier" INTEGER,
    "parametres" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "scenarioIds" JSONB,
    "estValide" BOOLEAN NOT NULL DEFAULT false,
    "valideLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generateurId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,

    CONSTRAINT "rapport_exporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cabinet" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "siret" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cabinet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cabinetId" TEXT,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'COLLABORATEUR',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'CLIENT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviteurId" TEXT NOT NULL,
    "dossierId" TEXT,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charge_fixe" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "montant" DECIMAL(15,2) NOT NULL,
    "periodicite" "PeriodiciteCharge" NOT NULL DEFAULT 'MENSUEL',
    "tauxTVA" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "deductibleTVA" BOOLEAN NOT NULL DEFAULT true,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "tauxIndexation" DECIMAL(5,2) DEFAULT 0.00,
    "estChargeFinanciere" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "charge_fixe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charge_variable" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "type" "TypeChargeVariable" NOT NULL DEFAULT 'POURCENTAGE_CA',
    "tauxPourcentage" DECIMAL(6,4),
    "coutUnitaire" DECIMAL(15,4),
    "montantFixe" DECIMAL(15,2),
    "tauxTVA" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "deductibleTVA" BOOLEAN NOT NULL DEFAULT true,
    "activiteId" TEXT,
    "tauxIndexation" DECIMAL(5,2) DEFAULT 0.00,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "charge_variable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autre_charge" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DECIMAL(15,2) NOT NULL,
    "annee" INTEGER NOT NULL,
    "tauxTVA" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "autre_charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commentaire" (
    "id" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "type" "TypeCommentaire" NOT NULL DEFAULT 'GENERAL',
    "entiteType" TEXT,
    "entiteId" TEXT,
    "resolu" BOOLEAN NOT NULL DEFAULT false,
    "resoluLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "auteurId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "commentaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_piece" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "statut" "StatutPiece" NOT NULL DEFAULT 'A_FOURNIR',
    "obligatoire" BOOLEAN NOT NULL DEFAULT false,
    "fichierUrl" TEXT,
    "fichierNom" TEXT,
    "noteInterne" TEXT,
    "dateReception" TIMESTAMP(3),
    "dateValidation" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dossierId" TEXT NOT NULL,

    CONSTRAINT "checklist_piece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "reference" TEXT,
    "typeDossier" "TypeDossier" NOT NULL DEFAULT 'CREATION',
    "dureeProjection" INTEGER NOT NULL DEFAULT 3,
    "dateDemarrage" TIMESTAMP(3) NOT NULL,
    "statut" "StatutDossier" NOT NULL DEFAULT 'ACTIF',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cabinetId" TEXT NOT NULL,

    CONSTRAINT "dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_dossier" (
    "id" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'COLLABORATEUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,

    CONSTRAINT "user_dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL DEFAULT 'Scénario réaliste',
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "statut" "StatutValidation" NOT NULL DEFAULT 'BROUILLON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dossierId" TEXT NOT NULL,

    CONSTRAINT "scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametres_entreprise" (
    "id" TEXT NOT NULL,
    "formeJuridique" "FormeJuridique" NOT NULL DEFAULT 'SAS',
    "regimeFiscal" "RegimeFiscal" NOT NULL DEFAULT 'IS',
    "regimeTVA" "RegimeTVA" NOT NULL DEFAULT 'REEL_NORMAL',
    "tauxIs" DECIMAL(5,2) NOT NULL DEFAULT 25.00,
    "tauxIsReduit" DECIMAL(5,2),
    "plafondIsReduit" DECIMAL(15,2),
    "tauxTvaStandard" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "tauxTvaReduit" DECIMAL(5,2),
    "periodiciteDeclarationTVA" TEXT DEFAULT 'mensuel',
    "delaiPaiementClients" INTEGER NOT NULL DEFAULT 30,
    "delaiPaiementFournisseurs" INTEGER NOT NULL DEFAULT 30,
    "joursStockMoyen" INTEGER DEFAULT 0,
    "repartitionResultat" DECIMAL(5,2),
    "activite" TEXT,
    "codeNAF" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "parametres_entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apport" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "type" "TypeApport" NOT NULL DEFAULT 'CAPITAL',
    "montant" DECIMAL(15,2) NOT NULL,
    "dateApport" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "remboursable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "apport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subvention" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "type" "TypeSubvention" NOT NULL DEFAULT 'AIDE_DEMARRAGE',
    "montant" DECIMAL(15,2) NOT NULL,
    "dateObtention" TIMESTAMP(3),
    "dateEncaissement" TIMESTAMP(3),
    "description" TEXT,
    "imposable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "subvention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emprunt" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DECIMAL(15,2) NOT NULL,
    "tauxAnnuel" DECIMAL(6,4) NOT NULL,
    "tauxAssurance" DECIMAL(5,4) NOT NULL DEFAULT 0.00,
    "dureeEnMois" INTEGER NOT NULL,
    "periodicite" "PeriodiciteEmprunt" NOT NULL DEFAULT 'MENSUEL',
    "dateDéblocage" TIMESTAMP(3) NOT NULL,
    "typeDiffere" "TypeDifferé" NOT NULL DEFAULT 'AUCUN',
    "dureeDiffereEnMois" INTEGER NOT NULL DEFAULT 0,
    "fraisDossier" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "garanties" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "emprunt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ligne_echeancier" (
    "id" TEXT NOT NULL,
    "moisNumero" INTEGER NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "capitalRestantDebut" DECIMAL(15,2) NOT NULL,
    "interesMois" DECIMAL(15,2) NOT NULL,
    "assuranceMois" DECIMAL(15,2) NOT NULL,
    "capitalRembourse" DECIMAL(15,2) NOT NULL,
    "mensualiteTotale" DECIMAL(15,2) NOT NULL,
    "capitalRestantFin" DECIMAL(15,2) NOT NULL,
    "empruntId" TEXT NOT NULL,

    CONSTRAINT "ligne_echeancier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "immobilisation" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "categorie" "CategorieImmobilisation" NOT NULL DEFAULT 'MATERIEL_BUREAU',
    "montantHT" DECIMAL(15,2) NOT NULL,
    "tauxTVA" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "recuperationTVA" BOOLEAN NOT NULL DEFAULT true,
    "dureeAmortissement" INTEGER NOT NULL,
    "modeAmortissement" "ModeAmortissement" NOT NULL DEFAULT 'LINEAIRE',
    "dateAcquisition" TIMESTAMP(3) NOT NULL,
    "renouvellement" BOOLEAN NOT NULL DEFAULT false,
    "periodeRenouvellement" INTEGER,
    "valeurResiduelle" DECIMAL(15,2),
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "immobilisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ligne_amortissement" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "mois" INTEGER,
    "valeurBruteDebut" DECIMAL(15,2) NOT NULL,
    "dotationAnnuelle" DECIMAL(15,2) NOT NULL,
    "amortissementCumule" DECIMAL(15,2) NOT NULL,
    "valeurNette" DECIMAL(15,2) NOT NULL,
    "immobilisationId" TEXT NOT NULL,

    CONSTRAINT "ligne_amortissement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultat_annuel" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "chiffreAffairesHT" DECIMAL(15,2) NOT NULL,
    "autresProduits" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subventionsExploitation" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalProduitsExploitation" DECIMAL(15,2) NOT NULL,
    "achatsMarchandises" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "variationStocks" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "chargesExternes" DECIMAL(15,2) NOT NULL,
    "impotsTaxes" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "chargesPersonnel" DECIMAL(15,2) NOT NULL,
    "dotationsAmortissements" DECIMAL(15,2) NOT NULL,
    "autresCharges" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalChargesExploitation" DECIMAL(15,2) NOT NULL,
    "margeCommerciale" DECIMAL(15,2) NOT NULL,
    "productionExercice" DECIMAL(15,2) NOT NULL,
    "valeurAjoutee" DECIMAL(15,2) NOT NULL,
    "excedentBrutExploitation" DECIMAL(15,2) NOT NULL,
    "resultatExploitation" DECIMAL(15,2) NOT NULL,
    "produitsFinanciers" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "chargesFinancieres" DECIMAL(15,2) NOT NULL,
    "resultatFinancier" DECIMAL(15,2) NOT NULL,
    "resultatCourantAvantImpot" DECIMAL(15,2) NOT NULL,
    "resultatExceptionnel" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "impotSocietes" DECIMAL(15,2) NOT NULL,
    "resultatNet" DECIMAL(15,2) NOT NULL,
    "capaciteAutofinancement" DECIMAL(15,2) NOT NULL,
    "chargesFixesTotales" DECIMAL(15,2) NOT NULL,
    "chargesVariablesTotales" DECIMAL(15,2) NOT NULL,
    "margeCouvVariables" DECIMAL(15,2) NOT NULL,
    "tauxMCVPourcentage" DECIMAL(6,4) NOT NULL,
    "seuilRentabiliteCA" DECIMAL(15,2) NOT NULL,
    "pointMortJours" DECIMAL(8,2) NOT NULL,
    "calculeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "resultat_annuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bilan_annuel" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "immobilisationsBrutes" DECIMAL(15,2) NOT NULL,
    "amortissementsCumules" DECIMAL(15,2) NOT NULL,
    "actifImmobiliseNet" DECIMAL(15,2) NOT NULL,
    "stocks" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "creancesClients" DECIMAL(15,2) NOT NULL,
    "tvaARecuperer" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "autresCreances" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "disponibilites" DECIMAL(15,2) NOT NULL,
    "totalActif" DECIMAL(15,2) NOT NULL,
    "capitalSocial" DECIMAL(15,2) NOT NULL,
    "reserves" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "reportNouveau" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "resultatExercice" DECIMAL(15,2) NOT NULL,
    "subventionsInvestissement" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCapitauxPropres" DECIMAL(15,2) NOT NULL,
    "dettesFinancieresMLT" DECIMAL(15,2) NOT NULL,
    "dettesCT" DECIMAL(15,2) NOT NULL,
    "dettesFournisseurs" DECIMAL(15,2) NOT NULL,
    "dettesFiscalesSociales" DECIMAL(15,2) NOT NULL,
    "tvaADecaisser" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "autresDettes" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPassif" DECIMAL(15,2) NOT NULL,
    "bfrExploitation" DECIMAL(15,2) NOT NULL,
    "frng" DECIMAL(15,2) NOT NULL,
    "tresorerieNette" DECIMAL(15,2) NOT NULL,
    "ecartBilan" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "calculeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "bilan_annuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tresorerie_mensuelle" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "encaissementsClients" DECIMAL(15,2) NOT NULL,
    "subventionsPercues" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "apportsPercus" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "autresEncaissements" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalEncaissements" DECIMAL(15,2) NOT NULL,
    "paiementsFournisseurs" DECIMAL(15,2) NOT NULL,
    "chargesPersonnelDecaisse" DECIMAL(15,2) NOT NULL,
    "chargesSociales" DECIMAL(15,2) NOT NULL,
    "remboursementEmprunts" DECIMAL(15,2) NOT NULL,
    "investissements" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tvaPayer" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "impotSocietesAcompte" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "autresDecaissements" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalDecaissements" DECIMAL(15,2) NOT NULL,
    "fluxNetMois" DECIMAL(15,2) NOT NULL,
    "soldeDebut" DECIMAL(15,2) NOT NULL,
    "soldeFin" DECIMAL(15,2) NOT NULL,
    "tvaCollectee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tvaDeductible" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "calculeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "tresorerie_mensuelle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seuil_rentabilite" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "chargesFixesTotales" DECIMAL(15,2) NOT NULL,
    "chargesVariablesTotales" DECIMAL(15,2) NOT NULL,
    "margeSurCoutsVariables" DECIMAL(15,2) NOT NULL,
    "tauxMCV" DECIMAL(6,4) NOT NULL,
    "seuilRentabiliteCA" DECIMAL(15,2) NOT NULL,
    "pointMortJours" DECIMAL(8,2) NOT NULL,
    "margeSecurite" DECIMAL(15,2) NOT NULL,
    "indiceSecurite" DECIMAL(6,4) NOT NULL,
    "leviersOperationnel" DECIMAL(8,4) NOT NULL,
    "calculeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "seuil_rentabilite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salarie" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "poste" TEXT NOT NULL,
    "statut" "StatutSalarie" NOT NULL DEFAULT 'ACTIF',
    "salaireBrutMensuel" DECIMAL(15,2) NOT NULL,
    "tauxChargesSocialesPatronales" DECIMAL(6,4) NOT NULL DEFAULT 42.00,
    "tauxChargesSocialesSalariales" DECIMAL(6,4) NOT NULL DEFAULT 22.00,
    "dateEntree" TIMESTAMP(3) NOT NULL,
    "dateSortie" TIMESTAMP(3),
    "tauxEvolutionAnnuel" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "quotiteTravail" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "description" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "salarie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prime" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "type" "TypePrime" NOT NULL DEFAULT 'PRIME_ANNUELLE',
    "montant" DECIMAL(15,2) NOT NULL,
    "annee" INTEGER NOT NULL,
    "taux" DECIMAL(6,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salarieId" TEXT,
    "dirigeantId" TEXT,

    CONSTRAINT "prime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dirigeant" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "statut" "StatutDirigeant" NOT NULL DEFAULT 'TNS',
    "remunerationMensuelle" DECIMAL(15,2) NOT NULL,
    "tauxCotisationsTNS" DECIMAL(6,4) DEFAULT 45.00,
    "tauxChargesPatronales" DECIMAL(6,4),
    "tauxChargesSalariales" DECIMAL(6,4),
    "tauxEvolutionAnnuel" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "datePrisePoste" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "dirigeant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unite_d_oeuvre" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "coutUnitaire" DECIMAL(15,4) NOT NULL,
    "volumesAnnuels" JSONB,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "unite_d_oeuvre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "volume_activite_activiteId_annee_key" ON "volume_activite"("activiteId", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "saisonnalite_activite_activiteId_annee_key" ON "saisonnalite_activite"("activiteId", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "croissance_activite_activiteId_annee_key" ON "croissance_activite"("activiteId", "annee");

-- CreateIndex
CREATE INDEX "audit_log_entiteType_entiteId_idx" ON "audit_log"("entiteType", "entiteId");

-- CreateIndex
CREATE INDEX "audit_log_dossierId_idx" ON "audit_log"("dossierId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "rapport_exporte_dossierId_idx" ON "rapport_exporte"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "cabinet_siret_key" ON "cabinet"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_token_key" ON "invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "dossier_reference_key" ON "dossier"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "user_dossier_userId_dossierId_key" ON "user_dossier"("userId", "dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "parametres_entreprise_scenarioId_key" ON "parametres_entreprise"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ligne_echeancier_empruntId_moisNumero_key" ON "ligne_echeancier"("empruntId", "moisNumero");

-- CreateIndex
CREATE UNIQUE INDEX "ligne_amortissement_immobilisationId_annee_mois_key" ON "ligne_amortissement"("immobilisationId", "annee", "mois");

-- CreateIndex
CREATE UNIQUE INDEX "resultat_annuel_scenarioId_annee_key" ON "resultat_annuel"("scenarioId", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "bilan_annuel_scenarioId_annee_key" ON "bilan_annuel"("scenarioId", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "tresorerie_mensuelle_scenarioId_annee_mois_key" ON "tresorerie_mensuelle"("scenarioId", "annee", "mois");

-- CreateIndex
CREATE UNIQUE INDEX "seuil_rentabilite_scenarioId_annee_key" ON "seuil_rentabilite"("scenarioId", "annee");

-- AddForeignKey
ALTER TABLE "activite" ADD CONSTRAINT "activite_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volume_activite" ADD CONSTRAINT "volume_activite_activiteId_fkey" FOREIGN KEY ("activiteId") REFERENCES "activite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saisonnalite_activite" ADD CONSTRAINT "saisonnalite_activite_activiteId_fkey" FOREIGN KEY ("activiteId") REFERENCES "activite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "croissance_activite" ADD CONSTRAINT "croissance_activite_activiteId_fkey" FOREIGN KEY ("activiteId") REFERENCES "activite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autre_produit" ADD CONSTRAINT "autre_produit_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapport_exporte" ADD CONSTRAINT "rapport_exporte_generateurId_fkey" FOREIGN KEY ("generateurId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapport_exporte" ADD CONSTRAINT "rapport_exporte_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviteurId_fkey" FOREIGN KEY ("inviteurId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_fixe" ADD CONSTRAINT "charge_fixe_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_variable" ADD CONSTRAINT "charge_variable_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autre_charge" ADD CONSTRAINT "autre_charge_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaire" ADD CONSTRAINT "commentaire_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaire" ADD CONSTRAINT "commentaire_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaire" ADD CONSTRAINT "commentaire_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "commentaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_piece" ADD CONSTRAINT "checklist_piece_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier" ADD CONSTRAINT "dossier_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dossier" ADD CONSTRAINT "user_dossier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dossier" ADD CONSTRAINT "user_dossier_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario" ADD CONSTRAINT "scenario_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametres_entreprise" ADD CONSTRAINT "parametres_entreprise_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apport" ADD CONSTRAINT "apport_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subvention" ADD CONSTRAINT "subvention_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprunt" ADD CONSTRAINT "emprunt_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_echeancier" ADD CONSTRAINT "ligne_echeancier_empruntId_fkey" FOREIGN KEY ("empruntId") REFERENCES "emprunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "immobilisation" ADD CONSTRAINT "immobilisation_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_amortissement" ADD CONSTRAINT "ligne_amortissement_immobilisationId_fkey" FOREIGN KEY ("immobilisationId") REFERENCES "immobilisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultat_annuel" ADD CONSTRAINT "resultat_annuel_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_annuel" ADD CONSTRAINT "bilan_annuel_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tresorerie_mensuelle" ADD CONSTRAINT "tresorerie_mensuelle_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seuil_rentabilite" ADD CONSTRAINT "seuil_rentabilite_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salarie" ADD CONSTRAINT "salarie_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prime" ADD CONSTRAINT "prime_salarieId_fkey" FOREIGN KEY ("salarieId") REFERENCES "salarie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prime" ADD CONSTRAINT "prime_dirigeantId_fkey" FOREIGN KEY ("dirigeantId") REFERENCES "dirigeant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dirigeant" ADD CONSTRAINT "dirigeant_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unite_d_oeuvre" ADD CONSTRAINT "unite_d_oeuvre_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

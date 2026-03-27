"use client";

/**
 * Formulaire financement — 2 tableaux éditables inline + modal détails emprunt
 * - Tableau des apports en capital / CCA / nature
 * - Tableau des emprunts avec bouton « Détails » (modal éditable)
 */

import { useCallback, useTransition, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Save, Loader2, FileText, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  TYPES_APPORT,
  PERIODICITES_EMPRUNT,
  TYPES_DIFFERE,
  TYPES_EMPRUNT,
  MODALITES_REMBOURSEMENT,
  MODES_ASSURANCE,
  calculerLoyerMensuel,
  nbPeriodesFromMois,
  type ApportRow,
  type EmpruntRow,
  type EmpruntWithEcheancier,
} from "@/lib/schemas/financement";

import {
  upsertApport,
  deleteApport,
  upsertEmprunt,
  deleteEmprunt,
} from "@/app/actions/financement";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";

import {
  useFinancementStore,
  type LocalApport,
  type LocalEmprunt,
} from "@/stores/financement-store";

import { resumeEmprunt } from "@/lib/calcul/echeancier";

// ── Helpers ───────────────────────────────────────────────────────────────────

const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-xs focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0";

const cellSelect =
  "h-7 w-full border-0 bg-transparent px-1 text-xs focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none cursor-pointer";

function numVal(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function intVal(v: string): number {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

function tempId() {
  return `__new__${crypto.randomUUID()}`;
}

function fmtEur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

function fmtDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR");
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
  isDirty,
  isSaving,
  onAdd,
  onSave,
}: {
  title: string;
  description: string;
  isDirty: boolean;
  isSaving: boolean;
  onAdd: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b">
      <div>
        <h3 className="text-base font-semibold leading-snug">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {isDirty && (
          <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs gap-1">
            Modifications non enregistrées
          </Badge>
        )}
        {isDirty && (
          <Button
            size="sm"
            variant="default"
            className="h-7 gap-1 text-xs"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Enregistrer
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onAdd}>
          <Plus className="h-3 w-3" />
          Ajouter
        </Button>
      </div>
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn(
      "border-r border-border last:border-r-0 px-1.5 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap",
      className
    )}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("border-r border-border last:border-r-0 p-0 align-middle", className)}>
      {children}
    </td>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DÉTAILS EMPRUNT — FORMULAIRE ÉDITABLE
// Les champs présents ici mais absents du tableau (tauxAssurance, typeDiffere,
// fraisDossier…) ne peuvent être configurés que depuis cette modal.
// Les modifications sont appliquées au store (dirty) — la sauvegarde DB se fait
// via le bouton « Enregistrer » du tableau.
// ─────────────────────────────────────────────────────────────────────────────

function ModalDetailsEmprunt({
  emprunt,
  open,
  onClose,
  onApply,
}: {
  emprunt: EmpruntRow | null;
  open: boolean;
  onClose: () => void;
  onApply: (updated: EmpruntRow) => void;
}) {
  // État local interne (draft modal) — initialisé depuis la ligne à la création
  // (le composant est remonté via `key` dans le parent à chaque ouverture)
  const [draft, setDraft] = useState<EmpruntRow | null>(
    () => emprunt
      ? {
          ...emprunt,
          typeEmprunt:           emprunt.typeEmprunt           ?? "AMORTISSABLE",
          modaliteRemboursement: emprunt.modaliteRemboursement ?? "ECHEANCE_CONSTANTE",
          modeAssurance:         emprunt.modeAssurance         ?? "CAPITAL_RESTANT",
          typeDiffere:           emprunt.typeDiffere           ?? "AUCUN",
          periodicite:           emprunt.periodicite           ?? "MENSUEL",
        }
      : null
  );

  // Recalcul du résumé en temps réel depuis le draft
  const resume = useMemo(() => {
    if (!draft) return null;
    return resumeEmprunt({
      montant:               draft.montant,
      tauxAnnuel:            draft.tauxAnnuel,
      tauxAssurance:         draft.tauxAssurance,
      dureeEnMois:           draft.dureeEnMois,
      periodicite:           draft.periodicite,
      dateDéblocage:         draft.dateDéblocage,
      typeDiffere:           draft.typeDiffere,
      dureeDiffereEnMois:    draft.dureeDiffereEnMois,
      fraisDossier:          draft.fraisDossier,
      typeEmprunt:           draft.typeEmprunt,
      modaliteRemboursement: draft.modaliteRemboursement,
      modeAssurance:         draft.modeAssurance,
    });
  }, [draft]);

  if (!draft || !resume) return null;

  const set = <K extends keyof EmpruntRow>(key: K, value: EmpruntRow[K]) =>
    setDraft((prev) => prev ? { ...prev, [key]: value } : prev);

  const dureeAns  = Math.floor(draft.dureeEnMois / 12);
  const dureeMois = draft.dureeEnMois % 12;
  const dureeTxt  = [
    dureeAns  > 0 ? `${dureeAns} an${dureeAns > 1 ? "s" : ""}` : null,
    dureeMois > 0 ? `${dureeMois} mois` : null,
  ].filter(Boolean).join(" ") || "—";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Détails de l&rsquo;emprunt</DialogTitle>
          <DialogDescription className="text-xs">
            Les champs modifiés ici sont appliqués à la ligne. Cliquez sur{" "}
            <span className="font-medium text-foreground">Enregistrer</span> dans le tableau pour sauvegarder en base.
          </DialogDescription>
        </DialogHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5 text-sm">

          {/* ── Section Emprunt ─────────────────────────────────────── */}
          <ModalSection title="Emprunt">
            <ModalField label="Date de déblocage">
              <Input
                type="date"
                value={draft.dateDéblocage}
                onChange={(e) => set("dateDéblocage", e.target.value)}
                className="h-8 text-sm"
              />
            </ModalField>
            <ModalField label="Montant (€)">
              <Input
                type="number" min={0} step={0.01}
                value={draft.montant === 0 ? "" : draft.montant}
                placeholder="0"
                onChange={(e) => set("montant", numVal(e.target.value))}
                className="h-8 text-sm text-right"
              />
            </ModalField>
          </ModalSection>

          {/* ── Section Remboursement ───────────────────────────────── */}
          <ModalSection title="Remboursement">
          {/* Châmp exclusif modal : type emprunt */}
            <ModalField label="Type">
              <Select
                value={draft.typeEmprunt}
                onValueChange={(v) => set("typeEmprunt", v as EmpruntRow["typeEmprunt"])}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Amortissable" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_EMPRUNT.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ModalField>

            <ModalField label="Taux annuel (%)">
              <Input
                type="number" min={0} max={100} step={0.01}
                value={draft.tauxAnnuel === 0 ? "" : draft.tauxAnnuel}
                placeholder="0"
                onChange={(e) => set("tauxAnnuel", numVal(e.target.value))}
                className="h-8 text-sm text-right"
              />
            </ModalField>

            <ModalField label={`Durée (mois)${dureeTxt ? ` — ${dureeTxt}` : ""}`}>
              <Input
                type="number" min={1} step={1}
                value={draft.dureeEnMois}
                onChange={(e) => set("dureeEnMois", intVal(e.target.value))}
                className="h-8 text-sm text-right"
              />
            </ModalField>

            <ModalField label="Différé (mois)">
              <Input
                type="number" min={0} step={1}
                value={draft.dureeDiffereEnMois === 0 ? "" : draft.dureeDiffereEnMois}
                placeholder="0"
                onChange={(e) => set("dureeDiffereEnMois", intVal(e.target.value))}
                className="h-8 text-sm text-right"
              />
            </ModalField>

            {/* Champ exclusif modal : modalité différé */}
            <ModalField label="Modalité différé">
              <Select
                value={draft.typeDiffere}
                onValueChange={(v) => set("typeDiffere", v as EmpruntRow["typeDiffere"])}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_DIFFERE.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ModalField>

            <ModalField label="Périodicité">
              <Select
                value={draft.periodicite}
                onValueChange={(v) => set("periodicite", v as EmpruntRow["periodicite"])}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Mensuel" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODICITES_EMPRUNT.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ModalField>

            <ModalFieldReadOnly label="1er remboursement">
              {fmtDate(resume.premierRembourement)}
            </ModalFieldReadOnly>

            {/* Champ exclusif modal : modalité de remboursement */}
            <ModalField label="Modalité">
              <Select
                value={draft.modaliteRemboursement}
                onValueChange={(v) => set("modaliteRemboursement", v as EmpruntRow["modaliteRemboursement"])}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Échéance constante" />
                </SelectTrigger>
                <SelectContent>
                  {MODALITES_REMBOURSEMENT.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ModalField>
          </ModalSection>

          {/* ── Section Assurance ───────────────────────────────────── */}
          <ModalSection title="Assurance">
            {/* Champ exclusif modal : mode calcul assurance */}
            <ModalField label="Mode">
              <Select
                value={draft.modeAssurance}
                onValueChange={(v) => set("modeAssurance", v as EmpruntRow["modeAssurance"])}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="% du capital restant" />
                </SelectTrigger>
                <SelectContent>
                  {MODES_ASSURANCE.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ModalField>

            {/* Champ exclusif modal : taux assurance */}
            <ModalField label="Taux annuel (%)" hint="Ex. 0.3 % standard — max 5 %">
              <Input
                type="number" min={0} max={5} step={0.001}
                value={draft.tauxAssurance === 0 ? "" : draft.tauxAssurance}
                placeholder="0.3"
                onChange={(e) => set("tauxAssurance", numVal(e.target.value))}
                className="h-8 text-sm text-right"
              />
            </ModalField>
          </ModalSection>

          {/* ── Section Frais ────────────────────────────────────────── */}
          <ModalSection title="Frais">
            {/* Champ exclusif modal : frais de dossier */}
            <ModalField label="Frais de dossier (€)">
              <Input
                type="number" min={0} step={0.01}
                value={draft.fraisDossier === 0 ? "" : draft.fraisDossier}
                placeholder="0"
                onChange={(e) => set("fraisDossier", numVal(e.target.value))}
                className="h-8 text-sm text-right"
              />
            </ModalField>
          </ModalSection>

          {/* ── Synthèse calculée (lecture seule, temps réel) ──────── */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">
              Synthèse calculée
            </p>
            <SynthRow label="Montant de l'échéance" primary>
              {fmtEur(resume.echeanceMoyenne)}
            </SynthRow>
            <SynthRow label="Frais de dossier">
              {fmtEur(draft.fraisDossier)}
            </SynthRow>
            <Separator className="my-1" />
            <SynthRow label="Coût total du crédit" primary>
              {fmtEur(resume.coutTotalCredit)}
            </SynthRow>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            <CheckIcon className="h-3.5 w-3.5" />
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sous-composants modal ─────────────────────────────────────────────────────

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <Separator />
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ModalField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <div>
        <Label className="text-sm text-muted-foreground font-normal leading-tight">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground/60 leading-none mt-0.5">{hint}</p>}
      </div>
      <div className="w-44">{children}</div>
    </div>
  );
}

function ModalFieldReadOnly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-right">{children}</span>
    </div>
  );
}

function SynthRow({
  label,
  children,
  primary,
}: {
  label: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={cn("text-sm", primary ? "font-medium" : "text-muted-foreground")}>
        {label}
      </span>
      <span className={cn("tabular-nums font-semibold", primary ? "text-primary" : "")}>
        {children}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU 1 — APPORTS EN CAPITAL
// ─────────────────────────────────────────────────────────────────────────────

function TableauApports({
  dossierId,
  initialData,
  dateDebutExerciceN,
}: {
  dossierId: string;
  initialData: ApportRow[];
  dateDebutExerciceN?: string;
}) {
  const _storeRows   = useFinancementStore((s) => s.apports[dossierId]);
  const setApports   = useFinancementStore((s) => s.setApports);
  const hydrateApports = useFinancementStore((s) => s.hydrateApports);

  useEffect(() => {
    hydrateApports(dossierId, initialData.map((d) => ({ ...d, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const rows    = _storeRows ?? initialData.map((d) => ({ ...d, _dirty: false }));
  const setRows = useCallback(
    (updater: (prev: LocalApport[]) => LocalApport[]) => setApports(dossierId, updater),
    [dossierId, setApports]
  );

  const [isPending, startTransition] = useTransition();
  const isDirty = rows.some((r) => r._dirty);
  const invalidateControleStores = useInvalidateControleStores();

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id:           tempId(),
        libelle:      "",
        type:         "CAPITAL",
        montant:      0,
        dateApport:   dateDebutExerciceN ?? new Date().toISOString().slice(0, 10),
        remboursable: false,
        actif:        true,
        ordre:        prev.length,
        _dirty:       true,
      } satisfies LocalApport,
    ]);
  }, [setRows, dateDebutExerciceN]);

  const updateRow = useCallback(
    <K extends keyof LocalApport>(idx: number, key: K, value: LocalApport[K]) => {
      setRows((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], [key]: value, _dirty: true };
        return next;
      });
    },
    [setRows]
  );

  const removeRow = useCallback(
    (idx: number) => {
      const row = rows[idx];
      if (!row) return;
      if (row.id?.startsWith("__new__")) {
        setRows((prev) => prev.filter((_, i) => i !== idx));
        return;
      }
      startTransition(async () => {
        const res = await deleteApport(row.id!, dossierId);
        if (res.success) {
          setRows((prev) => prev.filter((_, i) => i !== idx));
          toast.success("Apport supprimé.");
          invalidateControleStores(dossierId);
        } else {
          toast.error(res.error);
        }
      });
    },
    [rows, setRows, dossierId, invalidateControleStores]
  );

  const saveAll = useCallback(() => {
    startTransition(async () => {
      const dirtyRows = rows.filter((r) => r._dirty);
      const results = await Promise.all(
        dirtyRows.map((row) => {
          const payload: ApportRow = { ...row, id: row.id?.startsWith("__new__") ? undefined : row.id };
          return upsertApport(dossierId, payload).then((res) => ({ res, row }));
        })
      );

      let hasError = false;
      setRows((prev) => {
        const next = [...prev];
        for (const { res, row } of results) {
          if (res.success) {
            const i = next.findIndex((r) => r.id === row.id);
            if (i >= 0) next[i] = { ...next[i], id: res.id ?? next[i].id, _dirty: false };
          } else {
            hasError = true;
            toast.error(`Erreur : ${res.error}`);
          }
        }
        return next;
      });

      if (!hasError) toast.success("Apports enregistrés.");
      if (!hasError) invalidateControleStores(dossierId);
    });
  }, [rows, dossierId, setRows, invalidateControleStores]);

  const totalApports = rows.reduce((sum, r) => sum + (r.actif !== false ? r.montant : 0), 0);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Apports en capital"
        description="Capital social, comptes courants d'associés, apports en nature"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onSave={saveAll}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-8">#</Th>
              <Th className="w-8 text-center">Actif</Th>
              <Th className="min-w-48">Libellé</Th>
              <Th className="w-40">Type</Th>
              <Th className="w-32">Date</Th>
              <Th className="w-28">Montant (€)</Th>
              <Th className="w-28 text-center">Remboursable</Th>
              <Th className="w-8"></Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted-foreground text-xs py-6">
                  Aucun apport. Cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  "border-t border-border bg-background hover:bg-muted/30 transition-colors",
                  row._dirty && "bg-amber-50/40 dark:bg-amber-900/10",
                  !(row.actif ?? true) && "opacity-50"
                )}
              >
                <Td className="text-center text-xs text-muted-foreground px-1">{idx + 1}</Td>
                <Td className="text-center px-1">
                  <input
                    type="checkbox"
                    checked={row.actif ?? true}
                    onChange={(e) => updateRow(idx, "actif", e.target.checked)}
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                  />
                </Td>
                <Td>
                  <input
                    className={cellInput}
                    value={row.libelle}
                    placeholder="Libellé"
                    onChange={(e) => updateRow(idx, "libelle", e.target.value)}
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.type}
                    onChange={(e) => updateRow(idx, "type", e.target.value as ApportRow["type"])}
                  >
                    {TYPES_APPORT.map((t) => (
                      <option key={t.value} value={t.value} className="bg-background text-foreground">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    type="date"
                    className={cellInput}
                    value={row.dateApport}
                    onChange={(e) => updateRow(idx, "dateApport", e.target.value)}
                  />
                </Td>
                <Td>
                  <input
                    type="number" min={0} step={0.01}
                    className={cn(cellInput, "text-right")}
                    value={row.montant === 0 ? "" : row.montant}
                    placeholder="0"
                    onChange={(e) => updateRow(idx, "montant", numVal(e.target.value))}
                  />
                </Td>
                <Td className="text-center px-1">
                  <input
                    type="checkbox"
                    checked={row.remboursable ?? false}
                    disabled={row.type !== "COMPTE_COURANT"}
                    onChange={(e) => updateRow(idx, "remboursable", e.target.checked)}
                    className="h-3.5 w-3.5 cursor-pointer accent-primary disabled:opacity-30"
                    title={row.type !== "COMPTE_COURANT" ? "Option disponible uniquement pour les CCA" : ""}
                  />
                </Td>
                <Td className="text-center">
                  <button
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => removeRow(idx)}
                    title="Supprimer"
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t border-border bg-muted/50">
              <tr>
                <td colSpan={5} className="text-right text-xs font-medium text-muted-foreground px-2 py-1.5">
                  Total apports actifs
                </td>
                <td className="text-right text-xs font-semibold px-2 py-1.5 tabular-nums">
                  {fmtEur(totalApports)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU 2 — EMPRUNTS
// ─────────────────────────────────────────────────────────────────────────────

function TableauEmprunts({
  dossierId,
  initialData,
  dateDebutExerciceN,
}: {
  dossierId: string;
  initialData: EmpruntWithEcheancier[];
  dateDebutExerciceN?: string;
}) {
  const _storeRows    = useFinancementStore((s) => s.emprunts[dossierId]);
  const setEmprunts   = useFinancementStore((s) => s.setEmprunts);
  const hydrateEmprunts = useFinancementStore((s) => s.hydrateEmprunts);
  const [modalEmprunt, setModalEmprunt] = useState<EmpruntRow | null>(null);

  useEffect(() => {
    hydrateEmprunts(dossierId, initialData.map((d) => ({ ...d, _dirty: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const rows    = _storeRows ?? initialData.map((d) => ({ ...d, _dirty: false }));
  const setRows = useCallback(
    (updater: (prev: LocalEmprunt[]) => LocalEmprunt[]) => setEmprunts(dossierId, updater),
    [dossierId, setEmprunts]
  );

  const [isPending, startTransition] = useTransition();
  const isDirty = rows.some((r) => r._dirty);
  const invalidateControleStores = useInvalidateControleStores();

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id:                    tempId(),
        libelle:               "",
        montant:               0,
        tauxAnnuel:            3.5,
        tauxAssurance:         0.3,
        dureeEnMois:           84,
        periodicite:           "MENSUEL",
        dateDéblocage:         dateDebutExerciceN ?? new Date().toISOString().slice(0, 10),
        typeEmprunt:           "AMORTISSABLE",
        modaliteRemboursement: "ECHEANCE_CONSTANTE",
        typeDiffere:           "AUCUN",
        dureeDiffereEnMois:    0,
        modeAssurance:         "CAPITAL_RESTANT",
        fraisDossier:          0,
        actif:                 true,
        ordre:                 prev.length,
        lignesEcheancier:      [],
        _dirty:                true,
      } satisfies LocalEmprunt,
    ]);
  }, [setRows, dateDebutExerciceN]);

  const updateRow = useCallback(
    <K extends keyof LocalEmprunt>(idx: number, key: K, value: LocalEmprunt[K]) => {
      setRows((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], [key]: value, _dirty: true };
        return next;
      });
    },
    [setRows]
  );

  // Mise à jour complète depuis la modal (plusieurs champs d'un coup)
  const updateRowFull = useCallback(
    (updated: EmpruntRow) => {
      setRows((prev) => {
        const idx = prev.findIndex((r) => r.id === updated.id);
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...updated, _dirty: true };
        return next;
      });
    },
    [setRows]
  );

  const removeRow = useCallback(
    (idx: number) => {
      const row = rows[idx];
      if (!row) return;
      if (row.id?.startsWith("__new__")) {
        setRows((prev) => prev.filter((_, i) => i !== idx));
        return;
      }
      startTransition(async () => {
        const res = await deleteEmprunt(row.id!, dossierId);
        if (res.success) {
          setRows((prev) => prev.filter((_, i) => i !== idx));
          toast.success("Emprunt supprimé.");
          invalidateControleStores(dossierId);
        } else {
          toast.error(res.error);
        }
      });
    },
    [rows, setRows, dossierId, invalidateControleStores]
  );

  const saveAll = useCallback(() => {
    startTransition(async () => {
      const dirtyRows = rows.filter((r) => r._dirty);
      const results = await Promise.all(
        dirtyRows.map((row) => {
          const payload: EmpruntRow = {
            id:                    row.id?.startsWith("__new__") ? undefined : row.id,
            libelle:               row.libelle,
            montant:               row.montant,
            tauxAnnuel:            row.tauxAnnuel,
            tauxAssurance:         row.tauxAssurance,
            dureeEnMois:           row.dureeEnMois,
            periodicite:           row.periodicite,
            dateDéblocage:         row.dateDéblocage,
            typeEmprunt:           row.typeEmprunt,
            modaliteRemboursement: row.modaliteRemboursement,
            typeDiffere:           row.typeDiffere,
            dureeDiffereEnMois:    row.dureeDiffereEnMois,
            modeAssurance:         row.modeAssurance,
            fraisDossier:          row.fraisDossier,
            actif:                 row.actif,
            ordre:                 row.ordre,
          };
          return upsertEmprunt(dossierId, payload).then((res) => ({ res, row }));
        })
      );

      let hasError = false;
      setRows((prev) => {
        const next = [...prev];
        for (const { res, row } of results) {
          if (res.success) {
            const i = next.findIndex((r) => r.id === row.id);
            if (i >= 0) next[i] = { ...next[i], id: res.id ?? next[i].id, _dirty: false };
          } else {
            hasError = true;
            toast.error(`Erreur : ${res.error}`);
          }
        }
        return next;
      });

      if (!hasError) toast.success("Emprunts enregistrés.");
      if (!hasError) invalidateControleStores(dossierId);
    });
  }, [rows, dossierId, setRows, invalidateControleStores]);

  const totalEmprunts = rows.reduce((sum, r) => sum + (r.actif !== false ? r.montant : 0), 0);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Emprunts"
        description="Emprunts bancaires et financements externes — échéancier généré automatiquement"
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onSave={saveAll}
      />
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-8">#</Th>
              <Th className="w-8 text-center">Actif</Th>
              <Th className="min-w-40">Libellé</Th>
              <Th className="w-8 text-center">Détail</Th>
              <Th className="w-32">Date déblocage</Th>
              <Th className="w-28">Montant (€)</Th>
              <Th className="w-20">Durée (mois)</Th>
              <Th className="w-16">Taux %</Th>
              <Th className="w-24">Différé (mois)</Th>
              <Th className="w-28">Périodicité</Th>
              <Th className="w-28 italic">Échéance (€)</Th>
              <Th className="w-32 italic">1er rembt.</Th>
              <Th className="w-28 italic">Loyer (€)</Th>
              <Th className="w-8"></Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={14} className="text-center text-muted-foreground text-xs py-6">
                  Aucun emprunt. Cliquez sur « Ajouter » pour commencer.
                </td>
              </tr>
            )}
            {rows.map((row, idx) => {
              const loyer = calculerLoyerMensuel(row);
              const {
                echeanceMoyenne,
                premierRembourement,
              } = resumeEmprunt({ ...row, fraisDossier: row.fraisDossier });
              const nbPeriodes = nbPeriodesFromMois(row.dureeEnMois, row.periodicite);

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-t border-border bg-background hover:bg-muted/30 transition-colors",
                    row._dirty && "bg-amber-50/40 dark:bg-amber-900/10",
                    !(row.actif ?? true) && "opacity-50"
                  )}
                >
                  <Td className="text-center text-xs text-muted-foreground px-1">{idx + 1}</Td>
                  <Td className="text-center px-1">
                    <input
                      type="checkbox"
                      checked={row.actif ?? true}
                      onChange={(e) => updateRow(idx, "actif", e.target.checked)}
                      className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    />
                  </Td>
                  <Td>
                    <input
                      className={cellInput}
                      value={row.libelle}
                      placeholder="Libellé"
                      onChange={(e) => updateRow(idx, "libelle", e.target.value)}
                    />
                  </Td>
                  <Td className="text-center px-1">
                    <button
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                      title="Voir les détails"
                      onClick={() => setModalEmprunt(row)}
                      disabled={isPending}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                  </Td>
                  <Td>
                    <input
                      type="date"
                      className={cellInput}
                      value={row.dateDéblocage}
                      onChange={(e) => updateRow(idx, "dateDéblocage", e.target.value)}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number" min={0} step={0.01}
                      className={cn(cellInput, "text-right")}
                      value={row.montant === 0 ? "" : row.montant}
                      placeholder="0"
                      onChange={(e) => updateRow(idx, "montant", numVal(e.target.value))}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number" min={1} step={1}
                      className={cn(cellInput, "text-right")}
                      value={row.dureeEnMois}
                      onChange={(e) => updateRow(idx, "dureeEnMois", intVal(e.target.value))}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number" min={0} max={100} step={0.01}
                      className={cn(cellInput, "text-right")}
                      value={row.tauxAnnuel === 0 ? "" : row.tauxAnnuel}
                      placeholder="0"
                      onChange={(e) => updateRow(idx, "tauxAnnuel", numVal(e.target.value))}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number" min={0} step={1}
                      className={cn(cellInput, "text-right")}
                      value={row.dureeDiffereEnMois === 0 ? "" : row.dureeDiffereEnMois}
                      placeholder="0"
                      onChange={(e) => updateRow(idx, "dureeDiffereEnMois", intVal(e.target.value))}
                    />
                  </Td>
                  <Td>
                    <select
                      className={cellSelect}
                      value={row.periodicite}
                      onChange={(e) =>
                        updateRow(idx, "periodicite", e.target.value as EmpruntRow["periodicite"])
                      }
                    >
                      {PERIODICITES_EMPRUNT.map((p) => (
                        <option key={p.value} value={p.value} className="bg-background text-foreground">
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </Td>
                  {/* Colonnes calculées (lecture seule) */}
                  <Td className="text-right px-2 text-xs text-muted-foreground bg-muted/20 tabular-nums">
                    {echeanceMoyenne > 0 ? echeanceMoyenne.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                  </Td>
                  <Td className="text-right px-2 text-xs text-muted-foreground bg-muted/20 tabular-nums">
                    {fmtDate(premierRembourement)}
                  </Td>
                  <Td className="text-right px-2 text-xs text-muted-foreground bg-muted/20 tabular-nums">
                    {loyer > 0 && nbPeriodes > 0
                      ? loyer.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : "—"}
                  </Td>
                  <Td className="text-center">
                    <button
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => removeRow(idx)}
                      title="Supprimer"
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t border-border bg-muted/50">
              <tr>
                <td colSpan={5} className="text-right text-xs font-medium text-muted-foreground px-2 py-1.5">
                  Total emprunts actifs
                </td>
                <td className="text-right text-xs font-semibold px-2 py-1.5 tabular-nums">
                  {fmtEur(totalEmprunts)}
                </td>
                <td colSpan={8}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <ModalDetailsEmprunt
        key={modalEmprunt?.id ?? "closed"}
        emprunt={modalEmprunt}
        open={!!modalEmprunt}
        onClose={() => setModalEmprunt(null)}
        onApply={(updated) => updateRowFull(updated)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export interface FinancementFormProps {
  dossierId: string;
  apports?:  ApportRow[];
  emprunts?: EmpruntWithEcheancier[];
  dateDebutExerciceN?: string;
}

export function FinancementForm({
  dossierId,
  apports  = [],
  emprunts = [],
  dateDebutExerciceN,
}: FinancementFormProps) {
  return (
    <div className="h-full space-y-10 overflow-y-auto">
      <TableauApports  dossierId={dossierId} initialData={apports} dateDebutExerciceN={dateDebutExerciceN} />
      <TableauEmprunts dossierId={dossierId} initialData={emprunts} dateDebutExerciceN={dateDebutExerciceN} />
    </div>
  );
}

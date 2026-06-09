"use client";

import { useState, useMemo } from "react";
import { CheckIcon } from "lucide-react";
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
import { cn, numVal } from "@/lib/utils";

import {
  TYPES_EMPRUNT,
  TYPES_DIFFERE,
  PERIODICITES_EMPRUNT,
  MODALITES_REMBOURSEMENT,
  MODES_ASSURANCE,
  type EmpruntRow,
} from "@/lib/schemas/financement";
import { resumeEmprunt } from "@/lib/calcul/echeancier";
import { formatEur, formatDate } from "@/lib/format";
import { intVal } from "../helpers/table-helpers";

const fmtEur  = (n: number) => formatEur(n);
const fmtDate = (dateStr: string) => (dateStr ? formatDate(dateStr) : "—");

// ── Sous-composants ───────────────────────────────────────────────────────────

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <Separator />
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ModalField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
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

// ── Modal principale ──────────────────────────────────────────────────────────

export interface ModalDetailsEmpruntProps {
  emprunt: EmpruntRow | null;
  open: boolean;
  onClose: () => void;
  onApply: (updated: EmpruntRow) => void;
}

export function ModalDetailsEmprunt({
  emprunt,
  open,
  onClose,
  onApply,
}: ModalDetailsEmpruntProps) {
  const [draft, setDraft] = useState<EmpruntRow | null>(
    () =>
      emprunt
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
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const dureeAns  = Math.floor(draft.dureeEnMois / 12);
  const dureeMois = draft.dureeEnMois % 12;
  const dureeTxt  = [
    dureeAns  > 0 ? `${dureeAns} an${dureeAns > 1 ? "s" : ""}` : null,
    dureeMois > 0 ? `${dureeMois} mois` : null,
  ]
    .filter(Boolean)
    .join(" ") || "—";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Détails de l&rsquo;emprunt</DialogTitle>
          <DialogDescription className="text-xs">
            Les champs modifiés ici sont appliqués à la ligne. Cliquez sur{" "}
            <span className="font-medium text-foreground">Enregistrer</span> dans le tableau pour
            sauvegarder en base.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-5 text-sm">
          {/* ── Emprunt ─────────────────────────────────────────────── */}
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
                type="number"
                min={0}
                step={0.01}
                value={draft.montant === 0 ? "" : draft.montant}
                placeholder="0"
                onChange={(e) => set("montant", numVal(e.target.value))}
                className="h-8 text-sm text-right"
              />
            </ModalField>
          </ModalSection>

          {/* ── Remboursement ────────────────────────────────────────── */}
          <ModalSection title="Remboursement">
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
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={draft.tauxAnnuel === 0 ? "" : draft.tauxAnnuel}
                placeholder="0"
                onChange={(e) => set("tauxAnnuel", numVal(e.target.value))}
                className="h-8 text-sm text-right"
              />
            </ModalField>

            <ModalField label={`Durée (mois)${dureeTxt ? ` — ${dureeTxt}` : ""}`}>
              <Input
                type="number"
                min={1}
                step={1}
                value={draft.dureeEnMois}
                onChange={(e) => set("dureeEnMois", intVal(e.target.value))}
                className="h-8 text-sm text-right"
              />
            </ModalField>

            <ModalField label="Différé (mois)">
              <Input
                type="number"
                min={0}
                step={1}
                value={draft.dureeDiffereEnMois === 0 ? "" : draft.dureeDiffereEnMois}
                placeholder="0"
                onChange={(e) => set("dureeDiffereEnMois", intVal(e.target.value))}
                className="h-8 text-sm text-right"
              />
            </ModalField>

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

            <ModalField label="Modalité">
              <Select
                value={draft.modaliteRemboursement}
                onValueChange={(v) =>
                  set("modaliteRemboursement", v as EmpruntRow["modaliteRemboursement"])
                }
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

          {/* ── Assurance ────────────────────────────────────────────── */}
          <ModalSection title="Assurance">
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

            <ModalField label="Taux annuel (%)" hint="Ex. 0.3 % standard — max 5 %">
              <Input
                type="number"
                min={0}
                max={5}
                step={0.001}
                value={draft.tauxAssurance === 0 ? "" : draft.tauxAssurance}
                placeholder="0.3"
                onChange={(e) => set("tauxAssurance", numVal(e.target.value))}
                className="h-8 text-sm text-right"
              />
            </ModalField>
          </ModalSection>

          {/* ── Frais ────────────────────────────────────────────────── */}
          <ModalSection title="Frais">
            <ModalField label="Frais de dossier (€)">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={draft.fraisDossier === 0 ? "" : draft.fraisDossier}
                placeholder="0"
                onChange={(e) => set("fraisDossier", numVal(e.target.value))}
                className="h-8 text-sm text-right"
              />
            </ModalField>
          </ModalSection>

          {/* ── Synthèse ─────────────────────────────────────────────── */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">
              Synthèse calculée
            </p>
            <SynthRow label="Montant de l'échéance" primary>
              {fmtEur(resume.echeanceMoyenne)}
            </SynthRow>
            <SynthRow label="Frais de dossier">{fmtEur(draft.fraisDossier)}</SynthRow>
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

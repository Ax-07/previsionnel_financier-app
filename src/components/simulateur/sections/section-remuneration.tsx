"use client";

import { type UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LandmarkIcon, WandSparklesIcon } from "lucide-react";
import { PARAMS_2026 } from "@/lib/paie/params/2026";
import { type FormValues, HEURES_LEGALES } from "../simulateur-schema";

interface SectionRemunerationProps {
  form: UseFormReturn<FormValues>;
  mode: "brut_to_net" | "net_to_brut";
  onModeChange: (mode: "brut_to_net" | "net_to_brut") => void;
  hsAutoCalc: boolean;
  setHsAutoCalc: (v: boolean) => void;
  onAppliquerSmic: () => void;
}

export function SectionRemuneration({
  form,
  mode,
  onModeChange,
  hsAutoCalc,
  setHsAutoCalc,
  onAppliquerSmic,
}: SectionRemunerationProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Rémunération
        </h3>
        <div className="flex items-center gap-2">
          <span className={mode === "brut_to_net" ? "text-sm font-semibold" : "text-sm text-muted-foreground"}>
            Brut → Net
          </span>
          <Switch
            checked={mode === "net_to_brut"}
            onCheckedChange={(v) => onModeChange(v ? "net_to_brut" : "brut_to_net")}
            aria-label="Basculer entre mode brut→net et net→brut"
          />
          <span className={mode === "net_to_brut" ? "text-sm font-semibold" : "text-sm text-muted-foreground"}>
            Net → Brut
          </span>
        </div>
      </div>

      {mode === "brut_to_net" ? (
        <FormField
          control={form.control}
          name="brutMensuel"
          render={({ field }) => {
            const heures = form.watch("heuresContrat") || HEURES_LEGALES;
            const smicBase =
              Math.round(PARAMS_2026.smicHoraire * Math.min(heures, HEURES_LEGALES) * 100) / 100;
            return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Salaire brut mensuel (€)</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAppliquerSmic}
                    className="h-auto gap-1 border-primary bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15"
                    title={`Appliquer le SMIC — base ${Math.min(heures, HEURES_LEGALES).toFixed(2)} h légales${heures > HEURES_LEGALES ? " (HS calculées séparément)" : ""}`}
                  >
                    <LandmarkIcon className="size-3" />
                    Au SMIC — {smicBase.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                  </Button>
                </div>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={String(PARAMS_2026.smicMensuel.toFixed(2))}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ) : (
        <FormField
          control={form.control}
          name="netCible"
          render={({ field }) => {
            const heures = form.watch("heuresContrat") || HEURES_LEGALES;
            const smicBrut = Math.round(PARAMS_2026.smicHoraire * Math.min(heures, HEURES_LEGALES) * 100) / 100;
            return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Net à payer cible (€)</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAppliquerSmic}
                    className="h-auto gap-1 border-primary bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15"
                    title={`Calculer le net correspondant au SMIC brut proratisé (${smicBrut.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €)`}
                  >
                    <LandmarkIcon className="size-3" />
                    Net SMIC
                  </Button>
                </div>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1 500"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="primesSoumises"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primes soumises (€)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avantagesEnNature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avantages en nature (€)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 items-end">
        <FormField
          control={form.control}
          name="heuresSupplementaires"
          render={({ field }) => {
            const heures = form.watch("heuresContrat") ?? HEURES_LEGALES;
            const hsAuto = hsAutoCalc && heures > HEURES_LEGALES;
            const hsCalculees = Math.round((heures - HEURES_LEGALES) * 100000) / 100000;
            return (
              <FormItem>
                <div className="flex items-center justify-between gap-1">
                  <FormLabel>Heures supplémentaires</FormLabel>
                  {hsAuto ? (
                    <span className="flex items-center gap-1 rounded border border-green-300 bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-400">
                      <WandSparklesIcon className="size-3" />
                      Auto ·{" "}
                      {hsCalculees.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      h
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setHsAutoCalc(true);
                        if (heures > HEURES_LEGALES) {
                          form.setValue("heuresSupplementaires", hsCalculees);
                        }
                      }}
                      className="text-[10px] text-muted-foreground/70 underline underline-offset-2 hover:no-underline focus:outline-none"
                    >
                      Recalculer auto
                    </button>
                  )}
                </div>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    className={hsAuto ? "bg-muted/40" : ""}
                    {...field}
                    onChange={(e) => {
                      setHsAutoCalc(false);
                      field.onChange(parseFloat(e.target.value) || 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="tauxPAS"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taux PAS (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
}

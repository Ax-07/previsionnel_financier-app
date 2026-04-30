"use client";

import { Save, Loader2, Plus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface SectionHeaderProps {
  title: string;
  /** Texte de description affiché sous le titre. */
  description?: string;
  /** Icône affichée à gauche du titre. */
  icon?: React.ReactNode;
  isDirty: boolean;
  isSaving: boolean;
  /** Callback du bouton "Ajouter". Si absent et hideAdd non forcé, le bouton est masqué. */
  onAdd?: () => void;
  onSave: () => void;
  /** Bouton "Groupe" optionnel (ex: investissements). */
  onAddGroup?: () => void;
  /** Force le masquage du bouton "Ajouter". */
  hideAdd?: boolean;
}

/**
 * En-tête de section partagé pour les formulaires de saisie.
 * Affiche titre, description optionnelle, badge de modifications non enregistrées
 * et les boutons Ajouter / Groupe / Enregistrer selon les props fournies.
 */
export function SectionHeader({
  title,
  description,
  icon,
  isDirty,
  isSaving,
  onAdd,
  onSave,
  onAddGroup,
  hideAdd = false,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h3 className="text-base font-semibold leading-snug">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
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
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Enregistrer
          </Button>
        )}
        {onAddGroup && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={onAddGroup}
          >
            <FolderPlus className="h-3 w-3" />
            Groupe
          </Button>
        )}
        {!hideAdd && onAdd && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onAdd}>
            <Plus className="h-3 w-3" />
            Ajouter
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Link, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ToolbarSectionProps } from "./types";
import { getActiveLink, setLink, removeLink } from "./commands";

export const LinkControl: React.FC<ToolbarSectionProps> = ({ editorState, executeCommand }) => {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");

  const activeLink = getActiveLink(editorState);

  const handleOpen = () => {
    setHref(activeLink ? (activeLink.attrs.href as string) : "");
    setOpen(true);
  };

  const handleApply = () => {
    if (href.trim()) executeCommand(setLink(href.trim()));
    setOpen(false);
  };

  const handleRemove = () => {
    executeCommand(removeLink());
    setOpen(false);
  };

  return (
    <>
      <Button
        variant={activeLink ? "secondary" : "ghost"}
        size="default"
        onClick={handleOpen}
        aria-label="Lien hypertexte"
        className="my-0.5"
        title="Lien hypertexte"
      >
        <Link className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{activeLink ? "Modifier le lien" : "Insérer un lien"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="link-href">URL</Label>
            <Input
              id="link-href"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            {activeLink && (
              <Button variant="destructive" onClick={handleRemove}>
                <Link2Off className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleApply} disabled={!href.trim()}>
              {activeLink ? "Modifier" : "Insérer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

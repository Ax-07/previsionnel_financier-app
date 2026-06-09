"use client";

import React, { useState } from "react";
import { Minus, ImageIcon, ChevronDown, Plus } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToolbarSectionProps } from "./types";
import { insertHorizontalRule, insertImage } from "./commands";

export const InsertControls: React.FC<ToolbarSectionProps> = ({ executeCommand }) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [imgAlt, setImgAlt] = useState("");

  const handleInsertImage = () => {
    if (imgSrc.trim()) executeCommand(insertImage(imgSrc.trim(), imgAlt.trim() || undefined));
    setImageOpen(false);
    setImgSrc("");
    setImgAlt("");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="my-0.5 gap-0.5 px-2"
            aria-label="Insérer un élément"
          >
            <Plus className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => executeCommand(insertHorizontalRule())}>
            <Minus className="h-4 w-4 mr-2" />
            Règle horizontale
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setImageOpen(true)}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Image
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insérer une image</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="img-src">{"URL de l'image"}</Label>
              <Input
                id="img-src"
                value={imgSrc}
                onChange={(e) => setImgSrc(e.target.value)}
                placeholder="https://example.com/image.png"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="img-alt">Texte alternatif</Label>
              <Input
                id="img-alt"
                value={imgAlt}
                onChange={(e) => setImgAlt(e.target.value)}
                placeholder="Description de l'image"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageOpen(false)}>Annuler</Button>
            <Button onClick={handleInsertImage} disabled={!imgSrc.trim()}>Insérer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

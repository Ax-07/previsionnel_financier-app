"use client";

import React, { useRef, useState } from "react";
import { ChevronDown, ImagePlus, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { insertContentImage } from "../content-images";
import { insertHorizontalRule } from "./commands";
import { ToolbarSectionProps } from "./types";

export const InsertControls: React.FC<ToolbarSectionProps> = ({ executeCommand }) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [imgAlt, setImgAlt] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleInsertImage = () => {
    const src = imgSrc.trim();
    if (src) executeCommand(insertContentImage({ src, alt: imgAlt.trim() || undefined }));
    setImageOpen(false);
    setImgSrc("");
    setImgAlt("");
  };

  const handlePickImageFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setImgSrc(reader.result);
      setImgAlt((current) => current || file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="default"
        className="my-0.5 gap-1 px-2"
        onClick={() => setImageOpen(true)}
        aria-label="Inserer une image dans le texte"
        title="Inserer une image dans le texte"
      >
        <ImagePlus className="h-4 w-4" />
        {/* <span className="hidden sm:inline">Image contenu</span> */}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="my-0.5 gap-0.5 px-2"
            aria-label="Inserer un element"
            title="Inserer un element"
          >
            <Plus className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => executeCommand(insertHorizontalRule())}>
            <Minus className="h-4 w-4 mr-2" />
            Regle horizontale
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inserer une image dans le texte</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="img-src">URL de l&apos;image</Label>
              <Input
                id="img-src"
                value={imgSrc}
                onChange={(e) => setImgSrc(e.target.value)}
                placeholder="https://example.com/image.png"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
                Choisir un fichier
              </Button>
              <span className="truncate text-xs text-muted-foreground">
                {imgSrc.startsWith("data:image/") ? "Image locale selectionnee" : "Ou importez une image locale"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  handlePickImageFile(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
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
            <Button variant="outline" onClick={() => setImageOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleInsertImage} disabled={!imgSrc.trim()}>
              Inserer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

"use client";

import React, { useRef, useState } from "react";
import { LayoutTemplate, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { PageFormatState, MarginImageOptions, PageBackgroundSize, HeaderFooterImage } from "./types";

interface PageBackgroundControlProps {
  pageFormat: PageFormatState;
  onPageFormatChange: (changes: Partial<PageFormatState>) => void;
}

type LayoutZone = "cover" | "top" | "bottom" | "left" | "right";

interface BannerState {
  url: string;
  opacity: number;
}

const ZONE_LABELS: Record<LayoutZone, string> = {
  cover: "Page de garde",
  top: "Bandeau haut",
  bottom: "Bandeau bas",
  left: "Marge gauche",
  right: "Marge droite",
};

const BG_SIZE_LABELS: Record<PageBackgroundSize, string> = {
  cover: "Remplir",
  contain: "Adapter",
  tile: "Mosaique",
};

const POSITION_LABELS: Record<NonNullable<MarginImageOptions["position"]>, string> = {
  top: "Haut",
  center: "Centre",
  bottom: "Bas",
};

function emptyToUndefined(value: string): string | undefined {
  return value.trim() === "" ? undefined : value.trim();
}

function firstLayoutImage(images?: HeaderFooterImage[]): HeaderFooterImage | undefined {
  return images?.find((image) => image.url.trim() !== "");
}

function initBanner(images?: HeaderFooterImage[]): BannerState {
  const image = firstLayoutImage(images);
  return {
    url: image?.url ?? "",
    opacity: image?.opacity ?? 1,
  };
}

function imageBackground(url: string, size: "cover" | "contain" = "cover"): React.CSSProperties {
  if (!url) return {};
  return {
    backgroundImage: `url("${url.replace(/"/g, '\\"')}")`,
    backgroundSize: size,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  };
}

function OpacityInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        className="flex-1 accent-primary"
        aria-label="Opacite"
      />
      <span className="w-9 text-right text-xs text-muted-foreground">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

function ImageFileInput({
  id,
  value,
  onChange,
  placeholder = "https://... ou /image.png",
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        Image
      </Label>
      <div className="flex gap-1.5">
        <Input
          id={id}
          type="url"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 flex-1 min-w-0 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="Importer une image"
          title="Importer une image"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFile}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

function ZoneButton({
  zone,
  selectedZone,
  className,
  children,
  onSelect,
}: {
  zone: LayoutZone;
  selectedZone: LayoutZone;
  className: string;
  children?: React.ReactNode;
  onSelect: (zone: LayoutZone) => void;
}) {
  const selected = zone === selectedZone;
  return (
    <button
      type="button"
      className={[
        "absolute overflow-hidden border text-[10px] font-medium transition",
        "hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-primary/15 text-primary" : "border-border/70 bg-background/70 text-muted-foreground",
        className,
      ].join(" ")}
      aria-pressed={selected}
      onClick={() => onSelect(zone)}
    >
      {children ?? ZONE_LABELS[zone]}
    </button>
  );
}

function PagePreview({
  title,
  kind,
  selectedZone,
  onSelect,
  bgUrl,
  bgSize,
  topUrl,
  bottomUrl,
  leftUrl,
  leftPosition,
  rightUrl,
  rightPosition,
}: {
  title: string;
  kind: "cover" | "document";
  selectedZone: LayoutZone;
  onSelect: (zone: LayoutZone) => void;
  bgUrl: string;
  bgSize: PageBackgroundSize;
  topUrl: string;
  bottomUrl: string;
  leftUrl: string;
  leftPosition: MarginImageOptions["position"];
  rightUrl: string;
  rightPosition: MarginImageOptions["position"];
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">{title}</p>
      <div className="relative h-72 w-48 rounded-md border bg-white shadow-sm">
        {kind === "cover" ? (
          <ZoneButton
            zone="cover"
            selectedZone={selectedZone}
            className="inset-0 rounded-md bg-muted/20"
            onSelect={onSelect}
          >
            <span
              className="absolute inset-0"
              style={imageBackground(bgUrl, bgSize === "tile" ? "contain" : bgSize)}
            />
            <span className="relative inline-flex h-full w-full items-center justify-center bg-background/55 px-3 text-center">
              Fond page de garde
            </span>
          </ZoneButton>
        ) : (
          <>
            <ZoneButton
              zone="top"
              selectedZone={selectedZone}
              className="left-0 right-0 top-0 h-10 rounded-t-md"
              onSelect={onSelect}
            >
              <span className="absolute inset-0" style={imageBackground(topUrl)} />
              <span className="relative inline-flex h-full w-full items-center justify-center bg-background/45">
                Bandeau haut
              </span>
            </ZoneButton>
            <ZoneButton
              zone="bottom"
              selectedZone={selectedZone}
              className="bottom-0 left-0 right-0 h-10 rounded-b-md"
              onSelect={onSelect}
            >
              <span className="absolute inset-0" style={imageBackground(bottomUrl)} />
              <span className="relative inline-flex h-full w-full items-center justify-center bg-background/45">
                Bandeau bas
              </span>
            </ZoneButton>
            <ZoneButton
              zone="left"
              selectedZone={selectedZone}
              className="bottom-10 left-0 top-10 w-8"
              onSelect={onSelect}
            >
              <span
                className="absolute inset-0"
                style={{
                  ...imageBackground(leftUrl, "contain"),
                  backgroundPosition: `center ${leftPosition ?? "center"}`,
                }}
              />
              <span className="relative flex h-full items-center justify-center bg-background/45 [writing-mode:vertical-rl]">
                Gauche
              </span>
            </ZoneButton>
            <ZoneButton
              zone="right"
              selectedZone={selectedZone}
              className="bottom-10 right-0 top-10 w-8"
              onSelect={onSelect}
            >
              <span
                className="absolute inset-0"
                style={{
                  ...imageBackground(rightUrl, "contain"),
                  backgroundPosition: `center ${rightPosition ?? "center"}`,
                }}
              />
              <span className="relative flex h-full items-center justify-center bg-background/45 [writing-mode:vertical-rl]">
                Droite
              </span>
            </ZoneButton>
            <div className="absolute bottom-12 left-10 right-10 top-12 rounded-sm border border-dashed border-muted-foreground/30 bg-muted/20">
              <div className="space-y-2 p-3">
                <div className="h-2 w-3/4 rounded bg-muted-foreground/25" />
                <div className="h-2 w-full rounded bg-muted-foreground/20" />
                <div className="h-2 w-5/6 rounded bg-muted-foreground/20" />
                <div className="mt-4 h-10 rounded border border-muted-foreground/20" />
                <div className="h-2 w-full rounded bg-muted-foreground/20" />
                <div className="h-2 w-2/3 rounded bg-muted-foreground/20" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const PageBackgroundControl: React.FC<PageBackgroundControlProps> = ({
  pageFormat,
  onPageFormatChange,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<LayoutZone>("cover");

  const [bgUrl, setBgUrl] = useState(pageFormat.pageBackgroundImage ?? "");
  const [bgOpacity, setBgOpacity] = useState(pageFormat.pageBackgroundImageOpacity ?? 1);
  const [bgSize, setBgSize] = useState<PageBackgroundSize>(pageFormat.pageBackgroundImageSize ?? "cover");

  const [leftUrl, setLeftUrl] = useState(pageFormat.marginLeftImage?.url ?? "");
  const [leftOpacity, setLeftOpacity] = useState(pageFormat.marginLeftImage?.opacity ?? 1);
  const [leftPosition, setLeftPosition] = useState<MarginImageOptions["position"]>(
    pageFormat.marginLeftImage?.position ?? "center",
  );

  const [rightUrl, setRightUrl] = useState(pageFormat.marginRightImage?.url ?? "");
  const [rightOpacity, setRightOpacity] = useState(pageFormat.marginRightImage?.opacity ?? 1);
  const [rightPosition, setRightPosition] = useState<MarginImageOptions["position"]>(
    pageFormat.marginRightImage?.position ?? "center",
  );

  const [topBanner, setTopBanner] = useState<BannerState>(
    initBanner(pageFormat.marginTopImages ?? pageFormat.headerImages),
  );
  const [bottomBanner, setBottomBanner] = useState<BannerState>(
    initBanner(pageFormat.marginBottomImages ?? pageFormat.footerImages),
  );

  const isActive =
    !!pageFormat.pageBackgroundImage ||
    !!pageFormat.marginLeftImage ||
    !!pageFormat.marginRightImage ||
    (pageFormat.marginTopImages?.length ?? 0) > 0 ||
    (pageFormat.marginBottomImages?.length ?? 0) > 0 ||
    (pageFormat.headerImages?.length ?? 0) > 0 ||
    (pageFormat.footerImages?.length ?? 0) > 0 ||
    !!pageFormat.showTableOfContents;

  function applyBackground(url: string, opacity: number, size: PageBackgroundSize) {
    const cleanUrl = emptyToUndefined(url);
    onPageFormatChange({
      pageBackgroundImage: cleanUrl,
      pageBackgroundImageOpacity: opacity,
      pageBackgroundImageSize: size,
    });
  }

  function applyLeftMargin(url: string, opacity: number, position: MarginImageOptions["position"]) {
    const cleanUrl = emptyToUndefined(url);
    onPageFormatChange({
      marginLeftImage: cleanUrl ? { url: cleanUrl, opacity, position } : undefined,
    });
  }

  function applyRightMargin(url: string, opacity: number, position: MarginImageOptions["position"]) {
    const cleanUrl = emptyToUndefined(url);
    onPageFormatChange({
      marginRightImage: cleanUrl ? { url: cleanUrl, opacity, position } : undefined,
    });
  }

  function applyBanner(
    field: "marginTopImages" | "marginBottomImages",
    banner: BannerState,
  ) {
    const cleanUrl = emptyToUndefined(banner.url);
    const image: HeaderFooterImage[] | undefined = cleanUrl
      ? [{ url: cleanUrl, position: "center", opacity: banner.opacity }]
      : undefined;
    if (field === "marginTopImages") {
      onPageFormatChange({ marginTopImages: image, headerImages: undefined });
      return;
    }
    onPageFormatChange({ marginBottomImages: image, footerImages: undefined });
  }

  function renderSelectedSettings() {
    if (selectedZone === "cover") {
      return (
        <div className="space-y-3">
          <ImageFileInput
            id="layout-cover-image"
            value={bgUrl}
            onChange={(url) => {
              setBgUrl(url);
              applyBackground(url, bgOpacity, bgSize);
            }}
          />
          <div className="space-y-1.5">
            <Label className="text-xs">Affichage</Label>
            <Select
              value={bgSize}
              onValueChange={(value) => {
                const nextSize = value as PageBackgroundSize;
                setBgSize(nextSize);
                applyBackground(bgUrl, bgOpacity, nextSize);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BG_SIZE_LABELS) as PageBackgroundSize[]).map((key) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {BG_SIZE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Opacite</Label>
            <OpacityInput
              value={bgOpacity}
              onChange={(value) => {
                setBgOpacity(value);
                applyBackground(bgUrl, value, bgSize);
              }}
            />
          </div>
          {bgUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full text-xs"
              onClick={() => {
                setBgUrl("");
                applyBackground("", bgOpacity, bgSize);
              }}
            >
              Supprimer l&apos;image
            </Button>
          )}
        </div>
      );
    }

    if (selectedZone === "top" || selectedZone === "bottom") {
      const isTop = selectedZone === "top";
      const banner = isTop ? topBanner : bottomBanner;
      const setBanner = isTop ? setTopBanner : setBottomBanner;
      const field = isTop ? "marginTopImages" : "marginBottomImages";

      return (
        <div className="space-y-3">
          <ImageFileInput
            id={`layout-${selectedZone}-banner`}
            value={banner.url}
            onChange={(url) => {
              const nextBanner = { ...banner, url };
              setBanner(nextBanner);
              applyBanner(field, nextBanner);
            }}
          />
          <div className="space-y-1.5">
            <Label className="text-xs">Opacite</Label>
            <OpacityInput
              value={banner.opacity}
              onChange={(opacity) => {
                const nextBanner = { ...banner, opacity };
                setBanner(nextBanner);
                applyBanner(field, nextBanner);
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Le bandeau remplit toute la largeur de la page. Sa hauteur suit la marge.
          </p>
          {banner.url && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full text-xs"
              onClick={() => {
                const nextBanner = { url: "", opacity: 1 };
                setBanner(nextBanner);
                applyBanner(field, nextBanner);
              }}
            >
              Supprimer le bandeau
            </Button>
          )}
        </div>
      );
    }

    const isLeft = selectedZone === "left";
    const url = isLeft ? leftUrl : rightUrl;
    const opacity = isLeft ? leftOpacity : rightOpacity;
    const position = isLeft ? leftPosition : rightPosition;
    const setUrl = isLeft ? setLeftUrl : setRightUrl;
    const setOpacity = isLeft ? setLeftOpacity : setRightOpacity;
    const setPosition = isLeft ? setLeftPosition : setRightPosition;
    const apply = isLeft ? applyLeftMargin : applyRightMargin;

    return (
      <div className="space-y-3">
        <ImageFileInput
          id={`layout-${selectedZone}-margin`}
          value={url}
          onChange={(nextUrl) => {
            setUrl(nextUrl);
            apply(nextUrl, opacity, position);
          }}
        />
        <div className="space-y-1.5">
          <Label className="text-xs">Position verticale</Label>
          <Select
            value={position}
            onValueChange={(value) => {
              const nextPosition = value as MarginImageOptions["position"];
              setPosition(nextPosition);
              apply(url, opacity, nextPosition);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(POSITION_LABELS) as NonNullable<MarginImageOptions["position"]>[]).map((key) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {POSITION_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Opacite</Label>
          <OpacityInput
            value={opacity}
            onChange={(nextOpacity) => {
              setOpacity(nextOpacity);
              apply(url, nextOpacity, position);
            }}
          />
        </div>
        {url && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full text-xs"
            onClick={() => {
              setUrl("");
              apply("", opacity, position);
            }}
          >
            Supprimer l&apos;image
          </Button>
        )}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          size="default"
          className="my-0.5 gap-1 px-2"
          aria-label="Mise en page du document"
          title="Mise en page du document"
        >
          <LayoutTemplate className="h-4 w-4" />
          <span className="hidden sm:inline">Mise en page</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-190 max-w-[calc(100vw-2rem)] p-0" align="start">
        <div className="px-4 pb-2 pt-3">
          <p className="text-sm font-semibold">Mise en page du document</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cliquez une zone de page pour choisir son image decorative.
          </p>
        </div>
        <Separator />
        <div className="px-4 pt-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border bg-muted/20 p-3">
            <input
              type="checkbox"
              checked={!!pageFormat.showTableOfContents}
              onChange={(event) => onPageFormatChange({ showTableOfContents: event.target.checked })}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">Table des matieres en page 2</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                La page 1 reste la page de garde, puis une table des matieres est generee avant le contenu.
              </span>
            </span>
          </label>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-[1fr_260px]">
          <div className="flex flex-wrap gap-4">
            <PagePreview
              title="Page de garde"
              kind="cover"
              selectedZone={selectedZone}
              onSelect={setSelectedZone}
              bgUrl={bgUrl}
              bgSize={bgSize}
              topUrl={topBanner.url}
              bottomUrl={bottomBanner.url}
              leftUrl={leftUrl}
              leftPosition={leftPosition}
              rightUrl={rightUrl}
              rightPosition={rightPosition}
            />
            <PagePreview
              title="Pages du document"
              kind="document"
              selectedZone={selectedZone}
              onSelect={setSelectedZone}
              bgUrl={bgUrl}
              bgSize={bgSize}
              topUrl={topBanner.url}
              bottomUrl={bottomBanner.url}
              leftUrl={leftUrl}
              leftPosition={leftPosition}
              rightUrl={rightUrl}
              rightPosition={rightPosition}
            />
          </div>
          <div className="min-w-0 rounded-md border p-3">
            <div className="mb-3">
              <p className="text-sm font-medium">{ZONE_LABELS[selectedZone]}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Reglages de la zone selectionnee.
              </p>
            </div>
            {renderSelectedSettings()}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

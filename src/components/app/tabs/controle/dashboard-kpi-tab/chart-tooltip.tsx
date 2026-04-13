"use client";

import { createContext, useContext, useState } from "react";
import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtK } from "./utils";

export const ChartExpandedContext = createContext(false);

export function useChartExpanded() {
  return useContext(ChartExpandedContext);
}

export const TooltipCurrency = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-background/95 px-2.5 py-2 shadow-lg text-[11px]">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name} :</span>
          <span className="font-medium tabular-nums">{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function ChartPanel({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={cn("relative rounded-md border bg-card px-3 py-2.5 shadow-sm", className)}>
        {title && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1.5 right-1.5 z-10 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(true)}
            aria-label={`Agrandir ${title}`}
          >
            <Maximize2 className="size-3.5" />
          </Button>
        )}
        {children}
      </div>

      {title && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="flex h-[85vh] max-w-5xl flex-col">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <ChartExpandedContext.Provider value={true}>
              <div className="min-h-0 flex-1 pt-2">
                {children}
              </div>
            </ChartExpandedContext.Provider>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

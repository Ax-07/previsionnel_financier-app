import { cn } from "@/lib/utils";
import { fmtK } from "./utils";

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

export function ChartPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-md border bg-card px-3 py-2.5 shadow-sm", className)}>
      {children}
    </div>
  );
}

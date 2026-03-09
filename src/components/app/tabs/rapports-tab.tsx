import { FileBarChartIcon } from "lucide-react";

export default function RapportsTab() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <FileBarChartIcon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">Rapports</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Générez et exportez vos rapports financiers (PDF, Excel). Ce module
          est en cours de développement.
        </p>
      </div>
    </div>
  );
}

import { PresentationIcon } from "lucide-react";

export default function DiaporamaTab() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <PresentationIcon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">Diaporama</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Présentez votre business plan sous forme de diaporama interactif. Ce
          module est en cours de développement.
        </p>
      </div>
    </div>
  );
}

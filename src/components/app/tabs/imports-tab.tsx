import { UploadIcon } from "lucide-react";

export default function ImportsTab() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <UploadIcon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">Imports</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Importez vos données depuis un fichier Excel ou CSV. Ce module est en
          cours de développement.
        </p>
      </div>
    </div>
  );
}

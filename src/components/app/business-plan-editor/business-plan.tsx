"use client";

import { useParams } from "next/navigation";
import { TextEditor } from "./text-editor/TextEditor";

export function BusinessPlan() {
  const params = useParams();
  const dossierId = typeof params?.id === "string" ? params.id : "";

  return (
    <div className="h-full space-y-10 overflow-y-auto px-4 2xl:px-32">
      <TextEditor dossierId={dossierId} />
    </div>
  );
}
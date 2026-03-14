"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Label } from "@/components/ui/label";
import EditorToolbar from "./editor-toolbar";
import { useReportSectionsStore } from "@/stores/report-sections-store";
import { useTiptapDebounce } from "@/hooks/use-tiptap-debounce";
import type { SectionKey } from "@/lib/schemas/rapport";

interface SectionEditorProps {
  dossierId: string;
  sectionKey: SectionKey;
  label: string;
  placeholder?: string;
  maxLength?: number;
}

export default function SectionEditor({
  dossierId,
  sectionKey,
  label,
  placeholder = "Rédigez cette section…",
  maxLength = 5000,
}: SectionEditorProps) {
  const getContent = useReportSectionsStore((s) => s.getContent);
  const setContent = useReportSectionsStore((s) => s.setContent);
  const isDirty = useReportSectionsStore(
    (s) => s.dirty[dossierId]?.has(sectionKey) ?? false
  );
  const debouncedSave = useTiptapDebounce(1500);

  const persisted = getContent(dossierId, sectionKey);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    content: persisted || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[160px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      setContent(dossierId, sectionKey, editor.getHTML());
      debouncedSave(dossierId, sectionKey);
    },
  });

  // Sync l'éditeur quand on navigue vers une autre section
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== persisted) {
      editor.commands.setContent(persisted || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey]);

  const chars = editor?.storage.characterCount.characters() ?? 0;

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-semibold">{label}</Label>

      <div className="rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring">
        {editor && <EditorToolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {chars} / {maxLength} caractères
        </span>
        {isDirty ? (
          <span className="text-amber-500">● Non sauvegardé</span>
        ) : (
          <span className="text-green-600">✓ Enregistré</span>
        )}
      </div>
    </div>
  );
}

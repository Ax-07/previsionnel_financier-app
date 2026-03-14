import { create } from "zustand";
import {
  fetchReportSections,
  upsertReportSection,
} from "@/app/actions/rapport-sections";
import type { SectionKey } from "@/lib/schemas/rapport";

type SectionsCache = Partial<Record<SectionKey, string>>;

interface ReportSectionsState {
  /** dossierId → map sectionKey → contenu HTML */
  cache: Record<string, SectionsCache>;
  /** dossierId → ensemble des clés modifiées non encore persistées */
  dirty: Record<string, Set<SectionKey>>;
  /** `${dossierId}:${sectionKey}` → en cours de sauvegarde */
  saving: Record<string, boolean>;

  load: (dossierId: string) => Promise<void>;
  getContent: (dossierId: string, key: SectionKey) => string;
  setContent: (dossierId: string, key: SectionKey, value: string) => void;
  save: (dossierId: string, key: SectionKey) => Promise<void>;
}

export const useReportSectionsStore = create<ReportSectionsState>((set, get) => ({
  cache: {},
  dirty: {},
  saving: {},

  load: async (dossierId) => {
    if (get().cache[dossierId]) return;
    const rows = await fetchReportSections(dossierId);
    const map: SectionsCache = Object.fromEntries(
      rows.map((r) => [r.sectionKey, r.content])
    );
    set((s) => ({ cache: { ...s.cache, [dossierId]: map } }));
  },

  getContent: (dossierId, key) => get().cache[dossierId]?.[key] ?? "",

  setContent: (dossierId, key, value) => {
    set((s) => ({
      cache: {
        ...s.cache,
        [dossierId]: { ...s.cache[dossierId], [key]: value },
      },
      dirty: {
        ...s.dirty,
        [dossierId]: new Set([...(s.dirty[dossierId] ?? []), key]),
      },
    }));
  },

  save: async (dossierId, key) => {
    const content = get().cache[dossierId]?.[key] ?? "";
    const saveKey = `${dossierId}:${key}`;
    set((s) => ({ saving: { ...s.saving, [saveKey]: true } }));
    try {
      await upsertReportSection({ dossierId, sectionKey: key, content });
      set((s) => {
        const dirty = new Set(s.dirty[dossierId] ?? []);
        dirty.delete(key);
        return {
          saving: { ...s.saving, [saveKey]: false },
          dirty: { ...s.dirty, [dossierId]: dirty },
        };
      });
    } catch {
      set((s) => ({ saving: { ...s.saving, [saveKey]: false } }));
    }
  },
}));

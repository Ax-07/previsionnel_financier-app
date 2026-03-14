"use client";

import { useCallback, useRef } from "react";
import type { SectionKey } from "@/lib/schemas/rapport";
import { useReportSectionsStore } from "@/stores/report-sections-store";

export function useTiptapDebounce(delay = 1500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (dossierId: string, key: SectionKey) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        useReportSectionsStore.getState().save(dossierId, key);
      }, delay);
    },
    [delay]
  );
}

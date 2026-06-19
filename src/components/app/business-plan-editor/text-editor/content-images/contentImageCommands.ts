import type { Command } from "prosemirror-state";

export interface ContentImageAttrs {
  src: string;
  alt?: string;
  title?: string;
}

export function isSafeContentImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (/^data:image\//i.test(trimmed)) return true;
  if (/^(\/|#|\.\.?\/)/.test(trimmed)) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const insertContentImage = ({ src, alt = "", title }: ContentImageAttrs): Command => (state, dispatch) => {
  const { image } = state.schema.nodes;
  if (!image) return false;
  const cleanSrc = src.trim();
  if (!isSafeContentImageSrc(cleanSrc)) return false;
  if (dispatch) {
    dispatch(
      state.tr
        .replaceSelectionWith(image.create({ src: cleanSrc, alt, title: title ?? null }))
        .scrollIntoView(),
    );
  }
  return true;
};

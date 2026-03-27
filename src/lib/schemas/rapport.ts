import { z } from "zod";

export const SECTION_KEYS = [
  "cover_tagline",
  "executive_summary",
  "project_origin",
  "project_mission",
  "project_vision",
  "market_description",
  "market_trends",
  "market_competition",
  "market_targets",
  "business_model_description",
  "strategy_acquisition",
  "strategy_communication",
  "strategy_partnerships",
  "team_founder",
  "team_members",
  "operations_suppliers",
  "operations_logistics",
  "funding_usage",
  "annex",
  // Document complet (JSON Tiptap) — éditeur full-page
  "full_doc",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const upsertReportSectionSchema = z.object({
  dossierId: z.string().cuid(),
  sectionKey: z.enum(SECTION_KEYS),
  content: z.string().max(500_000),
});

export type UpsertReportSectionValues = z.infer<typeof upsertReportSectionSchema>;

export type ReportSectionRow = {
  sectionKey: SectionKey;
  content: string;
  updatedAt: Date;
};

/**
 * Closed sets used across the product. Strings are stable identifiers; labels live in en.json.
 */
export const VERDICT_STATUS = [
  "cleared",
  "fix_required",
  "refused",
  "abstained",
] as const;
export type VerdictStatus = (typeof VERDICT_STATUS)[number];

export const FIX_KIND = ["opener", "sponsor", "market"] as const;
export type FixKind = (typeof FIX_KIND)[number];

export const EVIDENCE_SOURCE = ["live", "sample", "none"] as const;
export type EvidenceSource = (typeof EVIDENCE_SOURCE)[number];

export const AFFINITY_LABEL = ["low", "mid", "strong"] as const;
export type AffinityLabel = (typeof AFFINITY_LABEL)[number];

export const DEAL_LEVEL = ["ok", "warn", "refuse"] as const;
export type DealLevel = (typeof DEAL_LEVEL)[number];

export const JOB_STATUS = ["queued", "running", "done", "failed"] as const;
export type JobStatus = (typeof JOB_STATUS)[number];

export const COVERAGE_CODE = [
  "ENTITY_RESOLVED",
  "ENTITY_UNRESOLVED",
  "HEATMAP_OK",
  "HEATMAP_SPARSE",
  "DEMOGRAPHICS_OK",
  "DEMOGRAPHICS_MISSING",
  "OPENERS",
  "SPONSORS",
  "ALT_MARKET",
] as const;
export type CoverageCode = (typeof COVERAGE_CODE)[number];

/** Lamp colour per verdict: the one place the mapping lives. */
export const STATUS_TONE: Record<
  VerdictStatus,
  "green" | "amber" | "red" | "blue"
> = {
  cleared: "green",
  fix_required: "amber",
  refused: "red",
  abstained: "blue",
};

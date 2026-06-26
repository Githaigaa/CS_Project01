export interface RegionalDataPoint {
  region: string;
  count: number;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

export interface DiseaseDataPoint {
  disease: string;
  cases: number;
  color: string;
}

export interface ComplianceSummary {
  traceability_rate: number;
  total_animals: number;
  active_holdings: number;
}

export interface ReportsOverview {
  date_range: { start: string; end: string };
  regional_data: RegionalDataPoint[];
  monthly_revenue: MonthlyRevenuePoint[];
  disease_data: DiseaseDataPoint[];
  compliance: ComplianceSummary;
}

export type ReportType =
  | "herd"
  | "health"
  | "movement"
  | "marketplace"
  | "slaughter"
  | "outbreak";

export type ReportExportFormat = "pdf" | "csv";

export type DateRangePreset = "30" | "90" | "180" | "365" | "custom";

export interface ReportDateParams {
  range?: DateRangePreset;
  startDate?: string;
  endDate?: string;
}

export interface ReportDetail {
  report_type: ReportType;
  title: string;
  date_range: { start: string; end: string };
  summary: Record<string, unknown>;
  rows: Record<string, unknown>[];
  columns: string[];
}

export const EMPTY_OVERVIEW: ReportsOverview = {
  date_range: { start: "", end: "" },
  regional_data: [],
  monthly_revenue: [],
  disease_data: [],
  compliance: {
    traceability_rate: 0,
    total_animals: 0,
    active_holdings: 0,
  },
};

/** Map custom report builder UI labels to API report types. */
export const BUILDER_REPORT_TYPE_MAP: Record<string, ReportType> = {
  "Animal Inventory": "herd",
  "Movement History": "movement",
  "Health Records": "health",
  "Financial Summary": "marketplace",
};

/** Map quick report button labels to API report types. */
export const QUICK_REPORT_TYPE_MAP: Record<string, ReportType> = {
  "Animal Inventory Report": "herd",
  "Movement Summary": "movement",
  "Health Records Report": "health",
  "Ownership Transfer Log": "marketplace",
  "Regional Distribution": "herd",
};

/** Map date range select labels to API preset values. */
export const DATE_RANGE_MAP: Record<string, DateRangePreset> = {
  "Last 30 days": "30",
  "Last 90 days": "90",
  "Last 6 months": "180",
  "Last year": "365",
  "Custom range": "custom",
};

export function buildDateQueryParams(params: ReportDateParams): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.startDate) query.start_date = params.startDate;
  if (params.endDate) query.end_date = params.endDate;
  if (params.range && params.range !== "custom") {
    query.range = params.range;
  } else if (params.range === "custom" && !params.startDate) {
    query.range = "365";
  }
  return query;
}

export function getFilenameFromDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="([^"]+)"/.exec(header);
  return match?.[1] ?? fallback;
}

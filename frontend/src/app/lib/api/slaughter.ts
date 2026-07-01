import type { SlaughterRecord } from "../types";
import type { PaginatedResponse } from "./animals";

export interface ApiAbattoir {
  id: number;
  name: string;
  license_no: string;
  county: string;
  address: string;
  contact: string;
  is_active: boolean;
}

export type ApiInspectionResult = "passed" | "passed_partial" | "condemned";

export interface ApiSlaughterRecord {
  id: number;
  animal: number;
  animal_tag: string;
  abattoir: number | null;
  abattoir_detail: ApiAbattoir | null;
  slaughter_date: string;
  slaughter_no: string;
  live_weight_kg: string;
  carcass_weight_kg: string;
  dressing_percentage: string | null;
  hide_weight_kg: string | null;
  offal_weight_kg: string | null;
  inspector: number | null;
  inspection_result: ApiInspectionResult;
  condemnation_reason: string;
  meat_grade: string;
  notes: string;
  created_at: string;
}

export interface SlaughterRecordListParams {
  page?: number;
  pageSize?: number;
  ordering?: "slaughter_date" | "-slaughter_date" | "created_at" | "-created_at";
}

export type SlaughterRecordListResponse = PaginatedResponse<ApiSlaughterRecord> | ApiSlaughterRecord[];

const inspectionVerified: Record<ApiInspectionResult, boolean> = {
  passed: true,
  passed_partial: true,
  condemned: false,
};

export function mapApiSlaughterRecordToSlaughterRecord(record: ApiSlaughterRecord): SlaughterRecord {
  return {
    id: String(record.id),
    animalId: String(record.animal),
    animalRfid: record.animal_tag,
    abattoirId: record.abattoir ? String(record.abattoir) : "",
    abattoirName: record.abattoir_detail?.name ?? "Unknown abattoir",
    chainNumber: record.slaughter_no,
    carcassId: record.meat_grade ? `GRADE-${record.meat_grade}` : record.slaughter_no,
    slaughterDate: record.slaughter_date,
    // Surface the condemnation reason (set by the inspector on the backend)
    // ahead of free-form notes — previously this field wasn't modeled on the
    // frontend at all, so condemned animals showed no reason in the UI.
    feedback: record.condemnation_reason || record.notes || undefined,
    verified: inspectionVerified[record.inspection_result] ?? false,
  };
}

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

export interface ApiAbattoirPayload {
  name: string;
  license_no: string;
  county: string;
  address?: string;
  contact?: string;
  is_active?: boolean;
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
  batch_number: string;
  live_weight_kg: string;
  carcass_weight_kg: string;
  dressing_percentage: string | null;
  hide_weight_kg: string | null;
  offal_weight_kg: string | null;
  inspector: number | null;
  inspector_name: string | null;
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

export interface SlaughterStats {
  total: number;
  this_week: number;
  today: number;
  this_month: number;
  verified: number;
  compliance_rate: number;
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
    batchNumber: record.batch_number || undefined,
    carcassId: record.slaughter_no,
    slaughterDate: record.slaughter_date,
    liveWeightKg: record.live_weight_kg ? parseFloat(record.live_weight_kg) : undefined,
    carcassWeightKg: record.carcass_weight_kg ? parseFloat(record.carcass_weight_kg) : undefined,
    dressingPct: record.dressing_percentage ? parseFloat(record.dressing_percentage) : undefined,
    inspectionResult: record.inspection_result,
    meatGrade: record.meat_grade || undefined,
    inspectorName: record.inspector_name || undefined,
    feedback: record.condemnation_reason || record.notes || undefined,
    verified: inspectionVerified[record.inspection_result] ?? false,
  };
}

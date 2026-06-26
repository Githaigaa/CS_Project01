import type { HealthEvent } from "../types";
import type { PaginatedResponse } from "./animals";

export type ApiHealthRecordType =
  | "vaccination"
  | "treatment"
  | "examination"
  | "deworming"
  | "dipping"
  | "other";

export interface ApiDisease {
  id: number;
  name: string;
  description: string;
  is_notifiable: boolean;
}

export interface ApiVaccine {
  id: number;
  name: string;
  manufacturer: string;
  validity_days: number;
}

export interface ApiHealthRecord {
  id: number;
  animal: number;
  animal_tag: string;
  record_type: ApiHealthRecordType;
  date: string;
  vet: number | null;
  diagnosis: number | null;
  diagnosis_detail: ApiDisease | null;
  vaccine_used: number | null;
  vaccine_used_detail: ApiVaccine | null;
  medication: string;
  dosage: string;
  next_due_date: string | null;
  temperature: string | null;
  notes: string;
  certificate_no: string;
  created_at: string;
}

export interface HealthRecordListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  animal?: string;
  disease?: string;
  ordering?: "date" | "-date" | "created_at" | "-created_at";
}

export interface HealthRecordPayload {
  animal: number;
  record_type: ApiHealthRecordType;
  date: string;
  diagnosis?: number | null;
  vaccine_used?: number | null;
  medication?: string;
  dosage?: string;
  next_due_date?: string | null;
  temperature?: string | null;
  notes?: string;
  certificate_no?: string;
}

export type HealthRecordListResponse = PaginatedResponse<ApiHealthRecord> | ApiHealthRecord[];

function getEventType(record: ApiHealthRecord): HealthEvent["eventType"] {
  if (record.record_type === "vaccination") return "Vaccination";
  if (record.diagnosis_detail) return "Disease";
  if (record.record_type === "other") return "Treatment";
  return "Treatment";
}

export function mapApiHealthRecordToHealthEvent(record: ApiHealthRecord): HealthEvent {
  const eventType = getEventType(record);
  const disease = record.diagnosis_detail?.name || (eventType === "Disease" ? record.medication : undefined);
  const vaccine = record.vaccine_used_detail?.name || (eventType === "Vaccination" ? record.medication : undefined);

  return {
    id: String(record.id),
    animalId: String(record.animal),
    animalRfid: record.animal_tag,
    eventType,
    disease,
    vaccine,
    date: record.date,
    recordedBy: record.vet ? `Vet #${record.vet}` : "CattleTrace",
    credentialLevel: record.vet ? "Veterinary record" : "Authorized record",
    notes: record.notes || undefined,
    severity: eventType === "Disease" ? "Medium" : "Low",
  };
}

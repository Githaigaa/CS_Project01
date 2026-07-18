/**
 * lib/api/animalProfile.ts
 * Raw Django REST Framework response shapes for the Animal Profile related
 * resources, plus mapper functions to the frontend UI types.
 */

import type { HealthEvent, Movement, Transaction } from "../types";
import type { PaginatedResponse } from "./animals";
import { mapApiTransactionToTransaction } from "./transactions";

// ─────────────────────────────────────────────
// Raw API response types (mirror DRF serializers)
// ─────────────────────────────────────────────

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
  /** "vaccination" | "treatment" | "examination" | "deworming" | "dipping" | "other" */
  record_type: string;
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

export interface ApiMovementRecord {
  id: number;
  animal: number;
  animal_tag: string;
  permit: number | null;
  origin_farm: number | null;
  destination_farm: number | null;
  origin_county: string;
  destination_county: string;
  move_date: string;
  /** "sale" | "grazing" | "breeding" | "slaughter" | "exhibition" | "other" */
  purpose: string;
  transporter: string;
  vehicle_reg: string;
  recorded_by: number | null;
  gps_latitude: string | null;
  gps_longitude: string | null;
  created_at: string;
}

export interface ApiTransaction {
  id: number;
  listing: number;
  buyer: number;
  seller: number;
  animal_tag?: string;
  asking_price?: string;
  buyer_name?: string;
  seller_name?: string;
  agreed_price: string;
  payment_method: string;
  payment_status: "pending" | "paid" | "failed";
  payment_ref: string;
  transaction_date: string;
  notes: string;
}

// ─────────────────────────────────────────────
// Re-export paginated wrapper for convenience
// ─────────────────────────────────────────────

export type ApiHealthRecordList = PaginatedResponse<ApiHealthRecord> | ApiHealthRecord[];
export type ApiMovementRecordList = PaginatedResponse<ApiMovementRecord> | ApiMovementRecord[];
export type ApiTransactionList = PaginatedResponse<ApiTransaction> | ApiTransaction[];

// ─────────────────────────────────────────────
// Normalise paginated-or-array response
// ─────────────────────────────────────────────

export function normalizeListResponse<T>(
  data: PaginatedResponse<T> | T[],
): PaginatedResponse<T> {
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return data;
}

// ─────────────────────────────────────────────
// Mapper: ApiHealthRecord → HealthEvent (UI type)
// ─────────────────────────────────────────────

// NOTE: eventType/severity logic must stay identical to
// `mapApiHealthRecordToHealthEvent` in `./health.ts` — both mappers render the
// *same* HealthRecord rows (Health Records screen vs. Animal Profile health
// tab) and previously disagreed on classification, causing the same record to
// show as "Disease" in one screen and "Treatment" in the other.
function getEventType(r: ApiHealthRecord): HealthEvent["eventType"] {
  if (r.record_type === "vaccination") return "Vaccination";
  if (r.diagnosis_detail) return "Disease";
  return "Treatment";
}

export function mapApiHealthRecord(r: ApiHealthRecord): HealthEvent {
  const eventType = getEventType(r);
  const disease = r.diagnosis_detail?.name || (eventType === "Disease" ? r.medication : undefined);
  const vaccine = r.vaccine_used_detail?.name || (eventType === "Vaccination" ? r.medication : undefined);

  return {
    id: String(r.id),
    animalId: String(r.animal),
    animalRfid: r.animal_tag,
    eventType,
    disease,
    vaccine,
    date: r.date,
    recordedBy: r.vet ? `Vet #${r.vet}` : "Unknown",
    credentialLevel: r.vet ? "Licensed Veterinary Officer" : "Authorized record",
    notes: r.notes || undefined,
    // Kept in sync with health.ts: severity is derived from eventType, not
    // from disease.is_notifiable, since HealthRecord stores no severity field.
    severity: eventType === "Disease" ? "Medium" : "Low",
  };
}

// ─────────────────────────────────────────────
// Mapper: ApiMovementRecord → Movement (UI type)
// ─────────────────────────────────────────────

const PURPOSE_LABEL: Record<string, Movement["purpose"]> = {
  sale: "Sale",
  grazing: "Grazing",
  breeding: "Breeding",
  slaughter: "Slaughter",
  exhibition: "Transfer",
  other: "Transfer",
};

export function mapApiMovementRecord(r: ApiMovementRecord): Movement {
  return {
    id: String(r.id),
    animalId: String(r.animal),
    animalRfid: r.animal_tag,
    fromHolding: r.origin_county
      ? `${r.origin_county}${r.origin_farm ? ` (Farm #${r.origin_farm})` : ""}`
      : `Farm #${r.origin_farm ?? "?"}`,
    toHolding: r.destination_county
      ? `${r.destination_county}${r.destination_farm ? ` (Farm #${r.destination_farm})` : ""}`
      : `Farm #${r.destination_farm ?? "?"}`,
    movementDate: r.move_date,
    purpose: PURPOSE_LABEL[r.purpose] ?? "Transfer",
    permitNumber: r.permit ? `Permit #${r.permit}` : undefined,
    crossBorder: r.origin_county !== r.destination_county,
    // All movement records retrieved from the API are already completed.
    status: "Completed",
  };
}

// ─────────────────────────────────────────────
// Mapper: ApiTransaction → Transaction (UI type)
// ─────────────────────────────────────────────

export function mapApiTransaction(r: ApiTransaction): Transaction {
  return mapApiTransactionToTransaction(r);
}

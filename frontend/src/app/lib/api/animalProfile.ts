/**
 * lib/api/animalProfile.ts
 * Raw Django REST Framework response shapes for the Animal Profile related
 * resources, plus mapper functions to the frontend UI types.
 */

import type { HealthEvent, Movement, Transaction } from "../types";
import type { PaginatedResponse } from "./animals";

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
  agreed_price: string;
  payment_method: string;
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

const RECORD_TYPE_LABEL: Record<string, HealthEvent["eventType"]> = {
  vaccination: "Vaccination",
  treatment: "Treatment",
  examination: "Treatment",
  deworming: "Treatment",
  dipping: "Treatment",
  other: "Treatment",
};

export function mapApiHealthRecord(r: ApiHealthRecord): HealthEvent {
  return {
    id: String(r.id),
    animalId: String(r.animal),
    animalRfid: r.animal_tag,
    eventType: RECORD_TYPE_LABEL[r.record_type] ?? "Treatment",
    disease: r.diagnosis_detail?.name || undefined,
    vaccine: r.vaccine_used_detail?.name || undefined,
    date: r.date,
    recordedBy: r.vet ? `Vet #${r.vet}` : "Unknown",
    credentialLevel: "Licensed Veterinary Officer",
    notes: r.notes || undefined,
    // Severity is not stored on HealthRecord; default to Low unless it's a
    // notifiable disease.
    severity: r.diagnosis_detail?.is_notifiable ? "High" : "Low",
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
  return {
    id: String(r.id),
    animalId: String(r.listing),
    animalRfid: "",
    seller: `Owner #${r.seller}`,
    buyer: `Buyer #${r.buyer}`,
    askingPrice: parseFloat(r.agreed_price),
    agreedPrice: parseFloat(r.agreed_price),
    paymentStatus: "Paid",
    saleDate: r.transaction_date.split("T")[0],
    status: "Completed",
  };
}

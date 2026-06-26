import type { Movement } from "../types";
import type { PaginatedResponse } from "./animals";

export type ApiMovementPurpose = "sale" | "grazing" | "breeding" | "slaughter" | "exhibition" | "other";
export type ApiMovementPermitStatus = "pending" | "approved" | "rejected" | "expired";

export interface ApiMovementPermit {
  id: number;
  permit_number: string;
  issued_by: number | null;
  issued_on: string;
  valid_until: string;
  status: ApiMovementPermitStatus;
  notes: string;
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
  purpose: ApiMovementPurpose;
  transporter: string;
  vehicle_reg: string;
  recorded_by: number | null;
  gps_latitude: string | null;
  gps_longitude: string | null;
  created_at: string;
}

export interface MovementListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  animal?: string;
  purpose?: ApiMovementPurpose | "";
  permitStatus?: ApiMovementPermitStatus | "";
  ordering?: "move_date" | "-move_date" | "created_at" | "-created_at";
}

export interface MovementPermitListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ApiMovementPermitStatus | "";
  ordering?: "issued_on" | "-issued_on" | "valid_until" | "-valid_until";
}

export interface MovementPayload {
  animal: number;
  permit?: number | null;
  origin_farm?: number | null;
  destination_farm?: number | null;
  origin_county: string;
  destination_county: string;
  move_date: string;
  purpose: ApiMovementPurpose;
  transporter?: string;
  vehicle_reg?: string;
  gps_latitude?: string | null;
  gps_longitude?: string | null;
}

export interface MovementPermitPayload {
  permit_number: string;
  valid_until: string;
  status?: ApiMovementPermitStatus;
  notes?: string;
}

export type MovementListResponse = PaginatedResponse<ApiMovementRecord> | ApiMovementRecord[];
export type MovementPermitListResponse = PaginatedResponse<ApiMovementPermit> | ApiMovementPermit[];

const purposeLabels: Record<ApiMovementPurpose, Movement["purpose"]> = {
  sale: "Sale",
  grazing: "Grazing",
  breeding: "Breeding",
  slaughter: "Slaughter",
  exhibition: "Transfer",
  other: "Transfer",
};

function deriveStatus(record: ApiMovementRecord, permit?: ApiMovementPermit): Movement["status"] {
  if (permit?.status === "pending") return "Pending";
  if (permit?.status === "rejected") return "Rejected";
  if (permit?.status === "expired") return "Rejected";

  const today = new Date();
  const moveDate = new Date(`${record.move_date}T00:00:00`);
  if (moveDate > today) return "Pending";
  if (moveDate.toDateString() === today.toDateString()) return "In Transit";
  return "Completed";
}

export function mapApiMovementToMovement(
  record: ApiMovementRecord,
  permitsById: Record<number, ApiMovementPermit> = {},
): Movement {
  const permit = record.permit ? permitsById[record.permit] : undefined;

  return {
    id: String(record.id),
    animalId: String(record.animal),
    animalRfid: record.animal_tag,
    fromHolding: record.origin_farm ? `Holding #${record.origin_farm}` : record.origin_county,
    toHolding: record.destination_farm ? `Holding #${record.destination_farm}` : record.destination_county,
    movementDate: record.move_date,
    purpose: purposeLabels[record.purpose],
    permitNumber: permit?.permit_number,
    crossBorder: record.origin_county.trim().toLowerCase() !== record.destination_county.trim().toLowerCase(),
    status: deriveStatus(record, permit),
  };
}

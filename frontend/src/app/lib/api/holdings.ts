/**
 * lib/api/holdings.ts
 * TypeScript interfaces mirroring DRF FarmSerializer fields, plus mapper
 * functions that convert the raw API shapes to the UI Holding type.
 */

// ─────────────────────────────────────────────
// Raw API response (mirrors FarmSerializer)
// ─────────────────────────────────────────────

export interface ApiFarm {
  id: number;
  owner: number | null;
  name: string;
  registration_no: string;
  county: string;
  sub_county: string;
  ward: string;
  gps_latitude: string | null;
  gps_longitude: string | null;
  total_area_acres: string | null;
  animal_count: number;
  created_at: string;
}

// ─────────────────────────────────────────────
// Paginated list response
// ─────────────────────────────────────────────

export interface PaginatedFarms {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiFarm[];
}

// ─────────────────────────────────────────────
// Write payload (fields accepted by DRF on POST/PATCH)
// ─────────────────────────────────────────────

export interface HoldingPayload {
  name: string;
  registration_no: string;
  county: string;
  sub_county?: string;
  ward?: string;
  gps_latitude?: string | null;
  gps_longitude?: string | null;
  total_area_acres?: string | null;
}

// ─────────────────────────────────────────────
// Query params for listing
// ─────────────────────────────────────────────

export interface HoldingListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: "created_at" | "-created_at" | "name" | "-name";
}

// ─────────────────────────────────────────────
// UI-friendly shape (used in the Holdings screen)
// ─────────────────────────────────────────────

export interface UiHolding {
  id: number;
  name: string;
  registrationNo: string;
  owner: string;
  county: string;
  subCounty: string;
  ward: string;
  animalCount: number;
  totalAreaAcres: number | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Mapper
// ─────────────────────────────────────────────

export function mapApiFarmToHolding(f: ApiFarm): UiHolding {
  return {
    id: f.id,
    name: f.name,
    registrationNo: f.registration_no,
    owner: f.owner ? `Owner #${f.owner}` : "Unassigned",
    county: f.county,
    subCounty: f.sub_county,
    ward: f.ward,
    animalCount: f.animal_count,
    totalAreaAcres: f.total_area_acres ? parseFloat(f.total_area_acres) : null,
    gpsLatitude: f.gps_latitude ? parseFloat(f.gps_latitude) : null,
    gpsLongitude: f.gps_longitude ? parseFloat(f.gps_longitude) : null,
    createdAt: f.created_at,
  };
}

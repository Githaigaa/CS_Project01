/**
 * services/api/holdings.ts
 * Full CRUD Axios service for the Holdings / Farms resource.
 *
 * DRF endpoint base: /api/v1/holdings/
 * Lookup field: id (numeric PK, default DRF router)
 *
 * Supported operations:
 *   GET    /holdings/           — paginated list with search + ordering
 *   GET    /holdings/{id}/      — single record
 *   POST   /holdings/           — create (owner assigned server-side)
 *   PATCH  /holdings/{id}/      — partial update
 *   DELETE /holdings/{id}/      — destroy
 */

import type {
  ApiFarm,
  HoldingListParams,
  HoldingPayload,
  PaginatedFarms,
} from "../../lib/api/holdings";
import { apiClient } from "./client";

// ─────────────────────────────────────────────
// LIST — GET /holdings/
// ─────────────────────────────────────────────

async function listHoldings(params: HoldingListParams = {}): Promise<PaginatedFarms> {
  const { data } = await apiClient.get<PaginatedFarms | ApiFarm[]>("/holdings/", {
    params: {
      page: params.page,
      page_size: params.pageSize,
      search: params.search || undefined,
      ordering: params.ordering,
    },
  });

  // Normalise: DRF may return a plain array if pagination is disabled
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return data;
}

// ─────────────────────────────────────────────
// GET ONE — GET /holdings/{id}/
// ─────────────────────────────────────────────

async function getHolding(id: number): Promise<ApiFarm> {
  const { data } = await apiClient.get<ApiFarm>(`/holdings/${id}/`);
  return data;
}

// ─────────────────────────────────────────────
// CREATE — POST /holdings/
// ─────────────────────────────────────────────

async function createHolding(payload: HoldingPayload): Promise<ApiFarm> {
  const { data } = await apiClient.post<ApiFarm>("/holdings/", payload);
  return data;
}

// ─────────────────────────────────────────────
// UPDATE — PATCH /holdings/{id}/
// ─────────────────────────────────────────────

async function updateHolding(id: number, payload: Partial<HoldingPayload>): Promise<ApiFarm> {
  const { data } = await apiClient.patch<ApiFarm>(`/holdings/${id}/`, payload);
  return data;
}

// ─────────────────────────────────────────────
// FULL UPDATE — PUT /holdings/{id}/
// ─────────────────────────────────────────────

async function replaceHolding(id: number, payload: HoldingPayload): Promise<ApiFarm> {
  const { data } = await apiClient.put<ApiFarm>(`/holdings/${id}/`, payload);
  return data;
}

// ─────────────────────────────────────────────
// DELETE — DELETE /holdings/{id}/
// ─────────────────────────────────────────────

async function deleteHolding(id: number): Promise<void> {
  await apiClient.delete(`/holdings/${id}/`);
}

// ─────────────────────────────────────────────
// Named export (consistent with other services)
// ─────────────────────────────────────────────

export const holdingsApi = {
  listHoldings,
  getHolding,
  createHolding,
  updateHolding,
  replaceHolding,
  deleteHolding,
};

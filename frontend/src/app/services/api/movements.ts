import type { PaginatedResponse } from "../../lib/api/animals";
import type {
  ApiMovementPermit,
  ApiMovementRecord,
  MovementListParams,
  MovementListResponse,
  MovementPayload,
  MovementPermitListParams,
  MovementPermitListResponse,
  MovementPermitPayload,
} from "../../lib/api/movements";
import { apiClient } from "./client";

function normalizeMovementList(data: MovementListResponse): PaginatedResponse<ApiMovementRecord> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data,
    };
  }

  return data;
}

function normalizePermitList(data: MovementPermitListResponse): PaginatedResponse<ApiMovementPermit> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data,
    };
  }

  return data;
}

export const movementsApi = {
  async listMovements(params: MovementListParams = {}): Promise<PaginatedResponse<ApiMovementRecord>> {
    const { data } = await apiClient.get<MovementListResponse>("/movements/", {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search || undefined,
        animal: params.animal || undefined,
        purpose: params.purpose || undefined,
        permit_status: params.permitStatus || undefined,
        ordering: params.ordering,
      },
    });
    return normalizeMovementList(data);
  },

  async getMovement(id: number | string): Promise<ApiMovementRecord> {
    const { data } = await apiClient.get<ApiMovementRecord>(`/movements/${id}/`);
    return data;
  },

  async createMovement(payload: MovementPayload): Promise<ApiMovementRecord> {
    const { data } = await apiClient.post<ApiMovementRecord>("/movements/", payload);
    return data;
  },

  async updateMovement(id: number | string, payload: Partial<MovementPayload>): Promise<ApiMovementRecord> {
    const { data } = await apiClient.patch<ApiMovementRecord>(`/movements/${id}/`, payload);
    return data;
  },

  async deleteMovement(id: number | string): Promise<void> {
    await apiClient.delete(`/movements/${id}/`);
  },

  async listPermits(params: MovementPermitListParams = {}): Promise<PaginatedResponse<ApiMovementPermit>> {
    const { data } = await apiClient.get<MovementPermitListResponse>("/movement-permits/", {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search || undefined,
        status: params.status || undefined,
        ordering: params.ordering,
      },
    });
    return normalizePermitList(data);
  },

  async getPermit(id: number | string): Promise<ApiMovementPermit> {
    const { data } = await apiClient.get<ApiMovementPermit>(`/movement-permits/${id}/`);
    return data;
  },

  async createPermit(payload: MovementPermitPayload): Promise<ApiMovementPermit> {
    const { data } = await apiClient.post<ApiMovementPermit>("/movement-permits/", payload);
    return data;
  },

  async updatePermit(
    id: number | string,
    payload: Partial<MovementPermitPayload>,
  ): Promise<ApiMovementPermit> {
    const { data } = await apiClient.patch<ApiMovementPermit>(`/movement-permits/${id}/`, payload);
    return data;
  },
};

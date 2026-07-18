import type {
  ApiHealthRecord,
  HealthRecordListParams,
  HealthRecordListResponse,
  HealthRecordPayload,
} from "../../lib/api/health";
import type { PaginatedResponse } from "../../lib/api/animals";
import { apiClient } from "./client";

function toFormDataOrJson(payload: Partial<HealthRecordPayload>): FormData | Partial<HealthRecordPayload> {
  if (!payload.vet_document) return payload;
  const fd = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) continue;
    fd.append(key, value instanceof File ? value : String(value));
  }
  return fd;
}

function normalizeListResponse(data: HealthRecordListResponse): PaginatedResponse<ApiHealthRecord> {
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

export const healthApi = {
  async listHealthRecords(params: HealthRecordListParams = {}): Promise<PaginatedResponse<ApiHealthRecord>> {
    const { data } = await apiClient.get<HealthRecordListResponse>("/health-events/", {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search || undefined,
        animal: params.animal || undefined,
        disease: params.disease || undefined,
        ordering: params.ordering,
      },
    });
    return normalizeListResponse(data);
  },

  async getHealthRecord(id: number | string): Promise<ApiHealthRecord> {
    const { data } = await apiClient.get<ApiHealthRecord>(`/health-events/${id}/`);
    return data;
  },

  async createHealthRecord(payload: HealthRecordPayload): Promise<ApiHealthRecord> {
    const body = toFormDataOrJson(payload);
    const headers = body instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
    const { data } = await apiClient.post<ApiHealthRecord>("/health-events/", body, { headers });
    return data;
  },

  async updateHealthRecord(
    id: number | string,
    payload: Partial<HealthRecordPayload>,
  ): Promise<ApiHealthRecord> {
    const body = toFormDataOrJson(payload);
    const headers = body instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
    const { data } = await apiClient.patch<ApiHealthRecord>(`/health-events/${id}/`, body, { headers });
    return data;
  },

  async deleteHealthRecord(id: number | string): Promise<void> {
    await apiClient.delete(`/health-events/${id}/`);
  },
};

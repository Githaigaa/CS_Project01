import type {
  ApiHealthRecord,
  HealthRecordListParams,
  HealthRecordListResponse,
  HealthRecordPayload,
} from "../../lib/api/health";
import type { PaginatedResponse } from "../../lib/api/animals";
import { apiClient } from "./client";

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
    const { data } = await apiClient.post<ApiHealthRecord>("/health-events/", payload);
    return data;
  },

  async updateHealthRecord(
    id: number | string,
    payload: Partial<HealthRecordPayload>,
  ): Promise<ApiHealthRecord> {
    const { data } = await apiClient.patch<ApiHealthRecord>(`/health-events/${id}/`, payload);
    return data;
  },

  async deleteHealthRecord(id: number | string): Promise<void> {
    await apiClient.delete(`/health-events/${id}/`);
  },
};

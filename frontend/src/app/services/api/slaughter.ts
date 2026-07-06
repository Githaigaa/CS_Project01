import type {
  ApiAbattoir,
  ApiAbattoirPayload,
  ApiSlaughterRecord,
  SlaughterRecordListParams,
  SlaughterRecordListResponse,
  SlaughterStats,
} from "../../lib/api/slaughter";
import type { PaginatedResponse } from "../../lib/api/animals";
import { apiClient } from "./client";

function normalizeListResponse(data: SlaughterRecordListResponse): PaginatedResponse<ApiSlaughterRecord> {
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return data;
}

export const slaughterApi = {
  async listSlaughterRecords(
    params: SlaughterRecordListParams = {},
  ): Promise<PaginatedResponse<ApiSlaughterRecord>> {
    const { data } = await apiClient.get<SlaughterRecordListResponse>("/slaughter-records/", {
      params: {
        page: params.page,
        page_size: params.pageSize,
        ordering: params.ordering ?? "-slaughter_date",
      },
    });
    return normalizeListResponse(data);
  },

  async getStats(): Promise<SlaughterStats> {
    const { data } = await apiClient.get<SlaughterStats>("/slaughter-records/stats/");
    return data;
  },

  async acceptRecord(id: number): Promise<ApiSlaughterRecord> {
    const { data } = await apiClient.post<ApiSlaughterRecord>(`/slaughter-records/${id}/accept/`);
    return data;
  },

  async listAbattoirs(): Promise<ApiAbattoir[]> {
    const { data } = await apiClient.get<ApiAbattoir[] | PaginatedResponse<ApiAbattoir>>("/abattoirs/");
    if (Array.isArray(data)) return data;
    return data.results;
  },

  async createAbattoir(payload: ApiAbattoirPayload): Promise<ApiAbattoir> {
    const { data } = await apiClient.post<ApiAbattoir>("/abattoirs/", payload);
    return data;
  },

  async updateAbattoir(id: number, payload: Partial<ApiAbattoirPayload>): Promise<ApiAbattoir> {
    const { data } = await apiClient.patch<ApiAbattoir>(`/abattoirs/${id}/`, payload);
    return data;
  },
};

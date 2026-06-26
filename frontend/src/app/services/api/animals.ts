import type {
  AnimalListParams,
  AnimalPayload,
  ApiAnimal,
  PaginatedResponse,
} from "../../lib/api/animals";
import { apiClient } from "./client";

type AnimalListResponse = PaginatedResponse<ApiAnimal> | ApiAnimal[];

function normalizeListResponse(data: AnimalListResponse): PaginatedResponse<ApiAnimal> {
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

export const animalsApi = {
  async listAnimals(params: AnimalListParams = {}): Promise<PaginatedResponse<ApiAnimal>> {
    const { data } = await apiClient.get<AnimalListResponse>("/animals/", {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search || undefined,
        ordering: params.ordering,
      },
    });
    return normalizeListResponse(data);
  },

  async getAnimal(tagNumber: string): Promise<ApiAnimal> {
    const { data } = await apiClient.get<ApiAnimal>(`/animals/${encodeURIComponent(tagNumber)}/`);
    return data;
  },

  async createAnimal(payload: AnimalPayload): Promise<ApiAnimal> {
    const { data } = await apiClient.post<ApiAnimal>("/animals/", payload);
    return data;
  },

  async updateAnimal(tagNumber: string, payload: Partial<AnimalPayload>): Promise<ApiAnimal> {
    const { data } = await apiClient.patch<ApiAnimal>(
      `/animals/${encodeURIComponent(tagNumber)}/`,
      payload,
    );
    return data;
  },

  async deleteAnimal(tagNumber: string): Promise<void> {
    await apiClient.delete(`/animals/${encodeURIComponent(tagNumber)}/`);
  },
};

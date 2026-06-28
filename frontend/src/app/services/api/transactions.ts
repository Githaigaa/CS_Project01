import type {
  ApiTransaction,
  TransactionListParams,
  TransactionListResponse,
} from "../../lib/api/transactions";
import type { PaginatedResponse } from "../../lib/api/animals";
import { apiClient } from "./client";

function normalizeListResponse(data: TransactionListResponse): PaginatedResponse<ApiTransaction> {
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

export const transactionsApi = {
  async listTransactions(
    params: TransactionListParams = {},
  ): Promise<PaginatedResponse<ApiTransaction>> {
    const { data } = await apiClient.get<TransactionListResponse>("/marketplace/transactions/", {
      params: {
        page: params.page,
        page_size: params.pageSize,
        ordering: params.ordering ?? "-transaction_date",
      },
    });
    return normalizeListResponse(data);
  },
};

import type {
  ApiTransaction,
  ApiTransactionStats,
  TransactionListParams,
  TransactionListResponse,
} from "../../lib/api/transactions";
import type { PaginatedResponse } from "../../lib/api/animals";
import { apiClient } from "./client";

function normalizeListResponse(data: TransactionListResponse): PaginatedResponse<ApiTransaction> {
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
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
        payment_status: params.payment_status && params.payment_status !== "all"
          ? params.payment_status
          : undefined,
      },
    });
    return normalizeListResponse(data);
  },

  async getStats(): Promise<ApiTransactionStats> {
    const { data } = await apiClient.get<ApiTransactionStats>(
      "/marketplace/transactions/stats/",
    );
    return data;
  },

  async updatePaymentStatus(
    id: number,
    payment_status: "pending" | "paid" | "failed",
    payment_ref?: string,
  ): Promise<ApiTransaction> {
    const { data } = await apiClient.patch<ApiTransaction>(
      `/marketplace/transactions/${id}/`,
      { payment_status, ...(payment_ref !== undefined ? { payment_ref } : {}) },
    );
    return data;
  },
};

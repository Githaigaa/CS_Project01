import type { Transaction } from "../types";
import type { PaginatedResponse } from "./animals";

export interface ApiTransaction {
  id: number;
  listing: number;
  animal_tag?: string;
  asking_price?: string;
  buyer: number;
  buyer_name?: string;
  seller: number;
  seller_name?: string;
  agreed_price: string;
  payment_method: string;
  payment_status: "pending" | "paid" | "failed";
  payment_ref: string;
  transaction_date: string;
  notes: string;
}

export interface ApiTransactionStats {
  total: number;
  total_revenue: string;
  pending: number;
  paid: number;
  failed: number;
}

export interface TransactionListParams {
  page?: number;
  pageSize?: number;
  ordering?: "transaction_date" | "-transaction_date";
  payment_status?: "pending" | "paid" | "failed" | "all";
}

export type TransactionListResponse = PaginatedResponse<ApiTransaction> | ApiTransaction[];

export function mapApiTransactionToTransaction(record: ApiTransaction): Transaction {
  const agreedPrice = Number(record.agreed_price);
  const askingPrice = record.asking_price ? Number(record.asking_price) : agreedPrice;

  const paymentStatus: Transaction["paymentStatus"] =
    record.payment_status === "paid"
      ? "Paid"
      : record.payment_status === "failed"
      ? "Failed"
      : "Pending";

  return {
    id: String(record.id),
    animalId: String(record.listing),
    animalRfid: record.animal_tag ?? "",
    seller: record.seller_name ?? `Seller #${record.seller}`,
    buyer: record.buyer_name ?? `Buyer #${record.buyer}`,
    askingPrice,
    agreedPrice,
    paymentStatus,
    saleDate: record.transaction_date.split("T")[0],
    status: "Completed",
  };
}

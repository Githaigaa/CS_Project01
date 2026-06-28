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
  payment_ref: string;
  transaction_date: string;
  notes: string;
}

export interface TransactionListParams {
  page?: number;
  pageSize?: number;
  ordering?: "transaction_date" | "-transaction_date";
}

export type TransactionListResponse = PaginatedResponse<ApiTransaction> | ApiTransaction[];

export function mapApiTransactionToTransaction(record: ApiTransaction): Transaction {
  const agreedPrice = Number(record.agreed_price);
  const askingPrice = record.asking_price ? Number(record.asking_price) : agreedPrice;

  return {
    id: String(record.id),
    animalId: String(record.listing),
    animalRfid: record.animal_tag ?? "",
    seller: record.seller_name ?? `Seller #${record.seller}`,
    buyer: record.buyer_name ?? `Buyer #${record.buyer}`,
    askingPrice,
    agreedPrice,
    paymentStatus: record.payment_ref ? "Paid" : "Pending",
    saleDate: record.transaction_date.split("T")[0],
    status: "Completed",
  };
}

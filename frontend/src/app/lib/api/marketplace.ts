import type { MarketplaceListing } from "../types";
import type { ApiAnimal, PaginatedResponse } from "./animals";
import { mapApiAnimalToAnimal } from "./animals";

export type ApiListingStatus = "active" | "sold" | "withdrawn" | "expired";

export interface ApiMarketplaceListing {
  id: number;
  animal: number;
  animal_detail: ApiAnimal;
  seller: number;
  asking_price: string;
  is_negotiable: boolean;
  description: string;
  location_county: string;
  status: ApiListingStatus;
  listed_on: string;
  expires_on: string | null;
  views_count: number;
  updated_at: string;
}

export interface MarketplaceListingListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  species?: string;
  minPrice?: string;
  maxPrice?: string;
  location?: string;
  status?: ApiListingStatus | "";
  ordering?: "listed_on" | "-listed_on" | "asking_price" | "-asking_price";
}

export interface MarketplaceListingPayload {
  animal: number;
  asking_price: string;
  is_negotiable?: boolean;
  description?: string;
  location_county: string;
  status?: ApiListingStatus;
  expires_on?: string | null;
}

export interface ApiMarketplaceInquiry {
  id: number;
  listing: number;
  buyer: number;
  message: string;
  offer_price: string | null;
  sent_at: string;
  is_read: boolean;
}

export interface MarketplaceInquiryListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  listing?: number | string;
  ordering?: "sent_at" | "-sent_at" | "offer_price" | "-offer_price";
}

export interface MarketplaceInquiryPayload {
  listing: number;
  message: string;
  offer_price?: string | null;
}

export type MarketplaceListingListResponse =
  | PaginatedResponse<ApiMarketplaceListing>
  | ApiMarketplaceListing[];

export type MarketplaceInquiryListResponse =
  | PaginatedResponse<ApiMarketplaceInquiry>
  | ApiMarketplaceInquiry[];

const statusLabels: Record<ApiListingStatus, MarketplaceListing["status"]> = {
  active: "Active",
  sold: "Sold",
  withdrawn: "Withdrawn",
  expired: "Withdrawn",
};

export function mapApiListingToListing(listing: ApiMarketplaceListing, inquiryCount = 0): MarketplaceListing {
  return {
    id: String(listing.id),
    animalId: String(listing.animal),
    animal: mapApiAnimalToAnimal(listing.animal_detail),
    askingPrice: Number(listing.asking_price),
    description: listing.description,
    seller: `Seller #${listing.seller}`,
    listedDate: listing.listed_on,
    status: statusLabels[listing.status],
    views: listing.views_count,
    offers: inquiryCount,
  };
}

import type { PaginatedResponse } from "../../lib/api/animals";
import type {
  ApiMarketplaceInquiry,
  ApiMarketplaceListing,
  MarketplaceInquiryListParams,
  MarketplaceInquiryListResponse,
  MarketplaceInquiryPayload,
  MarketplaceListingListParams,
  MarketplaceListingListResponse,
  MarketplaceListingPayload,
} from "../../lib/api/marketplace";
import { apiClient } from "./client";

function normalizeListingList(
  data: MarketplaceListingListResponse,
): PaginatedResponse<ApiMarketplaceListing> {
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

function normalizeInquiryList(
  data: MarketplaceInquiryListResponse,
): PaginatedResponse<ApiMarketplaceInquiry> {
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

export const marketplaceApi = {
  async listListings(
    params: MarketplaceListingListParams = {},
  ): Promise<PaginatedResponse<ApiMarketplaceListing>> {
    const { data } = await apiClient.get<MarketplaceListingListResponse>("/marketplace/listings/", {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search || undefined,
        species: params.species || undefined,
        min_price: params.minPrice || undefined,
        max_price: params.maxPrice || undefined,
        location: params.location || undefined,
        status: params.status || undefined,
        ordering: params.ordering,
      },
    });
    return normalizeListingList(data);
  },

  async getListing(id: number | string): Promise<ApiMarketplaceListing> {
    const { data } = await apiClient.get<ApiMarketplaceListing>(`/marketplace/listings/${id}/`);
    return data;
  },

  async createListing(payload: MarketplaceListingPayload): Promise<ApiMarketplaceListing> {
    const { data } = await apiClient.post<ApiMarketplaceListing>("/marketplace/listings/", payload);
    return data;
  },

  async updateListing(
    id: number | string,
    payload: Partial<MarketplaceListingPayload>,
  ): Promise<ApiMarketplaceListing> {
    const { data } = await apiClient.patch<ApiMarketplaceListing>(
      `/marketplace/listings/${id}/`,
      payload,
    );
    return data;
  },

  async deleteListing(id: number | string): Promise<void> {
    await apiClient.delete(`/marketplace/listings/${id}/`);
  },

  async listInquiries(
    params: MarketplaceInquiryListParams = {},
  ): Promise<PaginatedResponse<ApiMarketplaceInquiry>> {
    const { data } = await apiClient.get<MarketplaceInquiryListResponse>("/marketplace/inquiries/", {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search || undefined,
        listing: params.listing || undefined,
        ordering: params.ordering,
      },
    });
    return normalizeInquiryList(data);
  },

  async getInquiry(id: number | string): Promise<ApiMarketplaceInquiry> {
    const { data } = await apiClient.get<ApiMarketplaceInquiry>(`/marketplace/inquiries/${id}/`);
    return data;
  },

  async createInquiry(payload: MarketplaceInquiryPayload): Promise<ApiMarketplaceInquiry> {
    const { data } = await apiClient.post<ApiMarketplaceInquiry>("/marketplace/inquiries/", payload);
    return data;
  },
};

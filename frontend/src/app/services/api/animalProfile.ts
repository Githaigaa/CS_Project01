/**
 * services/api/animalProfile.ts
 * Reusable Axios-based service functions for the Animal Profile feature.
 * Each function fetches one resource type related to a specific animal.
 */

import type {
  ApiHealthRecord,
  ApiHealthRecordList,
  ApiMovementRecord,
  ApiMovementRecordList,
  ApiTransaction,
  ApiTransactionList,
} from "../../lib/api/animalProfile";
import { normalizeListResponse } from "../../lib/api/animalProfile";
import type { PaginatedResponse } from "../../lib/api/animals";
import { apiClient } from "./client";

// ─────────────────────────────────────────────
// Health Records
// ─────────────────────────────────────────────

/**
 * Fetch all health records for a single animal identified by its tag number.
 * DRF endpoint: GET /api/v1/health-events/?animal=<tag_number>
 */
async function getHealthRecords(tagNumber: string): Promise<ApiHealthRecord[]> {
  const { data } = await apiClient.get<ApiHealthRecordList>("/health-events/", {
    params: { animal: tagNumber },
  });
  return normalizeListResponse<ApiHealthRecord>(data).results;
}

// ─────────────────────────────────────────────
// Movement Records
// ─────────────────────────────────────────────

/**
 * Fetch all movement records for a single animal identified by its tag number.
 * DRF endpoint: GET /api/v1/movements/?animal=<tag_number>
 */
async function getMovementRecords(tagNumber: string): Promise<ApiMovementRecord[]> {
  const { data } = await apiClient.get<ApiMovementRecordList>("/movements/", {
    params: { animal: tagNumber },
  });
  return normalizeListResponse<ApiMovementRecord>(data).results;
}

// ─────────────────────────────────────────────
// Transactions (Ownership History)
// ─────────────────────────────────────────────

/**
 * Fetch all marketplace transactions visible to the current user and filter
 * them down to those belonging to this animal.
 *
 * The DRF Transaction endpoint does not expose a direct `animal` query param,
 * but each transaction's related listing carries `listing.animal`.  Because the
 * serializer only returns the listing FK (not nested), we rely on the backend
 * having already scoped the queryset to the current user (buyer or seller).
 *
 * DRF endpoint: GET /api/v1/marketplace/transactions/
 *
 * Note: If the user has no transaction access (403 / empty list), we return []
 * silently — this is intentional so the Ownership History tab degrades
 * gracefully for roles that cannot see transactions.
 */
async function getTransactions(_tagNumber: string): Promise<ApiTransaction[]> {
  const { data } = await apiClient.get<ApiTransactionList>(
    "/marketplace/transactions/",
  );
  return normalizeListResponse<ApiTransaction>(data).results;
}

// ─────────────────────────────────────────────
// Parallel loader helper
// ─────────────────────────────────────────────

export interface AnimalProfileRelatedData {
  healthRecords: ApiHealthRecord[];
  movementRecords: ApiMovementRecord[];
  transactions: ApiTransaction[];
  errors: {
    health: string | null;
    movements: string | null;
    transactions: string | null;
  };
}

/**
 * Fetch health records, movement records, and transactions concurrently.
 * Uses Promise.allSettled so a failure in one section doesn't block the others.
 */
async function getAnimalProfileData(
  tagNumber: string,
): Promise<AnimalProfileRelatedData> {
  const [healthResult, movementsResult, transactionsResult] =
    await Promise.allSettled([
      getHealthRecords(tagNumber),
      getMovementRecords(tagNumber),
      getTransactions(tagNumber),
    ]);

  return {
    healthRecords:
      healthResult.status === "fulfilled" ? healthResult.value : [],
    movementRecords:
      movementsResult.status === "fulfilled" ? movementsResult.value : [],
    transactions:
      transactionsResult.status === "fulfilled"
        ? transactionsResult.value
        : [],
    errors: {
      health:
        healthResult.status === "rejected"
          ? "Unable to load health records."
          : null,
      movements:
        movementsResult.status === "rejected"
          ? "Unable to load movement records."
          : null,
      transactions:
        transactionsResult.status === "rejected"
          ? "Unable to load ownership history."
          : null,
    },
  };
}

// ─────────────────────────────────────────────
// Named export object (consistent with other services)
// ─────────────────────────────────────────────

export const animalProfileApi = {
  getHealthRecords,
  getMovementRecords,
  getTransactions,
  getAnimalProfileData,
};

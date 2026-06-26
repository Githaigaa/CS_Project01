/**
 * services/api/dashboard.ts
 * Reusable Axios service for the Dashboard screen.
 *
 * Design decisions:
 *  - Stat counts use page_size=1 so DRF only scans for count — no wasted payload.
 *  - All six count requests run in ONE Promise.allSettled batch (no waterfall).
 *  - Recent lists (movements, health) run in a SECOND parallel batch.
 *  - A failure in any single request never blocks other sections.
 */

import type { ApiHealthRecord, ApiMovementRecord } from "../../lib/api/animalProfile";
import { normalizeListResponse } from "../../lib/api/animalProfile";
import type {
  DashboardData,
  DashboardStats,
  PaginatedCount,
} from "../../lib/api/dashboard";
import { EMPTY_STATS } from "../../lib/api/dashboard";
import { apiClient } from "./client";

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/** Fetch only the `count` field from a paginated DRF endpoint. */
async function fetchCount(endpoint: string, params?: Record<string, unknown>): Promise<number> {
  const { data } = await apiClient.get<PaginatedCount>(endpoint, {
    params: { page_size: 1, ...params },
  });
  // Some endpoints may return a plain array (non-paginated) — handle gracefully.
  if (Array.isArray(data)) return (data as unknown[]).length;
  return data.count ?? 0;
}

/** Fetch up to `limit` items from a paginated DRF endpoint. */
async function fetchRecent<T>(endpoint: string, limit: number, params?: Record<string, unknown>): Promise<T[]> {
  const { data } = await apiClient.get<{ count: number; results: T[] } | T[]>(endpoint, {
    params: { page_size: limit, ...params },
  });
  return normalizeListResponse<T>(data as { count: number; next: string | null; previous: string | null; results: T[] } | T[]).results;
}

// ─────────────────────────────────────────────
// Public stat functions
// ─────────────────────────────────────────────

async function getTotalAnimals(): Promise<number> {
  return fetchCount("/animals/");
}

async function getActiveHoldings(): Promise<number> {
  return fetchCount("/holdings/");
}

async function getMarketplaceListings(): Promise<number> {
  return fetchCount("/marketplace/listings/");
}

async function getHealthAlerts(): Promise<number> {
  return fetchCount("/health-events/");
}

async function getPendingPermits(): Promise<number> {
  return fetchCount("/movement-permits/");
}

async function getRecentTransactionCount(): Promise<number> {
  return fetchCount("/marketplace/transactions/");
}

// ─────────────────────────────────────────────
// Public list functions
// ─────────────────────────────────────────────

async function getRecentMovements(limit = 5): Promise<ApiMovementRecord[]> {
  return fetchRecent<ApiMovementRecord>("/movements/", limit);
}

async function getRecentHealthEvents(limit = 5): Promise<ApiHealthRecord[]> {
  return fetchRecent<ApiHealthRecord>("/health-events/", limit);
}

// ─────────────────────────────────────────────
// Orchestrator — single call from the Dashboard
// ─────────────────────────────────────────────

/**
 * Load all dashboard data in two parallel batches.
 *
 * Batch 1 (stats) — six count-only requests run simultaneously.
 * Batch 2 (lists) — movements and health events run simultaneously.
 *
 * Promise.allSettled ensures a single failure never blocks other sections.
 */
async function getDashboardData(): Promise<DashboardData> {
  // ── Batch 1: counts ──────────────────────────────────────────────────────
  const [
    animalsResult,
    holdingsResult,
    listingsResult,
    healthResult,
    permitsResult,
    transactionsResult,
  ] = await Promise.allSettled([
    getTotalAnimals(),
    getActiveHoldings(),
    getMarketplaceListings(),
    getHealthAlerts(),
    getPendingPermits(),
    getRecentTransactionCount(),
  ]);

  const stats: DashboardStats = {
    totalAnimals:
      animalsResult.status === "fulfilled" ? animalsResult.value : EMPTY_STATS.totalAnimals,
    activeHoldings:
      holdingsResult.status === "fulfilled" ? holdingsResult.value : EMPTY_STATS.activeHoldings,
    marketplaceListings:
      listingsResult.status === "fulfilled" ? listingsResult.value : EMPTY_STATS.marketplaceListings,
    healthAlerts:
      healthResult.status === "fulfilled" ? healthResult.value : EMPTY_STATS.healthAlerts,
    pendingPermits:
      permitsResult.status === "fulfilled" ? permitsResult.value : EMPTY_STATS.pendingPermits,
    recentTransactions:
      transactionsResult.status === "fulfilled"
        ? transactionsResult.value
        : EMPTY_STATS.recentTransactions,
  };

  const statsError =
    [animalsResult, holdingsResult, listingsResult, healthResult, permitsResult, transactionsResult]
      .every((r) => r.status === "rejected")
      ? "Unable to load statistics. Please try again."
      : null;

  // ── Batch 2: recent lists ────────────────────────────────────────────────
  const [movementsResult, recentHealthResult] = await Promise.allSettled([
    getRecentMovements(5),
    getRecentHealthEvents(5),
  ]);

  return {
    stats,
    recentMovements:
      movementsResult.status === "fulfilled" ? movementsResult.value : [],
    recentHealthEvents:
      recentHealthResult.status === "fulfilled" ? recentHealthResult.value : [],
    errors: {
      stats: statsError,
      movements:
        movementsResult.status === "rejected"
          ? "Unable to load recent movements."
          : null,
      health:
        recentHealthResult.status === "rejected"
          ? "Unable to load recent health events."
          : null,
    },
  };
}

// ─────────────────────────────────────────────
// Named export (consistent with other services)
// ─────────────────────────────────────────────

export const dashboardApi = {
  getTotalAnimals,
  getActiveHoldings,
  getMarketplaceListings,
  getHealthAlerts,
  getPendingPermits,
  getRecentTransactionCount,
  getRecentMovements,
  getRecentHealthEvents,
  getDashboardData,
};

/**
 * lib/api/dashboard.ts
 * TypeScript interfaces that mirror DRF serializer output for every resource
 * consumed by the Dashboard screen, plus the aggregated DashboardData shape.
 */

import type { ApiHealthRecord, ApiMovementRecord } from "./animalProfile";

// ─────────────────────────────────────────────
// Paginated wrapper (re-usable, DRF standard)
// ─────────────────────────────────────────────

export interface PaginatedCount {
  count: number;
  next: string | null;
  previous: string | null;
  results: unknown[];
}

// ─────────────────────────────────────────────
// Aggregated stat counters (one per stat card)
// ─────────────────────────────────────────────

export interface DashboardStats {
  totalAnimals: number;
  activeHoldings: number;
  marketplaceListings: number;
  healthAlerts: number;
  pendingPermits: number;
  recentTransactions: number;
}

// ─────────────────────────────────────────────
// Full dashboard payload returned by the service
// ─────────────────────────────────────────────

export interface DashboardData {
  stats: DashboardStats;
  recentMovements: ApiMovementRecord[];
  recentHealthEvents: ApiHealthRecord[];
  errors: {
    stats: string | null;
    movements: string | null;
    health: string | null;
  };
}

// ─────────────────────────────────────────────
// Fallback / empty defaults
// ─────────────────────────────────────────────

export const EMPTY_STATS: DashboardStats = {
  totalAnimals: 0,
  activeHoldings: 0,
  marketplaceListings: 0,
  healthAlerts: 0,
  pendingPermits: 0,
  recentTransactions: 0,
};

export const EMPTY_DASHBOARD: DashboardData = {
  stats: EMPTY_STATS,
  recentMovements: [],
  recentHealthEvents: [],
  errors: { stats: null, movements: null, health: null },
};

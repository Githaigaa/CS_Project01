/**
 * components/Skeleton.tsx
 * Shimmer loading placeholder. Uses CSS variables so it respects both
 * light and dark themes automatically. No new CSS file required.
 */

import { cn } from "../lib/utils";

interface SkeletonProps {
  /** Extra Tailwind classes for sizing / spacing. */
  className?: string;
}

/**
 * A single shimmer bar. Compose multiples to match the shape of the
 * real content so layout never shifts when data arrives.
 *
 * @example
 * // Stat card placeholder
 * <Skeleton className="h-8 w-24 mt-2" />
 *
 * // List row placeholder
 * <Skeleton className="h-4 w-full" />
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className,
      )}
    />
  );
}

/**
 * Stat card skeleton — mirrors the layout of the six KPI cards on the
 * Dashboard so dimensions are preserved during loading.
 */
export function StatCardSkeleton() {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-20 mt-2" />
        <Skeleton className="h-3 w-28 mt-1" />
      </div>
      <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
    </div>
  );
}

/**
 * Activity list row skeleton — mirrors the two-line + badge layout used
 * in "Recent Movement Activity" and "Recent Health Events".
 */
export function ActivityRowSkeleton() {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
    </div>
  );
}

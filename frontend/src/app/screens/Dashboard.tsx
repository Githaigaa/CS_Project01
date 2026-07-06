import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Badge } from "../components/Badge";
import { StatCardSkeleton, ActivityRowSkeleton } from "../components/Skeleton";
import {
  Beef,
  MapPin,
  Store,
  AlertTriangle,
  TrendingUp,
  Receipt,
  ArrowUp,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatDate } from "../lib/utils";
import { getApiErrorMessage } from "../services/api/errors";
import { dashboardApi } from "../services/api/dashboard";
import { mapApiMovementRecord, mapApiHealthRecord } from "../lib/api/animalProfile";
import type { DashboardData } from "../lib/api/dashboard";
import { EMPTY_DASHBOARD } from "../lib/api/dashboard";
import type { Movement, HealthEvent } from "../lib/types";
import { animalsApi } from "../services/api/animals";
import { mapApiAnimalToAnimal } from "../lib/api/animals";

// ─────────────────────────────────────────────
// Static / illustrative chart data
// These charts require time-series aggregation that has no dedicated DRF
// endpoint yet. They remain static and are clearly marked as illustrative.
// ─────────────────────────────────────────────

const CHART_COLORS = ["#2E7D32", "#FF9800", "#1565C0", "#F59E0B", "#64748B"];

function getMonthLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleString("en", { month: "short" });
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function Dashboard() {
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Derived UI lists — mapped from raw API shapes to UI types
  const [movements, setMovements] = useState<Movement[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [animalBreedData, setAnimalBreedData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setLoading(true);
      setLoadError(null);
      const [result, animalResult] = await Promise.allSettled([
        dashboardApi.getDashboardData(),
        animalsApi.listAnimals({ pageSize: 100, ordering: "-registration_date" }),
      ]);
      if (!isCurrent) return;

      if (result.status === "fulfilled") {
        setData(result.value);
        setMovements(result.value.recentMovements.map(mapApiMovementRecord));
        setHealthEvents(result.value.recentHealthEvents.map(mapApiHealthRecord));
      } else {
        setLoadError(getApiErrorMessage(result.reason, "Unable to load dashboard data. Please refresh the page."));
      }

      if (animalResult.status === "fulfilled") {
        const breedCounts = animalResult.value.results
          .map(mapApiAnimalToAnimal)
          .reduce<Record<string, number>>((counts, animal) => {
            counts[animal.breed] = (counts[animal.breed] || 0) + 1;
            return counts;
          }, {});
        setAnimalBreedData(
          Object.entries(breedCounts).map(([name, value], index) => ({
            name,
            value,
            color: CHART_COLORS[index % CHART_COLORS.length],
          })),
        );
      } else {
        setAnimalBreedData([]);
      }
      setLoading(false);
    }

    load();
    return () => { isCurrent = false; };
  }, []);

  const { stats, errors } = data;
  const populationData = useMemo(
    () => [{ month: "Current", count: stats.totalAnimals }],
    [stats.totalAnimals],
  );
  const movementData = useMemo(() => {
    const counts = movements.reduce<Record<string, number>>((acc, movement) => {
      const month = getMonthLabel(movement.movementDate);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([month, count]) => ({ month, movements: count }));
  }, [movements]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your livestock management system</p>
      </div>

      {loadError && (
        <div className="text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-md">
          {loadError}
        </div>
      )}

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Total Animals */}
        <Card>
          <CardHeader>
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Total Animals</CardTitle>
                  <div className="text-3xl font-semibold mt-2">
                    {stats.totalAnimals.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Beef className="w-6 h-6 text-primary" />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!loading && (
              <div className="flex items-center gap-2 text-green-600">
                <ArrowUp className="w-4 h-4" />
                <span>Live count from registry</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Holdings */}
        <Card>
          <CardHeader>
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Active Holdings</CardTitle>
                  <div className="text-3xl font-semibold mt-2">
                    {stats.activeHoldings.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-secondary" />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!loading && (
              <div className="flex items-center gap-2 text-green-600">
                <ArrowUp className="w-4 h-4" />
                <span>Registered holdings</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Marketplace Listings */}
        <Card>
          <CardHeader>
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Marketplace Listings</CardTitle>
                  <div className="text-3xl font-semibold mt-2">
                    {stats.marketplaceListings.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-accent" />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!loading && (
              <div className="flex items-center gap-2 text-green-600">
                <ArrowUp className="w-4 h-4" />
                <span>Active market</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Alerts */}
        <Card>
          <CardHeader>
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Health Alerts</CardTitle>
                  <div className="text-3xl font-semibold mt-2">
                    {stats.healthAlerts.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!loading && (
              <div className="text-muted-foreground">Requires attention</div>
            )}
          </CardContent>
        </Card>

        {/* Pending Permits */}
        <Card>
          <CardHeader>
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Pending Permits</CardTitle>
                  <div className="text-3xl font-semibold mt-2">
                    {stats.pendingPermits.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!loading && (
              <div className="text-muted-foreground">Awaiting approval</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <div className="text-3xl font-semibold mt-2">
                    {stats.recentTransactions.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-green-600" />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!loading && (
              <div className="text-muted-foreground">All time</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts (illustrative — no aggregate endpoint yet) ──────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Animal Population Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={populationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2E7D32" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breed Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={animalBreedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {animalBreedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Activity Lists ────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Recent Movement Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Movement Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <>
                  <ActivityRowSkeleton />
                  <ActivityRowSkeleton />
                  <ActivityRowSkeleton />
                </>
              ) : errors.movements ? (
                <div className="text-center text-destructive py-8">{errors.movements}</div>
              ) : movements.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No recent movements</div>
              ) : (
                movements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">Tag: {movement.animalRfid}</div>
                      <div className="text-muted-foreground">
                        {movement.fromHolding} → {movement.toHolding}
                      </div>
                      <div className="text-muted-foreground">
                        {formatDate(movement.movementDate)}
                      </div>
                    </div>
                    <Badge variant={movement.status === "Completed" ? "success" : "warning"}>
                      {movement.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Health Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Health Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <>
                  <ActivityRowSkeleton />
                  <ActivityRowSkeleton />
                  <ActivityRowSkeleton />
                </>
              ) : errors.health ? (
                <div className="text-center text-destructive py-8">{errors.health}</div>
              ) : healthEvents.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No recent health events</div>
              ) : (
                healthEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{event.eventType}</div>
                      <div className="text-muted-foreground">Tag: {event.animalRfid}</div>
                      <div className="text-muted-foreground">
                        {event.vaccine || event.disease} — {formatDate(event.date)}
                      </div>
                    </div>
                    <Badge variant={event.eventType === "Vaccination" ? "success" : "warning"}>
                      {event.severity}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Movement Trends Chart (illustrative) ─────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Movement Trends (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={movementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="movements" fill="#1565C0" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

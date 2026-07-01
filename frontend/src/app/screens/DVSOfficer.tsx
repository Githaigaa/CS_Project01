import { useEffect, useState } from "react";
import {
  ShieldCheck, ClipboardList, MapPin, Users, CheckCircle,
  XCircle, AlertTriangle, Loader2, Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input } from "../components/Input";
import { apiClient } from "../services/api/client";
import { formatDate } from "../lib/utils";
import { getApiErrorMessage } from "../services/api/errors";

type Permit = {
  id: number;
  permit_number: string;
  status: string;
  issued_on: string;
  valid_until: string;
  notes: string;
};

type Cahw = {
  id: number;
  name: string;
  email: string;
  phone: string;
  county_zone: string;
  is_cahw_verified: boolean;
  date_joined: string;
};

type CensusData = {
  county: string;
  total_animals: number;
  alive: number;
  stolen: number;
  quarantined: number;
  total_holdings: number;
  restricted_holdings: number;
} | null;

export function DVSOfficer() {
  const [activeTab, setActiveTab] = useState<"permits" | "census" | "cahws" | "trace">("permits");

  // Permits
  const [permits, setPermits] = useState<Permit[]>([]);
  const [permitsLoading, setPermitsLoading] = useState(true);
  const [permitsError, setPermitsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Census
  const [countyInput, setCountyInput] = useState("");
  const [census, setCensus] = useState<CensusData>(null);
  const [censusLoading, setCensusLoading] = useState(false);
  const [censusError, setCensusError] = useState<string | null>(null);

  // CAHWs
  const [cahws, setCahws] = useState<Cahw[]>([]);
  const [cahwsLoading, setCahwsLoading] = useState(true);
  const [cahwsError, setCahwsError] = useState<string | null>(null);

  // Disease trace
  const [holdingId, setHoldingId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [traceResult, setTraceResult] = useState<Record<string, unknown> | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);

  useEffect(() => {
    loadPermits();
    loadCahws();
  }, []);

  async function loadPermits() {
    setPermitsLoading(true);
    setPermitsError(null);
    try {
      const { data } = await apiClient.get("/movement-permits/", { params: { status: "pending" } });
      const results = Array.isArray(data) ? data : data.results ?? [];
      setPermits(results);
    } catch (err) {
      setPermitsError(getApiErrorMessage(err, "Failed to load permits."));
    } finally {
      setPermitsLoading(false);
    }
  }

  async function loadCahws() {
    setCahwsLoading(true);
    setCahwsError(null);
    try {
      const { data } = await apiClient.get("/dvs/cahws/");
      setCahws(data.results ?? []);
    } catch (err) {
      setCahwsError(getApiErrorMessage(err, "Failed to load CAHWs."));
    } finally {
      setCahwsLoading(false);
    }
  }

  async function handlePermitAction(id: number, action: "approve" | "reject") {
    setActionLoading(id);
    try {
      await apiClient.post(`/movement-permits/${id}/${action}/`);
      setPermits((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(getApiErrorMessage(err, `Failed to ${action} permit.`));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCahwVerify(id: number, verify: boolean) {
    try {
      await apiClient.post(`/dvs/cahws/${id}/verify/`, { verify });
      setCahws((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_cahw_verified: verify } : c))
      );
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to update CAHW."));
    }
  }

  async function handleCensus() {
    setCensusLoading(true);
    setCensusError(null);
    try {
      const { data } = await apiClient.get("/dvs/county-census/", {
        params: { county: countyInput },
      });
      setCensus(data);
    } catch (err) {
      setCensusError(getApiErrorMessage(err, "Failed to load census."));
    } finally {
      setCensusLoading(false);
    }
  }

  async function handleTrace() {
    if (!holdingId) return;
    setTraceLoading(true);
    setTraceError(null);
    try {
      const { data } = await apiClient.get("/dvs/disease-trace/", {
        params: { holding_id: holdingId, date_from: dateFrom, date_to: dateTo },
      });
      setTraceResult(data);
    } catch (err) {
      setTraceError(getApiErrorMessage(err, "Failed to run trace report."));
    } finally {
      setTraceLoading(false);
    }
  }

  const tabs = [
    { id: "permits" as const, label: "Movement Permits", icon: ClipboardList },
    { id: "census" as const, label: "County Census", icon: MapPin },
    { id: "cahws" as const, label: "CAHW Management", icon: Users },
    { id: "trace" as const, label: "Disease Trace", icon: AlertTriangle },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="mb-1">County DVS Officer Dashboard</h1>
        <p className="text-muted-foreground">
          Manage movement permits, CAHW accounts, and run traceability reports.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors text-sm font-medium ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Permits ── */}
      {activeTab === "permits" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Movement Permits</CardTitle>
              <Button variant="outline" size="sm" onClick={loadPermits}>Refresh</Button>
            </div>
          </CardHeader>
          <CardContent>
            {permitsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
            ) : permitsError ? (
              <div className="text-destructive text-sm">{permitsError}</div>
            ) : permits.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                No pending permits.
              </div>
            ) : (
              <div className="space-y-4">
                {permits.map((permit) => (
                  <div key={permit.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold font-mono">{permit.permit_number}</div>
                        <div className="text-sm text-muted-foreground">
                          Issued: {formatDate(permit.issued_on)} · Valid until: {formatDate(permit.valid_until)}
                        </div>
                        {permit.notes && (
                          <div className="text-sm text-muted-foreground mt-1">{permit.notes}</div>
                        )}
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={actionLoading === permit.id}
                        onClick={() => handlePermitAction(permit.id, "approve")}
                      >
                        {actionLoading === permit.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === permit.id}
                        onClick={() => handlePermitAction(permit.id, "reject")}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Census ── */}
      {activeTab === "census" && (
        <Card>
          <CardHeader>
            <CardTitle>County Livestock Census</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                label="County (leave blank for all)"
                placeholder="e.g. Nakuru"
                value={countyInput}
                onChange={(e) => setCountyInput(e.target.value)}
              />
              <div className="flex items-end">
                <Button onClick={handleCensus} disabled={censusLoading}>
                  {censusLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Run Report
                </Button>
              </div>
            </div>

            {censusError && <div className="text-destructive text-sm">{censusError}</div>}

            {census && (
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">{census.total_animals}</div>
                  <div className="text-muted-foreground">Total Animals</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-700">{census.alive}</div>
                  <div className="text-muted-foreground">Alive</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-amber-700">{census.quarantined}</div>
                  <div className="text-muted-foreground">Quarantined</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-700">{census.stolen}</div>
                  <div className="text-muted-foreground">Stolen</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">{census.total_holdings}</div>
                  <div className="text-muted-foreground">Holdings</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-700">{census.restricted_holdings}</div>
                  <div className="text-muted-foreground">Restricted Holdings</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── CAHW Management ── */}
      {activeTab === "cahws" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Community Animal Health Workers</CardTitle>
              <Button variant="outline" size="sm" onClick={loadCahws}>Refresh</Button>
            </div>
          </CardHeader>
          <CardContent>
            {cahwsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
            ) : cahwsError ? (
              <div className="text-destructive text-sm">{cahwsError}</div>
            ) : cahws.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                No CAHWs found in your county zone.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Phone</th>
                      <th className="text-left p-3 font-medium">County Zone</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cahws.map((cahw) => (
                      <tr key={cahw.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-3 font-medium">{cahw.name}</td>
                        <td className="p-3 text-muted-foreground">{cahw.email}</td>
                        <td className="p-3">{cahw.phone || "—"}</td>
                        <td className="p-3">{cahw.county_zone || "—"}</td>
                        <td className="p-3">
                          <Badge variant={cahw.is_cahw_verified ? "success" : "warning"}>
                            {cahw.is_cahw_verified ? "Verified" : "Unverified"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {cahw.is_cahw_verified ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCahwVerify(cahw.id, false)}
                            >
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleCahwVerify(cahw.id, true)}
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Verify
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Disease Trace ── */}
      {activeTab === "trace" && (
        <Card>
          <CardHeader>
            <CardTitle>Disease Trace Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Returns all animals present at a holding within a date range for disease investigation.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <Input
                label="Holding ID *"
                placeholder="e.g. 5"
                value={holdingId}
                onChange={(e) => setHoldingId(e.target.value)}
              />
              <Input
                label="Date From"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <Input
                label="Date To"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button onClick={handleTrace} disabled={traceLoading || !holdingId}>
              {traceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Run Trace
            </Button>

            {traceError && <div className="text-destructive text-sm">{traceError}</div>}

            {traceResult && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="font-semibold mb-1">
                    {(traceResult.holding as { name: string })?.name} —{" "}
                    {(traceResult.holding as { county: string })?.county}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {traceResult.total_current as number} currently on farm ·{" "}
                    {traceResult.total_movements as number} movements in range
                  </div>
                </div>

                {(traceResult.current_animals as unknown[]).length > 0 && (
                  <div>
                    <div className="font-medium mb-2">Currently on Farm</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-2">Tag</th>
                            <th className="text-left p-2">RFID</th>
                            <th className="text-left p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(traceResult.current_animals as Array<{ tag_number: string; rfid_tag: string; status: string }>).map((a) => (
                            <tr key={a.tag_number} className="border-b border-border">
                              <td className="p-2 font-mono">{a.tag_number}</td>
                              <td className="p-2 font-mono">{a.rfid_tag || "—"}</td>
                              <td className="p-2">
                                <Badge variant={a.status === "alive" ? "success" : "warning"}>
                                  {a.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

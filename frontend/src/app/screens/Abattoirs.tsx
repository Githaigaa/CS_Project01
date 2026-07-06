import { useEffect, useState, useCallback } from "react";
import {
  Building2, CheckCircle, Clock, Shield, Plus, Loader2,
  Search, AlertTriangle, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select, Textarea } from "../components/Input";
import {
  mapApiSlaughterRecordToSlaughterRecord,
  type ApiAbattoir,
  type ApiSlaughterRecord,
} from "../lib/api/slaughter";
import { formatDate } from "../lib/utils";
import type { SlaughterRecord } from "../lib/types";
import { getApiErrorMessage } from "../services/api/errors";
import { slaughterApi } from "../services/api/slaughter";
import { apiClient } from "../services/api/client";
import { holdingsApi } from "../services/api/holdings";
import { animalsApi } from "../services/api/animals";
import type { ApiFarm } from "../lib/api/holdings";
import type { ApiAnimal } from "../lib/api/animals";

const PAGE_SIZE = 10;

const INSPECTION_LABELS: Record<string, string> = {
  passed: "Passed",
  passed_partial: "Partial Pass",
  condemned: "Condemned",
};

// ─── Abattoir Registration Form ───────────────────────────────────────────────
function AbattoirForm({
  editing,
  onSaved,
  onCancel,
}: {
  editing: ApiAbattoir | null;
  onSaved: (a: ApiAbattoir) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    license_no: editing?.license_no ?? "",
    county: editing?.county ?? "",
    address: editing?.address ?? "",
    contact: editing?.contact ?? "",
    is_active: editing?.is_active ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!form.name.trim() || !form.license_no.trim() || !form.county.trim()) {
      setError("Name, Licence Number, and County are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const saved = editing
        ? await slaughterApi.updateAbattoir(editing.id, form)
        : await slaughterApi.createAbattoir(form);
      onSaved(saved);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save abattoir."));
    } finally {
      setSubmitting(false);
    }
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{editing ? "Edit Abattoir" : "Register Abattoir"}</CardTitle>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="text-destructive text-sm">{error}</div>}
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Abattoir Name *" value={form.name} onChange={f("name")} placeholder="Nairobi Meat Processing Ltd" />
          <Input label="Licence Number *" value={form.license_no} onChange={f("license_no")} placeholder="KMC-2024-001" />
          <Input label="County *" value={form.county} onChange={f("county")} placeholder="Nairobi" />
          <Input label="Contact" value={form.contact} onChange={f("contact")} placeholder="+254 700 000000" />
          <div className="md:col-span-2">
            <Textarea label="Address" value={form.address} onChange={f("address")} placeholder="Plot 12, Industrial Area, Nairobi" />
          </div>
          {editing && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm">Active (visible for slaughter records)</label>
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {editing ? "Save Changes" : "Register Abattoir"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Slaughter Record Form ─────────────────────────────────────────────────────
const emptySlaughterForm = {
  animal_id: 0, animal_tag: "", abattoir: "", slaughter_no: "", batch_number: "",
  slaughter_date: "", live_weight_kg: "", carcass_weight_kg: "",
  hide_weight_kg: "", offal_weight_kg: "",
  inspection_result: "", condemnation_reason: "", meat_grade: "", notes: "",
};

function SlaughterForm({
  abattoirs,
  onSaved,
  onCancel,
}: {
  abattoirs: ApiAbattoir[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...emptySlaughterForm });

  // Holding → Animal selection
  const [holdings, setHoldings] = useState<ApiFarm[]>([]);
  const [holdingsLoading, setHoldingsLoading] = useState(true);
  const [selectedHolding, setSelectedHolding] = useState("");
  const [holdingAnimals, setHoldingAnimals] = useState<ApiAnimal[]>([]);
  const [animalsLoading, setAnimalsLoading] = useState(false);

  // Verification
  const [verifyResult, setVerifyResult] = useState<{
    eligible: boolean; reason?: string; has_slaughter_movement_record?: boolean;
  } | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);

  // Load all holdings on mount
  useEffect(() => {
    holdingsApi.listHoldings({ pageSize: 200 })
      .then((res) => setHoldings(res.results))
      .catch(() => {})
      .finally(() => setHoldingsLoading(false));
  }, []);

  // When a holding is selected, load its alive animals
  const loadHoldingAnimals = useCallback(async (farmId: string) => {
    if (!farmId) { setHoldingAnimals([]); return; }
    setAnimalsLoading(true);
    try {
      const res = await animalsApi.listAnimals({ current_farm: farmId, status: "alive", pageSize: 200 });
      setHoldingAnimals(res.results);
    } catch {
      setHoldingAnimals([]);
    } finally {
      setAnimalsLoading(false);
    }
  }, []);

  function handleHoldingChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedHolding(val);
    setHoldingAnimals([]);
    setForm((prev) => ({ ...prev, animal_id: 0, animal_tag: "" }));
    setVerifyResult(null);
    loadHoldingAnimals(val);
  }

  function handleAnimalChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const animalId = Number(e.target.value);
    const animal = holdingAnimals.find((a) => a.id === animalId);
    if (!animal) return;
    setForm((prev) => ({ ...prev, animal_id: animalId, animal_tag: animal.tag_number }));
    // Auto-verify when animal is selected from the dropdown
    handleVerify(animal.tag_number);
  }

  async function handleVerify(tag: string) {
    if (!tag.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const { data } = await apiClient.get(`/slaughter-records/verify/${tag.trim()}/`);
      setVerifyResult(data);
    } catch (err) {
      setVerifyResult({ eligible: false, reason: getApiErrorMessage(err, "Animal not found.") });
    } finally {
      setVerifyLoading(false);
    }
  }

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSubmit() {
    if (!form.animal_id) { setSubmitError("Please select an animal."); return; }
    if (!form.abattoir) { setSubmitError("Please select an abattoir."); return; }
    if (!form.slaughter_no.trim()) { setSubmitError("Slaughter / Chain Number is required."); return; }
    if (!form.slaughter_date) { setSubmitError("Slaughter Date is required."); return; }
    if (!form.live_weight_kg) { setSubmitError("Live Weight is required."); return; }
    if (!form.carcass_weight_kg) { setSubmitError("Carcass Weight is required."); return; }
    if (!form.inspection_result) { setSubmitError("Inspection Result is required."); return; }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiClient.post("/slaughter-records/", {
        animal: form.animal_id,
        abattoir: Number(form.abattoir),
        slaughter_no: form.slaughter_no,
        batch_number: form.batch_number || undefined,
        slaughter_date: form.slaughter_date,
        live_weight_kg: form.live_weight_kg,
        carcass_weight_kg: form.carcass_weight_kg,
        hide_weight_kg: form.hide_weight_kg || undefined,
        offal_weight_kg: form.offal_weight_kg || undefined,
        inspection_result: form.inspection_result,
        condemnation_reason: form.condemnation_reason || undefined,
        meat_grade: form.meat_grade || undefined,
        notes: form.notes || undefined,
      });
      onSaved();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to record slaughter."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Record Slaughter Event</CardTitle>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Step 1 — Select holding then animal */}
        <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="font-medium text-sm">Step 1 — Select Source Holding &amp; Animal</div>
          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Holding / Property *"
              value={selectedHolding}
              onChange={handleHoldingChange}
              disabled={holdingsLoading}
            >
              <option value="">{holdingsLoading ? "Loading holdings…" : "Select holding"}</option>
              {holdings.map((h) => (
                <option key={h.id} value={String(h.id)}>
                  {h.name} — {h.county}
                </option>
              ))}
            </Select>

            <Select
              label="Animal *"
              value={form.animal_id ? String(form.animal_id) : ""}
              onChange={handleAnimalChange}
              disabled={!selectedHolding || animalsLoading}
            >
              <option value="">
                {!selectedHolding
                  ? "Select a holding first"
                  : animalsLoading
                  ? "Loading animals…"
                  : holdingAnimals.length === 0
                  ? "No active animals in this holding"
                  : "Select animal"}
              </option>
              {holdingAnimals.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.tag_number} — {a.breed_name || a.species} ({a.sex === "M" ? "Male" : "Female"})
                </option>
              ))}
            </Select>
          </div>

          {/* Verification result shown after animal is selected */}
          {verifyLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying eligibility…
            </div>
          )}
          {verifyResult && !verifyLoading && (
            <div className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
              verifyResult.eligible
                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
            }`}>
              {verifyResult.eligible
                ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              <span>
                {verifyResult.eligible
                  ? `Animal ${form.animal_tag} is eligible for slaughter.${!verifyResult.has_slaughter_movement_record ? " Note: No slaughter movement record found." : ""}`
                  : verifyResult.reason}
              </span>
            </div>
          )}
        </div>

        {/* Step 2 — Slaughter details */}
        <div className="font-medium text-sm">Step 2 — Slaughter Details</div>
        {submitError && <div className="text-destructive text-sm">{submitError}</div>}
        <div className="grid md:grid-cols-2 gap-4">
          <Select label="Abattoir *" value={form.abattoir} onChange={set("abattoir")}>
            <option value="">Select abattoir</option>
            {abattoirs.filter((a) => a.is_active).map((a) => (
              <option key={a.id} value={String(a.id)}>{a.name}</option>
            ))}
          </Select>
          <Input
            label="Slaughter / Chain Number *"
            placeholder="NMA-2026-05432"
            value={form.slaughter_no}
            onChange={set("slaughter_no")}
          />
          <Input
            label="Slaughter Date *"
            type="date"
            value={form.slaughter_date}
            onChange={set("slaughter_date")}
          />
          <Input
            label="Live Weight (kg) *"
            type="number"
            placeholder="450"
            value={form.live_weight_kg}
            onChange={set("live_weight_kg")}
          />
          <Input
            label="Carcass Weight (kg) *"
            type="number"
            placeholder="260"
            value={form.carcass_weight_kg}
            onChange={set("carcass_weight_kg")}
          />
          <Select label="Inspection Result *" value={form.inspection_result} onChange={set("inspection_result")}>
            <option value="">Select result</option>
            <option value="passed">Passed</option>
            <option value="passed_partial">Passed (Partial Condemnation)</option>
            <option value="condemned">Condemned</option>
          </Select>
          <Select label="Meat Grade" value={form.meat_grade} onChange={set("meat_grade")}>
            <option value="">Select grade</option>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
          </Select>
        </div>

        {(form.inspection_result === "condemned" || form.inspection_result === "passed_partial") && (
          <Textarea
            label="Condemnation Reason"
            placeholder="Describe the reason for condemnation or partial rejection..."
            value={form.condemnation_reason}
            onChange={set("condemnation_reason")}
          />
        )}

        <button
          type="button"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setShowOptional((v) => !v)}
        >
          {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showOptional ? "Hide" : "Show"} optional fields (batch, hide/offal weights, notes)
        </button>

        {showOptional && (
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Batch Number" placeholder="BATCH-2026-07-001" value={form.batch_number} onChange={set("batch_number")} />
            <Input label="Hide Weight (kg)" type="number" placeholder="25" value={form.hide_weight_kg} onChange={set("hide_weight_kg")} />
            <Input label="Offal Weight (kg)" type="number" placeholder="40" value={form.offal_weight_kg} onChange={set("offal_weight_kg")} />
            <div className="md:col-span-2">
              <Textarea label="Notes" placeholder="Carcass quality, marbling, any observations..." value={form.notes} onChange={set("notes")} />
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.animal_id}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Record
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────
function RecordDetail({ record, onClose }: { record: SlaughterRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Slaughter Record</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Animal RFID", record.animalRfid],
            ["Abattoir", record.abattoirName],
            ["Chain Number", record.chainNumber],
            ["Batch Number", record.batchNumber ?? "—"],
            ["Slaughter Date", formatDate(record.slaughterDate)],
            ["Inspection", record.inspectionResult ? INSPECTION_LABELS[record.inspectionResult] ?? record.inspectionResult : "—"],
            ["Meat Grade", record.meatGrade ?? "—"],
            ["Live Weight", record.liveWeightKg != null ? `${record.liveWeightKg} kg` : "—"],
            ["Carcass Weight", record.carcassWeightKg != null ? `${record.carcassWeightKg} kg` : "—"],
            ["Dressing %", record.dressingPct != null ? `${record.dressingPct}%` : "—"],
            ["Inspector", record.inspectorName ?? "Not assigned"],
            ["Status", record.verified ? "Verified" : "Pending"],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-muted-foreground">{label}</div>
              <div className="font-medium">{value}</div>
            </div>
          ))}
          {record.feedback && (
            <div className="col-span-2">
              <div className="text-muted-foreground">Notes / Condemnation Reason</div>
              <div className="font-medium">{record.feedback}</div>
            </div>
          )}
        </div>
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
type ActiveForm = "none" | "slaughter" | "abattoir";

export function Abattoirs() {
  const [activeForm, setActiveForm] = useState<ActiveForm>("none");
  const [records, setRecords] = useState<SlaughterRecord[]>([]);
  const [rawRecords, setRawRecords] = useState<ApiSlaughterRecord[]>([]);
  const [abattoirs, setAbattoirs] = useState<ApiAbattoir[]>([]);
  const [editingAbattoir, setEditingAbattoir] = useState<ApiAbattoir | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<SlaughterRecord | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [stats, setStats] = useState({ this_week: 0, today: 0, this_month: 0, compliance_rate: 0 });

  function loadAbattoirs() {
    slaughterApi.listAbattoirs().then(setAbattoirs).catch(() => {});
  }

  function loadStats() {
    slaughterApi.getStats().then(setStats).catch(() => {});
  }

  async function loadRecords(targetPage = page) {
    setLoading(true);
    setError(null);
    try {
      const response = await slaughterApi.listSlaughterRecords({ page: targetPage, pageSize: PAGE_SIZE });
      setRawRecords(response.results);
      setRecords(response.results.map(mapApiSlaughterRecordToSlaughterRecord));
      setTotalCount(response.count);
      setHasNext(Boolean(response.next));
      setHasPrev(Boolean(response.previous));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load slaughter records. Please try again."));
      setRecords([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAbattoirs();
    loadStats();
  }, []);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError(null);
    slaughterApi.listSlaughterRecords({ page, pageSize: PAGE_SIZE }).then((response) => {
      if (!isCurrent) return;
      setRawRecords(response.results);
      setRecords(response.results.map(mapApiSlaughterRecordToSlaughterRecord));
      setTotalCount(response.count);
      setHasNext(Boolean(response.next));
      setHasPrev(Boolean(response.previous));
    }).catch((err) => {
      if (!isCurrent) return;
      setError(getApiErrorMessage(err, "Unable to load slaughter records."));
    }).finally(() => {
      if (isCurrent) setLoading(false);
    });
    return () => { isCurrent = false; };
  }, [page]);

  async function handleAccept(record: SlaughterRecord) {
    setAcceptingId(Number(record.id));
    try {
      const updated = await slaughterApi.acceptRecord(Number(record.id));
      const mapped = mapApiSlaughterRecordToSlaughterRecord(updated);
      setRecords((prev) => prev.map((r) => (r.id === record.id ? mapped : r)));
      loadStats();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to verify record."));
    } finally {
      setAcceptingId(null);
    }
  }

  function handleAbattoirSaved(saved: ApiAbattoir) {
    setAbattoirs((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    setActiveForm("none");
    setEditingAbattoir(null);
  }

  function handleSlaughterSaved() {
    setActiveForm("none");
    setPage(1);
    loadRecords(1);
    loadStats();
  }

  const pendingRecords = records.filter((r) => !r.verified);

  return (
    <div className="p-6 space-y-6">
      {detailRecord && <RecordDetail record={detailRecord} onClose={() => setDetailRecord(null)} />}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Abattoir Management</h1>
          <p className="text-muted-foreground">Manage slaughter facilities and processing records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEditingAbattoir(null); setActiveForm("abattoir"); }}>
            <Building2 className="w-4 h-4" />
            Register Abattoir
          </Button>
          <Button onClick={() => setActiveForm("slaughter")}>
            <Plus className="w-5 h-5" />
            Record Slaughter
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stats — sourced from /stats/ endpoint, not the current page */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Animals Received</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.this_week}</div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent><div className="text-muted-foreground">Last 7 days</div></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Slaughtered Today</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.today}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent><div className="text-muted-foreground">{formatDate(new Date().toISOString())}</div></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Pending Verification</CardTitle>
                <div className="text-3xl font-semibold mt-2">{loading ? "—" : pendingRecords.length}</div>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent><div className="text-muted-foreground">Awaiting inspection</div></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Compliance Rate</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.compliance_rate}%</div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent><div className="text-muted-foreground">Inspection pass rate (all time)</div></CardContent>
        </Card>
      </div>

      {/* Forms */}
      {activeForm === "abattoir" && (
        <AbattoirForm
          editing={editingAbattoir}
          onSaved={handleAbattoirSaved}
          onCancel={() => { setActiveForm("none"); setEditingAbattoir(null); }}
        />
      )}
      {activeForm === "slaughter" && (
        <SlaughterForm
          abattoirs={abattoirs}
          onSaved={handleSlaughterSaved}
          onCancel={() => setActiveForm("none")}
        />
      )}

      {/* Registered Abattoirs */}
      {abattoirs.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Registered Abattoirs ({abattoirs.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {abattoirs.map((a) => (
                <div key={a.id} className="border border-border rounded-lg p-4 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{a.name}</div>
                    <Badge variant={a.is_active ? "success" : "warning"}>{a.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="text-muted-foreground text-sm">{a.license_no}</div>
                  <div className="text-muted-foreground text-sm">{a.county}{a.address ? ` — ${a.address}` : ""}</div>
                  {a.contact && <div className="text-muted-foreground text-sm">{a.contact}</div>}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => { setEditingAbattoir(a); setActiveForm("abattoir"); }}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Incoming verification queue */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Incoming Animal Verification</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : pendingRecords.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No animals pending verification.</div>
              ) : (
                pendingRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold">RFID: {record.animalRfid}</div>
                        <div className="text-muted-foreground text-sm">{record.abattoirName}</div>
                      </div>
                      <Badge variant="warning">Pending Verification</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Chain No.</div>
                        <div className="font-medium font-mono">{record.chainNumber}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Slaughter Date</div>
                        <div className="font-medium">{formatDate(record.slaughterDate)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(record)}
                        disabled={acceptingId === Number(record.id)}
                      >
                        {acceptingId === Number(record.id)
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <CheckCircle className="w-4 h-4" />}
                        Verify & Accept
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDetailRecord(record)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card>
          <CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground mb-1">This Week</div>
              <div className="text-2xl font-semibold">{stats.this_week}</div>
              <div className="text-muted-foreground text-sm">Animals Processed</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground mb-1">This Month</div>
              <div className="text-2xl font-semibold">{stats.this_month}</div>
              <div className="text-muted-foreground text-sm">Total Processed</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground mb-1">Compliance Rate</div>
              <div className="text-2xl font-semibold">{stats.compliance_rate}%</div>
              <div className="text-muted-foreground text-sm">Inspection pass rate</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground mb-1">Registered Abattoirs</div>
              <div className="text-2xl font-semibold">{abattoirs.filter((a) => a.is_active).length}</div>
              <div className="text-muted-foreground text-sm">Active facilities</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records table */}
      <Card>
        <CardHeader><CardTitle>Recent Slaughter Records</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No slaughter records found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium">Animal RFID</th>
                      <th className="text-left p-3 font-medium">Abattoir</th>
                      <th className="text-left p-3 font-medium">Chain No.</th>
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Grade</th>
                      <th className="text-left p-3 font-medium">Dressing %</th>
                      <th className="text-left p-3 font-medium">Inspection</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-mono text-sm">{record.animalRfid}</td>
                        <td className="p-3 text-sm">{record.abattoirName}</td>
                        <td className="p-3 font-mono text-sm">{record.chainNumber}</td>
                        <td className="p-3 text-sm">{formatDate(record.slaughterDate)}</td>
                        <td className="p-3 text-sm">{record.meatGrade ?? "—"}</td>
                        <td className="p-3 text-sm">
                          {record.dressingPct != null ? `${record.dressingPct}%` : "—"}
                        </td>
                        <td className="p-3 text-sm">
                          {record.inspectionResult
                            ? INSPECTION_LABELS[record.inspectionResult] ?? record.inspectionResult
                            : "—"}
                        </td>
                        <td className="p-3">
                          <Badge variant={record.verified ? "success" : "warning"}>
                            {record.verified ? "Verified" : "Pending"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button size="sm" variant="ghost" onClick={() => setDetailRecord(record)}>
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalCount > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-sm text-muted-foreground">
                    Page {page} · {totalCount} record{totalCount !== 1 ? "s" : ""}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={loading || !hasPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={loading || !hasNext}
                      onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

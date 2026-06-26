import { useEffect, useCallback, useState } from "react";
import {
  MapPin,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Map,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select } from "../components/Input";
import { Skeleton } from "../components/Skeleton";
import { holdingsApi } from "../services/api/holdings";
import { mapApiFarmToHolding } from "../lib/api/holdings";
import type { UiHolding, HoldingPayload } from "../lib/api/holdings";
import { getApiErrorMessage, getApiFieldErrors } from "../services/api/errors";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PAGE_SIZE = 9; // 3-column grid looks best with multiples of 3

type OrderingOption = "name" | "-name" | "-created_at" | "created_at";

// ─────────────────────────────────────────────
// Modal form for Create / Edit
// ─────────────────────────────────────────────

interface HoldingFormState {
  name: string;
  registration_no: string;
  county: string;
  sub_county: string;
  ward: string;
  gps_latitude: string;
  gps_longitude: string;
  total_area_acres: string;
}

const BLANK_FORM: HoldingFormState = {
  name: "",
  registration_no: "",
  county: "",
  sub_county: "",
  ward: "",
  gps_latitude: "",
  gps_longitude: "",
  total_area_acres: "",
};

function formToPayload(form: HoldingFormState): HoldingPayload {
  return {
    name: form.name.trim(),
    registration_no: form.registration_no.trim(),
    county: form.county.trim(),
    sub_county: form.sub_county.trim(),
    ward: form.ward.trim(),
    gps_latitude: form.gps_latitude.trim() || null,
    gps_longitude: form.gps_longitude.trim() || null,
    total_area_acres: form.total_area_acres.trim() || null,
  };
}

function holdingToForm(h: UiHolding): HoldingFormState {
  return {
    name: h.name,
    registration_no: h.registrationNo,
    county: h.county,
    sub_county: h.subCounty,
    ward: h.ward,
    gps_latitude: h.gpsLatitude != null ? String(h.gpsLatitude) : "",
    gps_longitude: h.gpsLongitude != null ? String(h.gpsLongitude) : "",
    total_area_acres: h.totalAreaAcres != null ? String(h.totalAreaAcres) : "",
  };
}

interface HoldingModalProps {
  mode: "create" | "edit";
  initial: HoldingFormState;
  submitting: boolean;
  fieldErrors: Record<string, string>;
  globalError: string | null;
  onSubmit: (form: HoldingFormState) => void;
  onClose: () => void;
}

function HoldingModal({
  mode,
  initial,
  submitting,
  fieldErrors,
  globalError,
  onSubmit,
  onClose,
}: HoldingModalProps) {
  const [form, setForm] = useState<HoldingFormState>(initial);

  const set = (field: keyof HoldingFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "Add New Holding" : "Edit Holding"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          className="p-6 space-y-4"
          onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
        >
          {globalError && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              {globalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Holding Name *"
                placeholder="e.g. Kiambu Dairy Farm"
                value={form.name}
                onChange={set("name")}
                error={fieldErrors.name}
                required
              />
            </div>

            <div className="col-span-2">
              <Input
                label="Registration Number *"
                placeholder="e.g. KE-FARM-001234"
                value={form.registration_no}
                onChange={set("registration_no")}
                error={fieldErrors.registration_no}
                required
              />
            </div>

            <Input
              label="County *"
              placeholder="e.g. Kiambu"
              value={form.county}
              onChange={set("county")}
              error={fieldErrors.county}
              required
            />

            <Input
              label="Sub-County"
              placeholder="e.g. Ruiru"
              value={form.sub_county}
              onChange={set("sub_county")}
              error={fieldErrors.sub_county}
            />

            <Input
              label="Ward"
              placeholder="e.g. Gitothua"
              value={form.ward}
              onChange={set("ward")}
              error={fieldErrors.ward}
            />

            <Input
              label="Total Area (acres)"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 200.00"
              value={form.total_area_acres}
              onChange={set("total_area_acres")}
              error={fieldErrors.total_area_acres}
            />

            <Input
              label="GPS Latitude"
              type="number"
              step="0.000001"
              placeholder="e.g. -1.171400"
              value={form.gps_latitude}
              onChange={set("gps_latitude")}
              error={fieldErrors.gps_latitude}
            />

            <Input
              label="GPS Longitude"
              type="number"
              step="0.000001"
              placeholder="e.g. 36.835600"
              value={form.gps_longitude}
              onChange={set("gps_longitude")}
              error={fieldErrors.gps_longitude}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "create" ? "Create Holding" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Card skeleton for loading state
// ─────────────────────────────────────────────

function HoldingCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <Skeleton className="h-8 rounded-xl" />
          <Skeleton className="h-8 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Detail panel (inline, slide-in style)
// ─────────────────────────────────────────────

function HoldingDetailPanel({
  holding,
  onClose,
}: {
  holding: UiHolding;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md h-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">{holding.name}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-muted-foreground mb-1">Registration No.</div>
              <div className="font-medium font-mono">{holding.registrationNo}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Owner</div>
              <div className="font-medium">{holding.owner}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Location</div>
              <div className="font-medium">
                {[holding.ward, holding.subCounty, holding.county].filter(Boolean).join(", ")}
              </div>
            </div>
            {holding.totalAreaAcres != null && (
              <div>
                <div className="text-muted-foreground mb-1">Total Area</div>
                <div className="font-medium">{holding.totalAreaAcres.toLocaleString()} acres</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground mb-1">Animals on Farm</div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-2xl">{holding.animalCount}</span>
              </div>
            </div>
            {holding.gpsLatitude != null && holding.gpsLongitude != null && (
              <div>
                <div className="text-muted-foreground mb-1">GPS Coordinates</div>
                <div className="font-mono text-sm">
                  {holding.gpsLatitude.toFixed(6)}, {holding.gpsLongitude.toFixed(6)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Holdings screen
// ─────────────────────────────────────────────

export function Holdings() {
  // ── List state ───────────────────────────────────────────────────────────
  const [holdings, setHoldings] = useState<UiHolding[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [ordering, setOrdering] = useState<OrderingOption>("-created_at");

  // ── Action state ─────────────────────────────────────────────────────────
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Modal state ──────────────────────────────────────────────────────────
  type ModalMode = { type: "create" } | { type: "edit"; holding: UiHolding } | null;
  const [modal, setModal] = useState<ModalMode>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalFieldErrors, setModalFieldErrors] = useState<Record<string, string>>({});
  const [modalGlobalError, setModalGlobalError] = useState<string | null>(null);

  // ── Detail panel ─────────────────────────────────────────────────────────
  const [viewHolding, setViewHolding] = useState<UiHolding | null>(null);

  // ── Reset page when filters change ───────────────────────────────────────
  useEffect(() => { setPage(1); }, [searchQuery, ordering]);

  // ── Fetch holdings ───────────────────────────────────────────────────────
  const fetchHoldings = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setListError(null);
    try {
      const result = await holdingsApi.listHoldings({
        page,
        pageSize: PAGE_SIZE,
        search: searchQuery.trim() || undefined,
        ordering,
      });
      setHoldings(result.results.map(mapApiFarmToHolding));
      setTotalCount(result.count);
      setHasNext(Boolean(result.next));
      setHasPrev(Boolean(result.previous));
    } catch (err) {
      setListError(getApiErrorMessage(err, "Unable to load holdings. Please try again."));
      setHoldings([]);
      setTotalCount(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, ordering]);

  useEffect(() => {
    let isCurrent = true;
    fetchHoldings().then(() => {
      if (!isCurrent) return;
    });
    return () => { isCurrent = false; };
  }, [fetchHoldings]);

  // ── CREATE ───────────────────────────────────────────────────────────────
  const handleCreate = async (form: HoldingFormState) => {
    setModalSubmitting(true);
    setModalFieldErrors({});
    setModalGlobalError(null);
    try {
      await holdingsApi.createHolding(formToPayload(form));
      setModal(null);
      setActionError(null);
      await fetchHoldings({ silent: true });
    } catch (err) {
      setModalFieldErrors(getApiFieldErrors(err));
      setModalGlobalError(getApiErrorMessage(err, "Failed to create holding."));
    } finally {
      setModalSubmitting(false);
    }
  };

  // ── UPDATE ───────────────────────────────────────────────────────────────
  const handleUpdate = async (holding: UiHolding, form: HoldingFormState) => {
    setModalSubmitting(true);
    setModalFieldErrors({});
    setModalGlobalError(null);
    try {
      await holdingsApi.updateHolding(holding.id, formToPayload(form));
      setModal(null);
      setActionError(null);
      await fetchHoldings({ silent: true });
    } catch (err) {
      setModalFieldErrors(getApiFieldErrors(err));
      setModalGlobalError(getApiErrorMessage(err, "Failed to update holding."));
    } finally {
      setModalSubmitting(false);
    }
  };

  // ── DELETE ───────────────────────────────────────────────────────────────
  const handleDelete = async (holding: UiHolding) => {
    const confirmed = window.confirm(
      `Delete "${holding.name}"? This cannot be undone and will unlink all associated animals.`,
    );
    if (!confirmed) return;

    setDeletingId(holding.id);
    setActionError(null);
    try {
      await holdingsApi.deleteHolding(holding.id);
      await fetchHoldings({ silent: true });
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Failed to delete holding."));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Modal submit router ──────────────────────────────────────────────────
  const handleModalSubmit = (form: HoldingFormState) => {
    if (modal?.type === "create") return handleCreate(form);
    if (modal?.type === "edit") return handleUpdate(modal.holding, form);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Holdings &amp; Properties</h1>
          <p className="text-muted-foreground">
            {loading ? "Loading…" : `${totalCount.toLocaleString()} holding${totalCount !== 1 ? "s" : ""} registered`}
          </p>
        </div>
        <Button onClick={() => { setModal({ type: "create" }); setModalFieldErrors({}); setModalGlobalError(null); }}>
          <Plus className="w-5 h-5" />
          Add New Holding
        </Button>
      </div>

      {/* ── Map placeholder ───────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Map View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Map className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Interactive GIS map showing all holdings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              className="w-full pl-9 pr-3 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              placeholder="Search by name, reg. no., county…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value as OrderingOption)}
            className="sm:w-52"
          >
            <option value="-created_at">Newest first</option>
            <option value="created_at">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="-name">Name Z–A</option>
          </Select>
        </div>
        {actionError && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            {actionError}
          </div>
        )}
      </Card>

      {/* ── List error ────────────────────────────────────────────────────── */}
      {listError && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive">
          {listError}
          <Button
            variant="outline"
            size="sm"
            className="ml-4"
            onClick={() => fetchHoldings()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── Holdings grid ─────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: PAGE_SIZE }).map((_, i) => <HoldingCardSkeleton key={i} />)
        ) : holdings.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No holdings found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search.`
                : "Get started by registering your first holding."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setModal({ type: "create" })}>
                <Plus className="w-4 h-4" />
                Add New Holding
              </Button>
            )}
          </div>
        ) : (
          holdings.map((holding) => (
            <Card key={holding.id} hover>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-1">{holding.name}</CardTitle>
                    <Badge variant="secondary">{holding.county}</Badge>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-muted-foreground mb-1">Owner</div>
                  <div className="font-medium">{holding.owner}</div>
                </div>

                <div>
                  <div className="text-muted-foreground mb-1">Location</div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="font-medium">
                      {[holding.ward, holding.subCounty, holding.county]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground mb-1">Animal Count</div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{holding.animalCount}</span>
                    </div>
                  </div>
                  {holding.totalAreaAcres != null && (
                    <div>
                      <div className="text-muted-foreground mb-1">Area</div>
                      <div className="font-medium">{holding.totalAreaAcres.toLocaleString()} ac</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewHolding(holding)}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setModalFieldErrors({});
                      setModalGlobalError(null);
                      setModal({ type: "edit", holding });
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={deletingId === holding.id}
                    onClick={() => handleDelete(holding)}
                  >
                    {deletingId === holding.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {!loading && totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">
            Page {page} of {totalPages} · {totalCount.toLocaleString()} holdings
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ────────────────────────────────────────────── */}
      {modal && (
        <HoldingModal
          mode={modal.type}
          initial={
            modal.type === "edit" ? holdingToForm(modal.holding) : BLANK_FORM
          }
          submitting={modalSubmitting}
          fieldErrors={modalFieldErrors}
          globalError={modalGlobalError}
          onSubmit={handleModalSubmit}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Detail Panel ──────────────────────────────────────────────────── */}
      {viewHolding && (
        <HoldingDetailPanel
          holding={viewHolding}
          onClose={() => setViewHolding(null)}
        />
      )}
    </div>
  );
}

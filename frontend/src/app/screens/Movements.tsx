import { useEffect, useMemo, useState } from "react";
import { Plus, Map, Filter, Download, CheckCircle, XCircle, Clock, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select, Textarea } from "../components/Input";
import type {
  ApiMovementPermit,
  ApiMovementPermitStatus,
  ApiMovementPurpose,
  ApiMovementRecord,
  MovementPayload,
} from "../lib/api/movements";
import { mapApiMovementToMovement } from "../lib/api/movements";
import { formatDate } from "../lib/utils";
import type { Movement } from "../lib/types";
import { animalsApi } from "../services/api/animals";
import { getApiErrorMessage } from "../services/api/errors";
import { movementsApi } from "../services/api/movements";

type FormState = {
  animalRfid: string;
  purpose: ApiMovementPurpose | "";
  originHolding: string;
  destinationHolding: string;
  movementDate: string;
  permitNumber: string;
  crossBorder: boolean;
  notes: string;
};

const emptyForm: FormState = {
  animalRfid: "",
  purpose: "",
  originHolding: "",
  destinationHolding: "",
  movementDate: "",
  permitNumber: "",
  crossBorder: false,
  notes: "",
};

const holdingOptions = [
  { value: "1", label: "Kiambu Dairy Farm" },
  { value: "2", label: "Kisumu Livestock Ranch" },
  { value: "3", label: "Nakuru Valley Dairy" },
  { value: "4", label: "Dagoretti Livestock Market" },
];

function getHoldingLabel(value: string | number | null | undefined) {
  if (!value) return "";
  return holdingOptions.find((option) => option.value === String(value))?.label || `Holding #${value}`;
}

function purposeFromUi(value: string): ApiMovementPurpose | "" {
  if (value === "transfer") return "other";
  return value as ApiMovementPurpose | "";
}

function formFromRecord(record: ApiMovementRecord, permit?: ApiMovementPermit): FormState {
  return {
    animalRfid: record.animal_tag,
    purpose: record.purpose,
    originHolding: record.origin_farm ? String(record.origin_farm) : "",
    destinationHolding: record.destination_farm ? String(record.destination_farm) : "",
    movementDate: record.move_date,
    permitNumber: permit?.permit_number || "",
    crossBorder: record.origin_county.trim().toLowerCase() !== record.destination_county.trim().toLowerCase(),
    notes: record.transporter || "",
  };
}

export function Movements() {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [animalFilter, setAnimalFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<ApiMovementPurpose | "">("");
  const [ordering, setOrdering] = useState<"move_date" | "-move_date" | "created_at" | "-created_at">("-move_date");
  const [page, setPage] = useState(1);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [records, setRecords] = useState<ApiMovementRecord[]>([]);
  const [permitsById, setPermitsById] = useState<Record<number, ApiMovementPermit>>({});
  const [totalMovements, setTotalMovements] = useState(0);
  const [nextPageAvailable, setNextPageAvailable] = useState(false);
  const [previousPageAvailable, setPreviousPageAvailable] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ApiMovementRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingMovementId, setEditingMovementId] = useState<number | null>(null);
  const [deletingMovementId, setDeletingMovementId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [animalFilter, filterStatus, ordering, purposeFilter, searchQuery]);

  useEffect(() => {
    let isCurrent = true;

    async function loadMovements() {
      setLoading(true);
      setError(null);

      try {
        const permitStatus: ApiMovementPermitStatus | "" =
          filterStatus === "Pending"
            ? "pending"
            : filterStatus === "Rejected"
            ? "rejected"
            : "";
        const [movementResponse, permitResponse] = await Promise.all([
          movementsApi.listMovements({
            page,
            pageSize,
            search: searchQuery.trim(),
            animal: animalFilter.trim(),
            purpose: purposeFilter,
            permitStatus,
            ordering,
          }),
          movementsApi.listPermits({ pageSize: 100, ordering: "-issued_on" }),
        ]);

        if (!isCurrent) return;

        const permitLookup = permitResponse.results.reduce<Record<number, ApiMovementPermit>>((lookup, permit) => {
          lookup[permit.id] = permit;
          return lookup;
        }, {});
        const mappedMovements = movementResponse.results.map((record) =>
          mapApiMovementToMovement(record, permitLookup),
        );

        setRecords(movementResponse.results);
        setPermitsById(permitLookup);
        setMovements(mappedMovements);
        setTotalMovements(movementResponse.count);
        setNextPageAvailable(Boolean(movementResponse.next));
        setPreviousPageAvailable(Boolean(movementResponse.previous));
      } catch (err) {
        if (!isCurrent) return;
        setError(getApiErrorMessage(err, "Unable to load movements. Please try again."));
        setRecords([]);
        setPermitsById({});
        setMovements([]);
        setTotalMovements(0);
        setNextPageAvailable(false);
        setPreviousPageAvailable(false);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadMovements();

    return () => {
      isCurrent = false;
    };
  }, [animalFilter, filterStatus, ordering, page, purposeFilter, searchQuery]);

  const filteredMovements = useMemo(() => {
    if (filterStatus === "all" || filterStatus === "Pending" || filterStatus === "Rejected") {
      return movements;
    }
    return movements.filter((movement) => movement.status === filterStatus);
  }, [filterStatus, movements]);

  const stats = useMemo(
    () => ({
      total: totalMovements,
      pending: movements.filter((movement) => movement.status === "Pending").length,
      inTransit: movements.filter((movement) => movement.status === "In Transit").length,
      completed: movements.filter((movement) => movement.status === "Completed").length,
    }),
    [movements, totalMovements],
  );

  const getStatusVariant = (status: Movement["status"]) => {
    switch (status) {
      case "Completed":
        return "success";
      case "In Transit":
        return "info";
      case "Pending":
        return "warning";
      case "Rejected":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: Movement["status"]) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "Pending":
      case "In Transit":
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const updateForm = (field: keyof FormState, value: string | boolean) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const refreshCurrentPage = async () => {
    const permitStatus: ApiMovementPermitStatus | "" =
      filterStatus === "Pending" ? "pending" : filterStatus === "Rejected" ? "rejected" : "";
    const [movementResponse, permitResponse] = await Promise.all([
      movementsApi.listMovements({
        page,
        pageSize,
        search: searchQuery.trim(),
        animal: animalFilter.trim(),
        purpose: purposeFilter,
        permitStatus,
        ordering,
      }),
      movementsApi.listPermits({ pageSize: 100, ordering: "-issued_on" }),
    ]);
    const permitLookup = permitResponse.results.reduce<Record<number, ApiMovementPermit>>((lookup, permit) => {
      lookup[permit.id] = permit;
      return lookup;
    }, {});

    setRecords(movementResponse.results);
    setPermitsById(permitLookup);
    setMovements(movementResponse.results.map((record) => mapApiMovementToMovement(record, permitLookup)));
    setTotalMovements(movementResponse.count);
    setNextPageAvailable(Boolean(movementResponse.next));
    setPreviousPageAvailable(Boolean(movementResponse.previous));
  };

  const resolveAnimalId = async (animalTag: string) => {
    const response = await animalsApi.listAnimals({ search: animalTag.trim(), pageSize: 10 });
    const match = response.results.find(
      (animal) => animal.tag_number === animalTag.trim() || animal.rfid_tag === animalTag.trim(),
    );
    if (!match) {
      throw new Error("No animal found for that RFID/tag.");
    }
    return match.id;
  };

  const resolvePermitId = async (permitNumber: string) => {
    if (!permitNumber.trim()) return null;
    const response = await movementsApi.listPermits({ search: permitNumber.trim(), pageSize: 10 });
    const match = response.results.find((permit) => permit.permit_number === permitNumber.trim());
    return match?.id ?? null;
  };

  const buildPayload = async (): Promise<MovementPayload> => {
    if (!form.animalRfid.trim() || !form.purpose || !form.originHolding || !form.destinationHolding || !form.movementDate) {
      throw new Error("Animal RFID, Purpose, Origin, Destination, and Movement Date are required.");
    }

    const animalId = await resolveAnimalId(form.animalRfid);
    const permitId = await resolvePermitId(form.permitNumber);

    return {
      animal: animalId,
      permit: permitId,
      origin_farm: Number(form.originHolding),
      destination_farm: Number(form.destinationHolding),
      origin_county: getHoldingLabel(form.originHolding),
      destination_county: form.crossBorder
        ? `${getHoldingLabel(form.destinationHolding)} Cross-Border`
        : getHoldingLabel(form.destinationHolding),
      move_date: form.movementDate,
      purpose: form.purpose,
      transporter: form.notes.trim(),
      vehicle_reg: "",
    };
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingMovementId(null);
    setActionError(null);
  };

  const handleCreateClick = () => {
    resetForm();
    setSelectedRecord(null);
    setShowForm((currentValue) => !currentValue);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setActionError(null);

    try {
      const payload = await buildPayload();
      if (editingMovementId) {
        await movementsApi.updateMovement(editingMovementId, payload);
      } else {
        await movementsApi.createMovement(payload);
      }
      resetForm();
      setShowForm(false);
      await refreshCurrentPage();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to save movement. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewMovement = async (movementId: string) => {
    setActionError(null);

    try {
      const record = await movementsApi.getMovement(movementId);
      setSelectedRecord(record);
      setShowForm(false);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to load movement details. Please try again."));
    }
  };

  const handleEditMovement = async (movementId: string) => {
    setActionError(null);

    try {
      const record = await movementsApi.getMovement(movementId);
      const permit = record.permit ? permitsById[record.permit] || await movementsApi.getPermit(record.permit) : undefined;
      setEditingMovementId(record.id);
      setForm(formFromRecord(record, permit));
      setSelectedRecord(null);
      setShowForm(true);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to load movement for editing. Please try again."));
    }
  };

  const handleDeleteMovement = async (movementId: string) => {
    const confirmed = window.confirm("Delete this movement record? This cannot be undone.");
    if (!confirmed) return;

    setDeletingMovementId(Number(movementId));
    setActionError(null);

    try {
      await movementsApi.deleteMovement(movementId);
      if (selectedRecord?.id === Number(movementId)) {
        setSelectedRecord(null);
      }
      await refreshCurrentPage();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to delete movement. Please try again."));
    } finally {
      setDeletingMovementId(null);
    }
  };

  const updatePermitStatus = async (movement: Movement, status: ApiMovementPermitStatus) => {
    const record = records.find((item) => String(item.id) === movement.id);
    if (!record?.permit) {
      setActionError("This movement does not have a linked permit.");
      return;
    }

    setActionError(null);

    try {
      await movementsApi.updatePermit(record.permit, { status });
      await refreshCurrentPage();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to update movement permit. Please try again."));
    }
  };

  const selectedMovement = selectedRecord ? mapApiMovementToMovement(selectedRecord, permitsById) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Animal Movement Tracking</h1>
          <p className="text-muted-foreground">Monitor and manage livestock movements between holdings</p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="w-5 h-5" />
          Record Movement
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Total Movements</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.total}</div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Map className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Pending</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.pending}</div>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>In Transit</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.inTransit}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Completed</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.completed}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingMovementId ? "Edit Movement" : "Record New Movement"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Animal RFID *"
                placeholder="254000123456789"
                value={form.animalRfid}
                onChange={(event) => updateForm("animalRfid", event.target.value)}
              />
              <Select
                label="Movement Purpose *"
                value={form.purpose}
                onChange={(event) => updateForm("purpose", purposeFromUi(event.target.value))}
              >
                <option value="">Select purpose</option>
                <option value="sale">Sale</option>
                <option value="breeding">Breeding</option>
                <option value="grazing">Grazing</option>
                <option value="slaughter">Slaughter</option>
                <option value="other">Transfer</option>
              </Select>
              <Select
                label="Origin Holding *"
                value={form.originHolding}
                onChange={(event) => updateForm("originHolding", event.target.value)}
              >
                <option value="">Select origin</option>
                <option value="1">Kiambu Dairy Farm</option>
                <option value="2">Kisumu Livestock Ranch</option>
                <option value="3">Nakuru Valley Dairy</option>
              </Select>
              <Select
                label="Destination Holding *"
                value={form.destinationHolding}
                onChange={(event) => updateForm("destinationHolding", event.target.value)}
              >
                <option value="">Select destination</option>
                <option value="1">Kiambu Dairy Farm</option>
                <option value="2">Nakuru Valley Dairy</option>
                <option value="3">Dagoretti Livestock Market</option>
              </Select>
              <Input
                label="Movement Date *"
                type="date"
                value={form.movementDate}
                onChange={(event) => updateForm("movementDate", event.target.value)}
              />
              <Input
                label="Permit Number"
                placeholder="KE-MV-2026-001234"
                value={form.permitNumber}
                onChange={(event) => updateForm("permitNumber", event.target.value)}
              />
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={form.crossBorder}
                    onChange={(event) => updateForm("crossBorder", event.target.checked)}
                  />
                  <span>Cross-Border Movement</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Notes"
                  placeholder="Additional movement details..."
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                />
              </div>
              {actionError && (
                <div className="md:col-span-2 text-destructive">
                  {actionError}
                </div>
              )}
              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Movement"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMovement && (
        <Card>
          <CardHeader>
            <CardTitle>Movement Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-muted-foreground">Animal RFID</div>
                <div className="font-medium">{selectedMovement.animalRfid}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Purpose</div>
                <div className="font-medium">{selectedMovement.purpose}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Origin</div>
                <div className="font-medium">{selectedMovement.fromHolding}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Destination</div>
                <div className="font-medium">{selectedMovement.toHolding}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Movement Date</div>
                <div className="font-medium">{formatDate(selectedMovement.movementDate)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <Badge variant={getStatusVariant(selectedMovement.status)}>
                  {selectedMovement.status}
                </Badge>
              </div>
              {selectedMovement.permitNumber && (
                <div>
                  <div className="text-muted-foreground">Permit Number</div>
                  <div className="font-medium font-mono">{selectedMovement.permitNumber}</div>
                </div>
              )}
              {selectedMovement.crossBorder && (
                <div>
                  <div className="text-muted-foreground">Movement Type</div>
                  <Badge variant="warning">Cross-Border Movement</Badge>
                </div>
              )}
              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
                  Close
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEditMovement(selectedMovement.id)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={deletingMovementId === Number(selectedMovement.id)}
                  onClick={() => handleDeleteMovement(selectedMovement.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Movement Route Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Map className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Interactive map showing movement routes and real-time tracking</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Movement History</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <Input
              placeholder="Search movements..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <Input
              placeholder="Filter by animal RFID/tag"
              value={animalFilter}
              onChange={(event) => setAnimalFilter(event.target.value)}
            />
            <Select
              value={purposeFilter}
              onChange={(event) => setPurposeFilter(purposeFromUi(event.target.value))}
            >
              <option value="">All Purposes</option>
              <option value="sale">Sale</option>
              <option value="breeding">Breeding</option>
              <option value="grazing">Grazing</option>
              <option value="slaughter">Slaughter</option>
              <option value="other">Transfer</option>
            </Select>
            <Select value={ordering} onChange={(event) => setOrdering(event.target.value as typeof ordering)}>
              <option value="-move_date">Newest Movement</option>
              <option value="move_date">Oldest Movement</option>
              <option value="-created_at">Recently Created</option>
              <option value="created_at">Earliest Created</option>
            </Select>
          </div>
          {!showForm && actionError && (
            <div className="text-destructive mb-4">
              {actionError}
            </div>
          )}
          {error && (
            <div className="text-destructive mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {loading && (
              <div className="text-center text-muted-foreground py-8">Loading movements...</div>
            )}
            {!loading && filteredMovements.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No movements found</div>
            )}
            {!loading && filteredMovements.map((movement) => (
              <div key={movement.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(movement.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold">RFID: {movement.animalRfid}</div>
                        <div className="text-muted-foreground">{movement.purpose}</div>
                      </div>
                      <Badge variant={getStatusVariant(movement.status)}>
                        {movement.status}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mt-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-muted-foreground">Origin</div>
                          <div className="font-medium">{movement.fromHolding}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-muted-foreground">Destination</div>
                          <div className="font-medium">{movement.toHolding}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Movement Date</div>
                        <div className="font-medium">{formatDate(movement.movementDate)}</div>
                      </div>
                      {movement.permitNumber && (
                        <div>
                          <div className="text-muted-foreground">Permit Number</div>
                          <div className="font-medium font-mono">{movement.permitNumber}</div>
                        </div>
                      )}
                    </div>
                    {movement.crossBorder && (
                      <div className="mt-2">
                        <Badge variant="warning">Cross-Border Movement</Badge>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      {movement.status === "Pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updatePermitStatus(movement, "approved")}>
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updatePermitStatus(movement, "rejected")}>
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleViewMovement(movement.id)}>
                        View Details
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEditMovement(movement.id)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={deletingMovementId === Number(movement.id)}
                        onClick={() => handleDeleteMovement(movement.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
            <div className="text-muted-foreground">
              Showing {filteredMovements.length} of {totalMovements} movements
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading || !previousPageAvailable}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || !nextPageAvailable}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

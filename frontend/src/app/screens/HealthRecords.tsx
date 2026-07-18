import { Plus, Heart, AlertTriangle, Syringe, Activity, ArrowUpCircle, FileText, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select, Textarea } from "../components/Input";
import type { ApiHealthRecord, HealthRecordPayload } from "../lib/api/health";
import { mapApiHealthRecordToHealthEvent } from "../lib/api/health";
import type { HealthEvent } from "../lib/types";
import { formatDate } from "../lib/utils";
import { animalsApi } from "../services/api/animals";
import { getApiErrorMessage } from "../services/api/errors";
import { healthApi } from "../services/api/health";
import { apiClient } from "../services/api/client";
import { useAuth } from "../context/AuthContext";

type FormState = {
  animalTag: string;
  eventType: "vaccination" | "disease" | "treatment" | "injury" | "death" | "";
  diseaseName: string;
  date: string;
  recordedBy: string;
  credentialLevel: string;
  notes: string;
  vetDocument: File | null;
};

const DISEASE_OPTIONS = [
  "Foot and Mouth Disease (FMD)",
  "East Coast Fever (ECF)",
  "Contagious Bovine Pleuropneumonia (CBPP)",
  "Lumpy Skin Disease (LSD)",
  "Rift Valley Fever (RVF)",
  "Brucellosis",
  "Blackleg (Clostridial Disease)",
  "Trypanosomiasis (Sleeping Sickness)",
  "Anthrax",
  "Bovine Tuberculosis (BTB)",
  "Mastitis",
  "Bovine Respiratory Disease (BRD)",
  "Peste des Petits Ruminants (PPR)",
  "Contagious Caprine Pleuropneumonia (CCPP)",
  "Sheep Pox / Goat Pox",
  "Contagious Ecthyma (Orf)",
  "African Swine Fever (ASF)",
  "Newcastle Disease",
  "Heartwater (Cowdriosis)",
  "Anaplasmosis",
  "Babesiosis (Redwater)",
];

const VACCINE_OPTIONS = [
  "FMD Vaccine",
  "ECF Vaccine (Muguga Cocktail)",
  "CBPP Vaccine",
  "LSD Vaccine",
  "RVF Vaccine",
  "Brucella Vaccine (S19/RB51)",
  "Blackleg / Clostridial Vaccine",
  "Anthrax Vaccine (Sterne)",
  "PPR Vaccine",
  "CCPP Vaccine",
  "Sheep Pox / Goat Pox Vaccine",
  "Rabies Vaccine",
  "Heartwater Vaccine",
  "Anaplasmosis Vaccine",
  "Dewormer (Ivermectin)",
  "Dewormer (Albendazole)",
  "Tick Dip / Acaricide",
];

const emptyForm: FormState = {
  animalTag: "",
  eventType: "",
  diseaseName: "",
  date: "",
  recordedBy: "",
  credentialLevel: "",
  notes: "",
  vetDocument: null,
};

function toPayload(form: FormState, animalId: number): HealthRecordPayload {
  return {
    animal: animalId,
    record_type:
      form.eventType === "vaccination"
        ? "vaccination"
        : form.eventType === "treatment"
        ? "treatment"
        : form.eventType === "disease"
        ? "examination"
        : "other",
    date: form.date,
    medication: form.diseaseName.trim(),
    notes: form.notes.trim(),
    vet_document: form.vetDocument ?? undefined,
  };
}

function formFromRecord(record: ApiHealthRecord): FormState {
  const event = mapApiHealthRecordToHealthEvent(record);

  return {
    animalTag: record.animal_tag,
    eventType:
      event.eventType === "Vaccination"
        ? "vaccination"
        : event.eventType === "Disease"
        ? "disease"
        : "treatment",
    diseaseName: event.vaccine || event.disease || record.medication || "",
    date: record.date,
    recordedBy: event.recordedBy,
    credentialLevel: event.credentialLevel,
    notes: record.notes,
    vetDocument: null,
  };
}

export function HealthRecords() {
  const { user } = useAuth();
  const canWrite = user?.role === "vet" || user?.role === "cahw";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [records, setRecords] = useState<ApiHealthRecord[]>([]);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ApiHealthRecord | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);
  const [escalatingRecordId, setEscalatingRecordId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [nextPageAvailable, setNextPageAvailable] = useState(false);
  const [previousPageAvailable, setPreviousPageAvailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [animalFilter, setAnimalFilter] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, animalFilter, diseaseFilter]);

  useEffect(() => {
    let isCurrent = true;

    async function loadRecords() {
      setLoading(true);
      setError(null);

      try {
        const response = await healthApi.listHealthRecords({
          page,
          pageSize,
          search: searchQuery.trim(),
          animal: animalFilter.trim(),
          disease: diseaseFilter.trim(),
          ordering: "-date",
        });

        if (!isCurrent) return;

        setRecords(response.results);
        setEvents(response.results.map(mapApiHealthRecordToHealthEvent));
        setTotalRecords(response.count);
        setNextPageAvailable(Boolean(response.next));
        setPreviousPageAvailable(Boolean(response.previous));
      } catch (err) {
        if (!isCurrent) return;
        setError(getApiErrorMessage(err, "Unable to load health records. Please try again."));
        setRecords([]);
        setEvents([]);
        setTotalRecords(0);
        setNextPageAvailable(false);
        setPreviousPageAvailable(false);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadRecords();

    return () => {
      isCurrent = false;
    };
  }, [animalFilter, diseaseFilter, page, searchQuery]);

  const healthStats = useMemo(
    () => ({
      totalEvents: totalRecords,
      vaccinations: events.filter((event) => event.eventType === "Vaccination").length,
      diseases: events.filter((event) => event.eventType === "Disease").length,
      treatments: events.filter((event) => event.eventType === "Treatment").length,
    }),
    [events, totalRecords],
  );

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const refreshCurrentPage = async () => {
    const response = await healthApi.listHealthRecords({
      page,
      pageSize,
      search: searchQuery.trim(),
      animal: animalFilter.trim(),
      disease: diseaseFilter.trim(),
      ordering: "-date",
    });
    setRecords(response.results);
    setEvents(response.results.map(mapApiHealthRecordToHealthEvent));
    setTotalRecords(response.count);
    setNextPageAvailable(Boolean(response.next));
    setPreviousPageAvailable(Boolean(response.previous));
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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingRecordId(null);
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
      if (!form.animalTag.trim() || !form.eventType || !form.date) {
        throw new Error("Animal RFID, Event Type, and Date are required.");
      }

      const animalId = await resolveAnimalId(form.animalTag);
      const payload = toPayload(form, animalId);

      if (editingRecordId) {
        const updated = await healthApi.updateHealthRecord(editingRecordId, payload);
        // Use the server response to update the specific record immediately,
        // rather than waiting for a full re-fetch that could fail or be stale.
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setEvents((prev) =>
          prev.map((e) => (e.id === String(updated.id) ? mapApiHealthRecordToHealthEvent(updated) : e)),
        );
      } else {
        await healthApi.createHealthRecord(payload);
      }

      resetForm();
      setShowForm(false);
      // Background refresh for full consistency (e.g. new record ordering, count).
      // Errors here are intentionally swallowed — the save already succeeded above.
      refreshCurrentPage().catch(() => {});
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to save health record. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewRecord = async (recordId: number) => {
    setActionError(null);

    try {
      const record = await healthApi.getHealthRecord(recordId);
      setSelectedRecord(record);
      setShowForm(false);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to load health record. Please try again."));
    }
  };

  const handleEditRecord = async (recordId: number) => {
    setActionError(null);

    try {
      const record = await healthApi.getHealthRecord(recordId);
      setEditingRecordId(record.id);
      setForm(formFromRecord(record));
      setSelectedRecord(null);
      setShowForm(true);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to load health record. Please try again."));
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    const confirmed = window.confirm("Delete this health record? This cannot be undone.");
    if (!confirmed) return;

    setDeletingRecordId(recordId);
    setActionError(null);

    try {
      await healthApi.deleteHealthRecord(recordId);
      if (selectedRecord?.id === recordId) {
        setSelectedRecord(null);
      }
      await refreshCurrentPage();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to delete health record. Please try again."));
    } finally {
      setDeletingRecordId(null);
    }
  };

  const handleEscalate = async (recordId: number) => {
    setEscalatingRecordId(recordId);
    setActionError(null);
    try {
      const { data } = await apiClient.post(`/health-events/${recordId}/escalate/`);
      alert(data.detail ?? "Record escalated to DVS officer.");
      await refreshCurrentPage();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Failed to escalate record."));
    } finally {
      setEscalatingRecordId(null);
    }
  };

  const credibilityBadgeVariant = (level: string) => {
    if (level === "vet_verified") return "success" as const;
    if (level === "cahw_observation") return "warning" as const;
    return "secondary" as const;
  };

  const credibilityLabel = (level: string) => {
    if (level === "vet_verified") return "Vet Verified";
    if (level === "cahw_observation") return "CAHW";
    return "Self Reported";
  };

  const selectedEvent = selectedRecord ? mapApiHealthRecordToHealthEvent(selectedRecord) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Health Records</h1>
          <p className="text-muted-foreground">Monitor animal health and manage medical events</p>
        </div>
        {canWrite && (
          <Button onClick={handleCreateClick}>
            <Plus className="w-5 h-5" />
            Record Health Event
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Total Events</CardTitle>
                <div className="text-3xl font-semibold mt-2">{healthStats.totalEvents}</div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Vaccinations</CardTitle>
                <div className="text-3xl font-semibold mt-2">{healthStats.vaccinations}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Syringe className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Disease Cases</CardTitle>
                <div className="text-3xl font-semibold mt-2">{healthStats.diseases}</div>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Treatments</CardTitle>
                <div className="text-3xl font-semibold mt-2">{healthStats.treatments}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              placeholder="Search records..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <Input
              placeholder="Filter by animal RFID/tag"
              value={animalFilter}
              onChange={(event) => setAnimalFilter(event.target.value)}
            />
            <Input
              placeholder="Filter by disease"
              value={diseaseFilter}
              onChange={(event) => setDiseaseFilter(event.target.value)}
            />
          </div>
          {actionError && (
            <div className="text-destructive mt-4">
              {actionError}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Health Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground">Event Type</div>
                  <div className="font-medium">{selectedEvent.eventType}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Animal RFID</div>
                  <div className="font-medium">{selectedEvent.animalRfid}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Disease/Vaccine</div>
                  <div className="font-medium">{selectedEvent.vaccine || selectedEvent.disease || "Not recorded"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Date</div>
                  <div className="font-medium">{formatDate(selectedEvent.date)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Recorded By</div>
                  <div className="font-medium">{selectedEvent.recordedBy}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Credential Level</div>
                  <div className="font-medium">{selectedEvent.credentialLevel}</div>
                </div>
              </div>
              {selectedEvent.notes && (
                <div className="text-muted-foreground italic pt-2 border-t border-border">
                  {selectedEvent.notes}
                </div>
              )}
              {selectedRecord?.vet_document && (
                <div className="pt-2 border-t border-border">
                  <div className="text-muted-foreground mb-1">Credential Document</div>
                  <a
                    href={selectedRecord.vet_document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    View uploaded document
                  </a>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
                  Close
                </Button>
                {canWrite && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleEditRecord(selectedRecord!.id)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deletingRecordId === selectedRecord!.id}
                      onClick={() => handleDeleteRecord(selectedRecord!.id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRecordId ? "Edit Health Event" : "Record Health Event"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Animal RFID"
                placeholder="254000123456789"
                value={form.animalTag}
                onChange={(event) => updateForm("animalTag", event.target.value)}
              />
              <Select
                label="Event Type"
                value={form.eventType}
                onChange={(event) => updateForm("eventType", event.target.value)}
              >
                <option value="">Select event type</option>
                <option value="vaccination">Vaccination</option>
                <option value="disease">Disease Case</option>
                <option value="treatment">Treatment</option>
                <option value="injury">Injury</option>
                <option value="death">Death</option>
              </Select>
              {form.eventType === "disease" || form.eventType === "vaccination" ? (() => {
                const options = form.eventType === "vaccination" ? VACCINE_OPTIONS : DISEASE_OPTIONS;
                const isCustom = form.diseaseName !== "" && !options.includes(form.diseaseName);
                const selectValue = isCustom ? "__other__" : form.diseaseName;
                return (
                  <>
                    <Select
                      label={form.eventType === "vaccination" ? "Vaccine Name" : "Disease Name"}
                      value={selectValue}
                      onChange={(event) => {
                        if (event.target.value === "__other__") {
                          updateForm("diseaseName", "");
                        } else {
                          updateForm("diseaseName", event.target.value);
                        }
                      }}
                    >
                      <option value="">
                        {form.eventType === "vaccination" ? "Select vaccine..." : "Select disease..."}
                      </option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      <option value="__other__">Other (specify below)</option>
                    </Select>
                    {selectValue === "__other__" && (
                      <Input
                        label="Specify Name"
                        placeholder={form.eventType === "vaccination" ? "Custom vaccine name" : "Custom disease name"}
                        value={form.diseaseName}
                        onChange={(event) => updateForm("diseaseName", event.target.value)}
                      />
                    )}
                  </>
                );
              })() : (
                <Input
                  label="Disease/Vaccine Name"
                  placeholder="e.g., medication, treatment type"
                  value={form.diseaseName}
                  onChange={(event) => updateForm("diseaseName", event.target.value)}
                />
              )}
              <Input
                label="Date"
                type="date"
                value={form.date}
                onChange={(event) => updateForm("date", event.target.value)}
              />
              <Input
                label="Recorded By"
                placeholder="Veterinarian name"
                value={form.recordedBy}
                onChange={(event) => updateForm("recordedBy", event.target.value)}
              />
              <Input
                label="Credential Level"
                placeholder="e.g., Licensed Veterinarian"
                value={form.credentialLevel}
                onChange={(event) => updateForm("credentialLevel", event.target.value)}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Notes"
                  placeholder="Additional details about this health event..."
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                />
              </div>

              {/* Credential document upload — required for credibility verification */}
              <div className="md:col-span-2">
                <div className="text-sm font-medium mb-1.5">
                  Credential Document
                  {user?.role === "vet" && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </div>
                <div
                  className="flex items-center gap-3 p-3 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Upload className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {form.vetDocument ? (
                      <span className="text-sm font-medium truncate block">{form.vetDocument.name}</span>
                    ) : (
                      <>
                        <span className="text-sm font-medium block">Upload veterinary licence / certificate</span>
                        <span className="text-xs text-muted-foreground">PDF, JPG or PNG · max 5 MB</span>
                      </>
                    )}
                  </div>
                  {form.vetDocument && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive text-xs shrink-0"
                      onClick={(e) => { e.stopPropagation(); setForm((f) => ({ ...f, vetDocument: null })); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setForm((f) => ({ ...f, vetDocument: file }));
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.role === "vet"
                    ? "Upload your DVS licence or practice certificate to achieve Vet Verified credibility."
                    : "Upload your CAHW certificate to support CAHW Observation credibility."}
                </p>
              </div>

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
                  {submitting ? "Saving..." : "Save Health Event"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Health Events</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {loading && (
              <div className="text-center text-muted-foreground py-8">Loading health records...</div>
            )}
            {!loading && events.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No health records found</div>
            )}
            {!loading && events.map((event, index) => {
              const record = records[index];

              return (
                <div key={event.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    event.eventType === "Vaccination"
                      ? "bg-green-100 dark:bg-green-900/20"
                      : event.eventType === "Disease"
                      ? "bg-red-100 dark:bg-red-900/20"
                      : "bg-blue-100 dark:bg-blue-900/20"
                  }`}>
                    {event.eventType === "Vaccination" ? (
                      <Syringe className="w-6 h-6 text-green-600" />
                    ) : event.eventType === "Disease" ? (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    ) : (
                      <Heart className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold">{event.eventType}</div>
                        <div className="text-muted-foreground">
                          RFID: {event.animalRfid}
                        </div>
                      </div>
                      <div className="space-y-2 flex flex-col items-end">
                        <div className="flex gap-2">
                          <Badge variant={credibilityBadgeVariant(record.credibility_level)}>
                            {credibilityLabel(record.credibility_level)}
                          </Badge>
                          {record.is_escalated && (
                            <Badge variant="warning">Escalated</Badge>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={() => handleViewRecord(record.id)}>
                            View
                          </Button>
                          {canWrite && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleEditRecord(record.id)}>
                                Edit
                              </Button>
                              {!record.is_escalated && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={escalatingRecordId === record.id}
                                  onClick={() => handleEscalate(record.id)}
                                  title="Escalate to DVS Officer"
                                >
                                  <ArrowUpCircle className="w-4 h-4" />
                                  Escalate
                                </Button>
                              )}
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={deletingRecordId === record.id}
                                onClick={() => handleDeleteRecord(record.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">
                        {event.vaccine || event.disease || "No disease or vaccine recorded"}
                      </div>
                      <div className="text-muted-foreground">
                        Date: {formatDate(event.date)}
                      </div>
                      <div className="text-muted-foreground">
                        By: {event.recordedBy} ({event.credentialLevel})
                      </div>
                      {event.notes && (
                        <div className="text-muted-foreground italic pt-2 border-t border-border">
                          {event.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
            <div className="text-muted-foreground">
              Showing {events.length} of {totalRecords} health records
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

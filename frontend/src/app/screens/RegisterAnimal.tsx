import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Link, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Input, Select, Textarea } from "../components/Input";
import { animalsApi } from "../services/api/animals";
import { holdingsApi } from "../services/api/holdings";
import type { ApiFarm } from "../lib/api/holdings";
import { getApiErrorMessage, getApiFieldErrors } from "../services/api/errors";
import { useAuth } from "../context/AuthContext";

interface RegisterAnimalProps {
  onBack: () => void;
  onComplete: () => void;
}

export function RegisterAnimal({ onBack, onComplete }: RegisterAnimalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [farms, setFarms] = useState<ApiFarm[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    holdingsApi.listHoldings({ pageSize: 100 }).then((res) => setFarms(res.results)).catch(() => {});
  }, []);

  // Photo state
  type PhotoEntry = { kind: "file"; file: File; preview: string } | { kind: "url"; url: string };
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [photoTab, setPhotoTab] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_PHOTOS = 5;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    const accepted = Array.from(files).slice(0, remaining).filter((f) =>
      f.type.startsWith("image/")
    );
    const entries: PhotoEntry[] = accepted.map((file) => ({
      kind: "file",
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...entries]);
  };

  const addUrl = () => {
    setUrlError(null);
    try { new URL(urlInput); } catch {
      setUrlError("Enter a valid URL.");
      return;
    }
    if (photos.length >= MAX_PHOTOS) {
      setUrlError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }
    setPhotos((prev) => [...prev, { kind: "url", url: urlInput }]);
    setUrlInput("");
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const entry = prev[index];
      if (entry.kind === "file") URL.revokeObjectURL(entry.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const [form, setForm] = useState({
    rfid: "",
    species: "",
    breed: "",
    sex: "",
    ageClass: "",
    dateOfBirth: "",
    ownerName: "",
    ownerEmail: "",
    holdingId: "",
    propertyAddress: "",
    weight: "",
    color: "",
    markings: "",
  });

  const steps = [
    { number: 1, title: "Animal Identification" },
    { number: 2, title: "Ownership" },
    { number: 3, title: "Physical Description" },
    { number: 4, title: "Review & Submit" },
  ];

  const AGE_CLASSES: Record<string, { value: string; label: string }[]> = {
    cattle: [
      { value: "calf", label: "Calf (< 6 months)" },
      { value: "weaner", label: "Weaner (6–12 months)" },
      { value: "yearling", label: "Yearling (1–2 years)" },
      { value: "adult", label: "Adult (> 2 years)" },
    ],
    goat: [
      { value: "kid", label: "Kid (< 4 months)" },
      { value: "weaner", label: "Weaner (4–8 months)" },
      { value: "yearling", label: "Yearling (8–18 months)" },
      { value: "adult", label: "Adult (> 18 months)" },
    ],
    sheep: [
      { value: "lamb", label: "Lamb (< 4 months)" },
      { value: "weaner", label: "Weaner (4–8 months)" },
      { value: "hogget", label: "Hogget (8–18 months)" },
      { value: "adult", label: "Adult (> 18 months)" },
    ],
    camel: [
      { value: "calf", label: "Calf (< 1 year)" },
      { value: "sub-adult", label: "Sub-adult (1–4 years)" },
      { value: "adult", label: "Adult (> 4 years)" },
    ],
    donkey: [
      { value: "foal", label: "Foal (< 1 year)" },
      { value: "yearling", label: "Yearling (1–2 years)" },
      { value: "adult", label: "Adult (> 2 years)" },
    ],
    poultry: [
      { value: "chick", label: "Chick (< 4 weeks)" },
      { value: "grower", label: "Grower (4–20 weeks)" },
      { value: "adult", label: "Adult (> 20 weeks)" },
    ],
  };

  const BREED_PLACEHOLDERS: Record<string, string> = {
    cattle: "e.g. Boran, Friesian, Sahiwal",
    goat: "e.g. Galla, Boer, Toggenburg",
    sheep: "e.g. Dorper, Red Maasai, Merino",
    camel: "e.g. Somali, Sudan",
    donkey: "e.g. Somali, Nubian",
    poultry: "e.g. Kienyeji, Kenbro, Broiler",
  };

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((currentForm) => {
      const next = { ...currentForm, [field]: value };
      if (field === "species") next.ageClass = "";
      return next;
    });
    // Clear field-level error when user edits the field
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setStepError(null);
  };

  const validateStep1 = (): string | null => {
    if (!form.rfid.trim()) return "RFID Number is required.";
    if (!form.species) return "Species is required.";
    if (!form.sex) return "Sex is required.";
    if (!form.dateOfBirth) return "Date of Birth is required.";
    return null;
  };

  const handleNext = () => {
    setStepError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setStepError(err);
        return;
      }
    }
    setStep(Math.min(4, step + 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const animal = await animalsApi.createAnimal({
        tag_number: form.rfid.trim(),
        rfid_tag: form.rfid.trim(),
        name: form.breed.trim(),
        species: form.species,
        breed_name: form.breed.trim(),
        age_class: form.ageClass,
        breed: null,
        sex: form.sex === "male" ? "M" : "F",
        date_of_birth: form.dateOfBirth,
        color: form.color.trim(),
        markings: form.markings.trim(),
        current_farm: form.holdingId ? Number(form.holdingId) : null,
      });

      // Upload photos sequentially
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p.kind === "file") {
          await animalsApi.uploadPhoto(animal.tag_number, p.file, i);
        } else {
          await animalsApi.addPhotoUrl(animal.tag_number, p.url, i);
        }
      }

      onComplete();
    } catch (err) {
      const fieldErrs = getApiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
        // Map backend field names to steps so we can jump back
        const step1Fields = new Set(["tag_number", "rfid_tag", "sex", "date_of_birth"]);
        const isStep1Error = Object.keys(fieldErrs).some((f) => step1Fields.has(f));
        if (isStep1Error) setStep(1);
      }
      setError(getApiErrorMessage(err, "Unable to register animal. Please try again."));
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="mb-1">Register New Animal</h1>
          <p className="text-muted-foreground">Step {step} of {steps.length}: {steps[step - 1].title}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step > s.number
                      ? "bg-primary text-primary-foreground"
                      : step === s.number
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.number ? <Check className="w-6 h-6" /> : s.number}
                </div>
                <div className={`mt-2 text-center ${step === s.number ? "font-medium" : "text-muted-foreground"}`}>
                  {s.title}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-4 ${step > s.number ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[step - 1].title}</CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                {stepError && (
                  <div ref={errorRef} className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {stepError}
                  </div>
                )}
                <div>
                  <Input
                    label="RFID Number *"
                    placeholder="254000123456789"
                    value={form.rfid}
                    onChange={(e) => updateForm("rfid", e.target.value)}
                  />
                  {(fieldErrors.tag_number || fieldErrors.rfid_tag) && (
                    <p className="mt-1 text-sm text-destructive">{fieldErrors.tag_number || fieldErrors.rfid_tag}</p>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Select
                    label="Species *"
                    value={form.species}
                    onChange={(e) => updateForm("species", e.target.value)}
                  >
                    <option value="">Select species</option>
                    <option value="cattle">Cattle</option>
                    <option value="goat">Goat</option>
                    <option value="sheep">Sheep</option>
                    <option value="camel">Camel</option>
                    <option value="donkey">Donkey</option>
                    <option value="poultry">Poultry</option>
                  </Select>
                  <Input
                    label="Breed *"
                    placeholder={BREED_PLACEHOLDERS[form.species] ?? "e.g. Boran, Friesian, Sahiwal"}
                    value={form.breed}
                    onChange={(e) => updateForm("breed", e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Select
                    label="Sex *"
                    value={form.sex}
                    onChange={(e) => updateForm("sex", e.target.value)}
                  >
                    <option value="">Select sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Select>
                  <Select
                    label="Age Class *"
                    value={form.ageClass}
                    onChange={(e) => updateForm("ageClass", e.target.value)}
                    disabled={!form.species}
                  >
                    <option value="">
                      {form.species ? "Select age class" : "Select species first"}
                    </option>
                    {(AGE_CLASSES[form.species] ?? []).map((cls) => (
                      <option key={cls.value} value={cls.value}>{cls.label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Input
                    label="Date of Birth *"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                  />
                  {fieldErrors.date_of_birth && (
                    <p className="mt-1 text-sm text-destructive">{fieldErrors.date_of_birth}</p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Input
                  label="Owner Name *"
                  placeholder="Kamau Mwangi"
                  value={form.ownerName}
                  onChange={(e) => updateForm("ownerName", e.target.value)}
                />
                <Input
                  label="Owner Email"
                  type="email"
                  placeholder="kamau@example.co.ke"
                  value={form.ownerEmail}
                  onChange={(e) => updateForm("ownerEmail", e.target.value)}
                />
                <Select
                  label="Property/Holding *"
                  value={form.holdingId}
                  onChange={(e) => updateForm("holdingId", e.target.value)}
                >
                  <option value="">Select property</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={String(farm.id)}>{farm.name}</option>
                  ))}
                  {farms.length === 0 && <option disabled>No holdings registered yet</option>}
                </Select>
                <Input
                  label="Property Address"
                  placeholder="Plot 234, Ruiru-Kiambu Road, Kiambu County"
                  value={form.propertyAddress}
                  onChange={(e) => updateForm("propertyAddress", e.target.value)}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Weight (kg)"
                    type="number"
                    placeholder="650"
                    value={form.weight}
                    onChange={(e) => updateForm("weight", e.target.value)}
                  />
                  <Input
                    label="Color"
                    placeholder="e.g., White, Brown, Black and White"
                    value={form.color}
                    onChange={(e) => updateForm("color", e.target.value)}
                  />
                </div>
                <Textarea
                  label="Distinguishing Marks"
                  placeholder="Any unique identifying features..."
                  value={form.markings}
                  onChange={(e) => updateForm("markings", e.target.value)}
                />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium">Photos</label>
                    <span className="text-sm text-muted-foreground">{photos.length}/{MAX_PHOTOS}</span>
                  </div>

                  {/* Tab switcher */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setPhotoTab("file")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${photoTab === "file" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoTab("url")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${photoTab === "url" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                    >
                      <Link className="w-3.5 h-3.5" /> Add URL
                    </button>
                  </div>

                  {/* File drop zone */}
                  {photoTab === "file" && (
                    <div
                      onClick={() => photos.length < MAX_PHOTOS && fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${photos.length >= MAX_PHOTOS ? "opacity-50 cursor-not-allowed border-border" : dragging ? "border-primary bg-primary/5 cursor-copy" : "border-border hover:border-primary cursor-pointer"}`}
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <div className="font-medium mb-1">
                        {photos.length >= MAX_PHOTOS ? "Maximum photos reached" : "Click to browse or drag & drop"}
                      </div>
                      <div className="text-sm text-muted-foreground">JPG, PNG, WEBP up to 10 MB</div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => addFiles(e.target.files)}
                        disabled={photos.length >= MAX_PHOTOS}
                      />
                    </div>
                  )}

                  {/* URL input */}
                  {photoTab === "url" && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/animal.jpg"
                          value={urlInput}
                          onChange={(e) => { setUrlInput(e.target.value); setUrlError(null); }}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
                          disabled={photos.length >= MAX_PHOTOS}
                          className="flex-1 px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={addUrl}
                          disabled={!urlInput.trim() || photos.length >= MAX_PHOTOS}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      {urlError && <p className="text-sm text-destructive">{urlError}</p>}
                    </div>
                  )}

                  {/* Preview grid */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                      {photos.map((p, i) => (
                        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                          <img
                            src={p.kind === "file" ? p.preview : p.url}
                            alt={`Photo ${i + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {i === 0 && (
                            <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1 rounded">Cover</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Registration Summary</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-muted-foreground">RFID Number</div>
                      <div className="font-medium">{form.rfid || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Species</div>
                      <div className="font-medium capitalize">{form.species || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Breed</div>
                      <div className="font-medium">{form.breed || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Age Class</div>
                      <div className="font-medium capitalize">{form.ageClass || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Sex</div>
                      <div className="font-medium capitalize">{form.sex || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Date of Birth</div>
                      <div className="font-medium">{form.dateOfBirth || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Color</div>
                      <div className="font-medium">{form.color || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Owner</div>
                      <div className="font-medium">
                        {user
                          ? (user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.username)
                          : (form.ownerName || "Current user")}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Property</div>
                      <div className="font-medium">
                        {form.holdingId
                          ? (farms.find((f) => String(f.id) === form.holdingId)?.name ?? `Farm #${form.holdingId}`)
                          : "Unassigned"}
                      </div>
                    </div>
                    {photos.length > 0 && (
                      <div>
                        <div className="text-muted-foreground">Photos</div>
                        <div className="font-medium">{photos.length} photo{photos.length !== 1 ? "s" : ""} attached</div>
                      </div>
                    )}
                  </div>
                </div>
                {error && (
                  <div ref={errorRef} className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Registration failed</p>
                      <p className="text-sm mt-0.5">{error}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="text-foreground">
                    By submitting, you confirm that all information is accurate and complete.
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => { setStepError(null); setStep(Math.max(1, step - 1)); }}
                disabled={step === 1}
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </Button>
              {step < 4 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="w-5 h-5" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting}>
                  <Check className="w-5 h-5" />
                  {submitting ? "Submitting..." : "Submit Registration"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

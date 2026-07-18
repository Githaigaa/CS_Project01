import type { Animal } from "../types";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BreedSummary {
  id: number;
  name: string;
  description: string;
}

export type ApiAnimalSex = "M" | "F";
export type ApiAnimalStatus = "alive" | "sold" | "slaughtered" | "deceased" | "stolen" | "quarantined";

// Statuses a farmer can set manually (mirrors FARMER_ALLOWED_STATUSES in the backend)
export type FarmerSettableStatus = "alive" | "stolen" | "deceased" | "slaughtered";
export const FARMER_STATUS_OPTIONS: { value: FarmerSettableStatus; label: string }[] = [
  { value: "alive",       label: "Active" },
  { value: "stolen",      label: "Stolen" },
  { value: "deceased",    label: "Dead" },
  { value: "slaughtered", label: "Slaughtered" },
];

export interface ApiAnimalPhoto {
  id: number;
  image: string | null;
  image_url: string | null;
  url: string;
  order: number;
}

export interface ApiAnimal {
  id: number;
  tag_number: string;
  rfid_tag: string | null;
  name: string;
  uuid: string;
  species: string;
  breed: number | null;
  breed_detail: BreedSummary | null;
  breed_name: string;
  age_class: string;
  sex: ApiAnimalSex;
  date_of_birth: string;
  age_months: number;
  color: string;
  markings: string;
  current_owner: number | null;
  current_owner_name: string | null;
  current_farm: number | null;
  current_farm_name: string | null;
  dam: number | null;
  sire: number | null;
  status: ApiAnimalStatus;
  photo: string | null;
  photos: ApiAnimalPhoto[];
  registered_by: number | null;
  registration_date: string;
  created_at: string;
  updated_at: string;
}

export interface AnimalListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  current_farm?: number | string;
  status?: string;
  ordering?: "registration_date" | "-registration_date" | "date_of_birth" | "-date_of_birth" | "created_at" | "-created_at";
}

export interface AnimalPayload {
  tag_number: string;
  rfid_tag?: string | null;
  name?: string;
  species?: string;
  breed?: number | null;
  breed_name?: string;
  age_class?: string;
  sex: ApiAnimalSex;
  date_of_birth: string;
  color?: string;
  markings?: string;
  current_farm?: number | null;
  dam?: number | null;
  sire?: number | null;
  status?: ApiAnimalStatus;
  photo?: string | null;
}

export const animalStatusLabels: Record<ApiAnimalStatus, Animal["status"]> = {
  alive: "Active",
  stolen: "Stolen",
  sold: "Sold",
  slaughtered: "Slaughtered",
  deceased: "Dead",
  quarantined: "Active",
};

export function mapApiAnimalToAnimal(apiAnimal: ApiAnimal): Animal {
  // Age class: prefer stored value, fall back to computed from age_months
  const ageClass =
    apiAnimal.age_class ||
    (apiAnimal.age_months < 12 ? "Calf" : apiAnimal.age_months < 24 ? "Young Stock" : "Adult");

  // Breed: prefer FK breed name, then free-text breed_name, then legacy name field
  const breed =
    apiAnimal.breed_detail?.name ||
    apiAnimal.breed_name ||
    apiAnimal.name ||
    "Unspecified";

  // Species: prefer stored value, fall back to "Cattle" for legacy records
  const species = apiAnimal.species
    ? apiAnimal.species.charAt(0).toUpperCase() + apiAnimal.species.slice(1)
    : "Cattle";

  return {
    id: apiAnimal.tag_number,
    rfid: apiAnimal.rfid_tag || apiAnimal.tag_number,
    species,
    breed,
    sex: apiAnimal.sex === "M" ? "Male" : "Female",
    ageClass,
    dateOfBirth: apiAnimal.date_of_birth,
    color: apiAnimal.color || undefined,
    distinguishingMarks: apiAnimal.markings || undefined,
    currentOwner: apiAnimal.current_owner_name || (apiAnimal.current_owner ? `Owner #${apiAnimal.current_owner}` : "Unassigned"),
    currentHolding: apiAnimal.current_farm_name || (apiAnimal.current_farm ? `Holding #${apiAnimal.current_farm}` : "Unassigned"),
    status: animalStatusLabels[apiAnimal.status],
    registrationDate: apiAnimal.registration_date,
    photo: apiAnimal.photo
      || apiAnimal.photos?.[0]?.image_url
      || apiAnimal.photos?.[0]?.url
      || undefined,
    photos: apiAnimal.photos
      ?.map((p) => p.image_url || p.url)
      .filter((u): u is string => Boolean(u)),
    traceabilityScore: 100,
  };
}

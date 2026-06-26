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
export type ApiAnimalStatus = "alive" | "sold" | "slaughtered" | "deceased" | "quarantined";

export interface ApiAnimal {
  id: number;
  tag_number: string;
  rfid_tag: string | null;
  name: string;
  uuid: string;
  breed: number | null;
  breed_detail: BreedSummary | null;
  sex: ApiAnimalSex;
  date_of_birth: string;
  age_months: number;
  color: string;
  markings: string;
  current_owner: number | null;
  current_farm: number | null;
  dam: number | null;
  sire: number | null;
  status: ApiAnimalStatus;
  photo: string | null;
  registered_by: number | null;
  registration_date: string;
  created_at: string;
  updated_at: string;
}

export interface AnimalListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: "registration_date" | "-registration_date" | "date_of_birth" | "-date_of_birth" | "created_at" | "-created_at";
}

export interface AnimalPayload {
  tag_number: string;
  rfid_tag?: string | null;
  name?: string;
  breed?: number | null;
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
  sold: "Sold",
  slaughtered: "Slaughtered",
  deceased: "Deceased",
  quarantined: "Active",
};

export function mapApiAnimalToAnimal(apiAnimal: ApiAnimal): Animal {
  const ageClass =
    apiAnimal.age_months < 12 ? "Calf" : apiAnimal.age_months < 24 ? "Young Stock" : "Adult";

  return {
    id: apiAnimal.tag_number,
    rfid: apiAnimal.rfid_tag || apiAnimal.tag_number,
    species: "Cattle",
    breed: apiAnimal.breed_detail?.name || "Unspecified",
    sex: apiAnimal.sex === "M" ? "Male" : "Female",
    ageClass,
    dateOfBirth: apiAnimal.date_of_birth,
    color: apiAnimal.color || undefined,
    distinguishingMarks: apiAnimal.markings || undefined,
    currentOwner: apiAnimal.current_owner ? `Owner #${apiAnimal.current_owner}` : "Unassigned",
    currentHolding: apiAnimal.current_farm ? `Holding #${apiAnimal.current_farm}` : "Unassigned",
    status: animalStatusLabels[apiAnimal.status],
    registrationDate: apiAnimal.registration_date,
    photo: apiAnimal.photo || undefined,
    traceabilityScore: 100,
  };
}

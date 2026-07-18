export interface Animal {
  id: string;
  rfid: string;
  species: string;
  breed: string;
  sex: "Male" | "Female";
  ageClass: string;
  dateOfBirth?: string;
  weight?: number;
  color?: string;
  distinguishingMarks?: string;
  currentOwner: string;
  currentHolding: string;
  status: "Active" | "Sold" | "Stolen" | "Dead" | "Slaughtered" | "For Sale";
  registrationDate: string;
  photo?: string;
  photos?: string[];
  traceabilityScore?: number;
}

export interface Holding {
  id: string;
  name: string;
  owner: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  propertyType: "Farm" | "Feedlot" | "Auction" | "Abattoir";
  animalCount: number;
  area?: string;
}

export interface Movement {
  id: string;
  animalId: string;
  animalRfid: string;
  fromHolding: string;
  toHolding: string;
  movementDate: string;
  purpose: "Sale" | "Breeding" | "Grazing" | "Slaughter" | "Transfer";
  permitNumber?: string;
  crossBorder: boolean;
  status: "Pending" | "Approved" | "In Transit" | "Completed" | "Rejected";
}

export interface HealthEvent {
  id: string;
  animalId: string;
  animalRfid: string;
  eventType: "Vaccination" | "Disease" | "Treatment" | "Injury" | "Death";
  disease?: string;
  vaccine?: string;
  date: string;
  recordedBy: string;
  credentialLevel: string;
  notes?: string;
  severity?: "Low" | "Medium" | "High" | "Critical";
}

export interface MarketplaceListing {
  id: string;
  animalId: string;
  animal: Animal;
  askingPrice: number;
  isNegotiable: boolean;
  description: string;
  seller: string;
  locationCounty: string;
  listedDate: string;
  status: "Active" | "Pending" | "Sold" | "Withdrawn";
  views: number;
  offers: number;
}

export interface Transaction {
  id: string;
  animalId: string;
  animalRfid: string;
  seller: string;
  buyer: string;
  askingPrice: number;
  agreedPrice: number;
  paymentStatus: "Pending" | "Paid" | "Failed";
  saleDate: string;
  status: "Pending" | "Completed" | "Cancelled";
}

export interface SlaughterRecord {
  id: string;
  animalId: string;
  animalRfid: string;
  abattoirId: string;
  abattoirName: string;
  chainNumber: string;
  batchNumber?: string;
  carcassId: string;
  slaughterDate: string;
  liveWeightKg?: number;
  carcassWeightKg?: number;
  dressingPct?: number;
  inspectionResult?: string;
  meatGrade?: string;
  inspectorName?: string;
  feedback?: string;
  verified: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Farmer" | "Buyer" | "Animal Health Worker" | "Abattoir" | "Administrator";
  organization?: string;
  verified: boolean;
}

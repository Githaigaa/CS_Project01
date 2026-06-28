import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CheckCircle,
  Heart,
  Receipt,
  Shield,
  TrendingUp,
} from "lucide-react";

import type { ApiHealthRecord, ApiMovementRecord, ApiTransaction } from "./animalProfile";
import type { ApiSlaughterRecord } from "./slaughter";
import type { Animal } from "../types";
import type { ApiAnimal } from "./animals";
import { mapApiAnimalToAnimal } from "./animals";
import { mapApiTransactionToTransaction } from "./transactions";

export interface TimelineEvent {
  id: string;
  type: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  title: string;
  timestamp: string;
  description: string;
  details: Record<string, string>;
  status: "completed";
}

function computeTraceabilityScore(
  healthCount: number,
  movementCount: number,
  transactionCount: number,
  slaughterCount: number,
): number {
  let score = 40;
  if (healthCount > 0) score += 20;
  if (movementCount > 0) score += 15;
  if (transactionCount > 0) score += 15;
  if (slaughterCount > 0) score += 10;
  return Math.min(score, 100);
}

export function buildTraceabilityTimeline(input: {
  apiAnimal: ApiAnimal;
  healthRecords: ApiHealthRecord[];
  movementRecords: ApiMovementRecord[];
  transactions: ApiTransaction[];
  slaughterRecords: ApiSlaughterRecord[];
}): { animal: Animal; events: TimelineEvent[]; traceabilityScore: number } {
  const animal = mapApiAnimalToAnimal(input.apiAnimal);
  const events: TimelineEvent[] = [
    {
      id: "registration",
      type: "registration",
      icon: Shield,
      iconColor: "text-primary",
      bgColor: "bg-primary",
      title: "Animal Registration",
      timestamp: animal.registrationDate,
      description: `Registered by ${animal.currentOwner}`,
      details: {
        RFID: animal.rfid,
        Species: animal.species,
        Breed: animal.breed,
        Sex: animal.sex,
      },
      status: "completed",
    },
  ];

  input.healthRecords.forEach((record) => {
    events.push({
      id: `health-${record.id}`,
      type: "health",
      icon: Heart,
      iconColor: "text-green-600",
      bgColor: "bg-green-600",
      title: `${record.record_type} - ${record.diagnosis_detail?.name || record.medication || "Health event"}`,
      timestamp: record.date,
      description: record.vet ? `Recorded by Vet #${record.vet}` : "Health record logged",
      details: {
        "Event Type": record.record_type,
        Diagnosis: record.diagnosis_detail?.name || "Not recorded",
        Certificate: record.certificate_no || "N/A",
      },
      status: "completed",
    });
  });

  input.movementRecords.forEach((record) => {
    events.push({
      id: `movement-${record.id}`,
      type: "movement",
      icon: TrendingUp,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-600",
      title: `Movement - ${record.purpose}`,
      timestamp: record.move_date,
      description: `${record.origin_county} → ${record.destination_county}`,
      details: {
        Origin: record.origin_county,
        Destination: record.destination_county,
        Purpose: record.purpose,
        Permit: record.permit ? `Permit #${record.permit}` : "N/A",
      },
      status: "completed",
    });
  });

  input.transactions.forEach((record) => {
    const transaction = mapApiTransactionToTransaction(record);
    events.push({
      id: `transaction-${record.id}`,
      type: "transaction",
      icon: Receipt,
      iconColor: "text-secondary",
      bgColor: "bg-secondary",
      title: "Transaction Completed",
      timestamp: record.transaction_date,
      description: `${transaction.seller} → ${transaction.buyer}`,
      details: {
        Seller: transaction.seller,
        Buyer: transaction.buyer,
        "Agreed Price": `KES ${transaction.agreedPrice.toLocaleString()}`,
        "Payment Status": transaction.paymentStatus,
      },
      status: "completed",
    });
  });

  if (input.slaughterRecords.length > 0) {
    input.slaughterRecords.forEach((record) => {
      events.push({
        id: `slaughter-${record.id}`,
        type: "slaughter",
        icon: Building2,
        iconColor: "text-purple-600",
        bgColor: "bg-purple-600",
        title: "Slaughter Processing",
        timestamp: record.slaughter_date,
        description: record.abattoir_detail?.name || "Abattoir processing",
        details: {
          Abattoir: record.abattoir_detail?.name || "Unknown",
          "Chain Number": record.slaughter_no,
          Grade: record.meat_grade || "N/A",
          Result: record.inspection_result,
        },
        status: "completed",
      });
    });
  }

  events.sort(
    (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );

  const traceabilityScore = computeTraceabilityScore(
    input.healthRecords.length,
    input.movementRecords.length,
    input.transactions.length,
    input.slaughterRecords.length,
  );

  if (events.length > 1) {
    events.push({
      id: "lifecycle-complete",
      type: "final",
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-600",
      title: "Lifecycle Snapshot",
      timestamp: events[events.length - 1]?.timestamp ?? animal.registrationDate,
      description: "Traceability records collected from live platform data",
      details: {
        "Health Events": String(input.healthRecords.length),
        Movements: String(input.movementRecords.length),
        Transactions: String(input.transactions.length),
        "Compliance Status": traceabilityScore >= 80 ? "Verified" : "Partial",
      },
      status: "completed",
    });
  }

  return {
    animal: { ...animal, traceabilityScore },
    events,
    traceabilityScore,
  };
}

export function filterSlaughterForAnimal(
  records: ApiSlaughterRecord[],
  animalId: number,
): ApiSlaughterRecord[] {
  return records.filter((record) => record.animal === animalId);
}

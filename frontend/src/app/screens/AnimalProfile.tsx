import { ArrowLeft, MapPin, Calendar, Weight, Palette, FileText, Activity, TrendingUp, Heart, Receipt } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { mockAnimals, mockMovements, mockHealthEvents, mockTransactions } from "../lib/mockData";
import { formatDate, formatDateTime } from "../lib/utils";

interface AnimalProfileProps {
  animalId: string;
  onBack: () => void;
}

export function AnimalProfile({ animalId, onBack }: AnimalProfileProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "ownership" | "movements" | "health" | "transactions" | "lifecycle">("overview");

  const animal = mockAnimals.find((a) => a.id === animalId);
  if (!animal) return <div>Animal not found</div>;

  const animalMovements = mockMovements.filter((m) => m.animalId === animalId);
  const animalHealth = mockHealthEvents.filter((h) => h.animalId === animalId);
  const animalTransactions = mockTransactions.filter((t) => t.animalId === animalId);

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "ownership" as const, label: "Ownership History" },
    { id: "movements" as const, label: "Movement History" },
    { id: "health" as const, label: "Health Records" },
    { id: "transactions" as const, label: "Transactions" },
    { id: "lifecycle" as const, label: "Lifecycle" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="mb-1">Animal Profile</h1>
          <p className="text-muted-foreground">RFID: {animal.rfid}</p>
        </div>
        <Button variant="outline">
          <FileText className="w-5 h-5" />
          Download Report
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-4">
              <img
                src={animal.photo}
                alt={animal.breed}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-muted-foreground">Species</div>
                <div className="font-medium">{animal.species}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Breed</div>
                <div className="font-medium">{animal.breed}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <Badge variant={animal.status === "Active" ? "success" : "secondary"}>
                  {animal.status}
                </Badge>
              </div>
              {animal.traceabilityScore && (
                <div>
                  <div className="text-muted-foreground">Traceability Score</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${animal.traceabilityScore}%` }}
                      />
                    </div>
                    <span className="font-medium">{animal.traceabilityScore}%</span>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex border-b border-border -mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {activeTab === "overview" && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-muted-foreground">Date of Birth</div>
                      <div className="font-medium">{animal.dateOfBirth ? formatDate(animal.dateOfBirth) : "Not recorded"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-muted-foreground mt-0.5 flex items-center justify-center">
                      ♂/♀
                    </div>
                    <div>
                      <div className="text-muted-foreground">Sex</div>
                      <div className="font-medium">{animal.sex}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Weight className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-muted-foreground">Weight</div>
                      <div className="font-medium">{animal.weight ? `${animal.weight} kg` : "Not recorded"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Palette className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-muted-foreground">Color</div>
                      <div className="font-medium">{animal.color || "Not recorded"}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-muted-foreground">Current Holding</div>
                      <div className="font-medium">{animal.currentHolding}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-muted-foreground">Current Owner</div>
                      <div className="font-medium">{animal.currentOwner}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-muted-foreground">Registration Date</div>
                      <div className="font-medium">{formatDate(animal.registrationDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-muted-foreground">Age Class</div>
                      <div className="font-medium">{animal.ageClass}</div>
                    </div>
                  </div>
                </div>
                {animal.distinguishingMarks && (
                  <div className="md:col-span-2">
                    <div className="text-muted-foreground mb-1">Distinguishing Marks</div>
                    <div className="font-medium">{animal.distinguishingMarks}</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "movements" && (
              <div className="space-y-4">
                {animalMovements.length > 0 ? (
                  animalMovements.map((movement) => (
                    <div key={movement.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium mb-1">{movement.purpose}</div>
                        <div className="text-muted-foreground">
                          From: {movement.fromHolding} → To: {movement.toHolding}
                        </div>
                        <div className="text-muted-foreground">{formatDate(movement.movementDate)}</div>
                        {movement.permitNumber && (
                          <div className="text-muted-foreground">Permit: {movement.permitNumber}</div>
                        )}
                      </div>
                      <Badge variant={movement.status === "Completed" ? "success" : "warning"}>
                        {movement.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">No movement records</div>
                )}
              </div>
            )}

            {activeTab === "health" && (
              <div className="space-y-4">
                {animalHealth.length > 0 ? (
                  animalHealth.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium mb-1">{event.eventType}</div>
                        <div className="text-muted-foreground">
                          {event.vaccine || event.disease}
                        </div>
                        <div className="text-muted-foreground">{formatDate(event.date)}</div>
                        <div className="text-muted-foreground">By: {event.recordedBy}</div>
                        {event.notes && (
                          <div className="mt-2 text-muted-foreground italic">{event.notes}</div>
                        )}
                      </div>
                      <Badge variant={event.eventType === "Vaccination" ? "success" : "warning"}>
                        {event.severity}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">No health records</div>
                )}
              </div>
            )}

            {activeTab === "transactions" && (
              <div className="space-y-4">
                {animalTransactions.length > 0 ? (
                  animalTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium mb-1">Sale Transaction</div>
                        <div className="text-muted-foreground">
                          Seller: {transaction.seller} → Buyer: {transaction.buyer}
                        </div>
                        <div className="text-muted-foreground">
                          Price: ${transaction.agreedPrice.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">{formatDate(transaction.saleDate)}</div>
                      </div>
                      <Badge variant={transaction.status === "Completed" ? "success" : "warning"}>
                        {transaction.paymentStatus}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">No transaction records</div>
                )}
              </div>
            )}

            {activeTab === "lifecycle" && (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-6">
                  <div className="relative flex gap-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center relative z-10 flex-shrink-0">
                      <Activity className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="font-medium">Animal Registration</div>
                      <div className="text-muted-foreground">{formatDate(animal.registrationDate)}</div>
                      <div className="text-muted-foreground">Registered by {animal.currentOwner}</div>
                    </div>
                  </div>

                  {animalHealth.map((event, idx) => (
                    <div key={event.id} className="relative flex gap-4">
                      <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center relative z-10 flex-shrink-0">
                        <Heart className="w-6 h-6 text-secondary-foreground" />
                      </div>
                      <div className="flex-1 pt-2">
                        <div className="font-medium">{event.eventType}</div>
                        <div className="text-muted-foreground">{formatDate(event.date)}</div>
                        <div className="text-muted-foreground">{event.vaccine || event.disease}</div>
                      </div>
                    </div>
                  ))}

                  {animalMovements.map((movement, idx) => (
                    <div key={movement.id} className="relative flex gap-4">
                      <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center relative z-10 flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <div className="flex-1 pt-2">
                        <div className="font-medium">Movement: {movement.purpose}</div>
                        <div className="text-muted-foreground">{formatDate(movement.movementDate)}</div>
                        <div className="text-muted-foreground">
                          {movement.fromHolding} → {movement.toHolding}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

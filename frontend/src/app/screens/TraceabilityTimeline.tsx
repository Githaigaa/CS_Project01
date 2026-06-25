import { ArrowLeft, Shield, Heart, TrendingUp, Store, Receipt, Building2, CheckCircle, Download, QrCode } from "lucide-react";
import { Card, CardContent } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { mockAnimals, mockHealthEvents, mockMovements, mockTransactions, mockSlaughterRecords } from "../lib/mockData";
import { formatDate, formatDateTime } from "../lib/utils";

interface TraceabilityTimelineProps {
  animalId: string;
  onBack: () => void;
}

export function TraceabilityTimeline({ animalId, onBack }: TraceabilityTimelineProps) {
  const animal = mockAnimals[0];

  const timelineEvents = [
    {
      id: "1",
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
    {
      id: "2",
      type: "health",
      icon: Heart,
      iconColor: "text-green-600",
      bgColor: "bg-green-600",
      title: "Vaccination - FMD Vaccine",
      timestamp: "2026-05-15T10:30:00",
      description: "Administered by Dr. Njoroge Macharia",
      details: {
        "Event Type": "Vaccination",
        Vaccine: "Foot and Mouth Disease",
        "Credential Level": "Licensed Veterinary Officer",
      },
      status: "completed",
    },
    {
      id: "3",
      type: "health",
      icon: Heart,
      iconColor: "text-green-600",
      bgColor: "bg-green-600",
      title: "Health Check - Routine",
      timestamp: "2026-05-20T14:00:00",
      description: "Annual health inspection completed",
      details: {
        "Event Type": "Inspection",
        Result: "Passed",
        Inspector: "Dr. Kipchoge Tanui",
      },
      status: "completed",
    },
    {
      id: "4",
      type: "marketplace",
      icon: Store,
      iconColor: "text-accent",
      bgColor: "bg-accent",
      title: "Listed on Marketplace",
      timestamp: "2026-05-25T09:00:00",
      description: "Listed for sale by Kamau Mwangi",
      details: {
        "Asking Price": "KES 85,000",
        Views: "127",
        Offers: "3",
      },
      status: "completed",
    },
    {
      id: "5",
      type: "movement",
      icon: TrendingUp,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-600",
      title: "Movement - Sale",
      timestamp: "2026-05-28T11:30:00",
      description: "Kiambu Dairy Farm → Dagoretti Livestock Market",
      details: {
        Origin: "Kiambu Dairy Farm",
        Destination: "Dagoretti Livestock Market",
        "Permit Number": "KE-MV-2026-001234",
        Purpose: "Sale",
      },
      status: "completed",
    },
    {
      id: "6",
      type: "transaction",
      icon: Receipt,
      iconColor: "text-secondary",
      bgColor: "bg-secondary",
      title: "Transaction Completed",
      timestamp: "2026-05-28T15:00:00",
      description: "Sold to Nairobi Beef Processors Ltd",
      details: {
        Seller: "Kamau Mwangi",
        Buyer: "Nairobi Beef Processors Ltd",
        "Agreed Price": "KES 80,000",
        "Payment Status": "Paid",
      },
      status: "completed",
    },
    {
      id: "7",
      type: "movement",
      icon: TrendingUp,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-600",
      title: "Movement - Slaughter",
      timestamp: "2026-06-01T08:00:00",
      description: "Dagoretti Livestock Market → Nairobi Modern Abattoir",
      details: {
        Origin: "Dagoretti Livestock Market",
        Destination: "Nairobi Modern Abattoir",
        Purpose: "Slaughter",
      },
      status: "completed",
    },
    {
      id: "8",
      type: "slaughter",
      icon: Building2,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-600",
      title: "Slaughter Processing",
      timestamp: "2026-06-01T10:30:00",
      description: "Processed at Nairobi Modern Abattoir",
      details: {
        Abattoir: "Nairobi Modern Abattoir",
        "Chain Number": "NMA-2026-05432",
        "Carcass ID": "CARC-20260601-001",
        Grade: "A",
        Feedback: "Good meat quality",
      },
      status: "completed",
    },
    {
      id: "9",
      type: "final",
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-600",
      title: "Lifecycle Complete",
      timestamp: "2026-06-01T12:00:00",
      description: "Full traceability chain verified",
      details: {
        "Total Lifecycle": "88 days",
        "Traceability Score": "98%",
        "Compliance Status": "Verified",
      },
      status: "completed",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="mb-1">Complete Traceability Timeline</h1>
          <p className="text-muted-foreground">RFID: {animal.rfid}</p>
        </div>
        <Button variant="outline">
          <QrCode className="w-5 h-5" />
          Generate QR Code
        </Button>
        <Button variant="outline">
          <Download className="w-5 h-5" />
          Download Report
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-4">
              <img
                src={animal.photo}
                alt={animal.breed}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-muted-foreground">Species</div>
                <div className="font-semibold">{animal.species}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Breed</div>
                <div className="font-semibold">{animal.breed}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Registration Date</div>
                <div className="font-semibold">{formatDate(animal.registrationDate)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Traceability Score</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${animal.traceabilityScore}%` }}
                    />
                  </div>
                  <span className="font-semibold">{animal.traceabilityScore}%</span>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <Badge variant="success" className="w-full justify-center">
                  <CheckCircle className="w-4 h-4" />
                  Fully Verified
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="font-semibold mb-2">Complete Lifecycle Journey</h2>
                <p className="text-muted-foreground">
                  Every stage of this animal's journey from registration to final processing,
                  verified and traceable for complete transparency and regulatory compliance.
                </p>
              </div>

              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-green-600" />

                <div className="space-y-8">
                  {timelineEvents.map((event, idx) => {
                    const Icon = event.icon;
                    return (
                      <div key={event.id} className="relative pl-20">
                        <div
                          className={`absolute left-0 w-16 h-16 rounded-2xl ${event.bgColor} text-white flex items-center justify-center shadow-lg z-10`}
                        >
                          <Icon className="w-8 h-8" />
                        </div>

                        <Card hover className="border-2 border-border">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                                <p className="text-muted-foreground">{event.description}</p>
                              </div>
                              <Badge variant="success">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </Badge>
                            </div>

                            <div className="text-muted-foreground mb-4">
                              {formatDateTime(event.timestamp)}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                              {Object.entries(event.details).map(([key, value]) => (
                                <div key={key}>
                                  <div className="text-muted-foreground">{key}</div>
                                  <div className="font-medium">{value}</div>
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-2 mt-4">
                              <Button variant="ghost" size="sm">
                                View Documentation
                              </Button>
                              {event.type === "health" && (
                                <Button variant="ghost" size="sm">
                                  View Certificate
                                </Button>
                              )}
                              {event.type === "transaction" && (
                                <Button variant="ghost" size="sm">
                                  View Receipt
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border-2 border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      Complete Traceability Chain Verified
                    </h3>
                    <p className="text-muted-foreground">
                      This animal's complete lifecycle has been tracked, verified, and documented
                      in compliance with national livestock traceability regulations.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-semibold text-primary mb-1">
                      {animal.traceabilityScore}%
                    </div>
                    <div className="text-muted-foreground">Compliance</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

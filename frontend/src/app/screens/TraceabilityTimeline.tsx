import { useEffect, useState } from "react";
import { ArrowLeft, Shield, CheckCircle, Download, QrCode, Loader2 } from "lucide-react";
import { Card, CardContent } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import {
  buildTraceabilityTimeline,
  filterSlaughterForAnimal,
  type TimelineEvent,
} from "../lib/api/traceability";
import type { Animal } from "../lib/types";
import { formatDate, formatDateTime } from "../lib/utils";
import { animalsApi } from "../services/api/animals";
import { animalProfileApi } from "../services/api/animalProfile";
import { getApiErrorMessage } from "../services/api/errors";
import { slaughterApi } from "../services/api/slaughter";

interface TraceabilityTimelineProps {
  animalId: string;
  onBack: () => void;
}

export function TraceabilityTimeline({ animalId, onBack }: TraceabilityTimelineProps) {
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadTimeline() {
      setLoading(true);
      setError(null);

      try {
        const apiAnimal = await animalsApi.getAnimal(animalId);
        const related = await animalProfileApi.getAnimalProfileData(apiAnimal.tag_number);
        const slaughterResponse = await slaughterApi.listSlaughterRecords({ pageSize: 100 });
        const slaughterRecords = filterSlaughterForAnimal(
          slaughterResponse.results,
          apiAnimal.id,
        );
        const transactions = related.transactions.filter(
          (transaction) => transaction.animal_tag === apiAnimal.tag_number,
        );

        if (!isCurrent) return;

        const timeline = buildTraceabilityTimeline({
          apiAnimal,
          healthRecords: related.healthRecords,
          movementRecords: related.movementRecords,
          transactions,
          slaughterRecords,
        });

        setAnimal(timeline.animal);
        setTimelineEvents(timeline.events);
      } catch (err) {
        if (!isCurrent) return;
        setError(getApiErrorMessage(err, "Unable to load traceability timeline. Please try again."));
        setAnimal(null);
        setTimelineEvents([]);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadTimeline();
    return () => { isCurrent = false; };
  }, [animalId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading traceability timeline" />
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || "Animal not found."}
        </div>
      </div>
    );
  }

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
              {animal.photo ? (
                <img
                  src={animal.photo}
                  alt={animal.breed}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No photo
                </div>
              )}
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
                      style={{ width: `${animal.traceabilityScore ?? 0}%` }}
                    />
                  </div>
                  <span className="font-semibold">{animal.traceabilityScore ?? 0}%</span>
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

              {timelineEvents.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No traceability events recorded for this animal yet.
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-green-600" />

                  <div className="space-y-8">
                    {timelineEvents.map((event) => {
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
              )}

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
                      {animal.traceabilityScore ?? 0}%
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

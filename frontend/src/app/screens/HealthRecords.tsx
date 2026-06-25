import { Plus, Heart, AlertTriangle, Syringe, Activity } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select, Textarea } from "../components/Input";
import { mockHealthEvents } from "../lib/mockData";
import { formatDate } from "../lib/utils";

export function HealthRecords() {
  const [showForm, setShowForm] = useState(false);

  const healthStats = {
    totalEvents: mockHealthEvents.length,
    vaccinations: mockHealthEvents.filter(e => e.eventType === "Vaccination").length,
    diseases: mockHealthEvents.filter(e => e.eventType === "Disease").length,
    treatments: mockHealthEvents.filter(e => e.eventType === "Treatment").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Health Records</h1>
          <p className="text-muted-foreground">Monitor animal health and manage medical events</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Record Health Event
        </Button>
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

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record Health Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Animal RFID" placeholder="254000123456789" />
              <Select label="Event Type">
                <option value="">Select event type</option>
                <option value="vaccination">Vaccination</option>
                <option value="disease">Disease Case</option>
                <option value="treatment">Treatment</option>
                <option value="injury">Injury</option>
                <option value="death">Death</option>
              </Select>
              <Input label="Disease/Vaccine Name" placeholder="e.g., FMD, ECF, PPR, CBPP" />
              <Input label="Date" type="date" />
              <Input label="Recorded By" placeholder="Veterinarian name" />
              <Input label="Credential Level" placeholder="e.g., Licensed Veterinarian" />
              <div className="md:col-span-2">
                <Textarea label="Notes" placeholder="Additional details about this health event..." />
              </div>
              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button>
                  Save Health Event
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
          <div className="space-y-4">
            {mockHealthEvents.map((event) => (
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
                    <Badge variant={
                      event.severity === "Low" ? "success" :
                      event.severity === "Medium" ? "warning" :
                      "danger"
                    }>
                      {event.severity}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">
                      {event.vaccine || event.disease}
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

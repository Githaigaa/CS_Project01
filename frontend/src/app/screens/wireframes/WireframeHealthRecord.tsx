import { Card } from "../../components/Card";

export function WireframeHealthRecord() {
  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="border-2 border-dashed border-primary p-4 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-4 w-96 bg-muted/50 rounded" />
          </div>
          <div className="w-48 h-10 bg-primary/80 rounded-lg" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Total Events", color: "primary" },
          { label: "Vaccinations", color: "green-500" },
          { label: "Diseases", color: "red-500" },
          { label: "Treatments", color: "blue-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-2 border-dashed border-secondary">
            <div className="p-6 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-10 w-16 bg-muted rounded" />
                </div>
                <div className={`w-12 h-12 bg-${stat.color}/10 rounded-lg`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Entry Form */}
      <Card className="border-2 border-dashed border-accent">
        <div className="p-6 space-y-6">
          {/* Form Title */}
          <div className="h-6 w-48 bg-muted rounded" />

          {/* Form Grid */}
          <div className="grid md:grid-cols-2 gap-4 border-2 border-dashed border-primary/30 p-6 rounded-lg bg-primary/5">
            {/* Animal RFID */}
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg flex items-center px-3">
                <div className="h-3 w-32 bg-muted/50 rounded" />
              </div>
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg" />
            </div>

            {/* Disease/Vaccine */}
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg flex items-center px-3">
                <div className="h-3 w-48 bg-muted/50 rounded" />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <div className="h-4 w-12 bg-muted rounded" />
              <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg" />
            </div>

            {/* Recorded By */}
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg flex items-center px-3">
                <div className="h-3 w-40 bg-muted/50 rounded" />
              </div>
            </div>

            {/* Credential Level */}
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg" />
            </div>

            {/* Notes - Full Width */}
            <div className="md:col-span-2 space-y-2">
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-24 w-full bg-input-background border-2 border-border rounded-lg p-3 space-y-2">
                <div className="h-3 w-full bg-muted/30 rounded" />
                <div className="h-3 w-3/4 bg-muted/30 rounded" />
                <div className="h-3 w-1/2 bg-muted/30 rounded" />
              </div>
            </div>

            {/* Attachments */}
            <div className="md:col-span-2 space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-32 w-full border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/10">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-muted rounded-lg mx-auto" />
                  <div className="h-3 w-48 bg-muted/50 rounded mx-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-6 border-t border-border">
            <div className="w-24 h-10 bg-muted/50 rounded-lg border-2 border-border" />
            <div className="w-40 h-10 bg-primary/80 rounded-lg" />
          </div>
        </div>
      </Card>

      {/* Recent Health Events */}
      <Card className="border-2 border-dashed border-secondary">
        <div className="p-6 space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="space-y-3">
            {[
              { type: "vaccination", color: "green" },
              { type: "disease", color: "red" },
              { type: "treatment", color: "blue" },
            ].map((event, idx) => (
              <div key={idx} className="border-2 border-dashed border-muted p-4 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-${event.color}-500/10 rounded-lg flex-shrink-0`} />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-48 bg-muted rounded" />
                        <div className="h-3 w-32 bg-muted/50 rounded" />
                      </div>
                      <div className="w-20 h-6 bg-muted/50 rounded" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 w-full bg-muted/30 rounded" />
                      <div className="h-3 w-3/4 bg-muted/30 rounded" />
                      <div className="h-3 w-1/2 bg-muted/30 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Wireframe Label */}
      <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg font-semibold">
        WIREFRAME: Health Record Entry
      </div>
    </div>
  );
}

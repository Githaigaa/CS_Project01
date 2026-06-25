import { Card } from "../../components/Card";

export function WireframeDVSPermit() {
  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="border-2 border-dashed border-primary p-4 rounded-lg">
        <div className="space-y-2">
          <div className="h-8 w-80 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted/50 rounded" />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Pending Review", color: "amber" },
          { label: "Approved Today", color: "green" },
          { label: "Rejected", color: "red" },
          { label: "Compliance Rate", color: "blue" },
        ].map((stat) => (
          <Card key={stat.label} className="border-2 border-dashed border-secondary">
            <div className="p-6 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-10 w-16 bg-muted rounded" />
                </div>
                <div className={`w-12 h-12 bg-${stat.color}-500/10 rounded-lg`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter and Search */}
      <Card className="border-2 border-dashed border-accent">
        <div className="p-4 space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2 h-10 bg-input-background border-2 border-border rounded-lg" />
            <div className="h-10 bg-input-background border-2 border-border rounded-lg" />
            <div className="h-10 bg-input-background border-2 border-border rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-32 bg-primary/80 rounded-lg" />
            <div className="h-8 w-32 bg-muted/50 rounded-lg border-2 border-border" />
            <div className="h-8 w-32 bg-muted/50 rounded-lg border-2 border-border" />
          </div>
        </div>
      </Card>

      {/* Permit Applications List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item} className="border-2 border-dashed border-secondary">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-48 bg-muted rounded" />
                  <div className="h-3 w-64 bg-muted/50 rounded" />
                </div>
                <div className="w-24 h-6 bg-amber-500/20 rounded border border-amber-500/30" />
              </div>

              {/* Permit Details Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 w-20 bg-muted/50 rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                  </div>
                ))}
              </div>

              {/* Movement Route */}
              <div className="border-2 border-dashed border-primary/30 p-4 rounded-lg bg-primary/5 space-y-3">
                <div className="h-4 w-32 bg-primary/20 rounded" />
                <div className="flex items-center gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="h-3 w-16 bg-muted/50 rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                  </div>
                  <div className="w-8 h-8 bg-primary/20 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3 w-20 bg-muted/50 rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                  </div>
                </div>
              </div>

              {/* Risk Indicators */}
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded border border-green-500/30">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div className="h-3 w-24 bg-green-500/30 rounded" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded border border-green-500/30">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div className="h-3 w-32 bg-green-500/30 rounded" />
                  </div>
                </div>
              </div>

              {/* Document Attachments */}
              <div className="space-y-2 pt-3 border-t border-border">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded border border-border">
                      <div className="w-4 h-4 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <div className="flex-1 h-10 bg-green-500/80 rounded-lg" />
                <div className="flex-1 h-10 bg-red-500/80 rounded-lg" />
                <div className="w-24 h-10 bg-muted/50 rounded-lg border-2 border-border" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Decision Panel */}
      <Card className="border-2 border-dashed border-accent">
        <div className="p-6 space-y-4">
          <div className="h-6 w-56 bg-muted rounded" />

          {/* Selected Permit Details */}
          <div className="border-2 border-dashed border-primary/30 p-6 rounded-lg bg-primary/5 space-y-4">
            <div className="h-5 w-64 bg-primary/20 rounded" />

            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-24 bg-muted/50 rounded" />
                  <div className="h-4 w-full bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Decision Form */}
          <div className="grid md:grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-24 w-full bg-input-background border-2 border-border rounded-lg" />
            </div>
          </div>

          {/* Submit Decision */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <div className="w-32 h-10 bg-muted/50 rounded-lg border-2 border-border" />
            <div className="w-40 h-10 bg-primary/80 rounded-lg" />
          </div>
        </div>
      </Card>

      {/* Wireframe Label */}
      <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg font-semibold">
        WIREFRAME: DVS Permit Review
      </div>
    </div>
  );
}

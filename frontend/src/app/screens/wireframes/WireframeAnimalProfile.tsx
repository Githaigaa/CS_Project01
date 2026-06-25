import { Card } from "../../components/Card";

export function WireframeAnimalProfile() {
  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header with Back Button */}
      <div className="border-2 border-dashed border-primary p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-muted rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted/50 rounded" />
          </div>
          <div className="w-40 h-10 bg-muted/50 rounded-lg border-2 border-border" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Animal Info */}
        <Card className="lg:col-span-1 border-2 border-dashed border-secondary">
          <div className="p-6 space-y-4">
            {/* Animal Photo */}
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <div className="text-muted-foreground">Animal Photo</div>
            </div>

            {/* Details */}
            <div className="space-y-3 pt-4 border-t border-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-24 bg-muted/50 rounded" />
                  <div className="h-5 w-full bg-muted rounded" />
                </div>
              ))}
            </div>

            {/* Traceability Score */}
            <div className="pt-4 border-t border-border space-y-2">
              <div className="h-4 w-32 bg-muted/50 rounded" />
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full">
                  <div className="h-full w-[98%] bg-primary rounded-full" />
                </div>
                <div className="h-5 w-12 bg-primary/20 rounded" />
              </div>
            </div>
          </div>
        </Card>

        {/* Right Content - Tabbed Interface */}
        <Card className="lg:col-span-2 border-2 border-dashed border-accent">
          <div className="p-6 space-y-6">
            {/* Tab Headers */}
            <div className="border-b-2 border-border -mb-6">
              <div className="flex gap-1">
                {['Overview', 'Ownership', 'Movements', 'Health', 'Transactions', 'Lifecycle'].map((tab, idx) => (
                  <div
                    key={tab}
                    className={`px-4 py-3 border-b-2 ${
                      idx === 0
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-transparent'
                    }`}
                  >
                    <div className={`h-4 w-20 ${idx === 0 ? 'bg-primary/30' : 'bg-muted'} rounded`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Tab Content - Overview */}
            <div className="pt-6 space-y-4 border-2 border-dashed border-primary/30 p-6 rounded-lg bg-primary/5">
              <div className="h-5 w-32 bg-primary/20 rounded mb-4" />

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-muted rounded mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-24 bg-muted/50 rounded" />
                        <div className="h-5 w-full bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-muted rounded mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-24 bg-muted/50 rounded" />
                        <div className="h-5 w-full bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distinguishing Marks */}
              <div className="pt-4 border-t border-border space-y-2">
                <div className="h-3 w-40 bg-muted/50 rounded" />
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <div className="h-10 w-32 bg-primary/80 rounded-lg" />
              <div className="h-10 w-32 bg-muted/50 rounded-lg border-2 border-border" />
              <div className="h-10 w-32 bg-muted/50 rounded-lg border-2 border-border" />
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Timeline Preview */}
      <Card className="border-2 border-dashed border-secondary">
        <div className="p-6 space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted/50 rounded" />
                  <div className="h-3 w-3/4 bg-muted/50 rounded" />
                </div>
                <div className="w-20 h-6 bg-green-500/20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Wireframe Label */}
      <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg font-semibold">
        WIREFRAME: Animal Profile
      </div>
    </div>
  );
}

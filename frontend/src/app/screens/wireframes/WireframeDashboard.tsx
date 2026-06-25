import { Card } from "../../components/Card";

export function WireframeDashboard() {
  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="border-2 border-dashed border-primary p-4 rounded-lg">
        <div className="h-8 w-64 bg-muted rounded mb-2" />
        <div className="h-4 w-96 bg-muted/50 rounded" />
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-2 border-dashed border-secondary">
            <div className="p-6 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-10 w-20 bg-primary/20 rounded" />
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg" />
              </div>
              <div className="h-3 w-32 bg-muted/50 rounded" />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2 border-dashed border-accent">
          <div className="p-6 space-y-4">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="h-32 w-full bg-gradient-to-t from-primary/20 to-transparent rounded" />
                <div className="text-muted-foreground">Line Chart: Population Trend</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-2 border-dashed border-accent">
          <div className="p-6 space-y-4">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-32 h-32 rounded-full border-8 border-primary/20 mx-auto" />
                <div className="text-muted-foreground">Pie Chart: Species Distribution</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Feed */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2 border-dashed border-secondary">
          <div className="p-6 space-y-4">
            <div className="h-6 w-40 bg-muted rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-3 w-3/4 bg-muted/50 rounded" />
                    <div className="h-3 w-1/2 bg-muted/50 rounded" />
                  </div>
                  <div className="w-16 h-6 bg-accent/20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="border-2 border-dashed border-secondary">
          <div className="p-6 space-y-4">
            <div className="h-6 w-40 bg-muted rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 bg-secondary/20 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-3 w-3/4 bg-muted/50 rounded" />
                    <div className="h-3 w-1/2 bg-muted/50 rounded" />
                  </div>
                  <div className="w-16 h-6 bg-green-500/20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Map Placeholder */}
      <Card className="border-2 border-dashed border-primary">
        <div className="p-6 space-y-4">
          <div className="h-6 w-56 bg-muted rounded" />
          <div className="h-96 bg-muted/30 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-muted-foreground font-semibold">Interactive Map</div>
              <div className="text-muted-foreground">Animal Locations & Holdings</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Wireframe Label */}
      <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg font-semibold">
        WIREFRAME: Home Dashboard
      </div>
    </div>
  );
}

import { Card } from "../../components/Card";

export function WireframeMarketplace() {
  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="border-2 border-dashed border-primary p-4 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-4 w-96 bg-muted/50 rounded" />
          </div>
          <div className="w-32 h-10 bg-primary/80 rounded-lg" />
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="border-2 border-dashed border-accent">
        <div className="p-4 space-y-4">
          {/* Search and Filters Row */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2 h-10 bg-input-background border-2 border-border rounded-lg" />
            <div className="h-10 bg-input-background border-2 border-border rounded-lg" />
            <div className="h-10 bg-input-background border-2 border-border rounded-lg" />
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-32 bg-secondary/20 rounded-full border border-secondary/30" />
            ))}
          </div>
        </div>
      </Card>

      {/* Listing Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Card key={item} className="border-2 border-dashed border-secondary overflow-hidden p-0">
            {/* Image */}
            <div className="aspect-[4/3] bg-muted relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-muted-foreground">Animal Photo</div>
              </div>
              {/* Traceability Badge */}
              <div className="absolute top-3 right-3">
                <div className="w-20 h-6 bg-green-500/20 rounded border border-green-500/30" />
              </div>
              {/* Favorite Icon */}
              <div className="absolute top-3 left-3">
                <div className="w-8 h-8 bg-card rounded-full" />
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Title and Price */}
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted/50 rounded" />
                </div>
                <div className="h-6 w-20 bg-primary/20 rounded" />
              </div>

              {/* RFID */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted rounded" />
                <div className="h-3 w-40 bg-muted/50 rounded" />
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 w-16 bg-muted/50 rounded" />
                ))}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <div className="h-3 w-full bg-muted/30 rounded" />
                <div className="h-3 w-3/4 bg-muted/30 rounded" />
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-muted rounded" />
                    <div className="h-3 w-8 bg-muted/50 rounded" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-muted rounded" />
                    <div className="h-3 w-8 bg-muted/50 rounded" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <div className="h-8 bg-muted/50 rounded-lg border-2 border-border" />
                <div className="h-8 bg-primary/80 rounded-lg" />
              </div>

              {/* Listed Date */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <div className="w-4 h-4 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted/50 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="flex items-center justify-center">
        <div className="w-40 h-10 bg-muted/50 rounded-lg border-2 border-border" />
      </div>

      {/* Wireframe Label */}
      <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg font-semibold">
        WIREFRAME: Marketplace Listing
      </div>
    </div>
  );
}

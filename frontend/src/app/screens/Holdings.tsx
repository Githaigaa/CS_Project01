import { MapPin, Plus, Eye, Edit, Users, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { mockHoldings } from "../lib/mockData";

export function Holdings() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Holdings & Properties</h1>
          <p className="text-muted-foreground">Manage farms, feedlots, and facilities</p>
        </div>
        <Button>
          <Plus className="w-5 h-5" />
          Add New Holding
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Map View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Map className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Interactive GIS map showing all holdings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockHoldings.map((holding) => (
          <Card key={holding.id} hover>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="mb-1">{holding.name}</CardTitle>
                  <Badge variant="secondary">{holding.propertyType}</Badge>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-muted-foreground mb-1">Owner</div>
                <div className="font-medium">{holding.owner}</div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1">Location</div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="font-medium">{holding.location.address}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground mb-1">Animal Count</div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{holding.animalCount}</span>
                  </div>
                </div>
                {holding.area && (
                  <div>
                    <div className="text-muted-foreground mb-1">Area</div>
                    <div className="font-medium">{holding.area}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

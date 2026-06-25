import { ArrowLeft, MapPin, Calendar, Shield, Heart, Eye, TrendingUp, Download, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { mockListings, mockHealthEvents, mockMovements } from "../lib/mockData";
import { formatCurrency, formatDate } from "../lib/utils";

interface MarketplaceDetailProps {
  listingId: string;
  onBack: () => void;
}

export function MarketplaceDetail({ listingId, onBack }: MarketplaceDetailProps) {
  const listing = mockListings[0];
  const animal = listing.animal;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="mb-1">{animal.breed} - {animal.species}</h1>
          <p className="text-muted-foreground">RFID: {animal.rfid}</p>
        </div>
        <Button variant="outline">
          <Heart className="w-5 h-5" />
          Save
        </Button>
        <Button variant="outline">
          <Download className="w-5 h-5" />
          Download Report
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="aspect-video relative">
              <img
                src={animal.photo}
                alt={animal.breed}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-card rounded-lg px-3 py-2 shadow-lg">
                <Badge variant="success">
                  <Shield className="w-4 h-4" />
                  {animal.traceabilityScore}% Verified
                </Badge>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Animal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-muted-foreground mb-1">Species</div>
                  <div className="font-medium">{animal.species}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Breed</div>
                  <div className="font-medium">{animal.breed}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Sex</div>
                  <div className="font-medium">{animal.sex}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Age Class</div>
                  <div className="font-medium">{animal.ageClass}</div>
                </div>
                {animal.weight && (
                  <div>
                    <div className="text-muted-foreground mb-1">Weight</div>
                    <div className="font-medium">{animal.weight} kg</div>
                  </div>
                )}
                {animal.color && (
                  <div>
                    <div className="text-muted-foreground mb-1">Color</div>
                    <div className="font-medium">{animal.color}</div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground mb-1">Current Location</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{animal.currentHolding}</span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Registered</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(animal.registrationDate)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{listing.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Traceability Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-6">
                  <div className="relative flex gap-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center relative z-10 flex-shrink-0">
                      <Shield className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="font-medium">Animal Registration</div>
                      <div className="text-muted-foreground">{formatDate(animal.registrationDate)}</div>
                      <div className="text-muted-foreground">Registered by {animal.currentOwner}</div>
                    </div>
                  </div>

                  {mockHealthEvents.slice(0, 2).map((event) => (
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

                  <div className="relative flex gap-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center relative z-10 flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="font-medium">Listed for Sale</div>
                      <div className="text-muted-foreground">{formatDate(listing.listedDate)}</div>
                      <div className="text-muted-foreground">Price: {formatCurrency(listing.askingPrice)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="text-3xl font-semibold text-primary mb-2">
                {formatCurrency(listing.askingPrice)}
              </div>
              <Badge variant="success">Active Listing</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" size="lg">
                Buy Now
              </Button>
              <Button variant="outline" className="w-full" size="lg">
                Make Offer
              </Button>
              <Button variant="outline" className="w-full">
                <MessageSquare className="w-5 h-5" />
                Contact Seller
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-muted-foreground mb-1">Seller</div>
                <div className="font-medium">{listing.seller}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Listed Date</div>
                <div className="font-medium">{formatDate(listing.listedDate)}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Views</div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{listing.views}</span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Offers</div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{listing.offers}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>All vaccinations current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>No disease history</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Complete health records</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Verified traceability</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Traceability Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-semibold text-primary mb-2">
                  {animal.traceabilityScore}%
                </div>
                <div className="text-muted-foreground mb-4">Industry Leading</div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${animal.traceabilityScore}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

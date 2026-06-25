import { useState } from "react";
import { Search, Filter, MapPin, Eye, Heart, TrendingUp, Calendar, Shield } from "lucide-react";
import { Card, CardContent } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select } from "../components/Input";
import { mockListings } from "../lib/mockData";
import { formatCurrency, formatDate } from "../lib/utils";

interface MarketplaceProps {
  onViewListing: (id: string) => void;
}

export function Marketplace({ onViewListing }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="mb-2">Livestock Marketplace</h1>
        <p className="text-muted-foreground">Buy and sell livestock with verified traceability</p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by RFID, breed, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterSpecies} onChange={(e) => setFilterSpecies(e.target.value)}>
              <option value="all">All Species</option>
              <option value="cattle">Cattle</option>
              <option value="goat">Goat</option>
              <option value="sheep">Sheep</option>
              <option value="camel">Camel</option>
              <option value="donkey">Donkey</option>
            </Select>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Most Recent</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="views">Most Viewed</option>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
            <Badge variant="secondary">Price: KES 10,000 - 150,000</Badge>
            <Badge variant="secondary">Location: Within 50 km</Badge>
            <Badge variant="secondary">Health Verified</Badge>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockListings.concat(mockListings).map((listing, idx) => (
          <Card key={`${listing.id}-${idx}`} hover className="overflow-hidden p-0">
            <div className="aspect-[4/3] relative overflow-hidden">
              <img
                src={listing.animal.photo}
                alt={listing.animal.breed}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-card rounded-lg px-2 py-1 shadow-lg">
                <Badge variant="success">
                  <Shield className="w-3 h-3" />
                  {listing.animal.traceabilityScore}% Verified
                </Badge>
              </div>
              <button className="absolute top-3 left-3 bg-card rounded-full p-2 shadow-lg hover:bg-muted transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            <CardContent className="p-4 space-y-3">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{listing.animal.breed}</h3>
                    <p className="text-muted-foreground">{listing.animal.species}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{formatCurrency(listing.askingPrice)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>RFID: {listing.animal.rfid}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary">{listing.animal.sex}</Badge>
                  <Badge variant="secondary">{listing.animal.ageClass}</Badge>
                  {listing.animal.weight && (
                    <Badge variant="secondary">{listing.animal.weight}kg</Badge>
                  )}
                </div>

                <p className="text-muted-foreground line-clamp-2">{listing.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{listing.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{listing.offers} offers</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewListing(listing.id)}
                >
                  View Details
                </Button>
                <Button size="sm">
                  Make Offer
                </Button>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground pt-2 border-t border-border">
                <Calendar className="w-4 h-4" />
                <span>Listed {formatDate(listing.listedDate)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-center">
        <Button variant="outline">
          Load More Listings
        </Button>
      </div>
    </div>
  );
}

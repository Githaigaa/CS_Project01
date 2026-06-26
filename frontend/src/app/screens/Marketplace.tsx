import { useEffect, useMemo, useState } from "react";
import { Search, Filter, MapPin, Eye, Heart, TrendingUp, Calendar, Shield, Plus } from "lucide-react";
import { Card, CardContent } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select, Textarea } from "../components/Input";
import type { ApiMarketplaceInquiry, ApiMarketplaceListing, MarketplaceListingPayload } from "../lib/api/marketplace";
import { mapApiListingToListing } from "../lib/api/marketplace";
import type { MarketplaceListing } from "../lib/types";
import { formatCurrency, formatDate } from "../lib/utils";
import { animalsApi } from "../services/api/animals";
import { getApiErrorMessage } from "../services/api/errors";
import { marketplaceApi } from "../services/api/marketplace";

interface MarketplaceProps {
  onViewListing: (id: string) => void;
}

type ListingForm = {
  animalRfid: string;
  askingPrice: string;
  description: string;
  locationCounty: string;
  expiresOn: string;
};

const emptyForm: ListingForm = {
  animalRfid: "",
  askingPrice: "",
  description: "",
  locationCounty: "",
  expiresOn: "",
};

function orderingFromSort(sortBy: string) {
  if (sortBy === "price-low") return "asking_price" as const;
  if (sortBy === "price-high") return "-asking_price" as const;
  return "-listed_on" as const;
}

export function Marketplace({ onViewListing }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [minPrice, setMinPrice] = useState("10000");
  const [maxPrice, setMaxPrice] = useState("150000");
  const [locationFilter, setLocationFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ListingForm>(emptyForm);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [apiListings, setApiListings] = useState<ApiMarketplaceListing[]>([]);
  const [inquiries, setInquiries] = useState<ApiMarketplaceInquiry[]>([]);
  const [totalListings, setTotalListings] = useState(0);
  const [nextPageAvailable, setNextPageAvailable] = useState(false);
  const [previousPageAvailable, setPreviousPageAvailable] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const pageSize = 9;

  useEffect(() => {
    setPage(1);
  }, [filterSpecies, locationFilter, maxPrice, minPrice, searchQuery, sortBy]);

  useEffect(() => {
    let isCurrent = true;

    async function loadListings() {
      setLoading(true);
      setError(null);

      try {
        const response = await marketplaceApi.listListings({
          page,
          pageSize,
          search: searchQuery.trim(),
          species: filterSpecies === "all" ? "" : filterSpecies,
          minPrice: minPrice.trim(),
          maxPrice: maxPrice.trim(),
          location: locationFilter.trim(),
          ordering: orderingFromSort(sortBy),
        });
        const inquiryResponse = await marketplaceApi.listInquiries({ pageSize: 100 });
        const inquiryCounts = inquiryResponse.results.reduce<Record<number, number>>((counts, inquiry) => {
          counts[inquiry.listing] = (counts[inquiry.listing] || 0) + 1;
          return counts;
        }, {});

        if (!isCurrent) return;

        setApiListings(response.results);
        setListings(response.results.map((listing) => mapApiListingToListing(listing, inquiryCounts[listing.id] || 0)));
        setTotalListings(response.count);
        setNextPageAvailable(Boolean(response.next));
        setPreviousPageAvailable(Boolean(response.previous));
      } catch (err) {
        if (!isCurrent) return;
        setError(getApiErrorMessage(err, "Unable to load marketplace listings. Please try again."));
        setApiListings([]);
        setListings([]);
        setTotalListings(0);
        setNextPageAvailable(false);
        setPreviousPageAvailable(false);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      isCurrent = false;
    };
  }, [filterSpecies, locationFilter, maxPrice, minPrice, page, searchQuery, sortBy]);

  useEffect(() => {
    let isCurrent = true;

    async function loadInquiries() {
      setInquiriesLoading(true);

      try {
        const response = await marketplaceApi.listInquiries({ pageSize: 5, ordering: "-sent_at" });
        if (isCurrent) {
          setInquiries(response.results);
        }
      } catch {
        if (isCurrent) {
          setInquiries([]);
        }
      } finally {
        if (isCurrent) {
          setInquiriesLoading(false);
        }
      }
    }

    loadInquiries();

    return () => {
      isCurrent = false;
    };
  }, []);

  const visibleListings = useMemo(() => {
    if (sortBy !== "views") return listings;
    return [...listings].sort((a, b) => b.views - a.views);
  }, [listings, sortBy]);

  const updateForm = (field: keyof ListingForm, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const resolveAnimalId = async (animalRfid: string) => {
    const response = await animalsApi.listAnimals({ search: animalRfid.trim(), pageSize: 10 });
    const match = response.results.find(
      (animal) => animal.tag_number === animalRfid.trim() || animal.rfid_tag === animalRfid.trim(),
    );

    if (!match) {
      throw new Error("No animal found for that RFID/tag.");
    }

    return match.id;
  };

  const refreshListings = async () => {
    const response = await marketplaceApi.listListings({
      page,
      pageSize,
      search: searchQuery.trim(),
      species: filterSpecies === "all" ? "" : filterSpecies,
      minPrice: minPrice.trim(),
      maxPrice: maxPrice.trim(),
      location: locationFilter.trim(),
      ordering: orderingFromSort(sortBy),
    });
    const inquiryResponse = await marketplaceApi.listInquiries({ pageSize: 100 });
    const inquiryCounts = inquiryResponse.results.reduce<Record<number, number>>((counts, inquiry) => {
      counts[inquiry.listing] = (counts[inquiry.listing] || 0) + 1;
      return counts;
    }, {});

    setApiListings(response.results);
    setListings(response.results.map((listing) => mapApiListingToListing(listing, inquiryCounts[listing.id] || 0)));
    setTotalListings(response.count);
    setNextPageAvailable(Boolean(response.next));
    setPreviousPageAvailable(Boolean(response.previous));
    setInquiries(inquiryResponse.results.slice(0, 5));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingListingId(null);
    setActionError(null);
  };

  const handleCreateClick = () => {
    resetForm();
    setShowForm((currentValue) => !currentValue);
  };

  const buildPayload = async (): Promise<MarketplaceListingPayload> => {
    if (!form.animalRfid.trim() || !form.askingPrice.trim() || !form.locationCounty.trim()) {
      throw new Error("Animal RFID, Asking Price, and Location are required.");
    }

    const animal = editingListingId
      ? apiListings.find((listing) => String(listing.id) === editingListingId)?.animal
      : await resolveAnimalId(form.animalRfid);

    if (!animal) {
      throw new Error("No animal found for that RFID/tag.");
    }

    return {
      animal,
      asking_price: form.askingPrice.trim(),
      is_negotiable: true,
      description: form.description.trim(),
      location_county: form.locationCounty.trim(),
      expires_on: form.expiresOn || null,
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setActionError(null);

    try {
      const payload = await buildPayload();
      if (editingListingId) {
        const { animal, ...updatePayload } = payload;
        await marketplaceApi.updateListing(editingListingId, updatePayload);
      } else {
        await marketplaceApi.createListing(payload);
      }
      resetForm();
      setShowForm(false);
      await refreshListings();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to save listing. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditListing = async (listingId: string) => {
    setActionError(null);

    try {
      const listing = await marketplaceApi.getListing(listingId);
      setEditingListingId(String(listing.id));
      setForm({
        animalRfid: listing.animal_detail.rfid_tag || listing.animal_detail.tag_number,
        askingPrice: listing.asking_price,
        description: listing.description,
        locationCounty: listing.location_county,
        expiresOn: listing.expires_on || "",
      });
      setShowForm(true);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to load listing for editing. Please try again."));
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    const confirmed = window.confirm("Delete this marketplace listing? This cannot be undone.");
    if (!confirmed) return;

    setDeletingListingId(listingId);
    setActionError(null);

    try {
      await marketplaceApi.deleteListing(listingId);
      await refreshListings();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to delete listing. Please try again."));
    } finally {
      setDeletingListingId(null);
    }
  };

  const handleCreateInquiry = async (listingId: string) => {
    const message = window.prompt("Message to seller", "I am interested in this animal.");
    if (message === null) return;

    const offer = window.prompt("Offer price (optional)", "");
    if (offer === null) return;

    setActionError(null);

    try {
      await marketplaceApi.createInquiry({
        listing: Number(listingId),
        message: message.trim(),
        offer_price: offer.trim() || null,
      });
      await refreshListings();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to send inquiry. Please try again."));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Livestock Marketplace</h1>
          <p className="text-muted-foreground">Buy and sell livestock with verified traceability</p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="w-5 h-5" />
          Create Listing
        </Button>
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

          <div className="grid md:grid-cols-3 gap-4">
            <Input
              placeholder="Minimum price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <Input
              placeholder="Maximum price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <Input
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
            <Badge variant="secondary">Price: KES {minPrice || "0"} - {maxPrice || "Any"}</Badge>
            <Badge variant="secondary">Location: {locationFilter || "Within 50 km"}</Badge>
            <Badge variant="secondary">Health Verified</Badge>
          </div>
          {actionError && (
            <div className="text-destructive">
              {actionError}
            </div>
          )}
        </div>
      </Card>

      {showForm && (
        <Card>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Animal RFID *"
                placeholder="254000123456789"
                value={form.animalRfid}
                disabled={Boolean(editingListingId)}
                onChange={(e) => updateForm("animalRfid", e.target.value)}
              />
              <Input
                label="Asking Price *"
                type="number"
                placeholder="150000"
                value={form.askingPrice}
                onChange={(e) => updateForm("askingPrice", e.target.value)}
              />
              <Input
                label="Location *"
                placeholder="Kiambu"
                value={form.locationCounty}
                onChange={(e) => updateForm("locationCounty", e.target.value)}
              />
              <Input
                label="Expires On"
                type="date"
                value={form.expiresOn}
                onChange={(e) => updateForm("expiresOn", e.target.value)}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  placeholder="Describe this listing..."
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Saving..." : editingListingId ? "Save Listing" : "Create Listing"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent>
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && (
          <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-8">
            Loading listings...
          </div>
        )}
        {!loading && visibleListings.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-8">
            No marketplace listings found
          </div>
        )}
        {!loading && visibleListings.map((listing) => (
          <Card key={listing.id} hover className="overflow-hidden p-0">
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
                <Button size="sm" onClick={() => handleCreateInquiry(listing.id)}>
                  Make Offer
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditListing(listing.id)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={deletingListingId === listing.id}
                  onClick={() => handleDeleteListing(listing.id)}
                >
                  Delete
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

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          disabled={loading || !previousPageAvailable}
          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
        >
          Previous Listings
        </Button>
        <Button
          variant="outline"
          disabled={loading || !nextPageAvailable}
          onClick={() => setPage((currentPage) => currentPage + 1)}
        >
          Load More Listings
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Inquiries</h3>
            <div className="text-muted-foreground">Showing {inquiries.length}</div>
          </div>
          <div className="space-y-3">
            {inquiriesLoading && (
              <div className="text-muted-foreground">Loading inquiries...</div>
            )}
            {!inquiriesLoading && inquiries.length === 0 && (
              <div className="text-muted-foreground">No inquiries found</div>
            )}
            {!inquiriesLoading && inquiries.map((inquiry) => (
              <div key={inquiry.id} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">Listing #{inquiry.listing}</div>
                    <div className="text-muted-foreground">{inquiry.message}</div>
                  </div>
                  {inquiry.offer_price && (
                    <div className="font-medium text-primary">{formatCurrency(Number(inquiry.offer_price))}</div>
                  )}
                </div>
                <div className="text-muted-foreground mt-1">{formatDate(inquiry.sent_at)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Filter, MapPin, Eye, Heart, TrendingUp, Calendar, Shield, Plus, MessageSquare, X } from "lucide-react";
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
import { useAuth } from "../context/AuthContext";

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

type InquiryForm = {
  message: string;
  offerPrice: string;
};

const emptyListingForm: ListingForm = {
  animalRfid: "",
  askingPrice: "",
  description: "",
  locationCounty: "",
  expiresOn: "",
};

const emptyInquiryForm: InquiryForm = { message: "", offerPrice: "" };

function orderingFromSort(sortBy: string) {
  if (sortBy === "price-low") return "asking_price" as const;
  if (sortBy === "price-high") return "-asking_price" as const;
  return "-listed_on" as const;
}

export function Marketplace({ onViewListing }: MarketplaceProps) {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [minPrice, setMinPrice] = useState("10000");
  const [maxPrice, setMaxPrice] = useState("150000");
  const [locationFilter, setLocationFilter] = useState("");

  // Seller form (create / edit)
  const [showForm, setShowForm] = useState(false);
  const [listingForm, setListingForm] = useState<ListingForm>(emptyListingForm);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);

  // Buyer inquiry panel
  const [inquiringListingId, setInquiringListingId] = useState<string | null>(null);
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>(emptyInquiryForm);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const inquiryRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => { setPage(1); }, [filterSpecies, locationFilter, maxPrice, minPrice, searchQuery, sortBy]);

  useEffect(() => {
    let isCurrent = true;
    async function loadListings() {
      setLoading(true);
      setError(null);
      try {
        const response = await marketplaceApi.listListings({
          page, pageSize,
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
        setListings(response.results.map((l) => mapApiListingToListing(l, inquiryCounts[l.id] || 0)));
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
        if (isCurrent) setLoading(false);
      }
    }
    loadListings();
    return () => { isCurrent = false; };
  }, [filterSpecies, locationFilter, maxPrice, minPrice, page, searchQuery, sortBy]);

  useEffect(() => {
    let isCurrent = true;
    async function loadInquiries() {
      setInquiriesLoading(true);
      try {
        const response = await marketplaceApi.listInquiries({ pageSize: 5, ordering: "-sent_at" });
        if (isCurrent) setInquiries(response.results);
      } catch {
        if (isCurrent) setInquiries([]);
      } finally {
        if (isCurrent) setInquiriesLoading(false);
      }
    }
    loadInquiries();
    return () => { isCurrent = false; };
  }, []);

  const visibleListings = useMemo(() => {
    if (sortBy !== "views") return listings;
    return [...listings].sort((a, b) => b.views - a.views);
  }, [listings, sortBy]);

  const updateListingForm = (field: keyof ListingForm, value: string) =>
    setListingForm((f) => ({ ...f, [field]: value }));

  const resolveAnimalId = async (animalRfid: string) => {
    const response = await animalsApi.listAnimals({ search: animalRfid.trim(), pageSize: 10 });
    const match = response.results.find(
      (a) => a.tag_number === animalRfid.trim() || a.rfid_tag === animalRfid.trim(),
    );
    if (!match) throw new Error("No animal found for that RFID/tag.");
    return match.id;
  };

  const refreshListings = async () => {
    const response = await marketplaceApi.listListings({
      page, pageSize,
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
    setListings(response.results.map((l) => mapApiListingToListing(l, inquiryCounts[l.id] || 0)));
    setTotalListings(response.count);
    setNextPageAvailable(Boolean(response.next));
    setPreviousPageAvailable(Boolean(response.previous));
    setInquiries(inquiryResponse.results.slice(0, 5));
  };

  const resetListingForm = () => {
    setListingForm(emptyListingForm);
    setEditingListingId(null);
    setActionError(null);
  };

  const handleCreateClick = () => {
    resetListingForm();
    setShowForm((v) => !v);
  };

  const buildPayload = async (): Promise<MarketplaceListingPayload> => {
    if (!listingForm.animalRfid.trim() || !listingForm.askingPrice.trim() || !listingForm.locationCounty.trim()) {
      throw new Error("Animal RFID, Asking Price, and Location are required.");
    }
    const animal = editingListingId
      ? apiListings.find((l) => String(l.id) === editingListingId)?.animal
      : await resolveAnimalId(listingForm.animalRfid);
    if (!animal) throw new Error("No animal found for that RFID/tag.");
    return {
      animal,
      asking_price: listingForm.askingPrice.trim(),
      is_negotiable: true,
      description: listingForm.description.trim(),
      location_county: listingForm.locationCounty.trim(),
      expires_on: listingForm.expiresOn || null,
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      const payload = await buildPayload();
      if (editingListingId) {
        const { animal, ...updatePayload } = payload;
        const updated = await marketplaceApi.updateListing(editingListingId, updatePayload);
        // Immediately reflect changes from the server response so the list
        // updates even if the subsequent background refresh fails.
        setApiListings((prev) => prev.map((l) => (String(l.id) === editingListingId ? updated : l)));
        setListings((prev) =>
          prev.map((l) =>
            l.id === editingListingId
              ? mapApiListingToListing(updated, prev.find((x) => x.id === editingListingId)?.offers ?? 0)
              : l,
          ),
        );
      } else {
        await marketplaceApi.createListing(payload);
      }
      resetListingForm();
      setShowForm(false);
      // Background refresh for ordering/count consistency — errors swallowed intentionally.
      refreshListings().catch(() => {});
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
      setListingForm({
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
    if (!window.confirm("Delete this marketplace listing? This cannot be undone.")) return;
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

  const openInquiryPanel = (listingId: string) => {
    setInquiringListingId(listingId);
    setInquiryForm(emptyInquiryForm);
    setInquiryError(null);
    setTimeout(() => inquiryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const handleSendInquiry = async () => {
    if (!inquiringListingId) return;
    if (!inquiryForm.message.trim()) {
      setInquiryError("Please enter a message to the seller.");
      return;
    }
    setInquirySubmitting(true);
    setInquiryError(null);
    try {
      await marketplaceApi.createInquiry({
        listing: Number(inquiringListingId),
        message: inquiryForm.message.trim(),
        offer_price: inquiryForm.offerPrice.trim() || null,
      });
      setInquiringListingId(null);
      setInquiryForm(emptyInquiryForm);
      await refreshListings();
    } catch (err) {
      setInquiryError(getApiErrorMessage(err, "Unable to send inquiry. Please try again."));
    } finally {
      setInquirySubmitting(false);
    }
  };

  const isOwnListing = (apiListing: ApiMarketplaceListing) =>
    user?.id != null && apiListing.seller === user.id;

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

      {/* Filters */}
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
            <Input placeholder="Minimum price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            <Input placeholder="Maximum price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            <Input placeholder="Location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
            <Badge variant="secondary">Price: KES {minPrice || "0"} – {maxPrice || "Any"}</Badge>
            <Badge variant="secondary">Location: {locationFilter || "Anywhere"}</Badge>
          </div>
          {actionError && (
            <div className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md">{actionError}</div>
          )}
        </div>
      </Card>

      {/* Seller — create / edit form */}
      {showForm && (
        <Card>
          <CardContent>
            <h3 className="font-semibold mb-4">{editingListingId ? "Edit Listing" : "New Listing"}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Animal RFID / Tag *"
                placeholder="254000123456789"
                value={listingForm.animalRfid}
                disabled={Boolean(editingListingId)}
                onChange={(e) => updateListingForm("animalRfid", e.target.value)}
              />
              <Input
                label="Asking Price (KES) *"
                type="number"
                placeholder="150000"
                value={listingForm.askingPrice}
                onChange={(e) => updateListingForm("askingPrice", e.target.value)}
              />
              <Input
                label="Location County *"
                placeholder="Kiambu"
                value={listingForm.locationCounty}
                onChange={(e) => updateListingForm("locationCounty", e.target.value)}
              />
              <Input
                label="Expires On"
                type="date"
                value={listingForm.expiresOn}
                onChange={(e) => updateListingForm("expiresOn", e.target.value)}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  placeholder="Describe the animal — health status, productivity, reason for sale..."
                  value={listingForm.description}
                  onChange={(e) => updateListingForm("description", e.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { resetListingForm(); setShowForm(false); }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Saving..." : editingListingId ? "Save Changes" : "Create Listing"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent>
            <div className="text-destructive text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Listing grid */}
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
        {!loading && visibleListings.map((listing) => {
          const apiListing = apiListings.find((l) => String(l.id) === listing.id);
          const isMine = apiListing ? isOwnListing(apiListing) : false;

          return (
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
                {isMine && (
                  <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-lg shadow">
                    Your listing
                  </div>
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-semibold">{listing.animal.breed}</h3>
                      <p className="text-muted-foreground text-sm">{listing.animal.species}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">{formatCurrency(listing.askingPrice)}</div>
                      {listing.isNegotiable && (
                        <div className="text-xs text-muted-foreground">Negotiable</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{listing.locationCounty || listing.animal.currentHolding}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <Badge variant="secondary">{listing.animal.sex}</Badge>
                    <Badge variant="secondary">{listing.animal.ageClass}</Badge>
                    {listing.animal.weight && (
                      <Badge variant="secondary">{listing.animal.weight} kg</Badge>
                    )}
                  </div>

                  {listing.description && (
                    <p className="text-muted-foreground text-sm line-clamp-2">{listing.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border text-muted-foreground text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{listing.views}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{listing.offers} offers</span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />{formatDate(listing.listedDate)}
                  </span>
                </div>

                {/* Seller: sold by */}
                {!isMine && (
                  <div className="text-xs text-muted-foreground">
                    Sold by <span className="font-medium text-foreground">{listing.seller}</span>
                  </div>
                )}

                {/* Action buttons — role-based */}
                {isMine ? (
                  /* ── Seller view ── */
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <Button variant="outline" size="sm" className="col-span-1" onClick={() => onViewListing(listing.id)}>
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditListing(listing.id)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deletingListingId === listing.id}
                      onClick={() => handleDeleteListing(listing.id)}
                    >
                      {deletingListingId === listing.id ? "…" : "Delete"}
                    </Button>
                  </div>
                ) : (
                  /* ── Buyer view ── */
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => onViewListing(listing.id)}>
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openInquiryPanel(listing.id)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Make Offer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inline inquiry panel — appears below the grid */}
      {inquiringListingId && (() => {
        const targetListing = listings.find((l) => l.id === inquiringListingId);
        return (
          <div ref={inquiryRef}>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Send Offer / Inquiry</h3>
                    {targetListing && (
                      <p className="text-muted-foreground text-sm">
                        {targetListing.animal.breed} · {formatCurrency(targetListing.askingPrice)} · Sold by {targetListing.seller}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { setInquiringListingId(null); setInquiryForm(emptyInquiryForm); setInquiryError(null); }}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Offer Price (KES) — optional"
                    type="number"
                    placeholder="Leave blank to inquire without an offer"
                    value={inquiryForm.offerPrice}
                    onChange={(e) => setInquiryForm((f) => ({ ...f, offerPrice: e.target.value }))}
                  />
                  <div className="md:col-span-1" />
                  <div className="md:col-span-2">
                    <Textarea
                      label="Message to seller *"
                      placeholder="Describe your interest, ask questions about the animal, or state your offer..."
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm((f) => ({ ...f, message: e.target.value }))}
                    />
                  </div>
                  {inquiryError && (
                    <div className="md:col-span-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md">
                      {inquiryError}
                    </div>
                  )}
                  <div className="md:col-span-2 flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => { setInquiringListingId(null); setInquiryForm(emptyInquiryForm); setInquiryError(null); }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSendInquiry} disabled={inquirySubmitting}>
                      <MessageSquare className="w-4 h-4" />
                      {inquirySubmitting ? "Sending..." : "Send Inquiry"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{totalListings} listing{totalListings !== 1 ? "s" : ""} total</div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={loading || !previousPageAvailable} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <Button variant="outline" disabled={loading || !nextPageAvailable} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      {/* Recent inquiries (for the current user's sent inquiries) */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">My Recent Inquiries</h3>
            <div className="text-muted-foreground text-sm">{inquiries.length} shown</div>
          </div>
          <div className="space-y-3">
            {inquiriesLoading && <div className="text-muted-foreground text-sm">Loading...</div>}
            {!inquiriesLoading && inquiries.length === 0 && (
              <div className="text-muted-foreground text-sm">You haven't sent any inquiries yet.</div>
            )}
            {!inquiriesLoading && inquiries.map((inquiry) => (
              <div key={inquiry.id} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-sm">
                      {(() => {
                        const l = apiListings.find((x) => x.id === inquiry.listing);
                        if (!l) return `Listing #${inquiry.listing}`;
                        const a = l.animal_detail;
                        return `${a.tag_number} — ${a.breed || a.species}`;
                      })()}
                    </div>
                    <div className="text-muted-foreground text-sm">{inquiry.message}</div>
                  </div>
                  {inquiry.offer_price && (
                    <div className="font-medium text-primary text-sm shrink-0">
                      {formatCurrency(Number(inquiry.offer_price))}
                    </div>
                  )}
                </div>
                <div className="text-muted-foreground text-xs mt-1">{formatDate(inquiry.sent_at)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

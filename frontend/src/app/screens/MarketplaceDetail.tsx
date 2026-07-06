import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MapPin, Calendar, Shield, Eye, TrendingUp, Download, MessageSquare, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Textarea } from "../components/Input";
import type { ApiMarketplaceListing } from "../lib/api/marketplace";
import { mapApiListingToListing } from "../lib/api/marketplace";
import type { MarketplaceListing } from "../lib/types";
import { formatCurrency, formatDate } from "../lib/utils";
import { getApiErrorMessage } from "../services/api/errors";
import { marketplaceApi } from "../services/api/marketplace";
import { useAuth } from "../context/AuthContext";

interface MarketplaceDetailProps {
  listingId: string;
  onBack: () => void;
}

export function MarketplaceDetail({ listingId, onBack }: MarketplaceDetailProps) {
  const { user } = useAuth();

  const [apiListing, setApiListing] = useState<ApiMarketplaceListing | null>(null);
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [message, setMessage] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryCount, setInquiryCount] = useState(0);

  const inquiryFormRef = useRef<HTMLDivElement>(null);

  const isMine = user?.id != null && apiListing?.seller === user.id;

  useEffect(() => {
    let isCurrent = true;
    async function loadListing() {
      setLoading(true);
      setError(null);
      try {
        const [listingResponse, inquiryResponse] = await Promise.all([
          marketplaceApi.getListing(listingId),
          marketplaceApi.listInquiries({ listing: listingId, pageSize: 25 }),
        ]);
        if (!isCurrent) return;
        setApiListing(listingResponse);
        setInquiryCount(inquiryResponse.results.length);
        setListing(mapApiListingToListing(listingResponse, inquiryResponse.results.length));
      } catch (err) {
        if (isCurrent) {
          setError(getApiErrorMessage(err, "Unable to load listing details. Please try again."));
          setApiListing(null);
          setListing(null);
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    }
    loadListing();
    return () => { isCurrent = false; };
  }, [listingId]);

  const scrollToInquiry = () => {
    inquiryFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => (inquiryFormRef.current?.querySelector("textarea") as HTMLTextAreaElement | null)?.focus(), 300);
  };

  const handleSendInquiry = async () => {
    if (!message.trim()) {
      setActionError("Please enter a message to the seller.");
      scrollToInquiry();
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await marketplaceApi.createInquiry({
        listing: Number(listingId),
        message: message.trim(),
        offer_price: offerPrice.trim() || null,
      });
      setMessage("");
      setOfferPrice("");
      setInquirySent(true);
      setInquiryCount((c) => c + 1);
      if (listing && apiListing) {
        setListing(mapApiListingToListing(apiListing, inquiryCount + 1));
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to send inquiry. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    setDeleting(true);
    setActionError(null);
    try {
      await marketplaceApi.deleteListing(listingId);
      onBack();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to delete listing. Please try again."));
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading listing details...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!listing) return <div className="p-6 text-muted-foreground">Listing not found.</div>;

  const animal = listing.animal;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="mb-1 truncate">{animal.breed} · {animal.species}</h1>
          <p className="text-muted-foreground text-sm">RFID: {animal.rfid}</p>
        </div>
        <Button variant="outline">
          <Download className="w-5 h-5" />
          Download Report
        </Button>
      </div>

      {actionError && (
        <div className="text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-md">{actionError}</div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Hero image */}
          <Card className="p-0 overflow-hidden">
            <div className="aspect-video relative">
              <img src={animal.photo} alt={animal.breed} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 bg-card rounded-lg px-3 py-2 shadow-lg">
                <Badge variant="success">
                  <Shield className="w-4 h-4" />
                  {animal.traceabilityScore}% Verified
                </Badge>
              </div>
              {isMine && (
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg shadow">
                  Your listing
                </div>
              )}
            </div>
          </Card>

          {/* Animal information */}
          <Card>
            <CardHeader>
              <CardTitle>Animal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div><div className="text-muted-foreground text-sm mb-1">Species</div><div className="font-medium">{animal.species}</div></div>
                <div><div className="text-muted-foreground text-sm mb-1">Breed</div><div className="font-medium">{animal.breed}</div></div>
                <div><div className="text-muted-foreground text-sm mb-1">Sex</div><div className="font-medium">{animal.sex}</div></div>
                <div><div className="text-muted-foreground text-sm mb-1">Age Class</div><div className="font-medium">{animal.ageClass}</div></div>
                {animal.weight && (
                  <div><div className="text-muted-foreground text-sm mb-1">Weight</div><div className="font-medium">{animal.weight} kg</div></div>
                )}
                {animal.color && (
                  <div><div className="text-muted-foreground text-sm mb-1">Color</div><div className="font-medium">{animal.color}</div></div>
                )}
                <div>
                  <div className="text-muted-foreground text-sm mb-1">Current Location</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{listing.locationCounty || animal.currentHolding}</span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm mb-1">Registered</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(animal.registrationDate)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {listing.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {/* Traceability timeline */}
          <Card>
            <CardHeader><CardTitle>Traceability Timeline</CardTitle></CardHeader>
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
                      <div className="text-muted-foreground text-sm">{formatDate(animal.registrationDate)}</div>
                      <div className="text-muted-foreground text-sm">Registered by {animal.currentOwner}</div>
                    </div>
                  </div>
                  <div className="relative flex gap-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center relative z-10 flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="font-medium">Listed for Sale</div>
                      <div className="text-muted-foreground text-sm">{formatDate(listing.listedDate)}</div>
                      <div className="text-muted-foreground text-sm">
                        Asking price: {formatCurrency(listing.askingPrice)}
                        {listing.isNegotiable && " · Negotiable"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inquiry form — buyer only */}
          {!isMine && (
            <div ref={inquiryFormRef}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <MessageSquare className="w-5 h-5 inline mr-2" />
                    Contact Seller
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {inquirySent ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300">
                      <Shield className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Inquiry sent!</div>
                        <div className="text-sm">The seller has been notified. They will get back to you.</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Input
                        label="Offer Price (KES) — optional"
                        type="number"
                        placeholder="Leave blank to inquire without an offer"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                      />
                      <Textarea
                        label="Message to seller *"
                        placeholder="Describe your interest, ask questions about the animal, or state your offer..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                      {actionError && (
                        <div className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md">
                          {actionError}
                        </div>
                      )}
                      <Button className="w-full" onClick={handleSendInquiry} disabled={submitting}>
                        <MessageSquare className="w-4 h-4" />
                        {submitting ? "Sending..." : "Send Inquiry"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right — sidebar */}
        <div className="space-y-6">

          {/* Price + primary actions */}
          <Card>
            <CardHeader>
              <div className="text-3xl font-semibold text-primary mb-1">
                {formatCurrency(listing.askingPrice)}
              </div>
              {listing.isNegotiable && (
                <div className="text-sm text-muted-foreground mb-2">Price is negotiable</div>
              )}
              <Badge variant={listing.status === "Active" ? "success" : "secondary"}>
                {listing.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {isMine ? (
                /* ── Seller actions ── */
                <>
                  <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                    This is your listing. Buyers can view and contact you about this animal.
                  </div>
                  <Button variant="outline" className="w-full" size="lg" onClick={() => {/* TODO: edit inline */}}>
                    <Edit className="w-5 h-5" />
                    Edit Listing
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full"
                    size="lg"
                    onClick={handleDeleteListing}
                    disabled={deleting}
                  >
                    <Trash2 className="w-5 h-5" />
                    {deleting ? "Deleting..." : "Delete Listing"}
                  </Button>
                </>
              ) : (
                /* ── Buyer actions ── */
                <>
                  <Button className="w-full" size="lg" onClick={() => { setMessage("I would like to purchase this animal."); scrollToInquiry(); }}>
                    Buy Now
                  </Button>
                  <Button variant="outline" className="w-full" size="lg" onClick={scrollToInquiry}>
                    <TrendingUp className="w-5 h-5" />
                    Make Offer
                  </Button>
                  <Button variant="outline" className="w-full" onClick={scrollToInquiry}>
                    <MessageSquare className="w-5 h-5" />
                    Contact Seller
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Listing details */}
          <Card>
            <CardHeader><CardTitle>Listing Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Seller</div>
                <div className="font-medium">{listing.seller}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm mb-1">Location</div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{listing.locationCounty}</span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm mb-1">Listed</div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{formatDate(listing.listedDate)}</span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm mb-1">Views</div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{listing.views}</span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm mb-1">Offers received</div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{listing.offers}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health verification */}
          <Card>
            <CardHeader><CardTitle>Health Verification</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                "All vaccinations current",
                "No active disease records",
                "Traceability chain complete",
                "Verified by system",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Traceability score */}
          <Card>
            <CardHeader><CardTitle>Traceability Score</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-semibold text-primary mb-1">{animal.traceabilityScore}%</div>
                <div className="text-muted-foreground text-sm mb-4">Blockchain-verified records</div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${animal.traceabilityScore}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, Eye, Filter, Plus, Trash2, X } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select } from "../components/Input";
import { FARMER_STATUS_OPTIONS, mapApiAnimalToAnimal } from "../lib/api/animals";
import type { FarmerSettableStatus } from "../lib/api/animals";
import type { Animal } from "../lib/types";
import { animalsApi } from "../services/api/animals";
import { getApiErrorMessage } from "../services/api/errors";
import { useAuth } from "../context/AuthContext";

interface AnimalRegistryProps {
  onViewAnimal: (id: string) => void;
  onRegisterAnimal: () => void;
}

export function AnimalRegistry({ onViewAnimal, onRegisterAnimal }: AnimalRegistryProps) {
  const { user } = useAuth();
  const isFarmer = user?.role === "farmer";

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [nextPageAvailable, setNextPageAvailable] = useState(false);
  const [previousPageAvailable, setPreviousPageAvailable] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingAnimalId, setDeletingAnimalId] = useState<string | null>(null);
  // Status modal state
  const [statusModal, setStatusModal] = useState<{ animal: Animal; value: FarmerSettableStatus } | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterSpecies, filterStatus]);

  useEffect(() => {
    let isCurrent = true;

    async function loadAnimals() {
      setLoading(true);
      setError(null);

      try {
        const response = await animalsApi.listAnimals({
          page,
          pageSize,
          search: searchQuery.trim(),
          ordering: "-registration_date",
        });

        if (!isCurrent) return;

        const mappedAnimals = response.results.map(mapApiAnimalToAnimal);
        setAnimals(mappedAnimals);
        setTotalAnimals(response.count);
        setNextPageAvailable(Boolean(response.next));
        setPreviousPageAvailable(Boolean(response.previous));
      } catch (err) {
        if (!isCurrent) return;
        setError(getApiErrorMessage(err, "Unable to load animals. Please try again."));
        setAnimals([]);
        setTotalAnimals(0);
        setNextPageAvailable(false);
        setPreviousPageAvailable(false);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadAnimals();

    return () => {
      isCurrent = false;
    };
  }, [page, searchQuery]);

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const matchesSpecies = filterSpecies === "all" || animal.species === filterSpecies;
      const matchesStatus = filterStatus === "all" || animal.status === filterStatus;
      return matchesSpecies && matchesStatus;
    });
  }, [animals, filterSpecies, filterStatus]);

  const getStatusVariant = (status: Animal["status"]) => {
    switch (status) {
      case "Active":    return "success";
      case "For Sale":  return "info";
      case "Sold":      return "secondary";
      case "Stolen":    return "warning";
      case "Dead":
      case "Slaughtered": return "danger";
      default:          return "default";
    }
  };

  const refreshCurrentPage = async () => {
    try {
      const response = await animalsApi.listAnimals({
        page,
        pageSize,
        search: searchQuery.trim(),
        ordering: "-registration_date",
      });
      setAnimals(response.results.map(mapApiAnimalToAnimal));
      setTotalAnimals(response.count);
      setNextPageAvailable(Boolean(response.next));
      setPreviousPageAvailable(Boolean(response.previous));
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to refresh animals. Please try again."));
    }
  };

  const openStatusModal = (animal: Animal) => {
    // Map display label back to API value
    const apiValueMap: Record<Animal["status"], FarmerSettableStatus> = {
      "Active":      "alive",
      "Stolen":      "stolen",
      "Dead":        "deceased",
      "Slaughtered": "slaughtered",
      "Sold":        "alive",      // fallback — can't change sold via this modal
      "For Sale":    "alive",
    };
    setStatusModal({ animal, value: apiValueMap[animal.status] ?? "alive" });
    setActionError(null);
  };

  const handleStatusSubmit = async () => {
    if (!statusModal) return;
    setStatusSubmitting(true);
    setActionError(null);
    try {
      await animalsApi.updateAnimalStatus(statusModal.animal.id, statusModal.value);
      setStatusModal(null);
      await refreshCurrentPage();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to update status. Please try again."));
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleDeleteAnimal = async (animal: Animal) => {
    const confirmed = window.confirm(`Delete animal ${animal.rfid}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingAnimalId(animal.id);
    setActionError(null);

    try {
      await animalsApi.deleteAnimal(animal.id);
      await refreshCurrentPage();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to delete animal. Please try again."));
    } finally {
      setDeletingAnimalId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Animal Registry</h1>
          <p className="text-muted-foreground">Manage and track all registered animals</p>
        </div>
        <Button onClick={onRegisterAnimal}>
          <Plus className="w-5 h-5" />
          Register New Animal
        </Button>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by RFID, breed, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={filterSpecies}
              onChange={(e) => setFilterSpecies(e.target.value)}
            >
              <option value="all">All Species</option>
              <option value="Cattle">Cattle</option>
              <option value="Goat">Goat</option>
              <option value="Sheep">Sheep</option>
              <option value="Camel">Camel</option>
              <option value="Donkey">Donkey</option>
            </Select>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Stolen">Stolen</option>
              <option value="Dead">Dead</option>
              <option value="Slaughtered">Slaughtered</option>
              <option value="Sold">Sold</option>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
          {actionError && !statusModal && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {actionError}
            </div>
          )}
        </div>
      </Card>

      <Card>
        {error && (
          <div className="p-4 text-destructive border-b border-border">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium">RFID Number</th>
                <th className="text-left p-3 font-medium">Species</th>
                <th className="text-left p-3 font-medium">Breed</th>
                <th className="text-left p-3 font-medium">Sex</th>
                <th className="text-left p-3 font-medium">Age Class</th>
                <th className="text-left p-3 font-medium">Current Owner</th>
                <th className="text-left p-3 font-medium">Current Holding</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="p-6 text-center text-muted-foreground" colSpan={9}>
                    Loading animals...
                  </td>
                </tr>
              )}
              {!loading && filteredAnimals.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-muted-foreground" colSpan={9}>
                    No animals found
                  </td>
                </tr>
              )}
              {!loading && filteredAnimals.map((animal) => (
                <tr key={animal.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="p-3 font-mono">{animal.rfid}</td>
                  <td className="p-3">{animal.species}</td>
                  <td className="p-3">{animal.breed}</td>
                  <td className="p-3">{animal.sex}</td>
                  <td className="p-3">{animal.ageClass}</td>
                  <td className="p-3">{animal.currentOwner}</td>
                  <td className="p-3">{animal.currentHolding}</td>
                  <td className="p-3">
                    <Badge variant={getStatusVariant(animal.status)}>
                      {animal.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewAnimal(animal.id)}
                        className="p-1.5 hover:bg-muted rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isFarmer && !["Sold", "Slaughtered"].includes(animal.status) && (
                        <button
                          onClick={() => openStatusModal(animal)}
                          className="px-2 py-1 text-xs font-medium border border-border rounded hover:bg-muted transition-colors"
                          title="Update Status"
                        >
                          Status
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAnimal(animal)}
                        disabled={deletingAnimalId === animal.id}
                        className="p-1.5 hover:bg-muted rounded transition-colors text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-muted-foreground">
            Showing {filteredAnimals.length} of {totalAnimals} animals
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading || !previousPageAvailable}
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || !nextPageAvailable}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Status update modal */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Update Animal Status</h2>
              <button
                onClick={() => { setStatusModal(null); setActionError(null); }}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Animal: <span className="font-mono font-medium">{statusModal.animal.rfid}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">New Status</label>
              <select
                value={statusModal.value}
                onChange={(e) => setStatusModal((m) => m ? { ...m, value: e.target.value as FarmerSettableStatus } : null)}
                className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {FARMER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {actionError && (
              <div className="flex items-start gap-2 p-3 mb-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {actionError}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => { setStatusModal(null); setActionError(null); }}
                disabled={statusSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleStatusSubmit} disabled={statusSubmitting}>
                {statusSubmitting ? "Saving..." : "Save Status"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

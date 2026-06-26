import { useEffect, useMemo, useState } from "react";
import { Filter, Download, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select } from "../components/Input";
import type { ApiAnimalStatus } from "../lib/api/animals";
import { mapApiAnimalToAnimal } from "../lib/api/animals";
import type { Animal } from "../lib/types";
import { animalsApi } from "../services/api/animals";
import { getApiErrorMessage } from "../services/api/errors";

interface AnimalRegistryProps {
  onViewAnimal: (id: string) => void;
  onRegisterAnimal: () => void;
}

const STATUS_FILTERS: Record<string, ApiAnimalStatus | null> = {
  all: null,
  Active: "alive",
  Sold: "sold",
  Slaughtered: "slaughtered",
  Deceased: "deceased",
};

export function AnimalRegistry({ onViewAnimal, onRegisterAnimal }: AnimalRegistryProps) {
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
  const [editingAnimalId, setEditingAnimalId] = useState<string | null>(null);
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
      case "Active":
        return "success";
      case "For Sale":
        return "info";
      case "Sold":
        return "secondary";
      case "Deceased":
      case "Slaughtered":
        return "danger";
      default:
        return "default";
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

  const handleEditAnimal = async (animal: Animal) => {
    const rfid = window.prompt("RFID Number", animal.rfid);
    if (rfid === null) return;

    const color = window.prompt("Color", animal.color || "");
    if (color === null) return;

    const status = window.prompt(
      "Status (alive, sold, slaughtered, deceased, quarantined)",
      STATUS_FILTERS[animal.status] || "alive",
    ) as ApiAnimalStatus | null;
    if (status === null) return;

    setEditingAnimalId(animal.id);
    setActionError(null);

    try {
      await animalsApi.updateAnimal(animal.id, {
        rfid_tag: rfid.trim() || null,
        color: color.trim(),
        status,
      });
      await refreshCurrentPage();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to update animal. Please try again."));
    } finally {
      setEditingAnimalId(null);
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
              <option value="For Sale">For Sale</option>
              <option value="Sold">Sold</option>
              <option value="Slaughtered">Slaughtered</option>
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
          {actionError && (
            <div className="text-destructive">
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
                      <button
                        onClick={() => handleEditAnimal(animal)}
                        disabled={editingAnimalId === animal.id}
                        className="p-1.5 hover:bg-muted rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
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
    </div>
  );
}

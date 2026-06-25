import { useState } from "react";
import { Search, Filter, Download, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select } from "../components/Input";
import { mockAnimals } from "../lib/mockData";
import type { Animal } from "../lib/types";

interface AnimalRegistryProps {
  onViewAnimal: (id: string) => void;
  onRegisterAnimal: () => void;
}

export function AnimalRegistry({ onViewAnimal, onRegisterAnimal }: AnimalRegistryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredAnimals = mockAnimals.filter((animal) => {
    const matchesSearch =
      animal.rfid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.currentOwner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecies = filterSpecies === "all" || animal.species === filterSpecies;
    const matchesStatus = filterStatus === "all" || animal.status === filterStatus;
    return matchesSearch && matchesSpecies && matchesStatus;
  });

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
        </div>
      </Card>

      <Card>
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
              {filteredAnimals.map((animal) => (
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
                        className="p-1.5 hover:bg-muted rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
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
            Showing {filteredAnimals.length} of {mockAnimals.length} animals
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

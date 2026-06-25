import { useState } from "react";
import { Plus, Map, Filter, Download, CheckCircle, XCircle, Clock, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select, Textarea } from "../components/Input";
import { mockMovements } from "../lib/mockData";
import { formatDate } from "../lib/utils";
import type { Movement } from "../lib/types";

export function Movements() {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredMovements = mockMovements.filter((m) =>
    filterStatus === "all" || m.status === filterStatus
  );

  const stats = {
    total: mockMovements.length,
    pending: mockMovements.filter(m => m.status === "Pending").length,
    inTransit: mockMovements.filter(m => m.status === "In Transit").length,
    completed: mockMovements.filter(m => m.status === "Completed").length,
  };

  const getStatusVariant = (status: Movement["status"]) => {
    switch (status) {
      case "Completed":
        return "success";
      case "In Transit":
        return "info";
      case "Pending":
        return "warning";
      case "Rejected":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: Movement["status"]) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "Pending":
      case "In Transit":
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Animal Movement Tracking</h1>
          <p className="text-muted-foreground">Monitor and manage livestock movements between holdings</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Record Movement
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Total Movements</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.total}</div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Map className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Pending</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.pending}</div>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>In Transit</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.inTransit}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Completed</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.completed}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record New Movement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Animal RFID *" placeholder="254000123456789" />
              <Select label="Movement Purpose *">
                <option value="">Select purpose</option>
                <option value="sale">Sale</option>
                <option value="breeding">Breeding</option>
                <option value="grazing">Grazing</option>
                <option value="slaughter">Slaughter</option>
                <option value="transfer">Transfer</option>
              </Select>
              <Select label="Origin Holding *">
                <option value="">Select origin</option>
                <option value="1">Kiambu Dairy Farm</option>
                <option value="2">Kisumu Livestock Ranch</option>
                <option value="3">Nakuru Valley Dairy</option>
              </Select>
              <Select label="Destination Holding *">
                <option value="">Select destination</option>
                <option value="1">Kiambu Dairy Farm</option>
                <option value="2">Nakuru Valley Dairy</option>
                <option value="3">Dagoretti Livestock Market</option>
              </Select>
              <Input label="Movement Date *" type="date" />
              <Input label="Permit Number" placeholder="KE-MV-2026-001234" />
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Cross-Border Movement</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <Textarea label="Notes" placeholder="Additional movement details..." />
              </div>
              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button>
                  Submit Movement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Movement Route Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Map className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Interactive map showing movement routes and real-time tracking</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Movement History</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMovements.map((movement) => (
              <div key={movement.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(movement.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold">RFID: {movement.animalRfid}</div>
                        <div className="text-muted-foreground">{movement.purpose}</div>
                      </div>
                      <Badge variant={getStatusVariant(movement.status)}>
                        {movement.status}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mt-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-muted-foreground">Origin</div>
                          <div className="font-medium">{movement.fromHolding}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-muted-foreground">Destination</div>
                          <div className="font-medium">{movement.toHolding}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Movement Date</div>
                        <div className="font-medium">{formatDate(movement.movementDate)}</div>
                      </div>
                      {movement.permitNumber && (
                        <div>
                          <div className="text-muted-foreground">Permit Number</div>
                          <div className="font-medium font-mono">{movement.permitNumber}</div>
                        </div>
                      )}
                    </div>
                    {movement.crossBorder && (
                      <div className="mt-2">
                        <Badge variant="warning">Cross-Border Movement</Badge>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      {movement.status === "Pending" && (
                        <>
                          <Button size="sm" variant="outline">
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

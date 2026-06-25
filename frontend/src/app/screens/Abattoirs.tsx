import { useState } from "react";
import { Building2, CheckCircle, Clock, Shield, FileText, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select, Textarea } from "../components/Input";
import { mockSlaughterRecords } from "../lib/mockData";
import { formatDate } from "../lib/utils";

export function Abattoirs() {
  const [showForm, setShowForm] = useState(false);

  const stats = {
    received: 45,
    slaughteredToday: 12,
    pending: 8,
    compliance: 98.5,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Abattoir Management</h1>
          <p className="text-muted-foreground">Manage slaughter facilities and processing records</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Record Slaughter
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Animals Received</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.received}</div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">Last 7 days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Slaughtered Today</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.slaughteredToday}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">June 6, 2026</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Pending Verification</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.pending}</div>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">Awaiting inspection</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Compliance Rate</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.compliance}%</div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">Above target</div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record Slaughter Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Animal RFID *" placeholder="254000123456789" />
              <Select label="Abattoir *">
                <option value="">Select abattoir</option>
                <option value="KE-AB-001">Nairobi Modern Abattoir</option>
                <option value="KE-AB-002">Mombasa Export Abattoir</option>
                <option value="KE-AB-003">Nakuru County Abattoir</option>
              </Select>
              <Input label="Chain Number *" placeholder="NMA-2026-05432" />
              <Input label="Carcass ID *" placeholder="CARC-20260606-001" />
              <Input label="Slaughter Date *" type="date" />
              <Select label="Grade">
                <option value="">Select grade</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </Select>
              <div className="md:col-span-2">
                <Textarea label="Feedback/Notes" placeholder="Carcass quality, marbling, any observations..." />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">Attachments</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <div className="text-muted-foreground">Upload inspection reports, photos, certificates</div>
                </div>
              </div>
              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button>
                  Submit Record
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Incoming Animal Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">RFID: 254000{(123456789 + item).toString()}</div>
                      <div className="text-muted-foreground">Boran - Male</div>
                    </div>
                    <Badge variant="warning">Pending Verification</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-muted-foreground">Origin</div>
                      <div className="font-medium">Kiambu Dairy Farm</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Expected Arrival</div>
                      <div className="font-medium">June 6, 2026 14:30</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">
                      <CheckCircle className="w-4 h-4" />
                      Verify & Accept
                    </Button>
                    <Button size="sm" variant="ghost">
                      View Full History
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground mb-1">This Week</div>
              <div className="text-2xl font-semibold">142</div>
              <div className="text-muted-foreground">Animals Processed</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground mb-1">This Month</div>
              <div className="text-2xl font-semibold">587</div>
              <div className="text-muted-foreground">Total Processed</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground mb-1">Avg Processing Time</div>
              <div className="text-2xl font-semibold">2.5h</div>
              <div className="text-muted-foreground">From arrival to completion</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Slaughter Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Animal RFID</th>
                  <th className="text-left p-3 font-medium">Abattoir</th>
                  <th className="text-left p-3 font-medium">Chain Number</th>
                  <th className="text-left p-3 font-medium">Carcass ID</th>
                  <th className="text-left p-3 font-medium">Slaughter Date</th>
                  <th className="text-left p-3 font-medium">Verified</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockSlaughterRecords.map((record) => (
                  <tr key={record.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-mono">{record.animalRfid}</td>
                    <td className="p-3">{record.abattoirName}</td>
                    <td className="p-3 font-mono">{record.chainNumber}</td>
                    <td className="p-3 font-mono">{record.carcassId}</td>
                    <td className="p-3">{formatDate(record.slaughterDate)}</td>
                    <td className="p-3">
                      <Badge variant={record.verified ? "success" : "warning"}>
                        {record.verified ? "Verified" : "Pending"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost">
                        View Chain
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

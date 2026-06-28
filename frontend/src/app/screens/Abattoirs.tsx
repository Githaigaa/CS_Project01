import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle, Clock, Shield, FileText, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Input, Select, Textarea } from "../components/Input";
import { mapApiSlaughterRecordToSlaughterRecord } from "../lib/api/slaughter";
import { formatDate } from "../lib/utils";
import type { SlaughterRecord } from "../lib/types";
import { getApiErrorMessage } from "../services/api/errors";
import { slaughterApi } from "../services/api/slaughter";

const PAGE_SIZE = 10;

export function Abattoirs() {
  const [showForm, setShowForm] = useState(false);
  const [records, setRecords] = useState<SlaughterRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadRecords() {
      setLoading(true);
      setError(null);

      try {
        const response = await slaughterApi.listSlaughterRecords({
          page,
          pageSize: PAGE_SIZE,
        });

        if (!isCurrent) return;

        setRecords(response.results.map(mapApiSlaughterRecordToSlaughterRecord));
        setTotalCount(response.count);
        setHasNext(Boolean(response.next));
        setHasPrev(Boolean(response.previous));
      } catch (err) {
        if (!isCurrent) return;
        setError(getApiErrorMessage(err, "Unable to load slaughter records. Please try again."));
        setRecords([]);
        setTotalCount(0);
        setHasNext(false);
        setHasPrev(false);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadRecords();
    return () => { isCurrent = false; };
  }, [page]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const verifiedCount = records.filter((record) => record.verified).length;

    return {
      received: records.filter((record) => record.slaughterDate >= weekAgo).length,
      slaughteredToday: records.filter((record) => record.slaughterDate === today).length,
      pending: records.filter((record) => !record.verified).length,
      compliance: records.length ? Math.round((verifiedCount / records.length) * 1000) / 10 : 0,
    };
  }, [records]);

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

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Animals Received</CardTitle>
                <div className="text-3xl font-semibold mt-2">
                  {loading ? "—" : stats.received}
                </div>
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
                <div className="text-3xl font-semibold mt-2">
                  {loading ? "—" : stats.slaughteredToday}
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">{formatDate(new Date().toISOString())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Pending Verification</CardTitle>
                <div className="text-3xl font-semibold mt-2">
                  {loading ? "—" : stats.pending}
                </div>
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
                <div className="text-3xl font-semibold mt-2">
                  {loading ? "—" : `${stats.compliance}%`}
                </div>
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading verification queue" />
                </div>
              ) : records.filter((record) => !record.verified).length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No animals pending verification.
                </div>
              ) : (
                records
                  .filter((record) => !record.verified)
                  .slice(0, 3)
                  .map((record) => (
                    <div key={record.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold">RFID: {record.animalRfid}</div>
                          <div className="text-muted-foreground">{record.abattoirName}</div>
                        </div>
                        <Badge variant="warning">Pending Verification</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-muted-foreground">Abattoir</div>
                          <div className="font-medium">{record.abattoirName}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Slaughter Date</div>
                          <div className="font-medium">{formatDate(record.slaughterDate)}</div>
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
                  ))
              )}
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
              <div className="text-2xl font-semibold">{loading ? "—" : stats.received}</div>
              <div className="text-muted-foreground">Animals Processed</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground mb-1">This Month</div>
              <div className="text-2xl font-semibold">{loading ? "—" : totalCount}</div>
              <div className="text-muted-foreground">Total Processed</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground mb-1">Compliance Rate</div>
              <div className="text-2xl font-semibold">{loading ? "—" : `${stats.compliance}%`}</div>
              <div className="text-muted-foreground">Inspection pass rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Slaughter Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading slaughter records" />
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No slaughter records found.
            </div>
          ) : (
            <>
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
                    {records.map((record) => (
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

              {totalCount > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-sm text-muted-foreground">
                    Page {page} · {totalCount} record{totalCount !== 1 ? "s" : ""}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading || !hasPrev}
                      onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading || !hasNext}
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  DollarSign,
  CheckCircle,
  Clock,
  Loader2,
  X,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Select } from "../components/Input";
import type { ApiTransaction, ApiTransactionStats } from "../lib/api/transactions";
import { mapApiTransactionToTransaction } from "../lib/api/transactions";
import { formatCurrency, formatDate } from "../lib/utils";
import type { Transaction } from "../lib/types";
import { getApiErrorMessage } from "../services/api/errors";
import { transactionsApi } from "../services/api/transactions";

const PAGE_SIZE = 10;

// ─── Detail modal ────────────────────────────────────────────────────────────

function TransactionDetailModal({
  txn,
  raw,
  onClose,
  onStatusChange,
}: {
  txn: Transaction;
  raw: ApiTransaction;
  onClose: () => void;
  onStatusChange: (id: number, status: "pending" | "paid" | "failed", ref?: string) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [payRef, setPayRef] = useState(raw.payment_ref);
  const [newStatus, setNewStatus] = useState<"pending" | "paid" | "failed">(raw.payment_status);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      await onStatusChange(raw.id, newStatus, payRef);
      onClose();
    } catch (e) {
      setErr(getApiErrorMessage(e, "Failed to update transaction."));
    } finally {
      setSaving(false);
    }
  };

  const paymentStatusBadge = (s: string) =>
    s === "paid" ? "success" : s === "failed" ? "danger" : "warning";

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Transaction TXN-{txn.id}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Animal RFID</div>
              <div className="font-mono font-medium">{txn.animalRfid || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Sale Date</div>
              <div className="font-medium">{formatDate(txn.saleDate)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Seller</div>
              <div className="font-medium">{txn.seller}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Buyer</div>
              <div className="font-medium">{txn.buyer}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Asking Price</div>
              <div className="font-medium">{formatCurrency(txn.askingPrice)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Agreed Price</div>
              <div className="font-semibold text-primary">{formatCurrency(txn.agreedPrice)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Payment Method</div>
              <div className="font-medium capitalize">{raw.payment_method || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Current Payment Status</div>
              <Badge variant={paymentStatusBadge(raw.payment_status)}>
                {raw.payment_status.charAt(0).toUpperCase() + raw.payment_status.slice(1)}
              </Badge>
            </div>
          </div>

          {raw.notes && (
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Notes</div>
              <p className="text-sm">{raw.notes}</p>
            </div>
          )}

          <div className="border-t border-border pt-4 space-y-3">
            <div className="text-sm font-medium">Update Payment Status</div>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as typeof newStatus)}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </Select>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Payment Reference (e.g. M-Pesa code)
              </label>
              <input
                className="w-full px-3 py-2 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                placeholder="e.g. QHJ9KL2MNA"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
              />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

type PaymentFilter = "all" | "pending" | "paid" | "failed";

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rawTransactions, setRawTransactions] = useState<ApiTransaction[]>([]);
  const [stats, setStats] = useState<ApiTransactionStats | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewTxn, setViewTxn] = useState<{ txn: Transaction; raw: ApiTransaction } | null>(null);

  // Reset to page 1 whenever the filter changes
  useEffect(() => { setPage(1); }, [paymentFilter]);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [listRes, statsRes] = await Promise.all([
          transactionsApi.listTransactions({
            page,
            pageSize: PAGE_SIZE,
            payment_status: paymentFilter,
          }),
          transactionsApi.getStats(),
        ]);

        if (!isCurrent) return;

        setRawTransactions(listRes.results);
        setTransactions(listRes.results.map(mapApiTransactionToTransaction));
        setTotalCount(listRes.count);
        setHasNext(Boolean(listRes.next));
        setHasPrev(Boolean(listRes.previous));
        setStats(statsRes);
      } catch (err) {
        if (!isCurrent) return;
        setError(getApiErrorMessage(err, "Unable to load transactions. Please try again."));
        setTransactions([]);
        setRawTransactions([]);
        setTotalCount(0);
        setHasNext(false);
        setHasPrev(false);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    load();
    return () => { isCurrent = false; };
  }, [page, paymentFilter]);

  const handleStatusChange = async (
    id: number,
    payment_status: "pending" | "paid" | "failed",
    payment_ref?: string,
  ) => {
    await transactionsApi.updatePaymentStatus(id, payment_status, payment_ref);
    // Refresh list and stats
    const [listRes, statsRes] = await Promise.all([
      transactionsApi.listTransactions({ page, pageSize: PAGE_SIZE, payment_status: paymentFilter }),
      transactionsApi.getStats(),
    ]);
    setRawTransactions(listRes.results);
    setTransactions(listRes.results.map(mapApiTransactionToTransaction));
    setTotalCount(listRes.count);
    setHasNext(Boolean(listRes.next));
    setHasPrev(Boolean(listRes.previous));
    setStats(statsRes);
  };

  const handleExport = () => {
    const header = ["ID", "Seller", "Buyer", "Animal RFID", "Asking Price", "Agreed Price", "Payment Status", "Payment Ref", "Sale Date"];
    const rows = transactions.map((t, i) => [
      `TXN-${t.id}`,
      t.seller,
      t.buyer,
      t.animalRfid || "",
      t.askingPrice,
      t.agreedPrice,
      t.paymentStatus,
      rawTransactions[i]?.payment_ref || "",
      t.saleDate,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPaymentVariant = (status: Transaction["paymentStatus"]) => {
    if (status === "Paid") return "success" as const;
    if (status === "Failed") return "danger" as const;
    return "warning" as const;
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Transactions</h1>
          <p className="text-muted-foreground">View and manage livestock sales and purchases</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={transactions.length === 0}>
          <Download className="w-5 h-5" />
          Export CSV
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats — sourced from the /stats/ endpoint, not the current page */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Total Transactions</CardTitle>
                <div className="text-3xl font-semibold mt-2">
                  {loading && !stats ? "—" : (stats?.total ?? 0)}
                </div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Total Revenue</CardTitle>
                <div className="text-3xl font-semibold mt-2">
                  {loading && !stats ? "—" : formatCurrency(Number(stats?.total_revenue ?? 0))}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Pending Payment</CardTitle>
                <div className="text-3xl font-semibold mt-2">
                  {loading && !stats ? "—" : (stats?.pending ?? 0)}
                </div>
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
                <CardTitle>Paid</CardTitle>
                <div className="text-3xl font-semibold mt-2">
                  {loading && !stats ? "—" : (stats?.paid ?? 0)}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Transaction Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {[
              { step: "Listing", icon: "1", active: true },
              { step: "Offer", icon: "2", active: true },
              { step: "Agreement", icon: "3", active: true },
              { step: "Payment", icon: "4", active: false },
              { step: "Transfer", icon: "5", active: false },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                      item.active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.active ? <CheckCircle className="w-6 h-6" /> : item.icon}
                  </div>
                  <div className={`mt-2 text-center text-sm ${item.active ? "font-medium" : "text-muted-foreground"}`}>
                    {item.step}
                  </div>
                </div>
                {idx < 4 && (
                  <div className={`h-0.5 flex-1 mx-4 ${item.active ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <Select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
              className="w-44"
            >
              <option value="all">All Transactions</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending Payment</option>
              <option value="failed">Failed</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <XCircle className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                {paymentFilter === "all"
                  ? "No transactions yet."
                  : `No ${paymentFilter} transactions found.`}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium text-sm">ID</th>
                      <th className="text-left p-3 font-medium text-sm">Seller</th>
                      <th className="text-left p-3 font-medium text-sm">Buyer</th>
                      <th className="text-left p-3 font-medium text-sm">Animal RFID</th>
                      <th className="text-left p-3 font-medium text-sm">Asking</th>
                      <th className="text-left p-3 font-medium text-sm">Agreed</th>
                      <th className="text-left p-3 font-medium text-sm">Payment</th>
                      <th className="text-left p-3 font-medium text-sm">Date</th>
                      <th className="text-left p-3 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, idx) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-3 font-mono text-sm">TXN-{transaction.id}</td>
                        <td className="p-3 text-sm">{transaction.seller}</td>
                        <td className="p-3 text-sm">{transaction.buyer}</td>
                        <td className="p-3 font-mono text-sm">{transaction.animalRfid || "—"}</td>
                        <td className="p-3 text-sm">{formatCurrency(transaction.askingPrice)}</td>
                        <td className="p-3 text-sm font-semibold">{formatCurrency(transaction.agreedPrice)}</td>
                        <td className="p-3">
                          <Badge variant={getPaymentVariant(transaction.paymentStatus)}>
                            {transaction.paymentStatus}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">{formatDate(transaction.saleDate)}</td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setViewTxn({ txn: transaction, raw: rawTransactions[idx] })
                            }
                          >
                            View
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
                    Page {page} of {totalPages} · {totalCount} transaction{totalCount !== 1 ? "s" : ""}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading || !hasPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading || !hasNext}
                      onClick={() => setPage((p) => p + 1)}
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

      {/* Detail modal */}
      {viewTxn && (
        <TransactionDetailModal
          txn={viewTxn.txn}
          raw={viewTxn.raw}
          onClose={() => setViewTxn(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

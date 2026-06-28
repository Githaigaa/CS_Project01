import { useEffect, useMemo, useState } from "react";
import { Filter, Download, DollarSign, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Select } from "../components/Input";
import { mapApiTransactionToTransaction } from "../lib/api/transactions";
import { formatCurrency, formatDate } from "../lib/utils";
import type { Transaction } from "../lib/types";
import { getApiErrorMessage } from "../services/api/errors";
import { transactionsApi } from "../services/api/transactions";

const PAGE_SIZE = 10;

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadTransactions() {
      setLoading(true);
      setError(null);

      try {
        const response = await transactionsApi.listTransactions({
          page,
          pageSize: PAGE_SIZE,
        });

        if (!isCurrent) return;

        setTransactions(response.results.map(mapApiTransactionToTransaction));
        setTotalCount(response.count);
        setHasNext(Boolean(response.next));
        setHasPrev(Boolean(response.previous));
      } catch (err) {
        if (!isCurrent) return;
        setError(getApiErrorMessage(err, "Unable to load transactions. Please try again."));
        setTransactions([]);
        setTotalCount(0);
        setHasNext(false);
        setHasPrev(false);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadTransactions();
    return () => { isCurrent = false; };
  }, [page]);

  const filteredTransactions = useMemo(() => {
    if (statusFilter === "all") return transactions;
    if (statusFilter === "pending") {
      return transactions.filter((transaction) => transaction.paymentStatus === "Pending");
    }
    if (statusFilter === "completed") {
      return transactions.filter((transaction) => transaction.status === "Completed");
    }
    return transactions.filter((transaction) => transaction.status === "Cancelled");
  }, [statusFilter, transactions]);

  const stats = useMemo(() => ({
    total: totalCount,
    totalRevenue: transactions.reduce((sum, transaction) => sum + transaction.agreedPrice, 0),
    pending: transactions.filter((transaction) => transaction.paymentStatus === "Pending").length,
    completed: transactions.filter((transaction) => transaction.status === "Completed").length,
  }), [totalCount, transactions]);

  const getStatusVariant = (status: Transaction["status"]) => {
    switch (status) {
      case "Completed":
        return "success";
      case "Pending":
        return "warning";
      case "Cancelled":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getPaymentVariant = (status: Transaction["paymentStatus"]) => {
    switch (status) {
      case "Paid":
        return "success";
      case "Pending":
        return "warning";
      case "Failed":
        return "danger";
      default:
        return "secondary";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Transactions</h1>
          <p className="text-muted-foreground">View and manage livestock sales and purchases</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-5 h-5" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="w-5 h-5" />
            Export
          </Button>
        </div>
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
                <CardTitle>Total Transactions</CardTitle>
                <div className="text-3xl font-semibold mt-2">
                  {loading ? "—" : stats.total}
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
                  {loading ? "—" : formatCurrency(stats.totalRevenue)}
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
                <CardTitle>Pending</CardTitle>
                <div className="text-3xl font-semibold mt-2">
                  {loading ? "—" : stats.pending}
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
                <CardTitle>Completed</CardTitle>
                <div className="text-3xl font-semibold mt-2">
                  {loading ? "—" : stats.completed}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

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
                  <div className={`mt-2 text-center ${item.active ? "font-medium" : "text-muted-foreground"}`}>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All Transactions</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading transactions" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No transactions found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium">Transaction ID</th>
                      <th className="text-left p-3 font-medium">Seller</th>
                      <th className="text-left p-3 font-medium">Buyer</th>
                      <th className="text-left p-3 font-medium">Animal RFID</th>
                      <th className="text-left p-3 font-medium">Asking Price</th>
                      <th className="text-left p-3 font-medium">Agreed Price</th>
                      <th className="text-left p-3 font-medium">Payment Status</th>
                      <th className="text-left p-3 font-medium">Sale Date</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-3 font-mono">TXN-{transaction.id}</td>
                        <td className="p-3">{transaction.seller}</td>
                        <td className="p-3">{transaction.buyer}</td>
                        <td className="p-3 font-mono">{transaction.animalRfid || "—"}</td>
                        <td className="p-3">{formatCurrency(transaction.askingPrice)}</td>
                        <td className="p-3 font-semibold">{formatCurrency(transaction.agreedPrice)}</td>
                        <td className="p-3">
                          <Badge variant={getPaymentVariant(transaction.paymentStatus)}>
                            {transaction.paymentStatus}
                          </Badge>
                        </td>
                        <td className="p-3">{formatDate(transaction.saleDate)}</td>
                        <td className="p-3">
                          <Badge variant={getStatusVariant(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button size="sm" variant="ghost">
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
                    Page {page} · {totalCount} transaction{totalCount !== 1 ? "s" : ""}
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

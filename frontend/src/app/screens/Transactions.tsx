import { Filter, Download, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Select } from "../components/Input";
import { mockTransactions } from "../lib/mockData";
import { formatCurrency, formatDate } from "../lib/utils";
import type { Transaction } from "../lib/types";

export function Transactions() {
  const stats = {
    total: mockTransactions.length,
    totalRevenue: mockTransactions.reduce((sum, t) => sum + t.agreedPrice, 0),
    pending: mockTransactions.filter(t => t.status === "Pending").length,
    completed: mockTransactions.filter(t => t.status === "Completed").length,
  };

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

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Total Transactions</CardTitle>
                <div className="text-3xl font-semibold mt-2">{stats.total}</div>
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
                <div className="text-3xl font-semibold mt-2">{formatCurrency(stats.totalRevenue)}</div>
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
            <Select>
              <option value="all">All Transactions</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
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
                {mockTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-mono">TXN-{transaction.id}</td>
                    <td className="p-3">{transaction.seller}</td>
                    <td className="p-3">{transaction.buyer}</td>
                    <td className="p-3 font-mono">{transaction.animalRfid}</td>
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
        </CardContent>
      </Card>
    </div>
  );
}

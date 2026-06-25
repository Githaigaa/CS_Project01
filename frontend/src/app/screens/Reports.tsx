import { FileText, Download, TrendingUp, Users, Map, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const regionalData = [
  { region: "North", count: 320 },
  { region: "South", count: 280 },
  { region: "East", count: 410 },
  { region: "West", count: 237 },
];

const monthlyRevenue = [
  { month: "Jan", revenue: 42000 },
  { month: "Feb", revenue: 48000 },
  { month: "Mar", revenue: 45000 },
  { month: "Apr", revenue: 52000 },
  { month: "May", revenue: 51000 },
  { month: "Jun", revenue: 58000 },
];

const diseaseData = [
  { disease: "FMD", cases: 15, color: "#DC2626" },
  { disease: "ECF", cases: 12, color: "#F59E0B" },
  { disease: "PPR", cases: 8, color: "#0EA5E9" },
  { disease: "CBPP", cases: 6, color: "#8B5CF6" },
  { disease: "Other", cases: 5, color: "#64748B" },
];

export function Reports() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights and data analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-5 h-5" />
            Export PDF
          </Button>
          <Button variant="outline">
            <Download className="w-5 h-5" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4" />
                Animal Inventory Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4" />
                Movement Summary
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Heart className="w-4 h-4" />
                Health Records Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4" />
                Ownership Transfer Log
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Map className="w-4 h-4" />
                Regional Distribution
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Marketplace Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#2E7D32" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Regional Livestock Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1565C0" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disease Incident Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={diseaseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ disease, cases }) => `${disease}: ${cases}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cases"
                >
                  {diseaseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance & Regulatory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <div className="text-4xl font-semibold text-green-600 mb-2">98.5%</div>
              <div className="text-muted-foreground">Traceability Compliance</div>
            </div>
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <div className="text-4xl font-semibold text-blue-600 mb-2">1,247</div>
              <div className="text-muted-foreground">Animals Registered</div>
            </div>
            <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
              <div className="text-4xl font-semibold text-amber-600 mb-2">156</div>
              <div className="text-muted-foreground">Active Holdings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 font-medium">Report Type</label>
              <select className="w-full px-3 py-2 bg-input-background border border-input rounded-lg">
                <option>Select report type</option>
                <option>Animal Inventory</option>
                <option>Movement History</option>
                <option>Health Records</option>
                <option>Financial Summary</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-medium">Date Range</label>
              <select className="w-full px-3 py-2 bg-input-background border border-input rounded-lg">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last 6 months</option>
                <option>Last year</option>
                <option>Custom range</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-medium">Format</label>
              <select className="w-full px-3 py-2 bg-input-background border border-input rounded-lg">
                <option>PDF</option>
                <option>Excel</option>
                <option>CSV</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button>
              <FileText className="w-5 h-5" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

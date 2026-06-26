import { useEffect, useState } from "react";
import { FileText, Download, TrendingUp, Users, Map, Heart, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Button } from "../components/Button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  BUILDER_REPORT_TYPE_MAP,
  DATE_RANGE_MAP,
  EMPTY_OVERVIEW,
  QUICK_REPORT_TYPE_MAP,
  type DateRangePreset,
  type ReportExportFormat,
  type ReportType,
  type ReportsOverview,
} from "../lib/api/reports";
import { reportsApi } from "../services/api/reports";
import { getApiErrorMessage } from "../services/api/errors";

const DEFAULT_BUILDER_REPORT = "Animal Inventory";
const DEFAULT_DATE_RANGE = "Last 6 months";
const DEFAULT_FORMAT = "PDF";

export function Reports() {
  const [overview, setOverview] = useState<ReportsOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [builderReportLabel, setBuilderReportLabel] = useState(DEFAULT_BUILDER_REPORT);
  const [dateRangeLabel, setDateRangeLabel] = useState(DEFAULT_DATE_RANGE);
  const [formatLabel, setFormatLabel] = useState(DEFAULT_FORMAT);

  const dateParams = {
    range: (DATE_RANGE_MAP[dateRangeLabel] ?? "180") as DateRangePreset,
  };

  const selectedReportType: ReportType =
    BUILDER_REPORT_TYPE_MAP[builderReportLabel] ?? "herd";

  const selectedFormat: ReportExportFormat =
    formatLabel === "CSV" ? "csv" : formatLabel === "Excel" ? "csv" : "pdf";

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await reportsApi.getOverview(dateParams);
        if (!isCurrent) return;
        setOverview(data);
      } catch (err) {
        if (!isCurrent) return;
        setError(getApiErrorMessage(err, "Unable to load reports. Please try again."));
        setOverview(EMPTY_OVERVIEW);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    load();
    return () => { isCurrent = false; };
  }, [dateRangeLabel]);

  const handleExport = async (reportType: ReportType, format: ReportExportFormat) => {
    setExporting(true);
    setActionError(null);

    try {
      await reportsApi.exportReport(reportType, format, dateParams);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Unable to export report. Please try again."));
    } finally {
      setExporting(false);
    }
  };

  const handleQuickReport = (label: string) => {
    const reportType = QUICK_REPORT_TYPE_MAP[label];
    if (reportType) {
      handleExport(reportType, selectedFormat === "csv" ? "csv" : "pdf");
    }
  };

  const regionalData = overview.regional_data;
  const monthlyRevenue = overview.monthly_revenue;
  const diseaseData = overview.disease_data;
  const compliance = overview.compliance;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights and data analytics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={exporting || loading}
            onClick={() => handleExport(selectedReportType, "pdf")}
          >
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Export PDF
          </Button>
          <Button
            variant="outline"
            disabled={exporting || loading}
            onClick={() => handleExport(selectedReportType, "csv")}
          >
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Export Excel
          </Button>
        </div>
      </div>

      {(error || actionError) && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || actionError}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={exporting || loading}
                onClick={() => handleQuickReport("Animal Inventory Report")}
              >
                <FileText className="w-4 h-4" />
                Animal Inventory Report
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={exporting || loading}
                onClick={() => handleQuickReport("Movement Summary")}
              >
                <TrendingUp className="w-4 h-4" />
                Movement Summary
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={exporting || loading}
                onClick={() => handleQuickReport("Health Records Report")}
              >
                <Heart className="w-4 h-4" />
                Health Records Report
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={exporting || loading}
                onClick={() => handleQuickReport("Ownership Transfer Log")}
              >
                <Users className="w-4 h-4" />
                Ownership Transfer Log
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={exporting || loading}
                onClick={() => handleQuickReport("Regional Distribution")}
              >
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
            {loading ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading revenue chart" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#2E7D32" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Regional Livestock Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading regional chart" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1565C0" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disease Incident Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading disease chart" />
              </div>
            ) : (
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
            )}
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
              <div className="text-4xl font-semibold text-green-600 mb-2">
                {loading ? "—" : `${compliance.traceability_rate}%`}
              </div>
              <div className="text-muted-foreground">Traceability Compliance</div>
            </div>
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <div className="text-4xl font-semibold text-blue-600 mb-2">
                {loading ? "—" : compliance.total_animals.toLocaleString()}
              </div>
              <div className="text-muted-foreground">Animals Registered</div>
            </div>
            <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
              <div className="text-4xl font-semibold text-amber-600 mb-2">
                {loading ? "—" : compliance.active_holdings.toLocaleString()}
              </div>
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
              <select
                className="w-full px-3 py-2 bg-input-background border border-input rounded-lg"
                value={builderReportLabel}
                onChange={(e) => setBuilderReportLabel(e.target.value)}
              >
                <option>Select report type</option>
                <option>Animal Inventory</option>
                <option>Movement History</option>
                <option>Health Records</option>
                <option>Financial Summary</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-medium">Date Range</label>
              <select
                className="w-full px-3 py-2 bg-input-background border border-input rounded-lg"
                value={dateRangeLabel}
                onChange={(e) => setDateRangeLabel(e.target.value)}
              >
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last 6 months</option>
                <option>Last year</option>
                <option>Custom range</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-medium">Format</label>
              <select
                className="w-full px-3 py-2 bg-input-background border border-input rounded-lg"
                value={formatLabel}
                onChange={(e) => setFormatLabel(e.target.value)}
              >
                <option>PDF</option>
                <option>Excel</option>
                <option>CSV</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button
              disabled={exporting || loading || builderReportLabel === "Select report type"}
              onClick={() => handleExport(selectedReportType, selectedFormat)}
            >
              {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

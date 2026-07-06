import type {
  ReportDateParams,
  ReportDetail,
  ReportExportFormat,
  ReportType,
  ReportsOverview,
} from "../../lib/api/reports";
import { buildDateQueryParams, getFilenameFromDisposition } from "../../lib/api/reports";
import { apiClient } from "./client";

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const reportsApi = {
  async getOverview(params: ReportDateParams = { range: "180" }): Promise<ReportsOverview> {
    const { data } = await apiClient.get<ReportsOverview>("/reports/", {
      params: buildDateQueryParams(params),
    });
    return data;
  },

  async getReport(reportType: ReportType, params: ReportDateParams = {}): Promise<ReportDetail> {
    const { data } = await apiClient.get<ReportDetail>(`/reports/${reportType}/`, {
      params: buildDateQueryParams(params),
    });
    return data;
  },

  async exportReport(
    reportType: ReportType,
    format: ReportExportFormat,
    params: ReportDateParams = {},
  ): Promise<void> {
    let response;
    try {
      response = await apiClient.get(`/reports/${reportType}/export/`, {
        params: {
          ...buildDateQueryParams(params),
          format,
        },
        responseType: "blob",
      });
    } catch (err: unknown) {
      // When responseType is "blob", axios wraps error bodies as Blobs.
      // Read the blob as text so getApiErrorMessage can parse the JSON detail.
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: unknown } }).response?.data instanceof Blob
      ) {
        const blob = (err as { response: { data: Blob } }).response.data;
        const text = await blob.text();
        try {
          (err as { response: { data: unknown } }).response.data = JSON.parse(text);
        } catch {
          (err as { response: { data: unknown } }).response.data = text;
        }
      }
      throw err;
    }

    const extension = format === "pdf" ? "pdf" : "csv";
    const fallback = `cattletrace-${reportType}-report.${extension}`;
    const disposition = response.headers["content-disposition"] as string | undefined;
    const filename = getFilenameFromDisposition(disposition, fallback);
    triggerBrowserDownload(response.data as Blob, filename);
  },
};

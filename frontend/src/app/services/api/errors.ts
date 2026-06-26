import { isAxiosError } from "axios";

type FieldErrors = Record<string, string[] | string>;

/**
 * Normalize Django REST Framework validation errors into a single message.
 */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const data = error.response?.data;

  if (!data) {
    return error.message || fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object" && data !== null) {
    const record = data as FieldErrors & { detail?: string | string[] };

    if (record.detail) {
      return Array.isArray(record.detail) ? record.detail.join(" ") : record.detail;
    }

    const messages: string[] = [];
    for (const [field, value] of Object.entries(record)) {
      if (field === "non_field_errors") {
        const text = Array.isArray(value) ? value.join(" ") : String(value);
        messages.push(text);
        continue;
      }
      const text = Array.isArray(value) ? value.join(" ") : String(value);
      messages.push(`${field}: ${text}`);
    }

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return fallback;
}

/**
 * Map DRF field errors to form field keys for inline validation.
 */
export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError(error) || !error.response?.data || typeof error.response.data !== "object") {
    return {};
  }

  const record = error.response.data as FieldErrors;
  const fieldErrors: Record<string, string> = {};

  for (const [field, value] of Object.entries(record)) {
    if (field === "detail") continue;
    fieldErrors[field] = Array.isArray(value) ? value.join(" ") : String(value);
  }

  return fieldErrors;
}

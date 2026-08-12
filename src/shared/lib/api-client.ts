/**
 * Shared fetch client — every API interaction goes through this.
 * Never call fetch directly from inside a component.
 */

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;
  constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && options?.body instanceof FormData;

  // Let the browser set multipart boundary for FormData — never force JSON.
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (options?.headers) {
    const extra = new Headers(options.headers);
    extra.forEach((value, key) => {
      headers[key] = value;
    });
  }
  // FormData must not carry Content-Type (boundary is required).
  if (isFormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) || "حدث خطأ غير متوقع";
    throw new ApiError(message, res.status, data?.code, data?.details);
  }

  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
  upload: <T>(url: string, formData: FormData) =>
    request<T>(url, { method: "POST", body: formData }),
};

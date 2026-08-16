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

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const path = url.startsWith("http") ? url : `${API_BASE}${url}`;
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

  const res = await fetch(path, {
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

export function getFileUrl(fileId: string): string {
  return `/api/files/${encodeURIComponent(fileId)}`;
}

function mimeFromFileName(fileName: string): string | undefined {
  if (/\.pdf$/i.test(fileName)) return "application/pdf";
  if (/\.png$/i.test(fileName)) return "image/png";
  if (/\.jpe?g$/i.test(fileName)) return "image/jpeg";
  if (/\.gif$/i.test(fileName)) return "image/gif";
  if (/\.webp$/i.test(fileName)) return "image/webp";
  return undefined;
}

export async function fetchFileBlob(
  fileId: string,
  fileName?: string
): Promise<Blob> {
  const params = new URLSearchParams();
  if (fileName) params.set("name", fileName);
  const qs = params.toString();
  const res = await fetch(`${getFileUrl(fileId)}${qs ? `?${qs}` : ""}`);
  const raw = await res.text();
  let json: { data?: string; contentType?: string; error?: string } = {};
  try {
    json = raw ? (JSON.parse(raw) as typeof json) : {};
  } catch {
    throw new ApiError("تعذّر قراءة الملف", res.status);
  }
  if (!res.ok || !json.data) {
    throw new ApiError(json.error || "تعذّر جلب الملف", res.status);
  }
  const binary = atob(json.data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const type =
    json.contentType && json.contentType !== "application/octet-stream"
      ? json.contentType
      : mimeFromFileName(fileName ?? "") ?? "application/octet-stream";
  return new Blob([bytes], { type });
}

export function saveBlobToDisk(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || "file";
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function openBlobInTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener");
  if (!opened) {
    URL.revokeObjectURL(url);
    throw new ApiError("المتصفح منع فتح تبويب جديد. اسمح بالنوافذ المنبثقة.", 0);
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
  upload: <T>(url: string, formData: FormData) =>
    request<T>(url, { method: "POST", body: formData }),
};

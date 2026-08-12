/**
 * Security utilities for the government forms system.
 * - DOMPurify-based HTML sanitization
 * - Client-side file validation (magic bytes + extension + size)
 * - UUID validation for dynamic route params
 */
import DOMPurify from "dompurify";

/** Sanitize arbitrary HTML before rendering — prevents XSS in admin views. */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") {
    // Server-side fallback: strip tags entirely (DOMPurify needs a DOM)
    return dirty.replace(/<[^>]*>/g, "");
  }
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "br", "p", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });
}

/** Sanitize plain text input — escapes HTML entities. */
export function sanitizeText(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return input.replace(/[&<>"'/]/g, (c) => map[c]);
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate that an id matches UUID v4 format — guards dynamic routes. */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/** Executable extensions that are ALWAYS rejected regardless of config. */
const FORBIDDEN_EXTENSIONS = [
  ".exe",
  ".sh",
  ".bat",
  ".cmd",
  ".com",
  ".scr",
  ".msi",
  ".dll",
  ".app",
  ".jar",
  ".vb",
  ".vbs",
  ".ps1",
];

/** Magic-byte signatures for allowed file types. */
const FILE_SIGNATURES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  png: [0x89, 0x50, 0x4e, 0x47],
  jpg: [0xff, 0xd8, 0xff],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46],
  docx: [0x50, 0x4b, 0x03, 0x04],
  xlsx: [0x50, 0x4b, 0x03, 0x04],
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
}

/**
 * Validate an uploaded file: extension, magic bytes, and size.
 * Executable extensions are always rejected.
 */
export function validateFile(
  file: File,
  allowedExtensions?: string[],
  maxFileSizeMB?: number
): FileValidationResult {
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();

  // 1. Always reject forbidden executable extensions
  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `نوع الملف "${ext}" غير مسموح به لأسباب أمنية.`,
    };
  }

  // 2. Check against allowed extensions if provided
  if (allowedExtensions && allowedExtensions.length > 0) {
    if (!allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `الامتدادات المسموح بها: ${allowedExtensions.join("، ")}`,
      };
    }
  }

  // 3. Check file size
  const maxSize = (maxFileSizeMB ?? 10) * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `حجم الملف يتجاوز الحد المسموح (${maxFileSizeMB ?? 10} ميجابايت).`,
    };
  }

  // 4. Magic-byte verification (best-effort, async in caller)
  return { valid: true, detectedType: ext };
}

/** Read the first bytes of a file and verify against known signatures. */
export async function verifyFileSignature(
  file: File,
  expectedExt: string
): Promise<boolean> {
  try {
    const signature = FILE_SIGNATURES[expectedExt.replace(".", "")];
    if (!signature) return true; // unknown type — allow (extension already checked)
    const buffer = await file.slice(0, signature.length).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return signature.every((byte, i) => bytes[i] === byte);
  } catch {
    return false;
  }
}

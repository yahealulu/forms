/**
 * Public fill URL helpers for published forms (`/f/[formId]`).
 */

export function getPublicFormUrl(formId: string): string {
  if (typeof window === "undefined") {
    return `/f/${formId}`;
  }
  return `${window.location.origin}/f/${formId}`;
}

/** Copy public fill URL to clipboard. Returns the URL on success. */
export async function copyPublicFormUrl(formId: string): Promise<string> {
  const url = getPublicFormUrl(formId);
  await navigator.clipboard.writeText(url);
  return url;
}

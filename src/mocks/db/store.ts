/**
 * In-memory database — a singleton that simulates a relational DB.
 * Persists across hot reloads via globalThis.
 * Uses Maps per entity with real foreign-key relational integrity.
 */
import type {
  Form,
  FormResponse,
  Option,
  Question,
  Section,
} from "@/shared/types";

interface DbStore {
  forms: Map<string, Form>;
  sections: Map<string, Section>;
  questions: Map<string, Question>;
  options: Map<string, Option>;
  responses: Map<string, FormResponse>;
  files: Map<string, { name: string; type: string; dataUrl: string; size: number }>;
  initialized: boolean;
}

const globalForDb = globalThis as unknown as { __FORMS_DB__?: DbStore };

function createStore(): DbStore {
  return {
    forms: new Map(),
    sections: new Map(),
    questions: new Map(),
    options: new Map(),
    responses: new Map(),
    files: new Map(),
    initialized: false,
  };
}

export const db: DbStore = globalForDb.__FORMS_DB__ ?? createStore();

if (!globalForDb.__FORMS_DB__) {
  globalForDb.__FORMS_DB__ = db;
}

/** Deep-clone helper so consumers can't mutate the store by reference. */
export function clone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Map) return value;
  return JSON.parse(JSON.stringify(value));
}

/** Generate a UUID v4 string. */
export function uuid(): string {
  // Crypto.randomUUID is available in Node 18+ and browsers
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Get current ISO timestamp. */
export function now(): string {
  return new Date().toISOString();
}

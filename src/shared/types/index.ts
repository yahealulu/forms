/**
 * Shared domain types — used across all features.
 * These define the shape of the data flowing through the entire system.
 */

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "short_text"
  | "long_text"
  | "number"
  | "date"
  | "file_upload"
  | "rating";

export interface Option {
  id: string;
  label: string;
  value: string;
  order: number;
}

export interface Question {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  placeholder?: string;
  order: number;
  options: Option[];
  /** For file uploads */
  allowedExtensions?: string[];
  maxFileSizeMB?: number;
  /** For rating */
  maxRating?: number;
  /** For number */
  min?: number;
  max?: number;
}

export interface Section {
  id: string;
  formId: string;
  title: string;
  description?: string;
  order: number;
  isRepeatable: boolean;
  minRepeat: number;
  maxRepeat: number;
  repeatLabel: string;
  questions: Question[];
}

export type FormStatus = "draft" | "published" | "archived";

export interface Form {
  id: string;
  title: string;
  description: string;
  status: FormStatus;
  /** When false, public fill URL shows disabled state (published forms only). */
  isEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  sections: Section[];
  /** The entity name shown on the public form */
  entityName: string;
  accentColor?: string;
}

/** A single answer to a single question */
export type AnswerValue =
  | string
  | number
  | string[]
  | { fileId: string; fileName: string }[]
  | null;

/** Answers keyed by questionId — for repeatable sections, the key includes the instance index */
export interface RepeatableInstance {
  instanceId: string;
  instanceIndex: number;
  answers: Record<string, AnswerValue>;
}

export interface SectionResponse {
  sectionId: string;
  /** For non-repeatable sections, a single instance at index 0 */
  instances: RepeatableInstance[];
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string;
  submitterName?: string;
  submitterEmail?: string;
  sections: SectionResponse[];
  /** Aggregated completion percentage at submission time */
  completion: number;
}

export interface FormStats {
  totalForms: number;
  publishedForms: number;
  draftForms: number;
  totalResponses: number;
  totalQuestions: number;
}

/** API envelope for consistent responses */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/** Excel import result — one entry per detected column */
export interface ExcelColumn {
  columnLabel: string;
  values: string[];
}

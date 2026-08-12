/**
 * Query helpers — assemble complete nested Form objects from the flat store.
 * This simulates the JOINs a real ORM would do.
 */
import { db, clone, uuid, now } from "./store";
import { initDb } from "./seed";
import type {
  Form,
  FormResponse,
  Option,
  Question,
  Section,
} from "@/shared/types";

/** Ensure the DB is seeded before any query. */
export function ensureDb() {
  initDb();
}

/** Assemble a complete Form with nested sections → questions → options. */
export function getFormWithRelations(formId: string): Form | null {
  ensureDb();
  const form = db.forms.get(formId);
  if (!form) return null;

  const sections = Array.from(db.sections.values())
    .filter((s) => s.formId === formId)
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      const questions = Array.from(db.questions.values())
        .filter((q) => q.sectionId === s.id)
        .sort((a, b) => a.order - b.order)
        .map((q) => {
          const options = Array.from(db.options.values())
            .filter((o) => o.id && q.options.some((qo) => qo.id === o.id))
            .sort((a, b) => a.order - b.order);
          return { ...clone(q), options };
        });
      return { ...clone(s), questions };
    });

  return { ...clone(form), sections };
}

/** Get all forms (summary, without deep relations for the list). */
export function getAllForms(): Form[] {
  ensureDb();
  return Array.from(db.forms.values())
    .map((f) => {
      const sections = Array.from(db.sections.values()).filter(
        (s) => s.formId === f.id
      );
      let questionCount = 0;
      sections.forEach((s) => {
        questionCount += Array.from(db.questions.values()).filter(
          (q) => q.sectionId === s.id
        ).length;
      });
      const responseCount = Array.from(db.responses.values()).filter(
        (r) => r.formId === f.id
      ).length;
      return { ...clone(f), sections: [], _questionCount: questionCount, _responseCount: responseCount } as Form & { _questionCount: number; _responseCount: number };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/** Get responses for a form. */
export function getResponsesForForm(formId: string): FormResponse[] {
  ensureDb();
  return Array.from(db.responses.values())
    .filter((r) => r.formId === formId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .map(clone);
}

/** Get a single response. */
export function getResponse(responseId: string): FormResponse | null {
  ensureDb();
  const r = db.responses.get(responseId);
  return r ? clone(r) : null;
}

// ── Mutations ──

export function createForm(title: string, description: string, entityName: string): Form {
  ensureDb();
  const id = uuid();
  const form: Form = {
    id,
    title,
    description,
    status: "draft",
    entityName: entityName || "الجهة الحكومية",
    accentColor: "#B69D6E",
    createdAt: now(),
    updatedAt: now(),
    sections: [],
  };
  db.forms.set(id, clone(form));
  return clone(form);
}

export function updateForm(formId: string, patch: Partial<Form>): Form | null {
  ensureDb();
  const form = db.forms.get(formId);
  if (!form) return null;
  const updated = { ...form, ...patch, updatedAt: now() };
  db.forms.set(formId, clone(updated));
  return clone(updated);
}

export function deleteForm(formId: string): boolean {
  ensureDb();
  // Cascade delete sections, questions, options
  const sections = Array.from(db.sections.values()).filter((s) => s.formId === formId);
  sections.forEach((s) => {
    const questions = Array.from(db.questions.values()).filter((q) => q.sectionId === s.id);
    questions.forEach((q) => {
      q.options.forEach((o) => db.options.delete(o.id));
      db.questions.delete(q.id);
    });
    db.sections.delete(s.id);
  });
  // Delete responses
  Array.from(db.responses.values())
    .filter((r) => r.formId === formId)
    .forEach((r) => db.responses.delete(r.id));
  return db.forms.delete(formId);
}

export function createSection(formId: string, data: Partial<Section>): Section | null {
  ensureDb();
  const form = db.forms.get(formId);
  if (!form) return null;
  const existingSections = Array.from(db.sections.values()).filter((s) => s.formId === formId);
  const id = uuid();
  const section: Section = {
    id,
    formId,
    title: data.title || "قسم جديد",
    description: data.description || "",
    order: existingSections.length,
    isRepeatable: data.isRepeatable ?? false,
    minRepeat: data.minRepeat ?? 1,
    maxRepeat: data.maxRepeat ?? 1,
    repeatLabel: data.repeatLabel || "",
    questions: [],
  };
  db.sections.set(id, clone(section));
  // Bump form updatedAt
  updateForm(formId, {});
  return clone(section);
}

export function updateSection(sectionId: string, patch: Partial<Section>): Section | null {
  ensureDb();
  const section = db.sections.get(sectionId);
  if (!section) return null;
  const updated = { ...section, ...patch };
  db.sections.set(sectionId, clone(updated));
  if (section.formId) updateForm(section.formId, {});
  return clone(updated);
}

export function deleteSection(sectionId: string): boolean {
  ensureDb();
  const section = db.sections.get(sectionId);
  if (!section) return false;
  const questions = Array.from(db.questions.values()).filter((q) => q.sectionId === sectionId);
  questions.forEach((q) => {
    q.options.forEach((o) => db.options.delete(o.id));
    db.questions.delete(q.id);
  });
  const ok = db.sections.delete(sectionId);
  if (ok) updateForm(section.formId, {});
  return ok;
}

export function reorderSections(formId: string, orderedIds: string[]): boolean {
  ensureDb();
  orderedIds.forEach((id, index) => {
    const s = db.sections.get(id);
    if (s && s.formId === formId) {
      db.sections.set(id, { ...s, order: index });
    }
  });
  updateForm(formId, {});
  return true;
}

export function createQuestion(sectionId: string, data: Partial<Question>): Question | null {
  ensureDb();
  const section = db.sections.get(sectionId);
  if (!section) return null;
  const existing = Array.from(db.questions.values()).filter((q) => q.sectionId === sectionId);
  const id = uuid();
  const question: Question = {
    id,
    sectionId,
    title: data.title || "سؤال جديد",
    description: data.description || "",
    type: data.type || "short_text",
    required: data.required ?? false,
    placeholder: data.placeholder || "",
    order: existing.length,
    options: [],
    allowedExtensions: data.allowedExtensions,
    maxFileSizeMB: data.maxFileSizeMB,
    maxRating: data.maxRating,
    min: data.min,
    max: data.max,
  };
  db.questions.set(id, clone(question));
  if (section.formId) updateForm(section.formId, {});
  return clone(question);
}

export function updateQuestion(questionId: string, patch: Partial<Question>): Question | null {
  ensureDb();
  const question = db.questions.get(questionId);
  if (!question) return null;
  const updated = { ...question, ...patch };
  db.questions.set(questionId, clone(updated));
  const section = db.sections.get(question.sectionId);
  if (section) updateForm(section.formId, {});
  return clone(updated);
}

export function deleteQuestion(questionId: string): boolean {
  ensureDb();
  const question = db.questions.get(questionId);
  if (!question) return false;
  question.options.forEach((o) => db.options.delete(o.id));
  const ok = db.questions.delete(questionId);
  const section = db.sections.get(question.sectionId);
  if (section) updateForm(section.formId, {});
  return ok;
}

export function reorderQuestions(sectionId: string, orderedIds: string[]): boolean {
  ensureDb();
  orderedIds.forEach((id, index) => {
    const q = db.questions.get(id);
    if (q && q.sectionId === sectionId) {
      db.questions.set(id, { ...q, order: index });
    }
  });
  const section = db.sections.get(sectionId);
  if (section) updateForm(section.formId, {});
  return true;
}

export function addOption(questionId: string, label: string): Option | null {
  ensureDb();
  const question = db.questions.get(questionId);
  if (!question) return null;
  const id = uuid();
  const option: Option = {
    id,
    label,
    value: label,
    order: question.options.length,
  };
  db.options.set(id, clone(option));
  question.options.push(clone(option));
  db.questions.set(questionId, clone(question));
  const section = db.sections.get(question.sectionId);
  if (section) updateForm(section.formId, {});
  return clone(option);
}

export function updateOption(optionId: string, label: string): Option | null {
  ensureDb();
  const option = db.options.get(optionId);
  if (!option) return null;
  const updated = { ...option, label, value: label };
  db.options.set(optionId, clone(updated));
  // Sync the option inside its question
  const questions = Array.from(db.questions.values());
  for (const q of questions) {
    const idx = q.options.findIndex((o) => o.id === optionId);
    if (idx >= 0) {
      q.options[idx] = clone(updated);
      db.questions.set(q.id, clone(q));
      break;
    }
  }
  return clone(updated);
}

export function deleteOption(optionId: string): boolean {
  ensureDb();
  const option = db.options.get(optionId);
  if (!option) return false;
  // Remove from question
  const questions = Array.from(db.questions.values());
  for (const q of questions) {
    const idx = q.options.findIndex((o) => o.id === optionId);
    if (idx >= 0) {
      q.options.splice(idx, 1);
      // Re-index order
      q.options.forEach((o, i) => (o.order = i));
      db.questions.set(q.id, clone(q));
      const section = db.sections.get(q.sectionId);
      if (section) updateForm(section.formId, {});
      break;
    }
  }
  return db.options.delete(optionId);
}

/** Bulk-import options for a question from an Excel column. */
export function importOptionsBulk(
  questionId: string,
  values: string[]
): Option[] {
  ensureDb();
  const question = db.questions.get(questionId);
  if (!question) return [];
  const created: Option[] = [];
  let order = question.options.length;
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const id = uuid();
    const option: Option = { id, label: trimmed, value: trimmed, order: order++ };
    db.options.set(id, clone(option));
    question.options.push(clone(option));
    created.push(clone(option));
  }
  db.questions.set(questionId, clone(question));
  const section = db.sections.get(question.sectionId);
  if (section) updateForm(section.formId, {});
  return created;
}

/** Store an uploaded file and return its id + data URL. */
export function storeFile(
  name: string,
  type: string,
  dataUrl: string,
  size: number
): string {
  ensureDb();
  const id = uuid();
  db.files.set(id, { name, type, dataUrl, size });
  return id;
}

export function getFile(fileId: string) {
  ensureDb();
  return db.files.get(fileId) ?? null;
}

/** Create a form response. */
export function createResponse(
  formId: string,
  data: Partial<FormResponse>
): FormResponse | null {
  ensureDb();
  const form = db.forms.get(formId);
  if (!form) return null;
  const id = uuid();
  const response: FormResponse = {
    id,
    formId,
    submittedAt: now(),
    submitterName: data.submitterName,
    submitterEmail: data.submitterEmail,
    sections: data.sections ?? [],
    completion: data.completion ?? 100,
  };
  db.responses.set(id, clone(response));
  return clone(response);
}

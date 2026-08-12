"use client";

/**
 * useDynamicFormSchema
 * Builds a Zod schema at runtime from a Form definition.
 *
 * Field-name layout inside RHF:
 *   - Non-repeatable section:  `${sectionId}.${questionId}`
 *   - Repeatable section:      `${sectionId}.${index}.${questionId}`
 *
 * The top-level shape is:
 *   {
 *     [sectionId]: { [questionId]: value }              // non-repeatable
 *     [sectionId]: [ { [questionId]: value }, ... ]     // repeatable
 *   }
 */
import { useMemo } from "react";
import { z } from "zod";
import type { Form, Question, Section } from "@/shared/types";

const REQUIRED_MSG = "هذا الحقل مطلوب";
const NUMBER_MSG = "أدخل رقماً صحيحاً";

/**
 * Form values type for the dynamic RHF instance.
 * `any` is intentional: the form schema is built at runtime from the form
 * definition, so the field paths cannot be statically typed.
 */
export type FormValues = Record<string, any>;

/**
 * Build the Zod schema for a single question, taking into account whether
 * it is required and any type-specific constraints (min/max, allowed options…).
 */
function buildQuestionSchema(q: Question): z.ZodTypeAny {
  switch (q.type) {
    case "single_choice": {
      const optionValues = q.options.map((o) => o.value);
      const base =
        optionValues.length > 0
          ? z
              .string()
              .refine((v) => optionValues.includes(v as string), {
                message: "الرجاء اختيار قيمة صالحة",
              })
          : z.string();
      return q.required
        ? base.min(1, { message: REQUIRED_MSG })
        : base.optional().or(z.literal(""));
    }

    case "multiple_choice": {
      const optionValues = q.options.map((o) => o.value);
      const itemSchema = z
        .string()
        .refine((v) => optionValues.includes(v as string), {
          message: "قيمة غير صالحة",
        });
      const arr = z.array(itemSchema);
      return q.required
        ? arr.min(1, { message: "الرجاء اختيار خيار واحد على الأقل" })
        : arr;
    }

    case "short_text":
    case "long_text": {
      const base = z.string();
      return q.required
        ? base.min(1, { message: REQUIRED_MSG })
        : base.optional().or(z.literal(""));
    }

    case "number": {
      let schema = z.coerce.number({ error: NUMBER_MSG });
      if (q.min !== undefined && q.min !== null) {
        schema = schema.min(q.min, {
          message: `القيمة يجب ألا تقل عن ${q.min}`,
        });
      }
      if (q.max !== undefined && q.max !== null) {
        schema = schema.max(q.max, {
          message: `القيمة يجب ألا تزيد عن ${q.max}`,
        });
      }
      return q.required ? schema : schema.optional().or(z.literal(""));
    }

    case "date": {
      const base = z.string();
      return q.required
        ? base.min(1, { message: REQUIRED_MSG })
        : base.optional().or(z.literal(""));
    }

    case "file_upload": {
      const fileSchema = z.object({
        fileId: z.string(),
        fileName: z.string(),
      });
      const arr = z.array(fileSchema);
      return q.required
        ? arr.min(1, { message: "يرجى رفع ملف واحد على الأقل" })
        : arr;
    }

    case "rating": {
      const max = q.maxRating ?? 5;
      const schema = z
        .coerce
        .number({ error: "الرجاء اختيار تقييم" })
        .int()
        .min(1, { message: "الرجاء اختيار تقييم" })
        .max(max, { message: `الحد الأقصى للتقييم هو ${max}` });
      return q.required ? schema : schema.optional();
    }

    default:
      return z.any();
  }
}

function emptyInstanceValue(q: Question): unknown {
  if (q.type === "multiple_choice" || q.type === "file_upload") return [];
  return "";
}

/**
 * Build the schema for a single section. Repeatable sections produce an
 * array-of-objects schema with min/max bounds; non-repeatable produce an
 * object schema.
 */
function buildSectionSchema(section: Section): z.ZodTypeAny {
  const questionSchemas: Record<string, z.ZodTypeAny> = {};
  for (const q of section.questions) {
    questionSchemas[q.id] = buildQuestionSchema(q);
  }
  const inner = z.object(questionSchemas);
  if (section.isRepeatable) {
    return z
      .array(inner)
      .min(section.minRepeat, {
        message: `الحد الأدنى ${section.minRepeat} عنصر`,
      })
      .max(section.maxRepeat, {
        message: `الحد الأقصى ${section.maxRepeat} عنصر`,
      });
  }
  return inner;
}

/**
 * Build the full top-level Zod schema for a form.
 */
export function buildDynamicFormSchema(
  form: Form
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const sectionSchemas: Record<string, z.ZodTypeAny> = {};
  for (const section of form.sections) {
    sectionSchemas[section.id] = buildSectionSchema(section);
  }
  return z.object(sectionSchemas);
}

/**
 * Build the default values that seed `useForm({ defaultValues })`.
 * Repeatable sections are pre-populated with `minRepeat` empty instances.
 */
export function buildDefaultValues(form: Form): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const section of form.sections) {
    const sectionDefaults: Record<string, unknown> = {};
    for (const q of section.questions) {
      sectionDefaults[q.id] = emptyInstanceValue(q);
    }
    if (section.isRepeatable) {
      const initialCount = Math.max(1, section.minRepeat);
      values[section.id] = Array.from({ length: initialCount }, () => ({
        ...sectionDefaults,
      }));
    } else {
      values[section.id] = sectionDefaults;
    }
  }
  return values;
}

/**
 * React hook — memoised schema for a given form.
 */
export function useDynamicFormSchema(form: Form | undefined) {
  const schema = useMemo(
    () => (form ? buildDynamicFormSchema(form) : null),
    [form]
  );
  return schema;
}

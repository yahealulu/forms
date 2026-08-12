"use client";

import type { Control } from "react-hook-form";
import type { Question, QuestionType } from "@/shared/types";
import type { FormValues } from "../../hooks/useDynamicFormSchema";
import { SingleChoiceField } from "./SingleChoiceField";
import { MultiChoiceField } from "./MultiChoiceField";
import { TextField } from "./TextField";
import { NumberField } from "./NumberField";
import { DateField } from "./DateField";
import { FileField } from "./FileField";
import { RatingField } from "./RatingField";

export interface QuestionFieldProps {
  question: Question;
  /**
   * Full RHF field path.
   * - Non-repeatable: `${sectionId}.${questionId}`
   * - Repeatable:     `${sectionId}.${index}.${questionId}`
   */
  name: string;
  // RHF control is intentionally loose-typed because the schema is dynamic.
  control: Control<FormValues>;
}

const FIELD_MAP: Record<
  QuestionType,
  React.ComponentType<QuestionFieldProps>
> = {
  single_choice: SingleChoiceField,
  multiple_choice: MultiChoiceField,
  short_text: TextField,
  long_text: TextField,
  number: NumberField,
  date: DateField,
  file_upload: FileField,
  rating: RatingField,
};

/**
 * QuestionField — dispatcher.
 * Picks the correct sub-field component based on the question type.
 */
export function QuestionField({ question, name, control }: QuestionFieldProps) {
  const FieldComp = FIELD_MAP[question.type];
  if (!FieldComp) {
    return (
      <div className="text-xs text-destructive">
        نوع سؤال غير مدعوم: {question.type}
      </div>
    );
  }
  return <FieldComp question={question} name={name} control={control} />;
}

"use client";

import { Controller, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Question } from "@/shared/types";
import type { FormValues } from "../../hooks/useDynamicFormSchema";
import { QuestionShell } from "./_QuestionShell";

export interface TextFieldProps {
  question: Question;
  name: string;
  control: Control<FormValues>;
}

/**
 * Renders an `Input` for `short_text` and a `Textarea` for `long_text`.
 */
export function TextField({ question, name, control }: TextFieldProps) {
  const isLong = question.type === "long_text";
  const fieldId = `field-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <QuestionShell question={question} htmlFor={fieldId} error={fieldState.error}>
          {isLong ? (
            <Textarea
              id={fieldId}
              placeholder={question.placeholder}
              value={(field.value as string) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              rows={4}
              className="resize-y min-h-24"
              aria-invalid={!!fieldState.error}
            />
          ) : (
            <Input
              id={fieldId}
              type="text"
              placeholder={question.placeholder}
              value={(field.value as string) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              aria-invalid={!!fieldState.error}
              autoComplete="off"
            />
          )}
        </QuestionShell>
      )}
    />
  );
}

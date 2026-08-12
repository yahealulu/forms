"use client";

import { Controller, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { Question } from "@/shared/types";
import type { FormValues } from "../../hooks/useDynamicFormSchema";
import { QuestionShell } from "./_QuestionShell";

export interface NumberFieldProps {
  question: Question;
  name: string;
  control: Control<FormValues>;
}

export function NumberField({ question, name, control }: NumberFieldProps) {
  const fieldId = `field-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <QuestionShell question={question} htmlFor={fieldId} error={fieldState.error}>
          <Input
            id={fieldId}
            type="number"
            inputMode="numeric"
            placeholder={question.placeholder}
            value={(field.value as string | number) ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            min={question.min}
            max={question.max}
            aria-invalid={!!fieldState.error}
            autoComplete="off"
          />
          {(question.min !== undefined || question.max !== undefined) && (
            <p className="text-xs text-muted-foreground">
              {question.min !== undefined && question.max !== undefined
                ? `القيمة المسموحة: من ${question.min} إلى ${question.max}`
                : question.min !== undefined
                  ? `الحد الأدنى: ${question.min}`
                  : `الحد الأقصى: ${question.max}`}
            </p>
          )}
        </QuestionShell>
      )}
    />
  );
}

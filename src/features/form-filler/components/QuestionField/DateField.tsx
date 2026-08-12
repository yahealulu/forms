"use client";

import { Controller, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { Question } from "@/shared/types";
import type { FormValues } from "../../hooks/useDynamicFormSchema";
import { QuestionShell } from "./_QuestionShell";

export interface DateFieldProps {
  question: Question;
  name: string;
  control: Control<FormValues>;
}

export function DateField({ question, name, control }: DateFieldProps) {
  const fieldId = `field-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <QuestionShell question={question} htmlFor={fieldId} error={fieldState.error}>
          <Input
            id={fieldId}
            type="date"
            value={(field.value as string) ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            aria-invalid={!!fieldState.error}
            className="max-w-[220px]"
          />
        </QuestionShell>
      )}
    />
  );
}

"use client";

import { Controller, type Control } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Question } from "@/shared/types";
import type { FormValues } from "../../hooks/useDynamicFormSchema";
import { QuestionShell } from "./_QuestionShell";

export interface SingleChoiceFieldProps {
  question: Question;
  name: string;
  // RHF control is intentionally loose-typed because the schema is dynamic.
  control: Control<FormValues>;
}

export function SingleChoiceField({
  question,
  name,
  control,
}: SingleChoiceFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <QuestionShell question={question} error={fieldState.error}>
          <RadioGroup
            value={(field.value as string) ?? ""}
            onValueChange={field.onChange}
            className="gap-2"
            aria-label={question.title}
          >
            {question.options.map((opt) => {
              const id = `${name}-${opt.id}`;
              return (
                <div
                  key={opt.id}
                  className="flex items-center gap-3 rounded-lg border border-transparent hover:border-border hover:bg-accent/40 px-3 py-2 transition-colors"
                >
                  <RadioGroupItem id={id} value={opt.value} />
                  <Label
                    htmlFor={id}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {opt.label}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </QuestionShell>
      )}
    />
  );
}

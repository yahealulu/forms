"use client";

import { Controller, type Control } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Question } from "@/shared/types";
import type { FormValues } from "../../hooks/useDynamicFormSchema";
import { QuestionShell } from "./_QuestionShell";

export interface MultiChoiceFieldProps {
  question: Question;
  name: string;
  control: Control<FormValues>;
}

export function MultiChoiceField({
  question,
  name,
  control,
}: MultiChoiceFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={[]}
      render={({ field, fieldState }) => {
        const selected = (field.value as string[]) ?? [];
        const toggle = (value: string, checked: boolean) => {
          const next = checked
            ? [...selected, value]
            : selected.filter((v) => v !== value);
          field.onChange(next);
        };
        return (
          <QuestionShell question={question} error={fieldState.error}>
            <div className="space-y-1.5" role="group" aria-label={question.title}>
              {question.options.map((opt) => {
                const id = `${name}-${opt.id}`;
                const checked = selected.includes(opt.value);
                return (
                  <div
                    key={opt.id}
                    className="flex items-center gap-3 rounded-lg border border-transparent hover:border-border hover:bg-accent/40 px-3 py-2 transition-colors"
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(c) => toggle(opt.value, Boolean(c))}
                    />
                    <Label
                      htmlFor={id}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {opt.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </QuestionShell>
        );
      }}
    />
  );
}

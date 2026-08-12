"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Progress } from "@/components/ui/progress";
import type { Form, Question } from "@/shared/types";

export interface ProgressIndicatorProps {
  form: Form;
}

/**
 * ProgressIndicator — top-of-page completion bar.
 *
 * Counts required questions across all sections (repeatable sections are
 * weighted by their `minRepeat`) and the number of those that have been
 * filled in. Updates in real time by subscribing to RHF's watched values.
 */
export function ProgressIndicator({ form }: ProgressIndicatorProps) {
  const { watch } = useFormContext<Record<string, unknown>>();

  // Subscribe to the whole form so this re-renders on any field change.
  const values = watch();

  const { total, filled, percent } = useMemo(() => {
    let total = 0;
    let filled = 0;

    const isFilled = (q: Question, value: unknown): boolean => {
      if (value === undefined || value === null) return false;
      switch (q.type) {
        case "multiple_choice":
        case "file_upload":
          return Array.isArray(value) && value.length > 0;
        case "number":
        case "rating": {
          const n = Number(value);
          return Number.isFinite(n) && n > 0;
        }
        case "single_choice":
        case "short_text":
        case "long_text":
        case "date":
        default:
          return typeof value === "string" && value.trim().length > 0;
      }
    };

    for (const section of form.sections) {
      const requiredQuestions = section.questions.filter((q) => q.required);
      if (section.isRepeatable) {
        const minCount = Math.max(1, section.minRepeat);
        const instances =
          (values[section.id] as Record<string, unknown>[]) ?? [];
        // Count against the minimum required instances.
        for (let i = 0; i < minCount; i++) {
          const inst = instances[i] ?? {};
          for (const q of requiredQuestions) {
            total += 1;
            if (isFilled(q, inst[q.id])) filled += 1;
          }
        }
      } else {
        const inst =
          (values[section.id] as Record<string, unknown>) ?? {};
        for (const q of requiredQuestions) {
          total += 1;
          if (isFilled(q, inst[q.id])) filled += 1;
        }
      }
    }

    const percent = total === 0 ? 100 : Math.round((filled / total) * 100);
    return { total, filled, percent };
  }, [form, values]);

  if (total === 0) {
    // No required questions at all → fully "ready"
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">اكتمال النموذج</span>
          <span className="font-semibold text-foreground">100%</span>
        </div>
        <Progress value={100} className="h-2 bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          اكتمال النموذج:{" "}
          <span className="font-semibold text-foreground">{percent}%</span>
          <span className="text-muted-foreground/70 mr-1">
            ({filled} / {total})
          </span>
        </span>
        {percent === 100 && (
          <span className="font-semibold text-gold-dark">
            جاهز للإرسال
          </span>
        )}
      </div>
      <Progress
        value={percent}
        className="h-2 bg-muted [&>[data-slot=progress-indicator]]:bg-gold [&>[data-slot=progress-indicator]]:transition-all"
      />
    </div>
  );
}

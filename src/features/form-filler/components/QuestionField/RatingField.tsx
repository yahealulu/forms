"use client";

import { useState } from "react";
import { Controller, type Control } from "react-hook-form";
import { Star } from "lucide-react";
import type { Question } from "@/shared/types";
import type { FormValues } from "../../hooks/useDynamicFormSchema";
import { motionTokens } from "@/styles/design-tokens";
import { cn } from "@/lib/utils";
import { QuestionShell } from "./_QuestionShell";

export interface RatingFieldProps {
  question: Question;
  name: string;
  control: Control<FormValues>;
}

export function RatingField({ question, name, control }: RatingFieldProps) {
  const max = question.maxRating ?? 5;
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const numericValue = Number(field.value);
        const value = Number.isFinite(numericValue) ? numericValue : 0;
        const displayValue = hoverValue ?? value;

        return (
          <QuestionShell question={question} error={fieldState.error}>
            <div
              className="flex items-center gap-1.5"
              role="radiogroup"
              aria-label={question.title}
              onMouseLeave={() => setHoverValue(null)}
            >
              {Array.from({ length: max }, (_, i) => {
                const starValue = i + 1;
                const isActive = starValue <= displayValue;
                return (
                  <button
                    key={starValue}
                    type="button"
                    role="radio"
                    aria-checked={starValue === value}
                    aria-label={`${starValue} من ${max}`}
                    onMouseEnter={() => setHoverValue(starValue)}
                    onFocus={() => setHoverValue(starValue)}
                    onBlur={() => setHoverValue(null)}
                    onClick={() => field.onChange(starValue)}
                    className={cn(
                      "rounded-md p-1 outline-none transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      "hover:scale-110 active:scale-95"
                    )}
                    style={{
                      transitionDuration: `${motionTokens.duration.fast * 1000}ms`,
                    }}
                  >
                    <Star
                      className={cn(
                        "size-7 transition-all",
                        isActive
                          ? "fill-gold text-gold"
                          : "fill-transparent text-muted-foreground/40"
                      )}
                      style={{
                        transitionDuration: `${motionTokens.duration.base * 1000}ms`,
                      }}
                    />
                  </button>
                );
              })}
              <span className="text-xs text-muted-foreground mr-2 min-w-[3rem]">
                {value > 0 ? `${value} / ${max}` : "لم يتم التقييم"}
              </span>
            </div>
          </QuestionShell>
        );
      }}
    />
  );
}

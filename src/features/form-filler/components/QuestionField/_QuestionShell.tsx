"use client";

import type { ReactNode } from "react";
import type { Question } from "@/shared/types";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Internal shared shell that renders the question title (with required
 * asterisk), helper/description text, and the validation error slot.
 * The actual input control is passed as children.
 */
export interface QuestionShellProps {
  question: Question;
  htmlFor?: string;
  error?: { message?: string };
  children: ReactNode;
  helperExtra?: ReactNode;
  className?: string;
}

export function QuestionShell({
  question,
  htmlFor,
  error,
  children,
  helperExtra,
  className,
}: QuestionShellProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-foreground leading-relaxed"
      >
        {question.title}
        {question.required && (
          <span className="text-destructive mr-1" aria-hidden="true">
            *
          </span>
        )}
        {!question.required && (
          <span className="text-muted-foreground text-xs font-normal mr-1">
            (اختياري)
          </span>
        )}
      </Label>

      {question.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {question.description}
        </p>
      )}

      {children}

      {helperExtra}

      {error?.message && (
        <p
          role="alert"
          className="text-xs font-medium text-destructive flex items-center gap-1"
        >
          <span aria-hidden="true">•</span>
          {error.message}
        </p>
      )}
    </div>
  );
}

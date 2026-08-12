"use client";

import * as React from "react";
import { Star, FileText, Paperclip, CalendarDays, Hash } from "lucide-react";
import type { AnswerValue, Question } from "@/shared/types";
import { sanitizeText } from "@/shared/lib/security";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Renders a single answer value according to the question type.
 * All free-text answers (short_text, long_text) are sanitized before rendering.
 *
 * Used by both ResponseDetailSheet and ResponseDetailView to keep rendering
 * consistent and DRY.
 */
export function AnswerDisplay({
  question,
  value,
}: {
  question: Question;
  value: AnswerValue;
}) {
  if (value === null || value === undefined) {
    return <EmptyAnswer />;
  }

  switch (question.type) {
    case "short_text":
    case "long_text": {
      const text = typeof value === "string" ? value : String(value);
      if (!text.trim()) return <EmptyAnswer />;
      const sanitized = sanitizeText(text);
      return question.type === "long_text" ? (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
          {sanitized}
        </p>
      ) : (
        <span className="text-sm text-foreground break-words">{sanitized}</span>
      );
    }

    case "number": {
      const num = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(num)) return <EmptyAnswer />;
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground tabular-nums">
          <Hash className="size-3.5 text-muted-foreground" />
          {num.toLocaleString("ar-EG")}
        </span>
      );
    }

    case "date": {
      const raw = typeof value === "string" ? value : String(value);
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) {
        return <span className="text-sm text-foreground">{raw}</span>;
      }
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
          <CalendarDays className="size-3.5 text-muted-foreground" />
          {d.toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      );
    }

    case "single_choice": {
      const v = typeof value === "string" ? value : String(value);
      const opt = question.options.find((o) => o.value === v || o.label === v);
      if (!opt) return <EmptyAnswer />;
      return (
        <Badge variant="secondary" className="bg-gold/15 text-gold-dark border-gold/20">
          {opt.label}
        </Badge>
      );
    }

    case "multiple_choice": {
      const values = Array.isArray(value) ? (value as string[]) : [];
      if (values.length === 0) return <EmptyAnswer />;
      const labels = question.options
        .filter((o) => values.includes(o.value) || values.includes(o.label))
        .map((o) => o.label);
      if (labels.length === 0) return <EmptyAnswer />;
      return (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label, i) => (
            <Badge
              key={`${label}-${i}`}
              variant="outline"
              className="bg-muted/50 text-foreground"
            >
              {label}
            </Badge>
          ))}
        </div>
      );
    }

    case "rating": {
      const num = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(num)) return <EmptyAnswer />;
      const max = question.maxRating ?? 5;
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: max }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-4 transition-colors",
                  i < num
                    ? "fill-gold text-gold"
                    : "fill-muted text-muted-foreground/40"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {num.toLocaleString("ar-EG")} / {max.toLocaleString("ar-EG")}
          </span>
        </div>
      );
    }

    case "file_upload": {
      const files = Array.isArray(value)
        ? (value as { fileId: string; fileName: string }[])
        : [];
      if (files.length === 0) return <EmptyAnswer />;
      return (
        <div className="flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <Badge
              key={f.fileId ?? `${f.fileName}-${i}`}
              variant="outline"
              className="bg-muted/40 text-foreground gap-1.5"
            >
              <Paperclip className="size-3 text-gold-dark" />
              <span className="max-w-[200px] truncate">{sanitizeText(f.fileName)}</span>
            </Badge>
          ))}
        </div>
      );
    }

    default: {
      // Exhaustive guard — if a new question type is added, this branch surfaces it.
      const _exhaustive: never = question.type;
      void _exhaustive;
      return <EmptyAnswer />;
    }
  }
}

function EmptyAnswer() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground italic">
      <FileText className="size-3" />
      لا توجد إجابة
    </span>
  );
}

/**
 * Compact completion progress bar that grows from the RIGHT in RTL contexts.
 * The shadcn Progress component slides from the left (LTR semantics), so we
 * build a tiny inline variant to match RTL reading direction.
 */
export function CompletionBar({
  value,
  className,
  showLabel = true,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="relative h-2 flex-1 min-w-[60px] overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="absolute inset-y-0 right-0 bg-gold-gradient transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-foreground tabular-nums w-9 text-left">
          {pct.toLocaleString("ar-EG")}%
        </span>
      )}
    </div>
  );
}

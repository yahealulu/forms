"use client";

import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { questionTypeMeta } from "./question-type-meta";
import type { Question, Section } from "@/shared/types";
import { cn } from "@/lib/utils";

export function SectionDragPreview({
  section,
  index,
}: {
  section: Section;
  index: number;
}) {
  return (
    <div
      className={cn(
        "w-[min(100vw-2rem,42rem)] rounded-2xl border bg-card shadow-2xl ring-2 ring-gold/50",
        "cursor-grabbing select-none pointer-events-none",
        section.isRepeatable && "border-gold/30"
      )}
    >
      <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
        <GripVertical className="size-5 text-gold-dark shrink-0" />
        <Badge
          variant="outline"
          className="shrink-0 size-6 justify-center text-[11px] font-normal p-0"
        >
          {index + 1}
        </Badge>
        <span className="flex-1 font-semibold text-base truncate">{section.title}</span>
        <Badge variant="outline" className="shrink-0 text-[11px] font-normal gap-1">
          {section.questions.length} سؤال
        </Badge>
      </div>
    </div>
  );
}

export function QuestionDragPreview({
  question,
  index,
}: {
  question: Question;
  index: number;
}) {
  const meta = questionTypeMeta[question.type];
  const TypeIcon = meta.icon;

  return (
    <div
      className={cn(
        "w-[min(100vw-2rem,40rem)] rounded-xl border bg-card shadow-2xl ring-2 ring-gold/50",
        "cursor-grabbing select-none pointer-events-none"
      )}
    >
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="size-4 text-gold-dark shrink-0" />
        <Badge
          variant="outline"
          className="shrink-0 size-6 justify-center text-[11px] font-normal p-0"
        >
          {index + 1}
        </Badge>
        <TypeIcon className="size-3.5 text-gold-dark shrink-0" />
        <span className="flex-1 font-medium text-sm truncate">{question.title}</span>
        {question.required && (
          <Badge variant="secondary" className="text-[10px] shrink-0">
            إلزامي
          </Badge>
        )}
      </div>
    </div>
  );
}

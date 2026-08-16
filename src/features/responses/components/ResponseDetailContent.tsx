"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Layers,
  Mail,
  CalendarClock,
  User,
  Hash,
  CheckCircle2,
} from "lucide-react";
import type { AnswerValue, Form, FormResponse, Section } from "@/shared/types";
import { motionTokens } from "@/styles/design-tokens";
import { FadeIn } from "@/shared/components/motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AnswerDisplay, CompletionBar } from "./AnswerDisplay";
import { resolveSubmitter } from "../utils/resolveSubmitter";

/**
 * Shared body that renders a FormResponse against the originating Form's
 * structure — used by both ResponseDetailSheet and ResponseDetailView so the
 * rendering stays identical.
 *
 * Layout:
 *   1. Submitter header (name, email, submission date, completion)
 *   2. One block per Section — non-repeatable sections render their Q&A list,
 *      repeatable sections render each instance as a numbered block using the
 *      section's `repeatLabel` (e.g. "مشروع 1", "مشروع 2").
 */
export function ResponseDetailContent({
  form,
  response,
  className,
}: {
  form: Form;
  response: FormResponse;
  className?: string;
}) {
  const submitted = new Date(response.submittedAt);
  const submittedLabel = Number.isNaN(submitted.getTime())
    ? response.submittedAt
    : submitted.toLocaleString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const { name: submitterName, email: submitterEmail } = resolveSubmitter(
    response,
    form
  );

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* Submitter / metadata card */}
      <FadeIn>
        <Card className="p-5 gap-4 bg-gradient-to-br from-gold/5 to-transparent border-gold/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
                <User className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground truncate">
                  {submitterName || "مقدم طلب غير محدد"}
                </h3>
                {submitterEmail && (
                  <a
                    href={`mailto:${submitterEmail}`}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold-dark transition-colors mt-0.5"
                    dir="ltr"
                  >
                    <Mail className="size-3" />
                    {submitterEmail}
                  </a>
                )}
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                  <CalendarClock className="size-3" />
                  {submittedLabel}
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-background/60 border-gold/30 text-gold-dark gap-1.5"
            >
              <CheckCircle2 className="size-3" />
              نسبة الاكتمال: {response.completion.toLocaleString("ar-EG")}%
            </Badge>
          </div>
          <div className="pt-1">
            <CompletionBar value={response.completion} />
          </div>
        </Card>
      </FadeIn>

      {/* Sections — mirror the form's structure */}
      <div className="flex flex-col gap-4">
        {form.sections.map((section, sIdx) => (
          <SectionBlock
            key={section.id}
            section={section}
            response={response}
            index={sIdx}
          />
        ))}
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  response,
  index,
}: {
  section: Section;
  response: FormResponse;
  index: number;
}) {
  const sectionResponse = response.sections.find(
    (sr) => sr.sectionId === section.id
  );
  const instances = sectionResponse?.instances ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.ease.smooth,
        delay: index * 0.05,
      }}
    >
      <Card className="overflow-hidden gap-0 py-0">
        <div className="flex items-center gap-2.5 px-5 py-3.5 bg-muted/40 border-b border-border">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold-dark">
            <Layers className="size-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground truncate">
              {section.title}
            </h4>
            {section.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {section.description}
              </p>
            )}
          </div>
          {section.isRepeatable && (
            <Badge variant="outline" className="ms-auto bg-background text-muted-foreground gap-1">
              <Hash className="size-3" />
              {instances.length.toLocaleString("ar-EG")} {section.repeatLabel || "عنصر"}
            </Badge>
          )}
        </div>

        <div className="flex flex-col">
          {!section.isRepeatable ? (
            <NonRepeatableBody section={section} instance={instances[0]} />
          ) : instances.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-muted-foreground italic">
              لم تتم إضافة أي عنصر في هذا القسم.
            </div>
          ) : (
            instances.map((inst, iIdx) => (
              <RepeatableInstanceBody
                key={inst.instanceId}
                section={section}
                instanceIndex={inst.instanceIndex}
                answers={inst.answers}
                position={iIdx + 1}
                isLast={iIdx === instances.length - 1}
              />
            ))
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function NonRepeatableBody({
  section,
  instance,
}: {
  section: Section;
  instance?: { answers: Record<string, AnswerValue> };
}) {
  if (!instance) {
    return (
      <div className="px-5 py-6 text-center text-sm text-muted-foreground italic">
        لا توجد إجابات في هذا القسم.
      </div>
    );
  }
  return (
    <div className="divide-y divide-border">
      {section.questions.map((q) => (
        <QARow key={q.id} question={q} value={instance.answers[q.id] ?? null} />
      ))}
    </div>
  );
}

function RepeatableInstanceBody({
  section,
  instanceIndex,
  answers,
  position,
  isLast,
}: {
  section: Section;
  instanceIndex: number;
  answers: Record<string, AnswerValue>;
  position: number;
  isLast: boolean;
}) {
  const label = section.repeatLabel || "عنصر";
  return (
    <div className={cn("flex flex-col", !isLast && "border-b border-border")}>
      <div className="flex items-center gap-2 px-5 py-2.5 bg-gold/5">
        <div className="flex size-6 items-center justify-center rounded-md bg-gold text-white text-[11px] font-bold tabular-nums">
          {position.toLocaleString("ar-EG")}
        </div>
        <span className="text-xs font-semibold text-gold-dark">
          {label} {position.toLocaleString("ar-EG")}
        </span>
      </div>
      <div className="divide-y divide-border">
        {section.questions.map((q) => (
          <QARow key={`${q.id}-${instanceIndex}`} question={q} value={answers[q.id] ?? null} />
        ))}
      </div>
    </div>
  );
}

function QARow({
  question,
  value,
}: {
  question: import("@/shared/types").Question;
  value: AnswerValue;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,_1fr)_minmax(0,_1.4fr)] gap-1 sm:gap-4 px-5 py-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-start gap-1.5">
          <span className="text-sm font-medium text-foreground leading-snug break-words">
            {question.title}
          </span>
          {question.required && (
            <span className="text-destructive mt-0.5 text-sm" aria-hidden>*</span>
          )}
        </div>
        {question.description && (
          <span className="text-[11px] text-muted-foreground break-words">
            {question.description}
          </span>
        )}
      </div>
      <div className="text-sm min-w-0 py-0.5">
        <AnswerDisplay question={question} value={value} />
      </div>
    </div>
  );
}

/** A small separator with subtle styling, kept here for parity across views. */
export function DetailSeparator() {
  return <Separator className="bg-border/60" />;
}

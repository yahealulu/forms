"use client";

import { motion } from "framer-motion";
import { useFormContext, type Control } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Form, Section } from "@/shared/types";
import { motionTokens } from "@/styles/design-tokens";
import type { FormValues } from "../hooks/useDynamicFormSchema";
import { QuestionField } from "./QuestionField";
import { RepeatableSectionBlock } from "./RepeatableSectionBlock";

export interface FormRendererProps {
  form: Form;
}

/**
 * FormRenderer — dynamic rendering engine.
 *
 * Iterates over the form sections and renders each as an animated card.
 * - Non-repeatable sections: render each `QuestionField` directly.
 * - Repeatable sections: delegate to `RepeatableSectionBlock`.
 *
 * Each section animates in as it enters the viewport using Framer Motion's
 * `whileInView` (with `once: true` so it doesn't replay on scroll-up).
 */
export function FormRenderer({ form }: FormRendererProps) {
  const { control } = useFormContext<FormValues>();

  const orderedSections = [...form.sections].sort(
    (a, b) => a.order - b.order
  );

  return (
    <div className="space-y-8">
      {orderedSections.map((section, idx) => (
        <motion.section
          key={section.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{
            duration: motionTokens.duration.slow,
            ease: motionTokens.ease.smooth,
            delay: Math.min(idx * 0.03, 0.15),
          }}
          aria-labelledby={`section-${section.id}-title`}
        >
          <SectionBlock section={section} control={control} />
        </motion.section>
      ))}
    </div>
  );
}

interface SectionBlockProps {
  section: Section;
  control: Control<FormValues>;
}

function SectionBlock({ section, control }: SectionBlockProps) {
  if (section.isRepeatable) {
    return (
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle
            id={`section-${section.id}-title`}
            className="text-lg font-bold"
          >
            {section.title}
          </CardTitle>
          {section.description && (
            <CardDescription className="text-muted-foreground">
              {section.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <RepeatableSectionBlock section={section} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle
          id={`section-${section.id}-title`}
          className="text-lg font-bold"
        >
          {section.title}
        </CardTitle>
        {section.description && (
          <CardDescription className="text-muted-foreground">
            {section.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {section.questions.map((q) => (
          <QuestionField
            key={q.id}
            question={q}
            name={`${section.id}.${q.id}`}
            control={control}
          />
        ))}
      </CardContent>
    </Card>
  );
}

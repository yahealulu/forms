"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Section } from "@/shared/types";
import { motionTokens } from "@/styles/design-tokens";
import type { FormValues } from "../hooks/useDynamicFormSchema";
import { QuestionField } from "./QuestionField";

export interface RepeatableSectionBlockProps {
  section: Section;
}

/**
 * RepeatableSectionBlock — uses RHF's `useFieldArray` to manage a list of
 * numbered instance cards. Each instance is a sub-card titled
 * `${repeatLabel} ${index + 1}` (e.g. "مشروع 1").
 *
 * - Delete button appears only on hover/focus of the instance card.
 * - Removing an instance plays a smooth exit animation via AnimatePresence.
 * - "+ إضافة [repeatLabel]" button disables at `maxRepeat` (with tooltip).
 * - `minRepeat` instances are guaranteed on mount.
 */
export function RepeatableSectionBlock({
  section,
}: RepeatableSectionBlockProps) {
  const { control } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: section.id,
  });

  // Safety-net: ensure `minRepeat` instances exist on mount.
  useEffect(() => {
    if (fields.length < Math.max(1, section.minRepeat)) {
      const needed = Math.max(1, section.minRepeat) - fields.length;
      const emptyInstance = buildEmptyInstance(section);
      for (let i = 0; i < needed; i++) {
        append(emptyInstance, { shouldFocus: false });
      }
    }
  }, [section, fields.length, append]);

  const atMax = fields.length >= section.maxRepeat;
  const atMin = fields.length <= Math.max(1, section.minRepeat);

  return (
    <div className="space-y-4">
      <motion.div layout className="space-y-4">
        <AnimatePresence initial={false}>
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              layout
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{
                opacity: 0,
                y: -10,
                height: 0,
                transition: {
                  duration: motionTokens.duration.base,
                  ease: motionTokens.ease.snappy,
                },
              }}
              transition={{
                duration: motionTokens.duration.base,
                ease: motionTokens.ease.smooth,
              }}
              className="group/instance overflow-hidden"
            >
              <Card className="rounded-xl border-border/70 shadow-sm overflow-hidden">
                <CardHeader className="flex-row items-center justify-between gap-2 border-b bg-muted/30 py-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gold/15 px-2 text-xs font-bold text-gold-dark">
                      {index + 1}
                    </span>
                    <span>
                      {section.repeatLabel || "عنصر"} {index + 1}
                    </span>
                  </CardTitle>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover/instance:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        disabled={atMin}
                        onClick={() => remove(index)}
                        aria-label={`حذف ${section.repeatLabel || "عنصر"} ${index + 1}`}
                      >
                        {atMin ? (
                          <Lock className="size-4" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    {atMin ? (
                      <TooltipContent>
                        لا يمكن الحذف — الحد الأدنى المسموح ({section.minRepeat})
                      </TooltipContent>
                    ) : (
                      <TooltipContent>حذف هذا العنصر</TooltipContent>
                    )}
                  </Tooltip>
                </CardHeader>

                <CardContent className="space-y-5 pt-5">
                  {section.questions.map((q) => (
                    <QuestionField
                      key={q.id}
                      question={q}
                      name={`${section.id}.${index}.${q.id}`}
                      control={control}
                    />
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <Tooltip>
        <TooltipTrigger asChild>
          {/* span wrapper so the tooltip works even when the button is disabled */}
          <span className="inline-flex">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={atMax}
              onClick={() => append(buildEmptyInstance(section))}
              className="border-dashed text-gold-dark hover:bg-gold/5 hover:text-gold-dark hover:border-gold/50"
            >
              <Plus className="size-4" />
              إضافة {section.repeatLabel || "عنصر"}
            </Button>
          </span>
        </TooltipTrigger>
        {atMax && (
          <TooltipContent>
            لقد وصلت إلى الحد الأقصى المسموح ({section.maxRepeat})
          </TooltipContent>
        )}
      </Tooltip>

      <p className="text-xs text-muted-foreground">
        العدد الحالي: {fields.length} — الحد الأدنى: {section.minRepeat}، الحد
        الأقصى: {section.maxRepeat}
      </p>
    </div>
  );
}

function buildEmptyInstance(section: Section): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const q of section.questions) {
    if (q.type === "multiple_choice" || q.type === "file_upload") {
      obj[q.id] = [];
    } else {
      obj[q.id] = "";
    }
  }
  return obj;
}

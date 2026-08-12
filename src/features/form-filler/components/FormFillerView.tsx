"use client";

import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Send, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useForm as useFormDefinition } from "@/features/forms-management/hooks/useForms";
import { useSubmitFormResponse } from "@/features/responses/hooks/useResponses";
import { useUIStore } from "@/stores/useUIStore";
import { motionTokens } from "@/styles/design-tokens";
import { Logo } from "@/shared/components/layout/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandLoader } from "@/shared/components/BrandLoader";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import type {
  AnswerValue,
  Form,
  FormResponse,
  RepeatableInstance,
  SectionResponse,
} from "@/shared/types";
import {
  buildDefaultValues,
  useDynamicFormSchema,
  type FormValues,
} from "../hooks/useDynamicFormSchema";
import { ProgressIndicator } from "./ProgressIndicator";
import { FormRenderer } from "./FormRenderer";
import { SubmitSuccessAnimation } from "./SubmitSuccessAnimation";

export interface FormFillerViewProps {
  formId: string;
  /** admin = builder preview (drafts OK). public = share link (published only). */
  mode?: "admin" | "public";
}

export function FormFillerView({ formId, mode = "admin" }: FormFillerViewProps) {
  const { data: form, isLoading, isError } = useFormDefinition(formId);
  const submitMutation = useSubmitFormResponse(formId);
  const [submitted, setSubmitted] = useState(false);
  const setView = useUIStore((s) => s.setView);
  const isPublic = mode === "public";

  // The dynamic Zod schema for this form.
  const schema = useDynamicFormSchema(form);

  // Default values for RHF — only rebuild when the form definition changes.
  const defaultValues = useMemo(
    () => (form ? buildDefaultValues(form) : {}),
    [form]
  );

  const methods = useForm<FormValues>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode: "onTouched",
  });

  // Reset default values when the form definition arrives / changes.
  useEffect(() => {
    if (form) {
      methods.reset(buildDefaultValues(form));
    }
  }, [form, methods]);

  // Loading state
  if (isLoading) {
    return (
      <BrandLoader variant="page" label="جارٍ تحميل الاستمارة..." />
    );
  }

  // Not-found / unavailable: public blocks draft+archived; admin preview allows drafts
  const isUnavailable =
    isError ||
    !form ||
    form.status === "archived" ||
    (isPublic && form.status !== "published");

  if (isUnavailable) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center p-6">
        <Alert className="max-w-md border-destructive/30 bg-card">
          <AlertCircle className="text-destructive" />
          <AlertTitle className="text-foreground font-semibold">
            {isPublic ? "النموذج غير متاح" : "تعذّر فتح الاستمارة"}
          </AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {isPublic
              ? "هذا النموذج غير منشور أو لم يعد متاحاً للتعبئة."
              : "النموذج غير موجود أو لم يعد متاحاً."}
          </AlertDescription>
          {!isPublic && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 w-fit"
              onClick={() => setView({ name: "dashboard" })}
            >
              <ArrowRight className="size-4 rtl-flip" />
              العودة للوحة التحكم
            </Button>
          )}
        </Alert>
      </div>
    );
  }

  // ── Submit handler ──────────────────────────────────────────────────────
  const onSubmit = methods.handleSubmit(async (values) => {
    if (submitMutation.isPending) return;
    const payload = transformToFormResponse(values, form);
    try {
      await submitMutation.mutateAsync(payload);
      setSubmitted(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "حدث خطأ أثناء الإرسال.";
      toast.error("تعذّر إرسال الاستمارة", { description: message });
    }
  });

  // Disable the button for the entire submit lifecycle (validation +
  // network). RHF's `isSubmitting` covers the validation+handler window;
  // the mutation's `isPending` covers the network window. Both must be
  // false for the button to be enabled — this prevents double submission.
  const isSubmitting = methods.formState.isSubmitting || submitMutation.isPending;

  return (
    <FormProvider {...methods}>
      <div className="relative flex min-h-screen flex-col bg-pattern-dots">
        {/* Simplified public header */}
        <PublicHeader form={form} />

        {/* Main content */}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-32 pt-6 sm:px-6">
          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionTokens.duration.base,
              ease: motionTokens.ease.smooth,
            }}
            className="mb-6"
          >
            <Card className="rounded-xl border-border/60 shadow-sm">
              <CardContent className="py-4">
                <ProgressIndicator form={form} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Sections */}
          <FormRenderer form={form} />
        </main>

        {/* Sticky submit bar */}
        <SubmitBar isSubmitting={isSubmitting} onSubmit={onSubmit} />

        {/* Success overlay */}
        {submitted && (
          <SubmitSuccessAnimation
            mode={mode}
            onDismiss={() => setSubmitted(false)}
          />
        )}
      </div>
    </FormProvider>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function PublicHeader({ form }: { form: Form }) {
  return (
    <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-5 sm:px-6">
        <Logo size={48} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">
            {form.entityName}
          </p>
          <h1 className="text-lg font-bold text-foreground leading-tight sm:text-xl">
            {form.title}
          </h1>
        </div>
      </div>
      {form.description && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {form.description}
          </p>
        </div>
      )}
    </header>
  );
}

function SubmitBar({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="text-xs text-muted-foreground hidden sm:block">
          بالضغط على «إرسال الاستمارة» فإنك تؤكد صحة المعلومات المُدخلة.
        </p>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{
            duration: motionTokens.duration.fast,
            ease: motionTokens.ease.snappy,
          }}
          className="mr-auto sm:mr-0"
        >
          <Button
            type="button"
            size="lg"
            disabled={isSubmitting}
            onClick={onSubmit}
            className="bg-gold-gradient text-white hover:opacity-90 shadow-sm min-w-[180px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                جارٍ الإرسال…
              </>
            ) : (
              <>
                <Send className="size-4 rtl-flip" />
                إرسال الاستمارة
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Transform the RHF form values into the API's `FormResponse["sections"]`
 * shape. Each non-repeatable section becomes a single instance at index 0;
 * each repeatable section maps its array entries to instances.
 */
function transformToFormResponse(
  values: FormValues,
  form: Form
): Partial<FormResponse> {
  const sections: SectionResponse[] = form.sections.map((section) => {
    if (section.isRepeatable) {
      const instances = (values[section.id] as FormValues[]) ?? [];
      const mapped: RepeatableInstance[] = instances.map((inst, index) => ({
        instanceId: safeUUID(),
        instanceIndex: index,
        answers: sanitizeAnswers(inst ?? {}, section),
      }));
      return { sectionId: section.id, instances: mapped };
    }

    const answers = sanitizeAnswers(
      (values[section.id] as FormValues) ?? {},
      section
    );
    return {
      sectionId: section.id,
      instances: [
        {
          instanceId: safeUUID(),
          instanceIndex: 0,
          answers,
        },
      ],
    };
  });

  return { sections };
}

/**
 * Strip out empty-string values for optional fields so they don't pollute the
 * stored answers, and coerce `number` / `rating` answers from their input
 * string form into actual numbers (the HTML input always returns a string).
 */
function sanitizeAnswers(
  raw: FormValues,
  section: Form["sections"][number]
): Record<string, AnswerValue> {
  const out: Record<string, AnswerValue> = {};
  for (const q of section.questions) {
    const v = raw[q.id];
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;

    if (q.type === "number" || q.type === "rating") {
      const coerced = Number(v);
      out[q.id] = Number.isFinite(coerced) ? coerced : (v as AnswerValue);
      continue;
    }

    out[q.id] = v as AnswerValue;
  }
  return out;
}

function safeUUID(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `inst-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

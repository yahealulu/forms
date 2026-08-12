"use client";

import * as React from "react";
import {
  ArrowRight,
  FileText,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { useForm } from "@/features/forms-management/hooks/useForms";
import { useFormResponse } from "../hooks/useResponses";
import { useUIStore } from "@/stores/useUIStore";
import { FadeIn } from "@/shared/components/motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/shared/components/BrandLoader";
import { ResponseDetailContent } from "./ResponseDetailContent";

/**
 * Full-page view of a single response. Mirrors the same structured body used
 * by ResponseDetailSheet — the only difference is the surrounding chrome
 * (full-width container, back button to the responses list).
 */
export function ResponseDetailView({
  formId,
  responseId,
}: {
  formId: string;
  responseId: string;
}) {
  const setView = useUIStore((s) => s.setView);
  const { data: form, isLoading: formLoading } = useForm(formId);
  const {
    data: response,
    isLoading: responseLoading,
    isError,
  } = useFormResponse(formId, responseId);

  const loading = formLoading || responseLoading;

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-sidebar/40 to-background">
        <div className="px-6 py-6 max-w-5xl mx-auto w-full">
          <FadeIn>
            <div className="flex items-center gap-3 mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                onClick={() => setView({ name: "responses", formId })}
                aria-label="العودة إلى الاستجابات"
                title="العودة إلى الاستجابات"
              >
                <ArrowRight className="size-4 rtl-flip" />
              </Button>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground tracking-tight truncate">
                  {form?.title ?? (formLoading ? "…" : "—")}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تفاصيل الاستجابة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setView({ name: "responses", formId })}
              >
                <ArrowRight className="size-4 rtl-flip" />
                العودة إلى الاستجابات
              </Button>
              {response && (
                <Badge
                  variant="outline"
                  className="bg-gold/10 border-gold/30 text-gold-dark gap-1"
                >
                  <Inbox className="size-3" />
                  معرّف: {response.id.slice(0, 8)}
                </Badge>
              )}
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-6 max-w-5xl mx-auto w-full">
        {loading ? (
          <BrandLoader variant="section" label="جارٍ تحميل تفاصيل الاستجابة..." />
        ) : isError || !response || !form ? (
          <NotFoundState onBack={() => setView({ name: "responses", formId })} />
        ) : (
          <ResponseDetailContent form={form} response={response} />
        )}
      </div>
    </div>
  );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-destructive/10 mb-5">
        <AlertCircle className="size-10 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        الاستجابة غير موجودة
      </h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">
        قد تكون هذه الاستجابة محذوفة أو أن المعرف غير صحيح. يمكنك العودة إلى
        قائمة الاستجابات لمتابعة المراجعة.
      </p>
      <Button onClick={onBack} variant="outline" className="gap-2">
        <ArrowRight className="size-4 rtl-flip" />
        العودة إلى الاستجابات
      </Button>
    </FadeIn>
  );
}

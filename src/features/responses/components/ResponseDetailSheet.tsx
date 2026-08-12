"use client";

import * as React from "react";
import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, FileQuestion, AlertCircle } from "lucide-react";
import { useForm } from "@/features/forms-management/hooks/useForms";
import { useFormResponse } from "../hooks/useResponses";
import { useUIStore } from "@/stores/useUIStore";
import { BrandLoader } from "@/shared/components/BrandLoader";
import { ResponseDetailContent } from "./ResponseDetailContent";

/**
 * Side Sheet that renders the full response detail. Slides in from the LEFT
 * (the trailing edge in RTL) which is the conventional side for detail panels
 * in right-to-left interfaces.
 */
export function ResponseDetailSheet({
  formId,
  responseId,
  open,
  onOpenChange,
}: {
  formId: string;
  responseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setView = useUIStore((s) => s.setView);
  const { data: form, isLoading: formLoading } = useForm(formId);
  const {
    data: response,
    isLoading: responseLoading,
    isError,
  } = useFormResponse(formId, responseId ?? "");

  // Close on Escape is handled natively by Radix; we additionally guard
  // against the responseId being null while open.
  useEffect(() => {
    if (open && !responseId) {
      onOpenChange(false);
    }
  }, [open, responseId, onOpenChange]);

  const loading = formLoading || responseLoading;

  const handleOpenFull = () => {
    if (!responseId) return;
    onOpenChange(false);
    // Defer view switch so the sheet close animation can start smoothly.
    setTimeout(() => {
      setView({ name: "response-detail", formId, responseId });
    }, 120);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-[640px] p-0 flex flex-col gap-0"
      >
        <SheetHeader className="px-5 py-4 border-b border-border bg-gradient-to-b from-gold/5 to-transparent">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-base font-semibold text-foreground">
                تفاصيل الاستجابة
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                {form?.title ?? "—"}
              </SheetDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={handleOpenFull}
              disabled={!responseId}
            >
              <ExternalLink className="size-3.5" />
              فتح في صفحة كاملة
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 py-5">
            {loading ? (
              <BrandLoader variant="compact" label="جارٍ تحميل التفاصيل..." />
            ) : isError || !response || !form ? (
              <NotFoundState />
            ) : (
              <ResponseDetailContent form={form} response={response} />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 mb-3">
        <AlertCircle className="size-7 text-destructive" />
      </div>
      <p className="text-sm font-medium text-foreground">
        تعذر تحميل الاستجابة
      </p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
        قد تكون الاستجابة محذوفة أو أن هناك مشكلة في الاتصال. حاول مرة أخرى لاحقاً.
      </p>
      <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
        <FileQuestion className="size-3" />
        معرّف الاستجابة غير صالح أو غير موجود
      </div>
    </div>
  );
}

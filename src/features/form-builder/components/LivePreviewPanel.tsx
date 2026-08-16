"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Star,
  Calendar,
  Upload,
  Hash,
  Type as TypeIcon,
  AlignRight,
  CircleDot,
  CheckSquare,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { layoutTokens } from "@/styles/design-tokens";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/features/form-builder/store/useBuilderStore";
import type { Form, Question, Section } from "@/shared/types";

interface LivePreviewPanelProps {
  open: boolean;
  onToggle: () => void;
}

const PREVIEW_DEBOUNCE_MS = 400;

export function LivePreviewPanel({ open, onToggle }: LivePreviewPanelProps) {
  const [snapshot, setSnapshot] = useState<Form | null>(() =>
    useBuilderStore.getState().assembleForm()
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const unsub = useBuilderStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSnapshot(useBuilderStore.getState().assembleForm());
      }, PREVIEW_DEBOUNCE_MS);
    });
    setSnapshot(useBuilderStore.getState().assembleForm());
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  const form = snapshot;

  if (!open) {
    return (
      <div className="shrink-0 hidden lg:flex">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="m-2 gap-2"
          aria-label="إظهار المعاينة المباشرة"
        >
          <Eye className="size-4 text-gold-dark" />
          معاينة مباشرة
        </Button>
      </div>
    );
  }

  return (
    <aside
      className="shrink-0 border-l border-border bg-muted/20 overflow-hidden hidden lg:block"
      aria-label="معاينة مباشرة"
      style={{ width: layoutTokens.previewPanelWidth }}
    >
      <div className="h-full flex flex-col" style={{ width: layoutTokens.previewPanelWidth }}>
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-gold-dark" />
            <span className="text-sm font-semibold text-foreground">معاينة مباشرة</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onToggle}
            aria-label="إخفاء المعاينة"
          >
            <EyeOff className="size-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4" dir="rtl">
            {!form ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                جارٍ تجهيز المعاينة...
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-background border border-border p-4">
                  <h3 className="font-bold text-base text-foreground leading-tight">
                    {form.title || "نموذج بلا عنوان"}
                  </h3>
                  {form.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {form.description}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2 inline-flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-gold-dark/60" />
                    {form.entityName}
                  </p>
                </div>

                {form.sections.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    أضف قسماً واحداً على الأقل لرؤية المعاينة.
                  </div>
                ) : (
                  form.sections.map((section, idx) => (
                    <PreviewSection key={section.id} section={section} index={idx} />
                  ))
                )}

                <div className="pt-2">
                  <Button className="w-full gap-2 builder-cta-accent" disabled>
                    <ChevronLeft className="size-4 rtl-flip" />
                    إرسال النموذج
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    هذه المعاينة غير تفاعلية — للتعبئة الفعلية استخدم زر «معاينة».
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}

function PreviewSection({ section, index }: { section: Section; index: number }) {
  return (
    <div className="rounded-xl bg-background border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Badge
          variant="outline"
          className="size-6 justify-center text-[11px] font-normal text-muted-foreground p-0"
        >
          {index + 1}
        </Badge>
        <h4 className="font-semibold text-sm text-foreground">{section.title}</h4>
        {section.isRepeatable && (
          <Badge variant="secondary" className="text-[10px] gap-1">
            قابل للتكرار ({section.minRepeat}–{section.maxRepeat})
          </Badge>
        )}
      </div>

      {section.questions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">لا توجد أسئلة في هذا القسم.</p>
      ) : (
        <div className="space-y-3">
          {section.questions.map((q, i) => (
            <PreviewQuestion key={q.id} question={q} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewQuestion({ question, index }: { question: Question; index: number }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
        <span className="text-muted-foreground">{index + 1}.</span>
        <span className="truncate">{question.title || "سؤال بلا نص"}</span>
        {question.required && <span className="text-destructive">*</span>}
      </Label>
      <PreviewInput question={question} />
    </div>
  );
}

function PreviewInput({ question }: { question: Question }) {
  switch (question.type) {
    case "single_choice":
      return (
        <div className="flex flex-col gap-1.5 pt-0.5">
          {(question.options ?? []).length === 0 ? (
            <p className="text-[11px] text-muted-foreground/70 italic">لا توجد خيارات</p>
          ) : (
            question.options.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 text-xs text-foreground cursor-default"
              >
                <span className="flex size-4 items-center justify-center rounded-full border border-border">
                  <CircleDot className="size-3 text-muted-foreground/50" />
                </span>
                {opt.label}
              </label>
            ))
          )}
        </div>
      );
    case "multiple_choice":
      return (
        <div className="flex flex-col gap-1.5 pt-0.5">
          {(question.options ?? []).length === 0 ? (
            <p className="text-[11px] text-muted-foreground/70 italic">لا توجد خيارات</p>
          ) : (
            question.options.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 text-xs text-foreground cursor-default"
              >
                <span className="flex size-4 items-center justify-center rounded border border-border">
                  <CheckSquare className="size-3 text-muted-foreground/50" />
                </span>
                {opt.label}
              </label>
            ))
          )}
        </div>
      );
    case "short_text":
      return (
        <div className="relative">
          <TypeIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input
            disabled
            placeholder={question.placeholder || "إجابة قصيرة"}
            className="h-8 pr-8 text-xs bg-muted/30"
          />
        </div>
      );
    case "long_text":
      return (
        <div className="relative">
          <AlignRight className="absolute right-2.5 top-2 size-3.5 text-muted-foreground/50" />
          <Textarea
            disabled
            placeholder={question.placeholder || "إجابة مفصّلة..."}
            className="min-h-[60px] pr-8 text-xs bg-muted/30 resize-none"
          />
        </div>
      );
    case "number":
      return (
        <div className="relative">
          <Hash className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input
            disabled
            type="number"
            placeholder={question.placeholder || "0"}
            className="h-8 pr-8 text-xs bg-muted/30"
          />
          {(question.min !== undefined || question.max !== undefined) && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {question.min !== undefined && `الحد الأدنى: ${question.min}`}
              {question.min !== undefined && question.max !== undefined && " · "}
              {question.max !== undefined && `الحد الأقصى: ${question.max}`}
            </p>
          )}
        </div>
      );
    case "date":
      return (
        <div className="relative">
          <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input
            disabled
            type="text"
            placeholder="يوم / شهر / سنة"
            className="h-8 pr-8 text-xs bg-muted/30"
          />
        </div>
      );
    case "file_upload":
      return (
        <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-[11px] text-muted-foreground/70">
          <Upload className="size-3.5" />
          <span>
            {(question.allowedExtensions ?? []).join("، ") || "أي ملف"}
            {question.maxFileSizeMB ? ` — حتى ${question.maxFileSizeMB}MB` : ""}
          </span>
        </div>
      );
    case "rating": {
      const max = question.maxRating ?? 5;
      return (
        <div className="flex items-center gap-1 pt-1">
          {Array.from({ length: max }).map((_, i) => (
            <Star
              key={i}
              className={cn("size-5 text-gold-dark/40", i === 0 && "fill-gold/30")}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ms-2">من 1 إلى {max}</span>
        </div>
      );
    }
    default:
      return null;
  }
}

"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Layers, ListChecks, Plus, Save } from "lucide-react";
import { useForm } from "@/features/forms-management/hooks/useForms";
import {
  getTargetSectionId,
  useBuilderStore,
} from "@/features/form-builder/store/useBuilderStore";
import { useUIStore } from "@/stores/useUIStore";
import { BuilderToolbar } from "./BuilderToolbar";
import { SectionList } from "./SectionList";
import { LivePreviewPanel } from "./LivePreviewPanel";
import { questionTypeMeta, questionTypeOrder } from "./question-type-meta";
import { FadeIn } from "@/shared/components/motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/shared/components/BrandLoader";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import type { QuestionType } from "@/shared/types";

interface FormBuilderViewProps {
  formId: string;
}

export function FormBuilderView({ formId }: FormBuilderViewProps) {
  const setView = useUIStore((s) => s.setView);
  const { data: form, isLoading, isError, error } = useForm(formId);
  const initialized = useBuilderStore((s) => s.initialized);
  const dirty = useBuilderStore((s) => s.dirty);

  const [previewOpen, setPreviewOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (form && !useBuilderStore.getState().dirty) {
      useBuilderStore.getState().init(form);
    }
  }, [form]);

  useEffect(() => {
    return () => useBuilderStore.getState().reset();
  }, [formId]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  if (isLoading) {
    return <BrandLoader variant="page" label="جارٍ تحميل محرر النموذج..." />;
  }

  if (isError || !form) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <p className="text-sm text-destructive mb-3">
            {error?.message || "تعذّر تحميل النموذج"}
          </p>
          <Button
            variant="outline"
            onClick={() => setView({ name: "dashboard" })}
            className="gap-2"
          >
            <ArrowRight className="size-4 rtl-flip" />
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return <BrandLoader variant="page" label="جارٍ تحميل محرر النموذج..." />;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="form-builder-root flex flex-1 min-h-0">
        <PalettePanel className="hidden lg:flex" />

        <div className="flex-1 min-w-0 flex flex-col">
          <BuilderToolbar
            formId={formId}
            onOpenPalette={() => setPaletteOpen(true)}
          />

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
              <CanvasSummary />
              <SectionList />
            </div>
          </div>
        </div>

        <LivePreviewPanel
          open={previewOpen}
          onToggle={() => setPreviewOpen((v) => !v)}
        />
      </div>

      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent side="right" className="form-builder-root w-[280px] sm:max-w-[280px] p-0">
          <SheetHeader className="px-4 pt-5 pb-3">
            <SheetTitle>العناصر</SheetTitle>
            <SheetDescription>
              أضف قسماً أو اضغط نوع سؤال لإضافته فوراً.
            </SheetDescription>
          </SheetHeader>
          <PaletteBody onAdded={() => setPaletteOpen(false)} showAddSection />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}

function CanvasSummary() {
  const entityName = useBuilderStore((s) => s.form?.entityName ?? "");
  const description = useBuilderStore((s) => s.form?.description ?? "");
  const sectionCount = useBuilderStore((s) => s.sectionOrder.length);
  const questionCount = useBuilderStore((s) =>
    Object.values(s.questionOrderBySection).reduce((acc, ids) => acc + ids.length, 0)
  );

  return (
    <FadeIn className="mb-5">
      <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
          <Layers className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{entityName}</span>
            <Badge variant="outline" className="text-[11px] font-normal gap-1">
              <ListChecks className="size-3" />
              {sectionCount} أقسام
            </Badge>
            <Badge variant="outline" className="text-[11px] font-normal gap-1">
              {questionCount} سؤال
            </Badge>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </FadeIn>
  );
}

function PalettePanel({ className }: { className?: string }) {
  return (
    <aside
      className={`w-[220px] shrink-0 border-r border-border bg-muted/20 flex flex-col ${className ?? ""}`}
      aria-label="لوحة العناصر"
    >
      <div className="p-3 border-b border-border bg-background">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          إضافة
        </h3>
        <Button
          onClick={() => useBuilderStore.getState().addSection()}
          className="w-full gap-2 builder-cta"
          size="sm"
        >
          <Plus className="size-4" />
          إضافة قسم
        </Button>
      </div>
      <PaletteBody />
    </aside>
  );
}

function addTypedQuestion(type: QuestionType) {
  const store = useBuilderStore.getState();
  let sectionId = getTargetSectionId();
  if (!sectionId) {
    sectionId = store.addSection();
  }
  if (!sectionId) return;
  store.addQuestion(sectionId, type);
  toast.success(`أُضيف سؤال: ${questionTypeMeta[type].label}`);
}

function PaletteBody({
  onAdded,
  showAddSection = false,
}: {
  onAdded?: () => void;
  showAddSection?: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        أنواع الأسئلة
      </h4>
      {showAddSection && (
        <div className="lg:hidden mb-3">
          <Button
            onClick={() => {
              useBuilderStore.getState().addSection();
              onAdded?.();
            }}
            variant="outline"
            className="w-full gap-2"
            size="sm"
          >
            <Plus className="size-4" />
            إضافة قسم
          </Button>
        </div>
      )}
      <ul className="flex flex-col gap-1.5">
        {questionTypeOrder.map((t) => {
          const meta = questionTypeMeta[t];
          const Icon = meta.icon;
          return (
            <li key={t}>
              <button
                type="button"
                onClick={() => {
                  addTypedQuestion(t);
                  onAdded?.();
                }}
                className="w-full flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2 hover:border-gold/40 hover:bg-gold/5 transition-colors cursor-pointer text-start"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gold/10 text-gold-dark">
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground leading-tight">
                    {meta.label}
                  </p>
                  {meta.hasOptions && (
                    <p className="text-[10px] text-muted-foreground">ذو خيارات</p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-lg bg-gold/5 border border-gold/20 p-3">
        <div className="flex items-center gap-1.5 mb-1 text-gold-dark">
          <Save className="size-3.5" />
          <span className="text-[11px] font-semibold">حفظ يدوي</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          التعديلات تبقى محلية حتى تضغط «حفظ». الأسهم تعيد الترتيب فوراً. الحذف يمكن
          التراجع عنه من الإشعار.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowRight,
  Eye,
  Inbox,
  Layers,
  ListChecks,
  Plus,
  Rocket,
  Save,
  Wand2,
} from "lucide-react";
import { useForm, useUpdateForm } from "@/features/forms-management/hooks/useForms";
import {
  useCreateSection,
  useReorderSections,
  useReorderQuestions,
} from "@/features/form-builder/hooks/useFormBuilder";
import { useAdjustableState } from "@/features/form-builder/hooks/useAdjustableState";
import { useUIStore } from "@/stores/useUIStore";
import { SectionCard } from "./SectionCard";
import { LivePreviewPanel } from "./LivePreviewPanel";
import { questionTypeMeta, questionTypeOrder } from "./question-type-meta";
import { FadeIn } from "@/shared/components/motion";
import { motionTokens } from "@/styles/design-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrandLoader } from "@/shared/components/BrandLoader";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
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
import type { Form, FormStatus } from "@/shared/types";

interface FormBuilderViewProps {
  formId: string;
}

const statusBadge: Record<FormStatus, { label: string; className: string }> = {
  draft: { label: "مسودة", className: "bg-secondary text-secondary-foreground" },
  published: { label: "منشور", className: "bg-gold-dark text-white" },
  archived: { label: "مؤرشف", className: "bg-muted text-muted-foreground" },
};

/**
 * FormBuilderView — the admin's interactive canvas for building a form.
 *
 * Three-zone layout (RTL):
 *   - Element palette on the RIGHT (narrow, sticky).
 *   - Build canvas in the center (scrollable, sortable sections).
 *   - Live preview on the LEFT (collapsible).
 *
 * Top toolbar: inline-editable form title, status badge, and quick actions
 * (preview filler, responses, save & publish).
 */
export function FormBuilderView({ formId }: FormBuilderViewProps) {
  const setView = useUIStore((s) => s.setView);
  const { data: form, isLoading, isError, error } = useForm(formId);
  const updateForm = useUpdateForm(formId);
  const createSection = useCreateSection();
  const reorderSections = useReorderSections(formId);
  const reorderQuestions = useReorderQuestions(formId);

  const [title, setTitle] = useAdjustableState(form?.title ?? "");
  const [previewOpen, setPreviewOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sectionIds = useMemo(
    () => (form?.sections ?? []).map((s) => s.id),
    [form?.sections]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const activeId = String(active.id);
      const overId = String(over.id);

      // Section reorder?
      if (sectionIds.includes(activeId) && sectionIds.includes(overId)) {
        const oldIndex = sectionIds.indexOf(activeId);
        const newIndex = sectionIds.indexOf(overId);
        const reordered = arrayMove(sectionIds, oldIndex, newIndex);
        reorderSections.mutate(reordered, {
          onError: (e) => toast.error(e.message || "تعذّر تحديث الترتيب"),
        });
        return;
      }

      // Question reorder (within same section only).
      if (!form) return;
      for (const sec of form.sections) {
        const qIds = sec.questions.map((q) => q.id);
        if (qIds.includes(activeId) && qIds.includes(overId)) {
          const oldIndex = qIds.indexOf(activeId);
          const newIndex = qIds.indexOf(overId);
          const reordered = arrayMove(qIds, oldIndex, newIndex);
          reorderQuestions.mutate(
            { sectionId: sec.id, orderedIds: reordered },
            {
              onError: (e) => toast.error(e.message || "تعذّر تحديث ترتيب الأسئلة"),
            }
          );
          return;
        }
      }
    },
    [sectionIds, form, reorderSections, reorderQuestions]
  );

  const commitTitle = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(form?.title ?? "");
      toast.error("لا يمكن أن يكون عنوان النموذج فارغاً");
      return;
    }
    if (trimmed !== form?.title) {
      updateForm.mutate({ title: trimmed });
    }
  };

  const handleAddSection = () => {
    createSection.mutate(
      {
        formId,
        data: {
          title: `قسم ${((form?.sections.length ?? 0) + 1).toString()}`,
          isRepeatable: false,
        },
      },
      {
        onError: (e) => toast.error(e.message || "تعذّر إضافة القسم"),
      }
    );
  };

  const handlePublish = () => {
    if (!form) return;
    if (form.sections.length === 0) {
      toast.error("لا يمكن نشر نموذج بدون أقسام");
      return;
    }
    const hasEmptySection = form.sections.some((s) => s.questions.length === 0);
    if (hasEmptySection) {
      toast.error("لا يمكن نشر نموذج يحتوي على أقسام فارغة");
      return;
    }
    updateForm.mutate(
      { status: "published" },
      {
        onSuccess: () => toast.success("تم نشر النموذج بنجاح"),
        onError: (e) => toast.error(e.message || "تعذّر نشر النموذج"),
      }
    );
  };

  if (isLoading) {
    return (
      <BrandLoader variant="page" label="جارٍ تحميل محرر النموذج..." />
    );
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

  const status = statusBadge[form.status];

  return (
    <TooltipProvider delayDuration={200}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 min-h-0">
          {/* Right palette (lg+) */}
          <PalettePanel
            className="hidden lg:flex"
            onAddSection={handleAddSection}
            addingSection={createSection.isPending}
          />

          {/* Mobile palette trigger (in toolbar) */}

          {/* Center canvas */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Toolbar */}
            <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
              <div className="px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView({ name: "dashboard" })}
                  className="gap-1.5 shrink-0"
                >
                  <ArrowRight className="size-4 rtl-flip" />
                  <span className="hidden sm:inline">رجوع</span>
                </Button>

                {/* Mobile palette trigger */}
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0 lg:hidden"
                  onClick={() => setPaletteOpen(true)}
                  aria-label="العناصر"
                >
                  <Wand2 className="size-4 text-gold-dark" />
                </Button>

                <div className="h-6 w-px bg-border shrink-0" />

                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="flex-1 min-w-0 max-w-md h-9 font-semibold text-base border-transparent hover:border-input focus-visible:border-input bg-transparent px-2"
                  placeholder="عنوان النموذج"
                />

                <Badge className={`shrink-0 gap-1 ${status.className}`}>
                  {status.label}
                </Badge>

                <div className="flex-1" />

                <div className="flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setView({ name: "filler", formId })}
                        className="gap-1.5"
                      >
                        <Eye className="size-4 text-gold-dark" />
                        <span className="hidden sm:inline">معاينة</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">معاينة التعبئة</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setView({ name: "responses", formId })}
                        className="gap-1.5"
                      >
                        <Inbox className="size-4" />
                        <span className="hidden sm:inline">الاستجابات</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">عرض الاستجابات</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={handlePublish}
                        disabled={updateForm.isPending || form.status === "published"}
                        className="gap-1.5 bg-gold-dark text-white hover:bg-gold-dark/90"
                      >
                        <Rocket className="size-4" />
                        <span className="hidden sm:inline">
                          {form.status === "published" ? "منشور" : "حفظ ونشر"}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {form.status === "published"
                        ? "النموذج منشور بالفعل"
                        : "نشر النموذج لتلقي الاستجابات"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Scrollable canvas */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
                {/* Form summary band */}
                <FadeIn className="mb-5">
                  <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
                      <Layers className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {form.entityName}
                        </span>
                        <Badge variant="outline" className="text-[11px] font-normal gap-1">
                          <ListChecks className="size-3" />
                          {form.sections.length} أقسام
                        </Badge>
                        <Badge variant="outline" className="text-[11px] font-normal gap-1">
                          {form.sections.reduce((acc, s) => acc + s.questions.length, 0)} سؤال
                        </Badge>
                      </div>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                          {form.description}
                        </p>
                      )}
                    </div>
                  </div>
                </FadeIn>

                {/* Sections list (sortable) */}
                {form.sections.length === 0 ? (
                  <EmptyState onAddSection={handleAddSection} />
                ) : (
                  <SortableContext
                    items={sectionIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <motion.div
                      layout
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: {},
                        visible: {
                          transition: { staggerChildren: motionTokens.stagger.cards },
                        },
                      }}
                      className="flex flex-col gap-4"
                    >
                      <AnimatePresence initial={false}>
                        {form.sections.map((section, idx) => (
                          <SectionCard
                            key={section.id}
                            formId={formId}
                            section={section}
                            index={idx}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </SortableContext>
                )}

                {/* Footer add-section (always visible) */}
                <div className="mt-5">
                  <Button
                    variant="outline"
                    onClick={handleAddSection}
                    disabled={createSection.isPending}
                    className="w-full gap-2 border-dashed border-2 text-gold-dark hover:bg-gold/5 hover:border-gold"
                  >
                    <Plus className="size-4" />
                    إضافة قسم
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Left preview (lg+, collapsible) */}
          <LivePreviewPanel
            form={form}
            open={previewOpen}
            onToggle={() => setPreviewOpen((v) => !v)}
          />
        </div>
      </DndContext>

      {/* Mobile palette sheet */}
      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent side="right" className="w-[280px] sm:max-w-[280px] p-0">
          <SheetHeader className="px-4 pt-5 pb-3 text-right">
            <SheetTitle className="text-right">العناصر</SheetTitle>
            <SheetDescription className="text-right">
              أضف قسماً جديداً أو تعرّف على أنواع الأسئلة.
            </SheetDescription>
          </SheetHeader>
          <PaletteBody
            onAddSection={() => {
              handleAddSection();
              setPaletteOpen(false);
            }}
            addingSection={createSection.isPending}
          />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}

// ── Palette ──

interface PalettePanelProps {
  className?: string;
  onAddSection: () => void;
  addingSection: boolean;
}

function PalettePanel({ className, onAddSection, addingSection }: PalettePanelProps) {
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
          onClick={onAddSection}
          disabled={addingSection}
          className="w-full gap-2 bg-gold-dark text-white hover:bg-gold-dark/90"
          size="sm"
        >
          <Plus className="size-4" />
          إضافة قسم
        </Button>
      </div>
      <PaletteBody onAddSection={onAddSection} addingSection={addingSection} />
    </aside>
  );
}

function PaletteBody({
  onAddSection,
  addingSection,
}: {
  onAddSection: () => void;
  addingSection: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        أنواع الأسئلة
      </h4>
      <div className="lg:hidden mb-3">
        <Button
          onClick={onAddSection}
          disabled={addingSection}
          variant="outline"
          className="w-full gap-2"
          size="sm"
        >
          <Plus className="size-4" />
          إضافة قسم
        </Button>
      </div>
      <ul className="flex flex-col gap-1.5">
        {questionTypeOrder.map((t) => {
          const meta = questionTypeMeta[t];
          const Icon = meta.icon;
          return (
            <li
              key={t}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2 hover:border-gold/40 hover:bg-gold/5 transition-colors cursor-default"
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
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-lg bg-gold/5 border border-gold/20 p-3">
        <div className="flex items-center gap-1.5 mb-1 text-gold-dark">
          <Save className="size-3.5" />
          <span className="text-[11px] font-semibold">حفظ تلقائي</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          تُحفظ التغييرات تلقائياً عند التعديل. استخدم زر «حفظ ونشر» لتفعيل النموذج
          وتلقي الاستجابات.
        </p>
      </div>
    </div>
  );
}

// ── Empty state ──

function EmptyState({ onAddSection }: { onAddSection: () => void }) {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-gold/10 mb-5">
        <Layers className="size-10 text-gold-dark" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">ابدأ بإضافة قسم</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">
        لا توجد أقسام بعد. أضف قسماً أول ثم ابدأ ببناء أسئلة النموذج. يمكنك لاحقاً
        تكرار الأقسام لمتطلبات مثل «عدة مشاريع».
      </p>
      <Button
        onClick={onAddSection}
        className="gap-2 animate-attention-pulse"
        size="lg"
      >
        <Plus className="size-4" />
        إضافة القسم الأول
      </Button>
    </FadeIn>
  );
}


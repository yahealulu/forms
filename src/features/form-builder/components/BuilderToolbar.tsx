"use client";

import { useSaveFormTree, useUpdateForm } from "@/features/forms-management/hooks/useForms";
import { useBuilderStore } from "@/features/form-builder/store/useBuilderStore";
import { useUIStore } from "@/stores/useUIStore";
import { useAdjustableState } from "@/features/form-builder/hooks/useAdjustableState";
import {
  ArrowRight,
  Eye,
  Inbox,
  Link2,
  Rocket,
  Save,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { copyPublicFormUrl } from "@/shared/lib/public-form-url";
import type { FormStatus } from "@/shared/types";

const statusBadge: Record<FormStatus, { label: string; className: string }> = {
  draft: { label: "مسودة", className: "bg-secondary text-secondary-foreground" },
  published: { label: "منشور", className: "bg-[var(--builder-accent)] text-white" },
  archived: { label: "مؤرشف", className: "bg-muted text-muted-foreground" },
};

interface BuilderToolbarProps {
  formId: string;
  onOpenPalette: () => void;
}

export function BuilderToolbar({ formId, onOpenPalette }: BuilderToolbarProps) {
  const setView = useUIStore((s) => s.setView);
  const updateForm = useUpdateForm(formId);
  const saveTree = useSaveFormTree(formId);

  const dirty = useBuilderStore((s) => s.dirty);
  const title = useBuilderStore((s) => s.form?.title ?? "");
  const status = useBuilderStore((s) => s.form?.status ?? "draft");
  const [localTitle, setLocalTitle] = useAdjustableState(title);

  const isSaving = saveTree.isPending || updateForm.isPending;
  const badge = statusBadge[status];

  const persistDraft = (onSaved?: () => void) => {
    const store = useBuilderStore.getState();
    const trimmed = localTitle.trim();
    if (!trimmed) {
      toast.error("لا يمكن أن يكون عنوان النموذج فارغاً");
      return;
    }
    if (trimmed !== store.form?.title) {
      store.patchForm({ title: trimmed });
    }
    const payload = useBuilderStore.getState().toTreePayload();
    if (!payload) return;
    saveTree.mutate({ ...payload, title: trimmed }, {
      onSuccess: (saved) => {
        useBuilderStore.getState().init(saved);
        onSaved?.();
      },
      onError: (e) => toast.error(e.message || "تعذّر حفظ النموذج"),
    });
  };

  const commitTitle = () => {
    const trimmed = localTitle.trim();
    if (!trimmed) {
      toast.error("لا يمكن أن يكون عنوان النموذج فارغاً");
      setLocalTitle(title);
      return;
    }
    if (trimmed !== title) {
      useBuilderStore.getState().patchForm({ title: trimmed });
    }
  };

  const handleCopyPublicLink = async () => {
    try {
      await copyPublicFormUrl(formId);
      toast.success("تم نسخ رابط النموذج");
    } catch {
      toast.error("تعذّر نسخ الرابط");
    }
  };

  const publishForm = () => {
    updateForm.mutate(
      { status: "published" },
      {
        onSuccess: () => {
          toast.success("تم نشر النموذج بنجاح", {
            action: {
              label: "نسخ الرابط",
              onClick: () => {
                void handleCopyPublicLink();
              },
            },
          });
        },
        onError: (e) => toast.error(e.message || "تعذّر نشر النموذج"),
      }
    );
  };

  const handlePublish = () => {
    const store = useBuilderStore.getState();
    if (store.sectionOrder.length === 0) {
      toast.error("لا يمكن نشر نموذج بدون أقسام");
      return;
    }
    const hasEmpty = store.sectionOrder.some(
      (id) => (store.questionOrderBySection[id] ?? []).length === 0
    );
    if (hasEmpty) {
      toast.error("لا يمكن نشر نموذج يحتوي على أقسام فارغة");
      return;
    }
    if (store.dirty) {
      persistDraft(() => publishForm());
      return;
    }
    publishForm();
  };

  return (
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

        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 lg:hidden"
          onClick={onOpenPalette}
          aria-label="العناصر"
        >
          <Wand2 className="size-4 text-gold-dark" />
        </Button>

        <div className="h-6 w-px bg-border shrink-0" />

        <Input
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="flex-1 min-w-[12rem] sm:min-w-[16rem] max-w-2xl h-10 font-semibold text-base md:text-lg leading-snug border-transparent hover:border-input focus-visible:border-input bg-transparent px-3"
          placeholder="عنوان النموذج"
          aria-label="عنوان النموذج"
        />

        <Badge className={`shrink-0 gap-1 ${badge.className}`}>{badge.label}</Badge>

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
                variant={dirty ? "default" : "outline"}
                size="sm"
                onClick={() => persistDraft(() => toast.success("تم حفظ النموذج"))}
                disabled={!dirty || isSaving}
                className="gap-1.5 builder-cta"
              >
                <Save className="size-4" />
                <span className="hidden sm:inline">
                  {saveTree.isPending ? "جارٍ الحفظ..." : dirty ? "حفظ" : "محفوظ"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">حفظ كل التعديلات دفعة واحدة</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={isSaving || status === "published"}
                className="gap-1.5 builder-cta-accent"
              >
                <Rocket className="size-4" />
                <span className="hidden sm:inline">
                  {status === "published" ? "منشور" : "حفظ ونشر"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {status === "published"
                ? "النموذج منشور بالفعل"
                : "حفظ ثم نشر النموذج لتلقي الاستجابات"}
            </TooltipContent>
          </Tooltip>

          {status === "published" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPublicLink}
                  className="gap-1.5 min-h-9"
                  aria-label="نسخ رابط النموذج المنشور"
                >
                  <Link2 className="size-4 text-gold-dark" />
                  <span className="hidden sm:inline">نسخ الرابط</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">نسخ رابط التعبئة العام</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

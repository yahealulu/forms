"use client";

import { memo, useState } from "react";
import {
  Plus,
  Trash2,
  Repeat,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdjustableState } from "@/features/form-builder/hooks/useAdjustableState";
import { useBuilderStore } from "@/features/form-builder/store/useBuilderStore";
import { toastUndo } from "@/features/form-builder/lib/toastUndo";
import { QuestionRow } from "./QuestionRow";
import { RepeatableSectionSettings } from "./RepeatableSectionSettings";
import { ReorderButtons } from "./ReorderButtons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Section } from "@/shared/types";

interface SectionCardProps {
  sectionId: string;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const SectionCard = memo(function SectionCard({
  sectionId,
  index,
  canMoveUp,
  canMoveDown,
}: SectionCardProps) {
  const section = useBuilderStore((s) => s.sectionsById[sectionId]);
  const questionIds = useBuilderStore(
    (s) => s.questionOrderBySection[sectionId] ?? EMPTY_IDS
  );
  const expanded = useBuilderStore((s) => s.expandedSectionIds.includes(sectionId));

  const [title, setTitle] = useAdjustableState(section?.title ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!section) return null;

  const commitTitle = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(section.title);
      toast.error("لا يمكن أن يكون عنوان القسم فارغاً");
      return;
    }
    if (trimmed !== section.title) {
      useBuilderStore.getState().patchSection(sectionId, { title: trimmed });
    }
  };

  const handleRepeatableToggle = (checked: boolean) => {
    useBuilderStore.getState().patchSection(sectionId, { isRepeatable: checked });
  };

  const handleRepeatableChange = (
    patch: Partial<Pick<Section, "minRepeat" | "maxRepeat" | "repeatLabel">>
  ) => {
    useBuilderStore.getState().patchSection(sectionId, patch);
  };

  const runDelete = () => {
    const snap = useBuilderStore.getState().deleteSection(sectionId);
    if (!snap) return;
    toastUndo("تم حذف القسم", () => {
      useBuilderStore.getState().restoreSection(snap);
    });
  };

  const handleDelete = () => {
    if (questionIds.length > 0) {
      setConfirmOpen(true);
      return;
    }
    runDelete();
  };

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card shadow-sm overflow-hidden builder-card",
        section.isRepeatable && "border-gold/30"
      )}
    >
      <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
        <ReorderButtons
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={() => useBuilderStore.getState().moveSection(sectionId, -1)}
          onMoveDown={() => useBuilderStore.getState().moveSection(sectionId, 1)}
          upLabel="نقل القسم للأعلى"
          downLabel="نقل القسم للأسفل"
        />

        <Badge
          variant="outline"
          className="shrink-0 size-6 justify-center text-[11px] font-normal text-muted-foreground p-0"
        >
          {index + 1}
        </Badge>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => useBuilderStore.getState().setActiveSection(sectionId)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="flex-1 h-9 min-w-[8rem] font-semibold text-base border-transparent hover:border-input focus-visible:border-input bg-transparent"
          placeholder="عنوان القسم"
        />

        <Badge variant="outline" className="shrink-0 text-[11px] font-normal gap-1">
          {questionIds.length} سؤال
        </Badge>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                قابل للتكرار
              </span>
              <Switch
                checked={section.isRepeatable}
                onCheckedChange={handleRepeatableToggle}
                aria-label="تفعيل القسم القابل للتكرار"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            {section.isRepeatable ? "قسم قابل للتكرار" : "قسم عادي"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              onClick={() => useBuilderStore.getState().duplicateSection(sectionId)}
              aria-label="نسخ القسم"
            >
              <Copy className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">نسخ القسم</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              onClick={() => useBuilderStore.getState().toggleSectionExpanded(sectionId)}
              aria-label={expanded ? "طي" : "توسيع"}
            >
              {expanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {expanded ? "طي القسم" : "توسيع القسم"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              aria-label="حذف القسم"
            >
              <Trash2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">حذف القسم</TooltipContent>
        </Tooltip>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="sm:max-w-[420px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-destructive" />
              حذف القسم
            </AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف القسم «{section.title}» وجميع أسئلته ({questionIds.length} سؤال).
              يمكنك التراجع من الإشعار بعد الحذف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={runDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RepeatableSectionSettings
        isRepeatable={section.isRepeatable}
        minRepeat={section.minRepeat}
        maxRepeat={section.maxRepeat}
        repeatLabel={section.repeatLabel}
        onChange={handleRepeatableChange}
      />

      {expanded && (
        <div className="p-4 pt-3">
          {questionIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-3 text-center border border-dashed border-border rounded-xl">
              <Repeat className="size-6 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                لا توجد أسئلة في هذا القسم بعد.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {questionIds.map((qid, i) => (
                <QuestionRow
                  key={qid}
                  questionId={qid}
                  index={i}
                  canMoveUp={i > 0}
                  canMoveDown={i < questionIds.length - 1}
                />
              ))}
            </div>
          )}

          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => useBuilderStore.getState().addQuestion(sectionId)}
              className="w-full gap-2 border-dashed border-2 text-gold-dark hover:bg-gold/5 hover:border-gold"
            >
              <Plus className="size-4" />
              إضافة سؤال
            </Button>
          </div>
        </div>
      )}
    </article>
  );
});

const EMPTY_IDS: string[] = [];

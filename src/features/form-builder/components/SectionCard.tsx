"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Trash2,
  Repeat,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useCreateQuestion,
  useUpdateSection,
  useDeleteSection,
} from "@/features/form-builder/hooks/useFormBuilder";
import { useAdjustableState } from "@/features/form-builder/hooks/useAdjustableState";
import { QuestionEditor } from "./QuestionEditor";
import { RepeatableSectionSettings } from "./RepeatableSectionSettings";
import { motionTokens } from "@/styles/design-tokens";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Section } from "@/shared/types";

interface SectionCardProps {
  formId: string;
  section: Section;
  index: number;
  isDragActive?: boolean;
}

/**
 * SectionCard — a dnd-kit sortable card representing one section.
 *
 * Header: drag handle, inline-editable title, "repeatable" Switch, delete
 * (with hover confirmation). When `isRepeatable` is true, smoothly expands the
 * `RepeatableSectionSettings` (min/max + repeatLabel).
 *
 * Body: list of `QuestionEditor`s (each sortable within the section) plus an
 * "إضافة سؤال" button at the bottom with the `animate-attention-pulse` class.
 */
export function SectionCard({
  formId,
  section,
  index,
  isDragActive = false,
}: SectionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const updateSection = useUpdateSection(formId);
  const deleteSection = useDeleteSection(formId);
  const createQuestion = useCreateQuestion(formId);

  const [title, setTitle] = useAdjustableState(section.title);
  const [collapsed, setCollapsed] = useState(false);

  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const commitTitle = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(section.title);
      toast.error("لا يمكن أن يكون عنوان القسم فارغاً");
      return;
    }
    if (trimmed !== section.title) {
      updateSection.mutate({ sectionId: section.id, patch: { title: trimmed } });
    }
  };

  const handleRepeatableToggle = (checked: boolean) => {
    updateSection.mutate({
      sectionId: section.id,
      patch: { isRepeatable: checked },
    });
  };

  const handleRepeatableChange = (
    patch: Partial<Pick<Section, "minRepeat" | "maxRepeat" | "repeatLabel">>
  ) => {
    updateSection.mutate({ sectionId: section.id, patch });
  };

  const handleAddQuestion = () => {
    createQuestion.mutate(
      {
        sectionId: section.id,
        data: {
          title: "سؤال جديد",
          type: "short_text",
          required: false,
        },
      },
      {
        onError: (e) => toast.error(e.message || "تعذّر إضافة السؤال"),
      }
    );
  };

  const handleDelete = () => {
    deleteSection.mutate(section.id, {
      onError: (e) => toast.error(e.message || "تعذّر حذف القسم"),
    });
  };

  const questionIds = section.questions.map((q) => q.id);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!isDragActive}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.smooth }}
      whileHover={isDragActive || isDragging ? undefined : { y: -2 }}
      className={cn(
        "rounded-2xl border bg-card shadow-sm overflow-hidden",
        "transition-shadow hover:shadow-md",
        isDragging && "shadow-none ring-2 ring-gold/20 border-dashed",
        section.isRepeatable && "border-gold/30"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
        <button
          type="button"
          className={cn(
            "flex items-center justify-center w-6 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors",
            "touch-none rounded-md hover:bg-muted"
          )}
          aria-label="اسحب لإعادة ترتيب الأقسام"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-5" />
        </button>

        <Badge
          variant="outline"
          className="shrink-0 size-6 justify-center text-[11px] font-normal text-muted-foreground p-0"
        >
          {index + 1}
        </Badge>

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
          className="flex-1 h-9 min-w-[8rem] font-semibold text-base md:text-base border-transparent hover:border-input focus-visible:border-input bg-transparent"
          placeholder="عنوان القسم"
        />

        <Badge variant="outline" className="shrink-0 text-[11px] font-normal gap-1">
          {section.questions.length} سؤال
        </Badge>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2.5 shrink-0 cursor-default">
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
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "توسيع" : "طي"}
            >
              {collapsed ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronUp className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {collapsed ? "توسيع القسم" : "طي القسم"}
          </TooltipContent>
        </Tooltip>

        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label="حذف القسم"
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">حذف القسم</TooltipContent>
          </Tooltip>
          <AlertDialogContent className="sm:max-w-[420px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="size-5 text-destructive" />
                حذف القسم
              </AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف القسم «{section.title}» وجميع أسئلته
                ({section.questions.length} سؤال) نهائياً. لا يمكن التراجع عن هذا
                الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteSection.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteSection.isPending ? "جارٍ الحذف..." : "حذف"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Repeatable settings (animated) */}
      <RepeatableSectionSettings
        isRepeatable={section.isRepeatable}
        minRepeat={section.minRepeat}
        maxRepeat={section.maxRepeat}
        repeatLabel={section.repeatLabel}
        onChange={handleRepeatableChange}
      />

      {/* Body — questions */}
      {!collapsed && (
        <div className="p-4 pt-3">
          {section.questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-3 text-center border border-dashed border-border rounded-xl">
              <Repeat className="size-6 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                لا توجد أسئلة في هذا القسم بعد.
              </p>
            </div>
          ) : (
            <SortableContext
              items={questionIds}
              strategy={verticalListSortingStrategy}
            >
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: motionTokens.stagger.list },
                  },
                }}
                className="flex flex-col gap-2"
              >
                {section.questions.map((q, i) => (
                  <QuestionEditor
                    key={q.id}
                    formId={formId}
                    question={q}
                    index={i}
                    isDragActive={isDragActive}
                  />
                ))}
              </motion.div>
            </SortableContext>
          )}

          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddQuestion}
              disabled={createQuestion.isPending}
              className="w-full gap-2 border-dashed border-2 text-gold-dark hover:bg-gold/5 hover:border-gold animate-attention-pulse"
            >
              <Plus className="size-4" />
              إضافة سؤال
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  ListChecks,
  Settings2,
  Hash,
  Star,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  useUpdateQuestion,
  useDeleteQuestion,
} from "@/features/form-builder/hooks/useFormBuilder";
import { useAdjustableState } from "@/features/form-builder/hooks/useAdjustableState";
import { OptionsManager } from "./OptionsManager";
import { questionTypeMeta, questionTypeOrder } from "./question-type-meta";
import { motionTokens } from "@/styles/design-tokens";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Question, QuestionType } from "@/shared/types";

interface QuestionEditorProps {
  formId: string;
  question: Question;
  index: number;
}

/**
 * QuestionEditor — a dnd-kit sortable row representing a single question.
 *
 * Includes: drag handle, type Select (with icon), inline title editing,
 * required toggle, "خيارات" popover (for choice types), type-specific config
 * (file_upload / rating / number), and a hover-confirmation delete button.
 */
export function QuestionEditor({ formId, question, index }: QuestionEditorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const updateQuestion = useUpdateQuestion(formId);
  const deleteQuestion = useDeleteQuestion(formId);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
  };

  const meta = questionTypeMeta[question.type];
  const TypeIcon = meta.icon;
  const isChoice = meta.hasOptions;

  const [title, setTitle] = useAdjustableState(question.title);
  const [showConfig, setShowConfig] = useState(false);

  const commitTitle = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(question.title);
      toast.error("لا يمكن أن يكون نص السؤال فارغاً");
      return;
    }
    if (trimmed !== question.title) {
      updateQuestion.mutate({ questionId: question.id, patch: { title: trimmed } });
    }
  };

  const handleTypeChange = (next: QuestionType) => {
    if (next === question.type) return;
    updateQuestion.mutate({ questionId: question.id, patch: { type: next } });
  };

  const handleRequiredToggle = (checked: boolean) => {
    updateQuestion.mutate({
      questionId: question.id,
      patch: { required: checked },
    });
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.smooth }}
      className={cn(
        "group relative rounded-xl border bg-card shadow-sm",
        "transition-shadow hover:shadow-md",
        isDragging && "shadow-lg ring-2 ring-gold/40"
      )}
    >
      <div className="flex items-stretch gap-2 p-3">
        {/* Drag handle */}
        <button
          type="button"
          className={cn(
            "flex items-center justify-center w-6 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors",
            "touch-none rounded-md hover:bg-muted"
          )}
          aria-label="اسحب لإعادة الترتيب"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <div className="flex flex-col flex-1 min-w-0 gap-2.5">
          {/* Top row: index + type select + title */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="shrink-0 size-6 justify-center text-[11px] font-normal text-muted-foreground p-0"
            >
              {index + 1}
            </Badge>

            <Select value={question.type} onValueChange={handleTypeChange}>
              <SelectTrigger
                size="sm"
                className="h-8 w-[150px] shrink-0 gap-1.5"
                aria-label="نوع السؤال"
              >
                <TypeIcon className="size-3.5 text-gold-dark" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questionTypeOrder.map((t) => {
                  const M = questionTypeMeta[t];
                  const Icon = M.icon;
                  return (
                    <SelectItem key={t} value={t}>
                      <Icon className="size-3.5 text-gold-dark" />
                      <span>{M.label}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

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
              placeholder="اكتب نص السؤال هنا..."
              className="flex-1 h-8 min-w-0 font-medium"
            />

            {/* Required toggle */}
            <div className="flex items-center gap-1.5 shrink-0 ps-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-default">
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      إلزامي
                    </span>
                    <Switch
                      checked={question.required}
                      onCheckedChange={handleRequiredToggle}
                      aria-label="سؤال إلزامي"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {question.required ? "سؤال إلزامي" : "سؤال اختياري"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Bottom row: type-specific actions */}
          <div className="flex items-center gap-1.5 flex-wrap ps-8">
            {isChoice ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                  >
                    <ListChecks className="size-3.5 text-gold-dark" />
                    خيارات
                    {question.options.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ms-0.5 px-1 py-0 text-[10px] h-4"
                      >
                        {question.options.length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[440px] p-4">
                  <OptionsManager
                    formId={formId}
                    questionId={question.id}
                    options={question.options}
                  />
                </DialogContent>
              </Dialog>
            ) : null}

            {/* Type-specific config */}
            {question.type === "file_upload" && (
              <FileUploadConfig
                formId={formId}
                question={question}
                open={showConfig}
                onOpenChange={setShowConfig}
              />
            )}
            {question.type === "rating" && (
              <RatingConfig
                formId={formId}
                question={question}
                open={showConfig}
                onOpenChange={setShowConfig}
              />
            )}
            {question.type === "number" && (
              <NumberConfig
                formId={formId}
                question={question}
                open={showConfig}
                onOpenChange={setShowConfig}
              />
            )}

            {(question.type === "file_upload" ||
              question.type === "rating" ||
              question.type === "number") && (
              <Button
                variant={showConfig ? "secondary" : "ghost"}
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setShowConfig((v) => !v)}
              >
                <Settings2 className="size-3.5" />
                {showConfig ? "إخفاء الإعدادات" : "إعدادات"}
              </Button>
            )}

            <div className="flex-1" />

            {/* Delete */}
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label="حذف السؤال"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">حذف السؤال</TooltipContent>
              </Tooltip>
              <AlertDialogContent className="sm:max-w-[420px]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Trash2 className="size-5 text-destructive" />
                    حذف السؤال
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف السؤال «{question.title}» نهائياً. لا يمكن التراجع
                    عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      deleteQuestion.mutate(question.id, {
                        onError: (e) =>
                          toast.error(e.message || "تعذّر حذف السؤال"),
                      })
                    }
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    حذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Type-specific config panels ──

interface ConfigPanelProps {
  formId: string;
  question: Question;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function FileUploadConfig({ formId, question, open }: ConfigPanelProps) {
  const updateQuestion = useUpdateQuestion(formId);
  const [exts, setExts] = useAdjustableState(
    (question.allowedExtensions ?? []).join(", ")
  );
  const [maxSize, setMaxSize] = useAdjustableState<string>(
    question.maxFileSizeMB?.toString() ?? "5"
  );

  if (!open) return null;

  const commit = () => {
    const list = exts
      .split(",")
      .map((s) => s.trim().replace(/^\./, "").toLowerCase())
      .filter(Boolean);
    updateQuestion.mutate({
      questionId: question.id,
      patch: {
        allowedExtensions: list,
        maxFileSizeMB: Number(maxSize) || 5,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.smooth }}
      className="w-full ps-8 pe-0 overflow-hidden"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-2 pt-1">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            الامتدادات المسموحة (افصل بفواصل)
          </Label>
          <div className="relative">
            <Upload className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={exts}
              onChange={(e) => setExts(e.target.value)}
              onBlur={commit}
              placeholder="pdf, jpg, png"
              className="h-8 pr-8 text-xs"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">
            الحد الأقصى (MB)
          </Label>
          <Input
            type="number"
            min={1}
            value={maxSize}
            onChange={(e) => setMaxSize(e.target.value)}
            onBlur={commit}
            className="h-8 text-xs"
          />
        </div>
      </div>
    </motion.div>
  );
}

function RatingConfig({ formId, question, open }: ConfigPanelProps) {
  const updateQuestion = useUpdateQuestion(formId);
  const [maxRating, setMaxRating] = useAdjustableState<string>(
    question.maxRating?.toString() ?? "5"
  );

  if (!open) return null;

  const commit = () => {
    const v = Number(maxRating);
    updateQuestion.mutate({
      questionId: question.id,
      patch: { maxRating: Number.isFinite(v) && v > 0 ? Math.min(10, Math.max(1, Math.floor(v))) : 5 },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.smooth }}
      className="w-full ps-8 pe-0 overflow-hidden"
    >
      <div className="flex items-end gap-3 pt-1">
        <div className="space-y-1 w-32">
          <Label className="text-[11px] text-muted-foreground">
            الحد الأقصى للتقييم
          </Label>
          <div className="relative">
            <Star className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gold-dark" />
            <Input
              type="number"
              min={1}
              max={10}
              value={maxRating}
              onChange={(e) => setMaxRating(e.target.value)}
              onBlur={commit}
              className="h-8 pr-8 text-xs"
            />
          </div>
        </div>
        <div className="flex items-center gap-0.5 pb-1">
          {Array.from({ length: Math.min(10, Number(maxRating) || 5) }).map((_, i) => (
            <Star key={i} className="size-3.5 text-gold-dark fill-gold/30" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function NumberConfig({ formId, question, open }: ConfigPanelProps) {
  const updateQuestion = useUpdateQuestion(formId);
  const [min, setMin] = useAdjustableState<string>(question.min?.toString() ?? "");
  const [max, setMax] = useAdjustableState<string>(question.max?.toString() ?? "");

  if (!open) return null;

  const commit = () => {
    const minNum = min.trim() === "" ? undefined : Number(min);
    const maxNum = max.trim() === "" ? undefined : Number(max);
    updateQuestion.mutate({
      questionId: question.id,
      patch: {
        min: minNum,
        max: maxNum,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.smooth }}
      className="w-full ps-8 pe-0 overflow-hidden"
    >
      <div className="grid grid-cols-2 gap-2 pt-1 max-w-sm">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">الحد الأدنى</Label>
          <div className="relative">
            <Hash className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="number"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              onBlur={commit}
              placeholder="بدون"
              className="h-8 pr-8 text-xs"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">الحد الأقصى</Label>
          <div className="relative">
            <Hash className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="number"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              onBlur={commit}
              placeholder="بدون"
              className="h-8 pr-8 text-xs"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

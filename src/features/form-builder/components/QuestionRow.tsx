"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
  Trash2,
  ListChecks,
  Settings2,
  Hash,
  Star,
  Upload,
  Copy,
  ChevronDown,
  ChevronUp,
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
import { useAdjustableState } from "@/features/form-builder/hooks/useAdjustableState";
import { useBuilderStore } from "@/features/form-builder/store/useBuilderStore";
import { toastUndo } from "@/features/form-builder/lib/toastUndo";
import { OptionsManager } from "./OptionsManager";
import { questionTypeMeta, questionTypeOrder } from "./question-type-meta";
import { ReorderButtons } from "./ReorderButtons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Question, QuestionType } from "@/shared/types";

interface QuestionRowProps {
  questionId: string;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const QuestionRow = memo(function QuestionRow({
  questionId,
  index,
  canMoveUp,
  canMoveDown,
}: QuestionRowProps) {
  const question = useBuilderStore((s) => s.questionsById[questionId]);
  const lastAddedQuestionId = useBuilderStore((s) => s.lastAddedQuestionId);
  const [title, setTitle] = useAdjustableState(question?.title ?? "");
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lastAddedQuestionId !== questionId) return;
    inputRef.current?.focus();
    inputRef.current?.select();
    useBuilderStore.setState({ lastAddedQuestionId: null });
  }, [lastAddedQuestionId, questionId]);

  if (!question) return null;

  const meta = questionTypeMeta[question.type];
  const TypeIcon = meta.icon;
  const isChoice = meta.hasOptions;
  const hasConfig =
    question.type === "file_upload" ||
    question.type === "rating" ||
    question.type === "number";

  const commitTitle = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(question.title);
      toast.error("لا يمكن أن يكون نص السؤال فارغاً");
      return;
    }
    if (trimmed !== question.title) {
      useBuilderStore.getState().patchQuestion(questionId, { title: trimmed });
    }
  };

  const handleTypeChange = (next: QuestionType) => {
    if (next === question.type) return;
    useBuilderStore.getState().patchQuestion(questionId, { type: next });
    if (questionTypeMeta[next].hasOptions || hasConfig) setExpanded(true);
  };

  const handleDelete = () => {
    const snap = useBuilderStore.getState().deleteQuestion(questionId);
    if (!snap) return;
    toastUndo("تم حذف السؤال", () => {
      useBuilderStore.getState().restoreQuestion(snap);
    });
  };

  return (
    <div className={cn("group relative rounded-xl border bg-card shadow-sm builder-card")}>
      <div className="flex items-stretch gap-2 p-3">
        <ReorderButtons
          compact
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={() => useBuilderStore.getState().moveQuestion(questionId, -1)}
          onMoveDown={() => useBuilderStore.getState().moveQuestion(questionId, 1)}
          upLabel="نقل السؤال للأعلى"
          downLabel="نقل السؤال للأسفل"
        />

        <div className="flex flex-col flex-1 min-w-0 gap-2">
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
              ref={inputRef}
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
              className="flex-1 h-9 min-w-[8rem] font-medium text-sm md:text-base"
            />

            <div className="flex items-center shrink-0 ps-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                      إلزامي
                    </span>
                    <Switch
                      checked={question.required}
                      onCheckedChange={(checked) =>
                        useBuilderStore.getState().patchQuestion(questionId, {
                          required: checked,
                        })
                      }
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

          <div className="flex items-center gap-1.5 flex-wrap ps-8">
            {isChoice && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
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
                  <OptionsManager questionId={questionId} />
                </DialogContent>
              </Dialog>
            )}

            {(isChoice || hasConfig) && (
              <Button
                variant={expanded ? "secondary" : "ghost"}
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setExpanded((v) => !v)}
              >
                {hasConfig ? (
                  <Settings2 className="size-3.5" />
                ) : expanded ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
                {expanded ? "إخفاء" : "إعدادات"}
              </Button>
            )}

            <div className="flex-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  onClick={() => useBuilderStore.getState().duplicateQuestion(questionId)}
                  aria-label="نسخ السؤال"
                >
                  <Copy className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">نسخ السؤال</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  aria-label="حذف السؤال"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">حذف السؤال</TooltipContent>
            </Tooltip>
          </div>

          {expanded && hasConfig && (
            <div className="ps-8">
              {question.type === "file_upload" && (
                <FileUploadConfig question={question} />
              )}
              {question.type === "rating" && <RatingConfig question={question} />}
              {question.type === "number" && <NumberConfig question={question} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function FileUploadConfig({ question }: { question: Question }) {
  const [exts, setExts] = useAdjustableState(
    (question.allowedExtensions ?? []).join(", ")
  );
  const [maxSize, setMaxSize] = useAdjustableState<string>(
    question.maxFileSizeMB?.toString() ?? "5"
  );

  const commit = () => {
    const list = exts
      .split(",")
      .map((s) => {
        const cleaned = s.trim().replace(/^\./, "").toLowerCase();
        return cleaned ? `.${cleaned}` : "";
      })
      .filter(Boolean);
    useBuilderStore.getState().patchQuestion(question.id, {
      allowedExtensions: list,
      maxFileSizeMB: Number(maxSize) || 5,
    });
  };

  return (
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
        <Label className="text-[11px] text-muted-foreground">الحد الأقصى (MB)</Label>
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
  );
}

function RatingConfig({ question }: { question: Question }) {
  const [maxRating, setMaxRating] = useAdjustableState<string>(
    question.maxRating?.toString() ?? "5"
  );

  const commit = () => {
    const v = Number(maxRating);
    useBuilderStore.getState().patchQuestion(question.id, {
      maxRating:
        Number.isFinite(v) && v > 0 ? Math.min(10, Math.max(1, Math.floor(v))) : 5,
    });
  };

  return (
    <div className="flex items-end gap-3 pt-1">
      <div className="space-y-1 w-32">
        <Label className="text-[11px] text-muted-foreground">الحد الأقصى للتقييم</Label>
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
  );
}

function NumberConfig({ question }: { question: Question }) {
  const [min, setMin] = useAdjustableState<string>(question.min?.toString() ?? "");
  const [max, setMax] = useAdjustableState<string>(question.max?.toString() ?? "");

  const commit = () => {
    const minNum = min.trim() === "" ? undefined : Number(min);
    const maxNum = max.trim() === "" ? undefined : Number(max);
    useBuilderStore.getState().patchQuestion(question.id, {
      min: minNum,
      max: maxNum,
    });
  };

  return (
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
  );
}

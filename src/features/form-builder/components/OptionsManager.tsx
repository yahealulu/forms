"use client";

import { memo, useState } from "react";
import { ListPlus, Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExcelImportDropzone } from "./ExcelImportDropzone";
import { useBuilderStore } from "@/features/form-builder/store/useBuilderStore";
import { toastUndo } from "@/features/form-builder/lib/toastUndo";
import { toast } from "sonner";
import type { Option } from "@/shared/types";

interface OptionsManagerProps {
  questionId: string;
}

export function OptionsManager({ questionId }: OptionsManagerProps) {
  const [newLabel, setNewLabel] = useState("");
  const options = useBuilderStore(
    (s) => s.questionsById[questionId]?.options ?? EMPTY_OPTIONS
  );

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) {
      toast.error("يرجى إدخال نص الخيار");
      return;
    }
    useBuilderStore.getState().addOption(questionId, trimmed);
    setNewLabel("");
  };

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      <div className="flex items-center gap-2 pe-1">
        <ListPlus className="size-4 shrink-0 text-gold-dark" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">الخيارات</span>
        <Badge variant="outline" className="text-[11px] font-normal shrink-0">
          {options.length} خيار
        </Badge>
      </div>

      <ScrollArea className="max-h-72 w-full rounded-lg border border-border bg-card/50">
        <div className="p-2 min-w-0">
          {options.length === 0 ? (
            <div className="text-center py-8 px-3">
              <p className="text-xs text-muted-foreground">
                لا توجد خيارات بعد. أضف خياراً يدوياً أو استورد من Excel.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {options.map((opt) => (
                <OptionRow key={opt.id} option={opt} questionId={questionId} />
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="نص الخيار الجديد..."
          className="flex-1 h-9"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={!newLabel.trim()}
          className="gap-1.5 shrink-0"
        >
          <Plus className="size-3.5" />
          إضافة
        </Button>
      </div>

      <div className="pt-2 border-t border-border">
        <ExcelImportDropzone
          onImport={(values) => {
            useBuilderStore.getState().importOptions(questionId, values);
          }}
        />
      </div>
    </div>
  );
}

const EMPTY_OPTIONS: Option[] = [];

const OptionRow = memo(function OptionRow({
  option,
  questionId,
}: {
  option: Option;
  questionId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(option.label);

  const startEdit = () => {
    setDraft(option.label);
    setEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error("لا يمكن أن يكون نص الخيار فارغاً");
      setDraft(option.label);
      setEditing(false);
      return;
    }
    if (trimmed === option.label) {
      setEditing(false);
      return;
    }
    useBuilderStore.getState().updateOption(questionId, option.id, trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(option.label);
    setEditing(false);
  };

  const handleDelete = () => {
    const snap = useBuilderStore.getState().deleteOption(questionId, option.id);
    if (!snap) return;
    toastUndo("تم حذف الخيار", () => {
      useBuilderStore.getState().restoreOption(snap);
    });
  };

  return (
    <li className="group flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 hover:border-gold/40 transition-colors">
      <span className="size-1.5 rounded-full bg-gold-dark/60 shrink-0" />

      {editing ? (
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          className="h-7 flex-1 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="flex-1 text-start text-sm text-foreground truncate hover:text-gold-dark transition-colors cursor-pointer"
          title="انقر للتعديل"
        >
          {option.label}
        </button>
      )}

      <div className="flex items-center gap-0.5 shrink-0">
        {editing ? (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={commit}
              aria-label="حفظ"
            >
              <Check className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-muted-foreground hover:bg-muted"
              onClick={cancel}
              aria-label="إلغاء"
            >
              <X className="size-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-gold-dark hover:bg-gold/10"
              onClick={startEdit}
              aria-label="تعديل"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              aria-label="حذف"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    </li>
  );
});

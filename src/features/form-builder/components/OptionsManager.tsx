"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListPlus, Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExcelImportDropzone } from "./ExcelImportDropzone";
import { useFormDraft } from "@/features/form-builder/context/FormBuilderDraftContext";
import { motionTokens } from "@/styles/design-tokens";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Option } from "@/shared/types";

interface OptionsManagerProps {
  questionId: string;
  options: Option[];
}

/**
 * OptionsManager — manage the options of a single choice question.
 *
 * - List of current options with inline-edit (click to edit) and delete.
 * - Manual add via input + "إضافة" button (calls `useAddOption`).
 * - `ExcelImportDropzone` at the bottom for Excel import.
 * - When `useImportExcelOptions` succeeds, options animate in one-by-one via
 *   staggered fade + slide-up (Framer Motion `staggerChildren`).
 */
export function OptionsManager({ questionId, options }: OptionsManagerProps) {
  const [newLabel, setNewLabel] = useState("");
  const { addOption, updateOption, deleteOption, importOptions } = useFormDraft();

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) {
      toast.error("يرجى إدخال نص الخيار");
      return;
    }
    addOption(questionId, trimmed);
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
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: motionTokens.stagger.list } },
              }}
              className="flex flex-col gap-1.5"
            >
              <AnimatePresence initial={false}>
                {options.map((opt) => (
                  <OptionRow
                    key={opt.id}
                    option={opt}
                    questionId={questionId}
                    onUpdate={(label) => updateOption(questionId, opt.id, label)}
                    onDelete={() => deleteOption(questionId, opt.id)}
                    saving={false}
                    deleting={false}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
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
            importOptions(questionId, values);
          }}
        />
      </div>
    </div>
  );
}

interface OptionRowProps {
  option: Option;
  questionId: string;
  onUpdate: (label: string) => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
}

function OptionRow({ option, onUpdate, onDelete, saving, deleting }: OptionRowProps) {
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
    onUpdate(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(option.label);
    setEditing(false);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: motionTokens.duration.fast } }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.smooth }}
      className="group flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 hover:border-gold/40 transition-colors"
    >
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
          disabled={saving}
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="flex-1 text-start text-sm text-foreground truncate hover:text-gold-dark transition-colors"
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
              disabled={saving}
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
              onClick={onDelete}
              disabled={deleting}
              aria-label="حذف"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    </motion.li>
  );
}

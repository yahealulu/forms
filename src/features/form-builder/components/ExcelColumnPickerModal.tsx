"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Layers, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motionTokens } from "@/styles/design-tokens";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ExcelColumn } from "@/shared/types";

interface ExcelColumnPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ExcelColumn[];
  treatFirstRowAsHeader?: boolean;
  onToggleHeader?: (firstRowIsOption: boolean) => void;
  onConfirm: (column: ExcelColumn) => void;
  onCancel?: () => void;
}

/**
 * ExcelColumnPickerModal — a precisely-specified single-select picker.
 *
 * Behaviour:
 * - Each column is an independent Card in a responsive 2×2 grid (1 col on mobile).
 * - Cards animate in with staggered entrance (`motionTokens.stagger.cards`).
 * - Single-select ONLY. Clicking a second card while one is selected:
 *     • The newly-clicked card SHAKES (`x: [0, -4, 4, -4, 0]`, duration 0.25s).
 *     • A toast appears with the exact government copy.
 *     • The original selection remains unchanged.
 *   To change selection the user must first deselect (click again).
 * - Confirm button stays disabled until exactly one card is selected.
 * - On confirm the modal closes with an AnimatePresence exit, then the caller
 *   imports the column's values (the options then animate into the question).
 */
export function ExcelColumnPickerModal({
  open,
  onOpenChange,
  columns,
  treatFirstRowAsHeader = true,
  onToggleHeader,
  onConfirm,
  onCancel,
}: ExcelColumnPickerModalProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [shakingIdx, setShakingIdx] = useState<number | null>(null);

  if (selectedIdx !== null && selectedIdx >= columns.length) {
    setSelectedIdx(null);
  }

  const reset = useCallback(() => {
    setSelectedIdx(null);
    setShakingIdx(null);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleCardClick = (idx: number) => {
    if (selectedIdx === null) {
      setSelectedIdx(idx);
      return;
    }
    if (selectedIdx === idx) {
      // Deselect the currently-selected card.
      setSelectedIdx(null);
      return;
    }
    // A second card was clicked while one was already selected → shake + toast.
    setShakingIdx(idx);
    window.setTimeout(() => setShakingIdx((cur) => (cur === idx ? null : cur)), 280);
    toast.error(
      "يمكنك اختيار مجموعة واحدة فقط لهذا السؤال — يقتصر الاختيار على واحدة من المجموعات الأربع.",
      { duration: 4200 }
    );
  };

  const handleConfirm = () => {
    if (selectedIdx === null) return;
    const selected = columns[selectedIdx];
    if (!selected) return;
    onConfirm(selected);
    reset();
    handleOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    reset();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[680px] p-0 overflow-hidden"
      >
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-5 text-gold-dark" aria-hidden="true" />
            هذا الملف يحتوي على أكثر من مجموعة خيارات — اختر واحدة لهذا السؤال.
          </DialogTitle>
          <DialogDescription>
            تم اكتشاف {columns.length} مجموعات خيارات مستقلة في الملف. اختر
            المجموعة المناسبة لهذا السؤال فقط.
          </DialogDescription>
        </DialogHeader>

        {onToggleHeader && (
          <div className="px-6 flex items-start gap-2.5">
            <Switch
              id="picker-header-toggle"
              checked={!treatFirstRowAsHeader}
              onCheckedChange={(checked) => onToggleHeader(checked)}
              aria-label="الصف الأول خيار وليس عنواناً"
            />
            <Label
              htmlFor="picker-header-toggle"
              className="text-xs leading-snug text-foreground cursor-pointer"
            >
              الصف الأول خيار وليس عنواناً
            </Label>
          </div>
        )}

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: motionTokens.stagger.cards } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-6 pb-2"
        >
          {columns.map((col, idx) => (
            <ColumnCard
              key={`${col.columnLabel}-${idx}`}
              column={col}
              index={idx}
              selected={selectedIdx === idx}
              shaking={shakingIdx === idx}
              onClick={() => handleCardClick(idx)}
            />
          ))}
        </motion.div>

        <DialogFooter
          className="px-6 py-4 border-t border-border bg-muted/30 flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-gold-dark" />
            {selectedIdx === null
              ? "اختر بطاقة واحدة للمتابعة"
              : "تم الاختيار — يمكنك التأكيد الآن"}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              إلغاء
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedIdx === null}
              className={cn(
                "gap-2 transition-colors duration-300",
                selectedIdx !== null &&
                  "bg-gold-dark text-white hover:bg-gold-dark/90"
              )}
            >
              <CheckCircle2 className="size-4" />
              تأكيد الاختيار
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ColumnCardProps {
  column: ExcelColumn;
  index: number;
  selected: boolean;
  shaking: boolean;
  onClick: () => void;
}

function ColumnCard({ column, selected, shaking, onClick }: ColumnCardProps) {
  const preview = column.values.slice(0, 5);
  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: motionTokens.duration.base,
        ease: motionTokens.ease.smooth,
      },
    },
  };

  return (
    <motion.button
      type="button"
      variants={cardVariants}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      animate={shaking ? { x: [0, -4, 4, -4, 0] } : { x: 0 }}
      transition={
        shaking
          ? { duration: 0.25 }
          : { duration: motionTokens.duration.fast, ease: motionTokens.ease.snappy }
      }
      className={cn(
        "relative text-start p-4 rounded-2xl border-2 bg-card transition-all duration-200 cursor-pointer",
        selected && "pe-12",
        "shadow-sm hover:shadow-md",
        selected
          ? "border-gold ring-2 ring-gold shadow-[0_0_0_4px_rgba(182,157,110,0.15)]"
          : "border-border hover:border-gold/50"
      )}
      aria-pressed={selected}
    >
      {selected && (
        <motion.span
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: motionTokens.duration.base,
            ease: motionTokens.ease.snappy,
          }}
          className="absolute top-3 end-3 flex size-7 items-center justify-center rounded-full bg-gold text-white shadow-sm"
        >
          <CheckCircle2 className="size-4" />
        </motion.span>
      )}

      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2 pr-0">
          <h4 className="font-semibold text-sm text-foreground truncate flex-1">
            {column.columnLabel}
          </h4>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1 text-[11px]">
            {column.values.length} خيار
          </Badge>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          {preview.map((val, i) => (
            <span
              key={`${val}-${i}`}
              className="text-[11px] text-muted-foreground bg-muted/60 rounded px-2 py-1 truncate"
              title={val}
            >
              {val}
            </span>
          ))}
          {column.values.length > preview.length && (
            <span className="text-[11px] text-muted-foreground/70 mt-0.5">
              + {column.values.length - preview.length} خيارات أخرى
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { useExcelParser } from "@/features/form-builder/hooks/useExcelParser";
import { useImportExcelOptions } from "@/features/form-builder/hooks/useFormBuilder";
import { ExcelColumnPickerModal } from "./ExcelColumnPickerModal";
import { motionTokens } from "@/styles/design-tokens";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExcelImportDropzoneProps {
  formId: string;
  questionId: string;
}

/**
 * ExcelImportDropzone — a dashed dropzone for Excel/CSV files.
 *
 * On drag-over, the zone scales up slightly (1.02) and shifts its border to the
 * gold accent. On drop, the file is parsed via `useExcelParser`.
 * - If exactly 1 column is detected → import directly via `useImportExcelOptions`.
 * - If more than 1 column → open `ExcelColumnPickerModal` for single-select.
 *
 * Accepts .xlsx, .xls and .csv files.
 */
export function ExcelImportDropzone({ formId, questionId }: ExcelImportDropzoneProps) {
  const { parse, isParsing, reset } = useExcelParser();
  const importOptions = useImportExcelOptions(formId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerColumns, setPickerColumns] = useState<
    { columnLabel: string; values: string[] }[]
  >([]);

  const ACCEPT = ".xlsx,.xls,.csv";

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const detected = await parse(file);
        if (detected.length === 0) {
          toast.error("لم يتم العثور على بيانات صالحة في الملف");
          return;
        }
        if (detected.length === 1) {
          importOptions.mutate(
            { questionId, values: detected[0].values },
            {
              onSuccess: (res) => {
                const count = res?.data?.length ?? detected[0].values.length;
                toast.success(`تم استيراد ${count} خيار بنجاح`);
              },
              onError: (err) => {
                toast.error(err.message || "تعذّر استيراد الخيارات");
              },
            }
          );
          return;
        }
        setPickerColumns(detected);
        setPickerOpen(true);
      } catch {
        // Error already surfaced by the hook (state.error) — keep silent here.
      }
    },
    [parse, importOptions, questionId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so the same file can be selected again.
      e.target.value = "";
    },
    [handleFile]
  );

  const handleConfirmColumn = (column: { columnLabel: string; values: string[] }) => {
    importOptions.mutate(
      { questionId, values: column.values },
      {
        onSuccess: (res) => {
          const count = res?.data?.length ?? column.values.length;
          toast.success(`تم استيراد ${count} خيار من «${column.columnLabel}»`);
        },
        onError: (err) => {
          toast.error(err.message || "تعذّر استيراد الخيارات");
        },
      }
    );
  };

  const isBusy = isParsing || importOptions.isPending;

  return (
    <div className="w-full">
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isBusy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isBusy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        animate={{
          scale: isDragOver ? 1.02 : 1,
        }}
        transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.snappy }}
        className={cn(
          "relative w-full rounded-xl border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-colors",
          "flex flex-col items-center justify-center gap-2",
          isDragOver
            ? "border-gold bg-gold/5"
            : "border-border bg-muted/30 hover:border-gold/40 hover:bg-muted/50",
          isBusy && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleInputChange}
          className="sr-only"
          aria-label="رفع ملف Excel"
        />

        <motion.div
          animate={{
            y: isDragOver ? -2 : 0,
            scale: isDragOver ? 1.08 : 1,
          }}
          transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.smooth }}
          className={cn(
            "flex size-10 items-center justify-center rounded-xl transition-colors",
            isDragOver ? "bg-gold/15 text-gold-dark" : "bg-muted text-muted-foreground"
          )}
        >
          {isBusy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : isDragOver ? (
            <UploadCloud className="size-5" />
          ) : (
            <FileSpreadsheet className="size-5" />
          )}
        </motion.div>

        <p className="text-xs text-muted-foreground leading-snug max-w-[260px]">
          {isBusy
            ? "جارٍ معالجة الملف..."
            : "أو اسحب ملف Excel هنا لاستيراد الخيارات"}
        </p>
        <p className="text-[10px] text-muted-foreground/70">xlsx · xls · csv</p>
      </motion.div>

      <ExcelColumnPickerModal
        open={pickerOpen}
        onOpenChange={(o) => {
          setPickerOpen(o);
          if (!o) {
            setPickerColumns([]);
            reset();
          }
        }}
        columns={pickerColumns}
        onConfirm={handleConfirmColumn}
        onCancel={() => reset()}
      />
    </div>
  );
}

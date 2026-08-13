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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ExcelImportDropzoneProps {
  formId: string;
  questionId: string;
}

/**
 * ExcelImportDropzone — dashed dropzone for Excel/CSV with a visible template
 * so users know the expected sheet shape before upload.
 *
 * After parse: preview + toggle «الصف الأول خيار وليس عنواناً».
 * One column → confirm import. Multiple columns → picker modal.
 */
export function ExcelImportDropzone({ formId, questionId }: ExcelImportDropzoneProps) {
  const {
    parse,
    columns,
    treatFirstRowAsHeader,
    setTreatFirstRowAsHeader,
    isParsing,
    error,
    hasFile,
    reset,
  } = useExcelParser();
  const importOptions = useImportExcelOptions(formId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const ACCEPT = ".xlsx,.xls,.csv";

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const detected = await parse(file);
        if (detected.length === 0) {
          toast.error("لم يتم العثور على بيانات صالحة في الملف");
          return;
        }
        if (detected.length > 1) {
          setPickerOpen(true);
        }
      } catch {
        /* error state is shown via role=alert */
      }
    },
    [parse]
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
      e.target.value = "";
    },
    [handleFile]
  );

  const importColumn = (values: string[], label?: string) => {
    importOptions.mutate(
      { questionId, values },
      {
        onSuccess: (res) => {
          const count = res?.data?.length ?? values.length;
          toast.success(
            label
              ? `تم استيراد ${count} خيار من «${label}»`
              : `تم استيراد ${count} خيار بنجاح`
          );
          reset();
        },
        onError: (err) => {
          toast.error(err.message || "تعذّر استيراد الخيارات");
        },
      }
    );
  };

  const handleConfirmSingle = () => {
    const col = columns[0];
    if (!col) return;
    importColumn(col.values, col.columnLabel);
  };

  const handleConfirmColumn = (column: { columnLabel: string; values: string[] }) => {
    importColumn(column.values, column.columnLabel);
  };

  const isBusy = isParsing || importOptions.isPending;
  const singleColumn = hasFile && columns.length === 1;

  return (
    <div className="w-full space-y-3">
      <ExcelFormatGuide />

      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isBusy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="رفع ملف Excel لاستيراد الخيارات"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isBusy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        animate={{ scale: isDragOver ? 1.02 : 1 }}
        transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.snappy }}
        className={cn(
          "relative w-full min-h-11 rounded-xl border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-colors",
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
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : isDragOver ? (
            <UploadCloud className="size-5" aria-hidden="true" />
          ) : (
            <FileSpreadsheet className="size-5" aria-hidden="true" />
          )}
        </motion.div>

        <p className="text-xs text-muted-foreground leading-snug max-w-[260px]">
          {isBusy
            ? "جارٍ معالجة الملف..."
            : "اسحب ملف Excel هنا أو اضغط للاختيار"}
        </p>
        <p className="text-[10px] text-muted-foreground/70">xlsx · xls · csv</p>
      </motion.div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {hasFile && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-3">
          <div className="flex items-start gap-2.5">
            <Switch
              id="excel-header-toggle"
              checked={!treatFirstRowAsHeader}
              onCheckedChange={(checked) => setTreatFirstRowAsHeader(!checked)}
              aria-label="الصف الأول خيار وليس عنواناً"
            />
            <Label
              htmlFor="excel-header-toggle"
              className="text-xs leading-snug text-foreground cursor-pointer"
            >
              الصف الأول خيار وليس عنواناً
              <span className="block text-muted-foreground font-normal mt-0.5">
                فعّل هذا إن بدأت القائمة من الخلية الأولى دون صف عنوان.
              </span>
            </Label>
          </div>

          {columns.length === 0 ? (
            <p role="alert" className="text-xs text-destructive">
              لا توجد قيم للاستيراد في هذا الوضع. جرّب تبديل الصف الأول.
            </p>
          ) : singleColumn ? (
            <>
              <ImportPreview
                label={columns[0].columnLabel}
                values={columns[0].values}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmSingle}
                  disabled={isBusy || columns[0].values.length === 0}
                  className="gap-1.5"
                >
                  استيراد {columns[0].values.length} خيار
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={reset}
                  disabled={isBusy}
                >
                  إلغاء
                </Button>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              تم اكتشاف {columns.length} أعمدة — اختر عموداً واحداً من النافذة.
            </p>
          )}
        </div>
      )}

      <ExcelColumnPickerModal
        open={pickerOpen}
        onOpenChange={(o) => {
          setPickerOpen(o);
          if (!o) {
            reset();
          }
        }}
        columns={columns}
        treatFirstRowAsHeader={treatFirstRowAsHeader}
        onToggleHeader={(asOption) => setTreatFirstRowAsHeader(!asOption)}
        onConfirm={handleConfirmColumn}
        onCancel={() => reset()}
      />
    </div>
  );
}

function ExcelFormatGuide() {
  const sample = ["عنوان العمود", "خيار 1", "خيار 2", "خيار 3"];

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
      <p className="text-xs font-medium text-foreground">شكل الملف المطلوب</p>
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <table className="w-full text-xs" aria-label="مثال لشكل ملف Excel">
          <tbody>
            {sample.map((cell, i) => (
              <tr
                key={cell}
                className={
                  i === 0
                    ? "bg-gold/10 text-foreground font-semibold"
                    : "text-muted-foreground"
                }
              >
                <td className="px-3 py-1.5 border-b border-border last:border-b-0 text-start">
                  {cell}
                  {i === 0 && (
                    <span className="ms-2 text-[10px] font-normal text-muted-foreground">
                      (عنوان)
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="text-[11px] text-muted-foreground leading-relaxed space-y-0.5 list-disc ps-4">
        <li>الورقة الأولى فقط تُقرأ</li>
        <li>كل عمود = مجموعة خيارات مستقلة</li>
        <li>الصف الأول عنوان العمود، والقيم تحته هي الخيارات</li>
      </ul>
    </div>
  );
}

function ImportPreview({ label, values }: { label: string; values: string[] }) {
  const preview = values.slice(0, 5);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground">{values.length} خيار سيُستورد</p>
      <ul className="flex flex-col gap-1">
        {preview.map((val, i) => (
          <li
            key={`${val}-${i}`}
            className="text-[11px] text-muted-foreground bg-muted/60 rounded px-2 py-1 truncate"
            title={val}
          >
            {val}
          </li>
        ))}
        {values.length > preview.length && (
          <li className="text-[11px] text-muted-foreground/70">
            + {values.length - preview.length} خيارات أخرى
          </li>
        )}
      </ul>
    </div>
  );
}

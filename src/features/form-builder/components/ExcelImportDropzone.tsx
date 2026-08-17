"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileSpreadsheet, Loader2, UploadCloud, X } from "lucide-react";
import { useExcelParser } from "@/features/form-builder/hooks/useExcelParser";
import { ExcelColumnPickerModal } from "./ExcelColumnPickerModal";
import { motionTokens } from "@/styles/design-tokens";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ExcelImportDropzoneProps {
  onImport: (values: string[]) => string[];
  onClearImported: (optionIds: string[]) => void;
}

interface AttachedFile {
  name: string;
  size: number;
}

/**
 * ExcelImportDropzone — dashed dropzone for Excel/CSV with a visible template
 * so users know the expected sheet shape before upload.
 *
 * After a file is attached, the dropzone is replaced by a file chip.
 * Clearing the chip also removes options imported from that file.
 */
export function ExcelImportDropzone({
  onImport,
  onClearImported,
}: ExcelImportDropzoneProps) {
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [didImport, setDidImport] = useState(false);

  const ACCEPT = ".xlsx,.xls,.csv";
  const showDropzone = !attachedFile && !isParsing;

  const handleFile = useCallback(
    async (file: File) => {
      setAttachedFile({ name: file.name, size: file.size });
      setDidImport(false);
      setImportedIds([]);
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
        setAttachedFile(null);
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
    const ids = onImport(values);
    setImportedIds(ids);
    setDidImport(true);
    toast.success(
      label
        ? `تمت إضافة ${values.length} خيار من «${label}» — اضغط حفظ`
        : `تمت إضافة ${values.length} خيار — اضغط حفظ`
    );
    reset();
  };

  const handleConfirmSingle = () => {
    const col = columns[0];
    if (!col) return;
    importColumn(col.values, col.columnLabel);
  };

  const handleConfirmColumn = (column: {
    columnLabel: string;
    values: string[];
  }) => {
    importColumn(column.values, column.columnLabel);
  };

  const clearAttachedFile = () => {
    const hadImported = importedIds.length > 0;
    if (hadImported) {
      onClearImported(importedIds);
    }
    setAttachedFile(null);
    setImportedIds([]);
    setDidImport(false);
    setPickerOpen(false);
    reset();
    toast.success(
      hadImported ? "تم إزالة الملف والخيارات المستوردة منه" : "تم إزالة الملف"
    );
  };

  const isBusy = isParsing;
  const singleColumn = hasFile && columns.length === 1;
  const pendingMulti = hasFile && columns.length > 1 && !didImport;

  return (
    <div className="w-full space-y-3 min-w-0">
      {showDropzone && <ExcelFormatGuide />}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleInputChange}
        className="sr-only"
        aria-label="رفع ملف Excel"
      />

      <AnimatePresence mode="wait" initial={false}>
        {showDropzone ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{
              duration: motionTokens.duration.fast,
              ease: motionTokens.ease.snappy,
            }}
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
            className={cn(
              "relative w-full min-h-11 rounded-xl border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-colors",
              "flex flex-col items-center justify-center gap-2",
              isDragOver
                ? "border-gold bg-gold/5"
                : "border-border bg-muted/30 hover:border-gold/40 hover:bg-muted/50",
              isBusy && "pointer-events-none opacity-70"
            )}
          >
            <motion.div
              animate={{
                y: isDragOver ? -2 : 0,
                scale: isDragOver ? 1.08 : 1,
              }}
              transition={{
                duration: motionTokens.duration.fast,
                ease: motionTokens.ease.smooth,
              }}
              className={cn(
                "flex size-10 items-center justify-center rounded-xl transition-colors",
                isDragOver
                  ? "bg-gold/15 text-gold-dark"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isDragOver ? (
                <UploadCloud className="size-5" aria-hidden="true" />
              ) : (
                <FileSpreadsheet className="size-5" aria-hidden="true" />
              )}
            </motion.div>

            <p className="text-xs text-muted-foreground leading-snug max-w-[260px]">
              اسحب ملف Excel هنا أو اضغط للاختيار
            </p>
            <p className="text-[10px] text-muted-foreground/70">xlsx · xls · csv</p>
          </motion.div>
        ) : (
          <motion.div
            key="file-chip"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{
              duration: motionTokens.duration.fast,
              ease: motionTokens.ease.snappy,
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 min-h-11 min-w-0"
          >
            {isBusy ? (
              <Loader2
                className="size-4 shrink-0 animate-spin text-gold-dark"
                aria-hidden="true"
              />
            ) : (
              <FileSpreadsheet
                className="size-4 shrink-0 text-gold-dark"
                aria-hidden="true"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate" title={attachedFile?.name}>
                {isBusy ? "جارٍ معالجة الملف..." : attachedFile?.name}
              </p>
              {attachedFile && !isBusy && (
                <p className="text-[11px] text-muted-foreground">
                  {formatFileSize(attachedFile.size)}
                  {didImport ? " · تم الاستيراد" : ""}
                </p>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={clearAttachedFile}
              disabled={isBusy}
              aria-label="إزالة الملف والخيارات المستوردة"
            >
              <X className="size-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {hasFile && !didImport && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-3 min-w-0">
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
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmSingle}
                  disabled={isBusy || columns[0].values.length === 0}
                  className="gap-1.5"
                >
                  استيراد {columns[0].values.length} خيار
                </Button>
              </div>
            </>
          ) : pendingMulti ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                تم اكتشاف {columns.length} أعمدة — اختر عموداً واحداً.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPickerOpen(true)}
              >
                اختيار العمود
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <ExcelColumnPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        columns={columns}
        treatFirstRowAsHeader={treatFirstRowAsHeader}
        onToggleHeader={(asOption) => setTreatFirstRowAsHeader(!asOption)}
        onConfirm={handleConfirmColumn}
      />
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
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
  const preview = values.slice(0, 4);
  return (
    <div className="space-y-1.5 min-w-0">
      <p className="text-xs font-medium text-foreground truncate">{label}</p>
      <p className="text-[11px] text-muted-foreground">{values.length} خيار سيُستورد</p>
      <ul className="flex flex-col gap-1 max-h-28 overflow-y-auto">
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

"use client";

import { useRef, useState } from "react";
import { Controller, type Control } from "react-hook-form";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Question } from "@/shared/types";
import type { FormValues } from "../../hooks/useDynamicFormSchema";
import {
  validateFile,
  verifyFileSignature,
} from "@/shared/lib/security";
import { useUploadFile } from "@/features/form-filler/hooks/useFiles";
import { cn } from "@/lib/utils";
import { QuestionShell } from "./_QuestionShell";

export interface FileFieldProps {
  question: Question;
  name: string;
  control: Control<FormValues>;
}

interface UploadedFile {
  fileId: string;
  fileName: string;
}

export function FileField({ question, name, control }: FileFieldProps) {
  const uploadFile = useUploadFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const allowedExtensions = question.allowedExtensions ?? [];
  const maxMB = question.maxFileSizeMB ?? 10;

  const handleFiles = async (
    fileList: FileList | null,
    current: UploadedFile[],
    onChange: (next: UploadedFile[]) => void
  ) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setPendingCount((c) => c + files.length);
    const accepted: UploadedFile[] = [];
    try {
      for (const file of files) {
        const validation = validateFile(file, allowedExtensions, maxMB);
        if (!validation.valid) {
          toast.error(validation.error ?? "ملف غير صالح", {
            description: file.name,
          });
          continue;
        }
        const verified = await verifyFileSignature(
          file,
          validation.detectedType ?? ""
        );
        if (!verified) {
          toast.error("توقيع الملف لا يطابق الامتداد المعلن.", {
            description: file.name,
          });
          continue;
        }
        try {
          const uploaded = await uploadFile.mutateAsync(file);
          accepted.push({
            fileId: uploaded.fileId,
            fileName: uploaded.fileName,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "تعذّر رفع الملف.";
          toast.error(message, { description: file.name });
        }
      }
      if (accepted.length > 0) {
        onChange([...current, ...accepted]);
      }
    } finally {
      setPendingCount((c) => Math.max(0, c - files.length));
      // Reset the input so the same file can be re-selected later
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={[]}
      render={({ field, fieldState }) => {
        const files = (field.value as UploadedFile[]) ?? [];
        return (
          <QuestionShell
            question={question}
            error={fieldState.error}
            helperExtra={
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {allowedExtensions.length > 0 && (
                  <span>
                    الأنواع المسموح بها:{" "}
                    <span className="font-medium text-foreground/70">
                      {allowedExtensions.join("، ")}
                    </span>
                  </span>
                )}
                <span>
                  الحد الأقصى للحجم:{" "}
                  <span className="font-medium text-foreground/70">
                    {maxMB} ميجابايت
                  </span>
                </span>
              </div>
            }
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              aria-label={`رفع ملفات لـ ${question.title}`}
              onChange={(e) =>
                handleFiles(e.target.files, files, field.onChange)
              }
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pendingCount > 0}
              onClick={() => inputRef.current?.click()}
              className="w-fit"
            >
              {pendingCount > 0 ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  جارٍ الرفع…
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  رفع ملف
                </>
              )}
            </Button>

            {files.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {files.map((f, idx) => (
                  <li
                    key={f.fileId}
                    className={cn(
                      "flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2",
                      "transition-colors hover:bg-muted/60"
                    )}
                  >
                    <FileText className="size-4 shrink-0 text-gold-dark" />
                    <span className="flex-1 truncate text-sm" title={f.fileName}>
                      {f.fileName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        field.onChange(
                          files.filter((_, i) => i !== idx)
                        )
                      }
                      className="text-muted-foreground hover:text-destructive rounded p-1 transition-colors"
                      aria-label={`حذف ${f.fileName}`}
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </QuestionShell>
        );
      }}
    />
  );
}

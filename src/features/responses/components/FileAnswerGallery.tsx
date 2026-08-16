"use client";

import { useEffect, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  ImageOff,
  Loader2,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchFileBlob,
  saveBlobToDisk,
} from "@/shared/lib/api-client";
import { sanitizeText } from "@/shared/lib/security";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export type ResponseFile = {
  fileId: string;
  fileName: string;
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i;
const PDF_EXT = /\.pdf$/i;

function isImageFile(fileName: string) {
  return IMAGE_EXT.test(fileName);
}

function isPdfFile(fileName: string) {
  return PDF_EXT.test(fileName);
}

/**
 * File answers in response detail (full page + side sheet).
 * Loads bytes via fetch (IDM cannot cancel), then preview/download from a blob URL.
 */
export function FileAnswerGallery({ files }: { files: ResponseFile[] }) {
  if (files.length === 0) return null;

  const showNav = files.length > 1;

  return (
    <Carousel
      opts={{ loop: showNav, direction: "rtl", align: "start" }}
      className="w-full max-w-full"
      dir="rtl"
    >
      <CarouselContent>
        {files.map((file, index) => (
          <CarouselItem key={file.fileId || `${file.fileName}-${index}`}>
            <FileSlide file={file} />
          </CarouselItem>
        ))}
      </CarouselContent>
      {showNav && (
        <>
          <CarouselPrevious className="left-2 right-auto top-1/2 size-8 border-border bg-card/90 shadow-sm" />
          <CarouselNext className="right-2 left-auto top-1/2 size-8 border-border bg-card/90 shadow-sm" />
        </>
      )}
    </Carousel>
  );
}

function FileSlide({ file }: { file: ResponseFile }) {
  const safeName = sanitizeText(file.fileName);
  const image = isImageFile(file.fileName);
  const pdf = isPdfFile(file.fileName);
  const { blob, previewUrl, isLoading, error } = useFileBlob(
    file.fileId,
    file.fileName
  );
  const [busy, setBusy] = useState<"view" | "download" | null>(null);

  const handleView = () => {
    if (!previewUrl || busy) return;
    const opened = window.open(previewUrl, "_blank", "noopener");
    if (!opened) {
      toast.error("المتصفح منع فتح تبويب جديد. اسمح بالنوافذ المنبثقة.");
    }
  };

  const handleDownload = async () => {
    if (!blob || busy) return;
    setBusy("download");
    try {
      saveBlobToDisk(blob, file.fileName || "file");
      toast.success("تم حفظ الملف على جهازك");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر تنزيل الملف");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="relative flex h-52 items-center justify-center bg-muted/50 sm:h-72">
        {isLoading && (
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        )}
        {!isLoading && error && (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <ImageOff className="size-8" />
            <span className="text-xs">تعذّر تحميل الملف</span>
          </div>
        )}
        {!isLoading && !error && previewUrl && image && (
          <button
            type="button"
            className="block h-full w-full"
            title="فتح في تبويب جديد"
            onClick={handleView}
          >
            <FileImage src={previewUrl} alt={safeName} />
          </button>
        )}
        {!isLoading && !error && previewUrl && pdf && (
          <iframe
            src={previewUrl}
            title={safeName}
            className="h-full w-full border-0 bg-white"
          />
        )}
        {!isLoading && !error && previewUrl && !image && !pdf && (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gold/15 text-gold-dark">
              <Paperclip className="size-7" />
            </div>
            <p className="max-w-[240px] truncate text-sm font-medium text-foreground">
              {safeName}
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border bg-card px-3 py-2">
        <p className="min-w-0 truncate text-xs text-foreground" title={safeName}>
          {safeName}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!blob || busy !== null}
            onClick={handleView}
          >
            {busy === "view" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : pdf ? (
              <FileText className="size-3.5" />
            ) : (
              <ExternalLink className="size-3.5" />
            )}
            عرض
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!blob || busy !== null}
            onClick={handleDownload}
          >
            {busy === "download" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            تنزيل
          </Button>
        </div>
      </div>
    </div>
  );
}

function useFileBlob(fileId: string, fileName: string) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setIsLoading(true);
    setError(false);
    setBlob(null);
    setPreviewUrl(null);

    fetchFileBlob(fileId, fileName)
      .then((data) => {
        const url = URL.createObjectURL(data);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setBlob(data);
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, fileName]);

  return { blob, previewUrl, isLoading, error };
}

function FileImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
        <ImageOff className="size-8" />
        <span className="text-xs">تعذّر عرض الصورة</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}

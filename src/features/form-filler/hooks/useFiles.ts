"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/lib/api-client";

interface UploadResponse {
  data: {
    fileId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    previewUrl: string;
  };
  message: string;
}

export function useUploadFile() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.upload<UploadResponse>("/api/files/upload", formData).then((r) => r.data);
    },
  });
}

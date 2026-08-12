"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/shared/lib/api-client";
import type { FormResponse } from "@/shared/types";

interface ResponsesListResponse {
  data: FormResponse[];
}
interface ResponseDetailResponse {
  data: FormResponse;
}

export const responsesKeys = {
  list: (formId: string) => ["responses", formId] as const,
  detail: (formId: string, responseId: string) =>
    ["responses", formId, responseId] as const,
};

export function useFormResponses(formId: string) {
  return useQuery({
    queryKey: responsesKeys.list(formId),
    queryFn: () =>
      api
        .get<ResponsesListResponse>(`/api/forms/${formId}/responses`)
        .then((r) => r.data),
    enabled: !!formId,
  });
}

export function useFormResponse(formId: string, responseId: string) {
  return useQuery({
    queryKey: responsesKeys.detail(formId, responseId),
    queryFn: () =>
      api
        .get<ResponseDetailResponse>(
          `/api/forms/${formId}/responses/${responseId}`
        )
        .then((r) => r.data),
    enabled: !!formId && !!responseId,
  });
}

export function useSubmitFormResponse(formId: string) {
  return useMutation({
    mutationFn: (input: Partial<FormResponse>) =>
      api
        .post<{ data: FormResponse; message: string }>(
          `/api/forms/${formId}/responses`,
          input
        )
        .then((r) => r),
  });
}

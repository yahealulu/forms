"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/lib/api-client";
import type { Form } from "@/shared/types";

interface FormsListResponse {
  data: (Form & { _questionCount?: number; _responseCount?: number })[];
}
interface FormResponse {
  data: Form;
}

export const formsKeys = {
  all: ["forms"] as const,
  list: () => [...formsKeys.all, "list"] as const,
  detail: (id: string) => [...formsKeys.all, "detail", id] as const,
};

export function useForms() {
  return useQuery({
    queryKey: formsKeys.list(),
    queryFn: () => api.get<FormsListResponse>("/api/forms").then((r) => r.data),
  });
}

export function useForm(formId: string) {
  return useQuery({
    queryKey: formsKeys.detail(formId),
    queryFn: () =>
      api.get<FormResponse>(`/api/forms/${formId}`).then((r) => r.data),
    enabled: !!formId,
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description: string; entityName: string }) =>
      api.post<FormResponse>("/api/forms", input).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formsKeys.list() });
    },
  });
}

export function useUpdateForm(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Form>) =>
      api.patch<FormResponse>(`/api/forms/${formId}`, patch).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formsKeys.detail(formId) });
      qc.invalidateQueries({ queryKey: formsKeys.list() });
    },
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { formId: string; confirmText: string; forceDelete?: boolean }) =>
      api
        .delete<{ message: string }>(`/api/forms/${input.formId}`, {
          confirmText: input.confirmText,
          forceDelete: input.forceDelete,
        })
        .then((r) => r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formsKeys.list() });
    },
  });
}

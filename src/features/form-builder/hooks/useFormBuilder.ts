"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/lib/api-client";
import { formsKeys } from "@/features/forms-management/hooks/useForms";
import type { Form, Option, Question, Section } from "@/shared/types";

export function reorderSectionsInForm(form: Form, orderedIds: string[]): Form {
  const map = new Map(form.sections.map((s) => [s.id, s]));
  return {
    ...form,
    sections: orderedIds
      .map((id, order) => {
        const section = map.get(id);
        return section ? { ...section, order } : null;
      })
      .filter(Boolean) as Section[],
  };
}

export function reorderQuestionsInForm(
  form: Form,
  sectionId: string,
  orderedIds: string[]
): Form {
  return {
    ...form,
    sections: form.sections.map((section) => {
      if (section.id !== sectionId) return section;
      const map = new Map(section.questions.map((q) => [q.id, q]));
      return {
        ...section,
        questions: orderedIds
          .map((id, order) => {
            const question = map.get(id);
            return question ? { ...question, order } : null;
          })
          .filter(Boolean) as Question[],
      };
    }),
  };
}

// ── Sections ──

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { formId: string; data: Partial<Section> }) =>
      api
        .post<{ data: Section }>("/api/sections", { formId: input.formId, ...input.data })
        .then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: formsKeys.detail(variables.formId) });
    },
  });
}

export function useUpdateSection(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { sectionId: string; patch: Partial<Section> }) =>
      api
        .patch<{ data: Section }>(`/api/sections/${input.sectionId}`, input.patch)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formsKeys.detail(formId) });
    },
  });
}

export function useDeleteSection(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: string) =>
      api.delete<{ message: string }>(`/api/sections/${sectionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formsKeys.detail(formId) });
    },
  });
}

export function useReorderSections(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.patch<{ message: string }>(`/api/sections/${orderedIds[0]}/reorder`, {
        formId,
        orderedIds,
      }),
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: formsKeys.detail(formId) });
      const previous = qc.getQueryData<Form>(formsKeys.detail(formId));
      if (previous) {
        qc.setQueryData(
          formsKeys.detail(formId),
          reorderSectionsInForm(previous, orderedIds)
        );
      }
      return { previous };
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(formsKeys.detail(formId), ctx.previous);
      }
    },
  });
}

// ── Questions ──

export function useCreateQuestion(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { sectionId: string; data: Partial<Question> }) =>
      api
        .post<{ data: Question }>("/api/questions", { sectionId: input.sectionId, ...input.data })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formsKeys.detail(formId) });
    },
  });
}

export function useUpdateQuestion(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { questionId: string; patch: Partial<Question> }) =>
      api
        .patch<{ data: Question }>(`/api/questions/${input.questionId}`, input.patch)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formsKeys.detail(formId) });
    },
  });
}

export function useDeleteQuestion(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      api.delete<{ message: string }>(`/api/questions/${questionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formsKeys.detail(formId) });
    },
  });
}

export function useReorderQuestions(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { sectionId: string; orderedIds: string[] }) =>
      api.patch<{ message: string }>(
        `/api/questions/${input.orderedIds[0]}/reorder`,
        { sectionId: input.sectionId, orderedIds: input.orderedIds }
      ),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: formsKeys.detail(formId) });
      const previous = qc.getQueryData<Form>(formsKeys.detail(formId));
      if (previous) {
        qc.setQueryData(
          formsKeys.detail(formId),
          reorderQuestionsInForm(previous, input.sectionId, input.orderedIds)
        );
      }
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(formsKeys.detail(formId), ctx.previous);
      }
    },
  });
}

// ── Options ──

export function useAddOption(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { questionId: string; label: string }) =>
      api
        .post<{ data: Option }>(`/api/questions/${input.questionId}/options`, {
          label: input.label,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formsKeys.detail(formId) });
    },
  });
}

export function useUpdateOption(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { questionId: string; optionId: string; label: string }) =>
      api
        .patch<{ data: Option }>(
          `/api/questions/${input.questionId}/options/${input.optionId}`,
          { label: input.label }
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formsKeys.detail(formId) });
    },
  });
}

export function useDeleteOption(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { questionId: string; optionId: string }) =>
      api.delete<{ message: string }>(
        `/api/questions/${input.questionId}/options/${input.optionId}`
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formsKeys.detail(formId) });
    },
  });
}

export function useImportExcelOptions(formId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { questionId: string; values: string[] }) =>
      api
        .post<{ data: Option[]; message: string }>(
          `/api/questions/${input.questionId}/options/import-excel`,
          { values: input.values }
        )
        .then((r) => r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formsKeys.detail(formId) });
    },
  });
}

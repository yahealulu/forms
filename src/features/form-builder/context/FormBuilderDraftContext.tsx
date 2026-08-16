"use client";

import { createContext, useCallback, useContext, type Dispatch, type SetStateAction } from "react";
import type { Form, Option, Question, QuestionType, Section } from "@/shared/types";

export function newEntityId() {
  return crypto.randomUUID();
}

export function toFormTreePayload(form: Form) {
  return {
    title: form.title,
    description: form.description,
    entityName: form.entityName,
    sections: form.sections.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      isRepeatable: s.isRepeatable,
      minRepeat: s.minRepeat,
      maxRepeat: s.maxRepeat,
      repeatLabel: s.repeatLabel,
      questions: s.questions.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        type: q.type,
        required: q.required,
        placeholder: q.placeholder,
        allowedExtensions: q.allowedExtensions ?? [],
        maxFileSizeMB: q.maxFileSizeMB ?? null,
        maxRating: q.maxRating ?? null,
        min: q.min ?? null,
        max: q.max ?? null,
        options: q.options.map((o) => ({
          id: o.id,
          label: o.label,
          value: o.value,
        })),
      })),
    })),
  };
}

interface FormBuilderDraftValue {
  formId: string;
  draft: Form;
  patchForm: (patch: Partial<Form>) => void;
  patchSection: (sectionId: string, patch: Partial<Section>) => void;
  deleteSection: (sectionId: string) => void;
  addQuestion: (sectionId: string) => void;
  patchQuestion: (questionId: string, patch: Partial<Question>) => void;
  deleteQuestion: (questionId: string) => void;
  addOption: (questionId: string, label: string) => void;
  updateOption: (questionId: string, optionId: string, label: string) => void;
  deleteOption: (questionId: string, optionId: string) => void;
  importOptions: (questionId: string, labels: string[]) => void;
}

const FormBuilderDraftContext = createContext<FormBuilderDraftValue | null>(
  null
);

export function FormBuilderDraftProvider({
  formId,
  draft,
  setDraft,
  children,
}: {
  formId: string;
  draft: Form;
  setDraft: Dispatch<SetStateAction<Form | null>>;
  children: React.ReactNode;
}) {
  const mutate = useCallback(
    (updater: (prev: Form) => Form) => {
      setDraft((prev) => (prev ? updater(prev) : prev));
    },
    [setDraft]
  );

  const patchForm = useCallback(
    (patch: Partial<Form>) => {
      mutate((prev) => ({ ...prev, ...patch }));
    },
    [mutate]
  );

  const patchSection = useCallback(
    (sectionId: string, patch: Partial<Section>) => {
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId ? { ...s, ...patch } : s
        ),
      }));
    },
    [mutate]
  );

  const deleteSection = useCallback(
    (sectionId: string) => {
      mutate((prev) => ({
        ...prev,
        sections: prev.sections
          .filter((s) => s.id !== sectionId)
          .map((s, order) => ({ ...s, order })),
      }));
    },
    [mutate]
  );

  const addQuestion = useCallback(
    (sectionId: string) => {
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          const question: Question = {
            id: newEntityId(),
            sectionId: s.id,
            title: "سؤال جديد",
            type: "short_text",
            required: false,
            order: s.questions.length,
            options: [],
          };
          return { ...s, questions: [...s.questions, question] };
        }),
      }));
    },
    [mutate]
  );

  const patchQuestion = useCallback(
    (questionId: string, patch: Partial<Question>) => {
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => ({
          ...s,
          questions: s.questions.map((q) =>
            q.id === questionId ? { ...q, ...patch } : q
          ),
        })),
      }));
    },
    [mutate]
  );

  const deleteQuestion = useCallback(
    (questionId: string) => {
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => ({
          ...s,
          questions: s.questions
            .filter((q) => q.id !== questionId)
            .map((q, order) => ({ ...q, order })),
        })),
      }));
    },
    [mutate]
  );

  const addOption = useCallback(
    (questionId: string, label: string) => {
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => ({
          ...s,
          questions: s.questions.map((q) => {
            if (q.id !== questionId) return q;
            const option: Option = {
              id: newEntityId(),
              label,
              value: label,
              order: q.options.length,
            };
            return { ...q, options: [...q.options, option] };
          }),
        })),
      }));
    },
    [mutate]
  );

  const updateOption = useCallback(
    (questionId: string, optionId: string, label: string) => {
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => ({
          ...s,
          questions: s.questions.map((q) => {
            if (q.id !== questionId) return q;
            return {
              ...q,
              options: q.options.map((o) =>
                o.id === optionId ? { ...o, label, value: label } : o
              ),
            };
          }),
        })),
      }));
    },
    [mutate]
  );

  const deleteOption = useCallback(
    (questionId: string, optionId: string) => {
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => ({
          ...s,
          questions: s.questions.map((q) => {
            if (q.id !== questionId) return q;
            return {
              ...q,
              options: q.options
                .filter((o) => o.id !== optionId)
                .map((o, order) => ({ ...o, order })),
            };
          }),
        })),
      }));
    },
    [mutate]
  );

  const importOptions = useCallback(
    (questionId: string, labels: string[]) => {
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => ({
          ...s,
          questions: s.questions.map((q) => {
            if (q.id !== questionId) return q;
            const next = [...q.options];
            for (const label of labels) {
              const trimmed = label.trim();
              if (!trimmed) continue;
              next.push({
                id: newEntityId(),
                label: trimmed,
                value: trimmed,
                order: next.length,
              });
            }
            return { ...q, options: next };
          }),
        })),
      }));
    },
    [mutate]
  );

  return (
    <FormBuilderDraftContext.Provider
      value={{
        formId,
        draft,
        patchForm,
        patchSection,
        deleteSection,
        addQuestion,
        patchQuestion,
        deleteQuestion,
        addOption,
        updateOption,
        deleteOption,
        importOptions,
      }}
    >
      {children}
    </FormBuilderDraftContext.Provider>
  );
}

export function useFormDraft() {
  const ctx = useContext(FormBuilderDraftContext);
  if (!ctx) {
    throw new Error("useFormDraft must be used inside FormBuilderDraftProvider");
  }
  return ctx;
}

export function createEmptySection(formId: string, index: number): Section {
  return {
    id: newEntityId(),
    formId,
    title: `قسم ${index + 1}`,
    order: index,
    isRepeatable: false,
    minRepeat: 1,
    maxRepeat: 1,
    repeatLabel: "",
    questions: [],
  };
}

export type { QuestionType };

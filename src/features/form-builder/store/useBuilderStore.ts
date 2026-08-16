"use client";

import { create } from "zustand";
import type {
  Form,
  FormStatus,
  Option,
  Question,
  QuestionType,
  Section,
} from "@/shared/types";

export function newEntityId() {
  return crypto.randomUUID();
}

export type FormMeta = {
  id: string;
  title: string;
  description: string;
  status: FormStatus;
  entityName: string;
  isEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  accentColor?: string;
};

export type SectionData = Omit<Section, "questions">;

export type FormTreePayload = ReturnType<typeof buildTreePayload>;

export interface DeletedSectionSnapshot {
  section: SectionData;
  index: number;
  questions: Question[];
  questionOrder: string[];
}

export interface DeletedQuestionSnapshot {
  question: Question;
  sectionId: string;
  index: number;
}

export interface DeletedOptionSnapshot {
  option: Option;
  questionId: string;
  index: number;
}

interface BuilderState {
  initialized: boolean;
  dirty: boolean;
  form: FormMeta | null;
  sectionsById: Record<string, SectionData>;
  sectionOrder: string[];
  questionsById: Record<string, Question>;
  questionOrderBySection: Record<string, string[]>;
  activeSectionId: string | null;
  lastAddedQuestionId: string | null;
  expandedSectionIds: string[];

  init: (form: Form) => void;
  reset: () => void;
  markClean: () => void;
  patchForm: (patch: Partial<FormMeta>) => void;
  addSection: () => string;
  duplicateSection: (sectionId: string) => string | null;
  deleteSection: (sectionId: string) => DeletedSectionSnapshot | null;
  restoreSection: (snap: DeletedSectionSnapshot) => void;
  moveSection: (sectionId: string, dir: -1 | 1) => void;
  patchSection: (sectionId: string, patch: Partial<SectionData>) => void;
  setActiveSection: (sectionId: string | null) => void;
  toggleSectionExpanded: (sectionId: string) => void;
  addQuestion: (sectionId: string, type?: QuestionType) => string | null;
  duplicateQuestion: (questionId: string) => string | null;
  deleteQuestion: (questionId: string) => DeletedQuestionSnapshot | null;
  restoreQuestion: (snap: DeletedQuestionSnapshot) => void;
  moveQuestion: (questionId: string, dir: -1 | 1) => void;
  patchQuestion: (questionId: string, patch: Partial<Question>) => void;
  addOption: (questionId: string, label: string) => void;
  updateOption: (questionId: string, optionId: string, label: string) => void;
  deleteOption: (questionId: string, optionId: string) => DeletedOptionSnapshot | null;
  restoreOption: (snap: DeletedOptionSnapshot) => void;
  importOptions: (questionId: string, labels: string[]) => void;
  toTreePayload: () => FormTreePayload | null;
  assembleForm: () => Form | null;
}

const emptyState = {
  initialized: false,
  dirty: false,
  form: null as FormMeta | null,
  sectionsById: {} as Record<string, SectionData>,
  sectionOrder: [] as string[],
  questionsById: {} as Record<string, Question>,
  questionOrderBySection: {} as Record<string, string[]>,
  activeSectionId: null as string | null,
  lastAddedQuestionId: null as string | null,
  expandedSectionIds: [] as string[],
};

function cloneQuestion(q: Question, sectionId: string): Question {
  return {
    ...q,
    id: newEntityId(),
    sectionId,
    options: q.options.map((o, order) => ({
      ...o,
      id: newEntityId(),
      order,
    })),
  };
}

function createEmptySection(formId: string, index: number): SectionData {
  return {
    id: newEntityId(),
    formId,
    title: `قسم ${index + 1}`,
    order: index,
    isRepeatable: false,
    minRepeat: 1,
    maxRepeat: 1,
    repeatLabel: "",
  };
}

function createEmptyQuestion(
  sectionId: string,
  order: number,
  type: QuestionType = "short_text"
): Question {
  return {
    id: newEntityId(),
    sectionId,
    title: "سؤال جديد",
    type,
    required: false,
    order,
    options: [],
  };
}

function insertAt<T>(arr: T[], index: number, item: T): T[] {
  const next = arr.slice();
  next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
  return next;
}

function swapAdjacent(ids: string[], id: string, dir: -1 | 1): string[] | null {
  const index = ids.indexOf(id);
  if (index < 0) return null;
  const nextIndex = index + dir;
  if (nextIndex < 0 || nextIndex >= ids.length) return null;
  const next = ids.slice();
  const tmp = next[index];
  next[index] = next[nextIndex];
  next[nextIndex] = tmp;
  return next;
}

function buildTreePayload(state: Pick<
  BuilderState,
  "form" | "sectionsById" | "sectionOrder" | "questionsById" | "questionOrderBySection"
>) {
  if (!state.form) return null;
  return {
    title: state.form.title,
    description: state.form.description,
    entityName: state.form.entityName,
    sections: state.sectionOrder.map((sectionId, sectionOrder) => {
      const s = state.sectionsById[sectionId];
      const questionIds = state.questionOrderBySection[sectionId] ?? [];
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        isRepeatable: s.isRepeatable,
        minRepeat: s.minRepeat,
        maxRepeat: s.maxRepeat,
        repeatLabel: s.repeatLabel,
        order: sectionOrder,
        questions: questionIds.map((questionId, questionOrder) => {
          const q = state.questionsById[questionId];
          return {
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
            order: questionOrder,
            options: q.options.map((o, optionOrder) => ({
              id: o.id,
              label: o.label,
              value: o.value,
              order: optionOrder,
            })),
          };
        }),
      };
    }),
  };
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  ...emptyState,

  init: (form) => {
    const sectionsById: Record<string, SectionData> = {};
    const questionsById: Record<string, Question> = {};
    const questionOrderBySection: Record<string, string[]> = {};
    const sortedSections = [...form.sections].sort((a, b) => a.order - b.order);
    const sectionOrder = sortedSections.map((s) => {
      const { questions, ...rest } = s;
      sectionsById[s.id] = { ...rest };
      const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
      questionOrderBySection[s.id] = sortedQuestions.map((q) => {
        questionsById[q.id] = q;
        return q.id;
      });
      return s.id;
    });

    const { sections: _sections, ...meta } = form;
    set({
      initialized: true,
      dirty: false,
      form: meta,
      sectionsById,
      sectionOrder,
      questionsById,
      questionOrderBySection,
      activeSectionId: sectionOrder[0] ?? null,
      lastAddedQuestionId: null,
      expandedSectionIds: sectionOrder[0] ? [sectionOrder[0]] : [],
    });
  },

  reset: () => set(emptyState),

  markClean: () => set({ dirty: false }),

  patchForm: (patch) =>
    set((state) => {
      if (!state.form) return state;
      return { form: { ...state.form, ...patch }, dirty: true };
    }),

  addSection: () => {
    const state = get();
    if (!state.form) return "";
    const section = createEmptySection(state.form.id, state.sectionOrder.length);
    set({
      sectionsById: { ...state.sectionsById, [section.id]: section },
      sectionOrder: [...state.sectionOrder, section.id],
      questionOrderBySection: {
        ...state.questionOrderBySection,
        [section.id]: [],
      },
      activeSectionId: section.id,
      expandedSectionIds: [section.id],
      dirty: true,
    });
    return section.id;
  },

  duplicateSection: (sectionId) => {
    const state = get();
    if (!state.form) return null;
    const source = state.sectionsById[sectionId];
    if (!source) return null;
    const index = state.sectionOrder.indexOf(sectionId);
    const copy: SectionData = {
      ...source,
      id: newEntityId(),
      title: `${source.title} (نسخة)`,
      order: index + 1,
    };
    const sourceQIds = state.questionOrderBySection[sectionId] ?? [];
    const questionsById = { ...state.questionsById };
    const newQIds = sourceQIds.map((qid, order) => {
      const cloned = cloneQuestion(questionsById[qid], copy.id);
      cloned.order = order;
      questionsById[cloned.id] = cloned;
      return cloned.id;
    });
    set({
      sectionsById: { ...state.sectionsById, [copy.id]: copy },
      sectionOrder: insertAt(state.sectionOrder, index + 1, copy.id),
      questionsById,
      questionOrderBySection: {
        ...state.questionOrderBySection,
        [copy.id]: newQIds,
      },
      activeSectionId: copy.id,
      expandedSectionIds: [copy.id],
      dirty: true,
    });
    return copy.id;
  },

  deleteSection: (sectionId) => {
    const state = get();
    const section = state.sectionsById[sectionId];
    if (!section) return null;
    const index = state.sectionOrder.indexOf(sectionId);
    const questionOrder = state.questionOrderBySection[sectionId] ?? [];
    const questions = questionOrder.map((id) => state.questionsById[id]);
    const { [sectionId]: _removed, ...sectionsById } = state.sectionsById;
    const questionOrderBySection = { ...state.questionOrderBySection };
    delete questionOrderBySection[sectionId];
    const questionsById = { ...state.questionsById };
    for (const id of questionOrder) delete questionsById[id];
    const sectionOrder = state.sectionOrder.filter((id) => id !== sectionId);
    const nextActive =
      state.activeSectionId === sectionId
        ? (sectionOrder[Math.max(0, index - 1)] ?? null)
        : state.activeSectionId;
    set({
      sectionsById,
      sectionOrder,
      questionsById,
      questionOrderBySection,
      activeSectionId: nextActive,
      expandedSectionIds: state.expandedSectionIds.filter((id) => id !== sectionId),
      dirty: true,
    });
    return { section, index, questions, questionOrder };
  },

  restoreSection: (snap) =>
    set((state) => {
      const questionsById = { ...state.questionsById };
      for (const q of snap.questions) questionsById[q.id] = q;
      return {
        sectionsById: { ...state.sectionsById, [snap.section.id]: snap.section },
        sectionOrder: insertAt(state.sectionOrder, snap.index, snap.section.id),
        questionsById,
        questionOrderBySection: {
          ...state.questionOrderBySection,
          [snap.section.id]: snap.questionOrder,
        },
        activeSectionId: snap.section.id,
        expandedSectionIds: [snap.section.id],
        dirty: true,
      };
    }),

  moveSection: (sectionId, dir) =>
    set((state) => {
      const next = swapAdjacent(state.sectionOrder, sectionId, dir);
      if (!next) return state;
      return { sectionOrder: next, dirty: true };
    }),

  patchSection: (sectionId, patch) =>
    set((state) => {
      const section = state.sectionsById[sectionId];
      if (!section) return state;
      return {
        sectionsById: {
          ...state.sectionsById,
          [sectionId]: { ...section, ...patch },
        },
        dirty: true,
      };
    }),

  setActiveSection: (sectionId) =>
    set((state) => ({
      activeSectionId: sectionId,
      expandedSectionIds:
        sectionId && !state.expandedSectionIds.includes(sectionId)
          ? [...state.expandedSectionIds, sectionId]
          : state.expandedSectionIds,
    })),

  toggleSectionExpanded: (sectionId) =>
    set((state) => {
      const open = state.expandedSectionIds.includes(sectionId);
      return {
        expandedSectionIds: open
          ? state.expandedSectionIds.filter((id) => id !== sectionId)
          : [...state.expandedSectionIds, sectionId],
        activeSectionId: sectionId,
      };
    }),

  addQuestion: (sectionId, type = "short_text") => {
    const state = get();
    if (!state.sectionsById[sectionId]) return null;
    const order = (state.questionOrderBySection[sectionId] ?? []).length;
    const question = createEmptyQuestion(sectionId, order, type);
    set({
      questionsById: { ...state.questionsById, [question.id]: question },
      questionOrderBySection: {
        ...state.questionOrderBySection,
        [sectionId]: [...(state.questionOrderBySection[sectionId] ?? []), question.id],
      },
      activeSectionId: sectionId,
      lastAddedQuestionId: question.id,
      expandedSectionIds: state.expandedSectionIds.includes(sectionId)
        ? state.expandedSectionIds
        : [...state.expandedSectionIds, sectionId],
      dirty: true,
    });
    return question.id;
  },

  duplicateQuestion: (questionId) => {
    const state = get();
    const source = state.questionsById[questionId];
    if (!source) return null;
    const orderList = state.questionOrderBySection[source.sectionId] ?? [];
    const index = orderList.indexOf(questionId);
    const copy = cloneQuestion(source, source.sectionId);
    copy.title = `${source.title} (نسخة)`;
    set({
      questionsById: { ...state.questionsById, [copy.id]: copy },
      questionOrderBySection: {
        ...state.questionOrderBySection,
        [source.sectionId]: insertAt(orderList, index + 1, copy.id),
      },
      lastAddedQuestionId: copy.id,
      dirty: true,
    });
    return copy.id;
  },

  deleteQuestion: (questionId) => {
    const state = get();
    const question = state.questionsById[questionId];
    if (!question) return null;
    const orderList = state.questionOrderBySection[question.sectionId] ?? [];
    const index = orderList.indexOf(questionId);
    const { [questionId]: _removed, ...questionsById } = state.questionsById;
    set({
      questionsById,
      questionOrderBySection: {
        ...state.questionOrderBySection,
        [question.sectionId]: orderList.filter((id) => id !== questionId),
      },
      lastAddedQuestionId:
        state.lastAddedQuestionId === questionId ? null : state.lastAddedQuestionId,
      dirty: true,
    });
    return { question, sectionId: question.sectionId, index };
  },

  restoreQuestion: (snap) =>
    set((state) => {
      const orderList = state.questionOrderBySection[snap.sectionId] ?? [];
      return {
        questionsById: { ...state.questionsById, [snap.question.id]: snap.question },
        questionOrderBySection: {
          ...state.questionOrderBySection,
          [snap.sectionId]: insertAt(orderList, snap.index, snap.question.id),
        },
        lastAddedQuestionId: snap.question.id,
        dirty: true,
      };
    }),

  moveQuestion: (questionId, dir) =>
    set((state) => {
      const question = state.questionsById[questionId];
      if (!question) return state;
      const orderList = state.questionOrderBySection[question.sectionId] ?? [];
      const next = swapAdjacent(orderList, questionId, dir);
      if (!next) return state;
      return {
        questionOrderBySection: {
          ...state.questionOrderBySection,
          [question.sectionId]: next,
        },
        dirty: true,
      };
    }),

  patchQuestion: (questionId, patch) =>
    set((state) => {
      const question = state.questionsById[questionId];
      if (!question) return state;
      return {
        questionsById: {
          ...state.questionsById,
          [questionId]: { ...question, ...patch },
        },
        dirty: true,
      };
    }),

  addOption: (questionId, label) =>
    set((state) => {
      const question = state.questionsById[questionId];
      if (!question) return state;
      const option: Option = {
        id: newEntityId(),
        label,
        value: label,
        order: question.options.length,
      };
      return {
        questionsById: {
          ...state.questionsById,
          [questionId]: { ...question, options: [...question.options, option] },
        },
        dirty: true,
      };
    }),

  updateOption: (questionId, optionId, label) =>
    set((state) => {
      const question = state.questionsById[questionId];
      if (!question) return state;
      return {
        questionsById: {
          ...state.questionsById,
          [questionId]: {
            ...question,
            options: question.options.map((o) =>
              o.id === optionId ? { ...o, label, value: label } : o
            ),
          },
        },
        dirty: true,
      };
    }),

  deleteOption: (questionId, optionId) => {
    const state = get();
    const question = state.questionsById[questionId];
    if (!question) return null;
    const index = question.options.findIndex((o) => o.id === optionId);
    if (index < 0) return null;
    const option = question.options[index];
    set({
      questionsById: {
        ...state.questionsById,
        [questionId]: {
          ...question,
          options: question.options
            .filter((o) => o.id !== optionId)
            .map((o, order) => ({ ...o, order })),
        },
      },
      dirty: true,
    });
    return { option, questionId, index };
  },

  restoreOption: (snap) =>
    set((state) => {
      const question = state.questionsById[snap.questionId];
      if (!question) return state;
      return {
        questionsById: {
          ...state.questionsById,
          [snap.questionId]: {
            ...question,
            options: insertAt(question.options, snap.index, snap.option),
          },
        },
        dirty: true,
      };
    }),

  importOptions: (questionId, labels) =>
    set((state) => {
      const question = state.questionsById[questionId];
      if (!question) return state;
      const next = [...question.options];
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
      return {
        questionsById: {
          ...state.questionsById,
          [questionId]: { ...question, options: next },
        },
        dirty: true,
      };
    }),

  toTreePayload: () => buildTreePayload(get()),

  assembleForm: () => {
    const state = get();
    if (!state.form) return null;
    const payload = buildTreePayload(state);
    if (!payload) return null;
    return {
      ...state.form,
      sections: payload.sections.map((s) => ({
        ...state.sectionsById[s.id],
        questions: s.questions.map((q) => state.questionsById[q.id]),
      })),
    };
  },
}));

export function getTargetSectionId(): string | null {
  const { activeSectionId, sectionOrder } = useBuilderStore.getState();
  return activeSectionId ?? sectionOrder[sectionOrder.length - 1] ?? null;
}

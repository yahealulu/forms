"use client";

import {
  CircleDot,
  CheckSquare,
  Type as TypeIcon,
  AlignRight,
  Hash,
  Calendar,
  Upload,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { QuestionType } from "@/shared/types";

export interface QuestionTypeMeta {
  label: string;
  icon: LucideIcon;
  hasOptions: boolean;
}

/** Central registry of question-type metadata (label + icon). */
export const questionTypeMeta: Record<QuestionType, QuestionTypeMeta> = {
  single_choice: { label: "اختيار واحد", icon: CircleDot, hasOptions: true },
  multiple_choice: { label: "اختيار متعدد", icon: CheckSquare, hasOptions: true },
  short_text: { label: "نص قصير", icon: TypeIcon, hasOptions: false },
  long_text: { label: "نص طويل", icon: AlignRight, hasOptions: false },
  number: { label: "رقم", icon: Hash, hasOptions: false },
  date: { label: "تاريخ", icon: Calendar, hasOptions: false },
  file_upload: { label: "رفع ملف", icon: Upload, hasOptions: false },
  rating: { label: "تقييم", icon: Star, hasOptions: false },
};

export const questionTypeOrder: QuestionType[] = [
  "single_choice",
  "multiple_choice",
  "short_text",
  "long_text",
  "number",
  "date",
  "file_upload",
  "rating",
];

import type { AnswerValue, Form, FormResponse } from "@/shared/types";

function includesAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((n) => lower.includes(n.toLowerCase()));
}

function isNameQuestion(title: string): boolean {
  return includesAny(title, ["الاسم الكامل", "الاسم", "full name"]);
}

function isEmailQuestion(title: string): boolean {
  return includesAny(title, ["بريد", "إلكتروني", "الكتروني", "email"]);
}

function looksLikeEmail(value: string): boolean {
  const at = value.indexOf("@");
  const dot = value.lastIndexOf(".");
  return at > 0 && dot > at + 1 && dot < value.length - 1 && !value.includes(" ");
}

function firstStringAnswer(
  form: Form,
  response: Pick<FormResponse, "sections">,
  match: (title: string) => boolean
): string | undefined {
  const answers = collectFirstInstanceAnswers(response);
  for (const section of form.sections) {
    for (const question of section.questions) {
      if (question.type !== "short_text" && question.type !== "long_text") {
        continue;
      }
      if (!match(question.title)) continue;
      const value = answers.get(question.id);
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }
  return undefined;
}

function collectFirstInstanceAnswers(
  response: Pick<FormResponse, "sections">
): Map<string, AnswerValue> {
  const map = new Map<string, AnswerValue>();
  for (const section of response.sections ?? []) {
    const instance = section.instances?.[0];
    if (!instance?.answers) continue;
    for (const [questionId, value] of Object.entries(instance.answers)) {
      if (!map.has(questionId)) map.set(questionId, value);
    }
  }
  return map;
}

function findEmailInAnswers(
  form: Form,
  response: Pick<FormResponse, "sections">
): string | undefined {
  const fromTitle = firstStringAnswer(form, response, isEmailQuestion);
  if (fromTitle && looksLikeEmail(fromTitle)) return fromTitle;

  const answers = collectFirstInstanceAnswers(response);
  for (const section of form.sections) {
    for (const question of section.questions) {
      if (question.type !== "short_text") continue;
      const value = answers.get(question.id);
      if (typeof value === "string" && looksLikeEmail(value.trim())) {
        return value.trim();
      }
    }
  }
  return undefined;
}

/**
 * Prefer stored submitter fields; otherwise pull name/email from answered questions.
 */
export function resolveSubmitter(
  response: FormResponse,
  form?: Form
): { name?: string; email?: string } {
  const storedName = response.submitterName?.trim() || undefined;
  const storedEmail = response.submitterEmail?.trim() || undefined;
  if (!form) {
    return { name: storedName, email: storedEmail };
  }
  return {
    name: storedName ?? firstStringAnswer(form, response, isNameQuestion),
    email: storedEmail ?? findEmailInAnswers(form, response),
  };
}

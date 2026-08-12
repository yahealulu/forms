/**
 * Seed data — 4 pre-built forms at startup covering every question type
 * and both normal + repeatable sections.
 */
import { db, uuid, now, clone } from "./store";
import type {
  Form,
  FormResponse,
  Option,
  Question,
  Section,
} from "@/shared/types";

function makeOption(label: string, order: number): Option {
  return {
    id: uuid(),
    label,
    value: label,
    order,
  };
}

function makeQuestion(
  partial: Partial<Question> & { sectionId: string; title: string; type: Question["type"]; order: number }
): Question {
  return {
    id: uuid(),
    description: "",
    required: false,
    placeholder: "",
    options: [],
    ...partial,
  };
}

function seedForms() {
  // ── Form 1: طلب ترخيص نشاط تجاري ──
  const form1Id = "f1a2b3c4-d1e2-3f4a-5b6c-7d8e9f0a1b2c";
  const s1Id = uuid();
  const s2Id = uuid();
  const s3Id = uuid();

  const form1: Form = {
    id: form1Id,
    title: "طلب ترخيص نشاط تجاري",
    description:
      "استمارة طلب ترخيص لمزاولة نشاط تجاري داخل نطاق البلدية. يرجى تعبئة جميع الحقول المطلوبة بدقة.",
    status: "published",
    entityName: "بلدية المنطقة الكبرى",
    accentColor: "#B69D6E",
    createdAt: "2024-09-01T08:00:00.000Z",
    updatedAt: "2024-11-15T10:30:00.000Z",
    publishedAt: "2024-11-15T10:30:00.000Z",
    sections: [],
  };

  const section1: Section = {
    id: s1Id,
    formId: form1Id,
    title: "بيانات مقدم الطلب",
    description: "المعلومات الأساسية لمالك النشاط التجاري",
    order: 0,
    isRepeatable: false,
    minRepeat: 1,
    maxRepeat: 1,
    repeatLabel: "",
    questions: [
      makeQuestion({
        sectionId: s1Id,
        title: "الاسم الكامل",
        type: "short_text",
        required: true,
        placeholder: "أدخل الاسم رباعياً",
        order: 0,
      }),
      makeQuestion({
        sectionId: s1Id,
        title: "رقم الهوية الوطنية",
        type: "number",
        required: true,
        placeholder: "10 أرقام",
        order: 1,
        min: 1000000000,
        max: 9999999999,
      }),
      makeQuestion({
        sectionId: s1Id,
        title: "البريد الإلكتروني",
        type: "short_text",
        required: true,
        placeholder: "example@gov.sa",
        order: 2,
      }),
      makeQuestion({
        sectionId: s1Id,
        title: "نوع النشاط التجاري",
        type: "single_choice",
        required: true,
        order: 3,
        options: [
          makeOption("تجزئة", 0),
          makeOption("جملة", 1),
          makeOption("خدمات", 2),
          makeOption("صناعية خفيفة", 3),
        ],
      }),
    ],
  };

  const section2: Section = {
    id: s2Id,
    formId: form1Id,
    title: "المشاريع التجارية",
    description:
      "أضف كل مشروع تجاري تود ترخييصه. يمكن تكرار هذا القسم حتى 5 مرات.",
    order: 1,
    isRepeatable: true,
    minRepeat: 1,
    maxRepeat: 5,
    repeatLabel: "مشروع",
    questions: [
      makeQuestion({
        sectionId: s2Id,
        title: "اسم المشروع التجاري",
        type: "short_text",
        required: true,
        order: 0,
      }),
      makeQuestion({
        sectionId: s2Id,
        title: "وصف موجز للنشاط",
        type: "long_text",
        required: true,
        placeholder: "صف طبيعة النشاط التجاري...",
        order: 1,
      }),
      makeQuestion({
        sectionId: s2Id,
        title: "العنوان التفصيلي للموقع",
        type: "long_text",
        required: true,
        order: 2,
      }),
      makeQuestion({
        sectionId: s2Id,
        title: "المساحة بالمتر المربع",
        type: "number",
        required: true,
        order: 3,
        min: 1,
      }),
      makeQuestion({
        sectionId: s2Id,
        title: "الوثائق المرفقة",
        type: "file_upload",
        required: true,
        order: 4,
        allowedExtensions: [".pdf", ".jpg", ".png"],
        maxFileSizeMB: 5,
      }),
    ],
  };

  const section3: Section = {
    id: s3Id,
    formId: form1Id,
    title: "إقرار وتعهد",
    description: "أقر بصحة المعلومات المقدمة",
    order: 2,
    isRepeatable: false,
    minRepeat: 1,
    maxRepeat: 1,
    repeatLabel: "",
    questions: [
      makeQuestion({
        sectionId: s3Id,
        title: "أتعهد بصحة المعلومات المقدمة أعلاه",
        type: "single_choice",
        required: true,
        order: 0,
        options: [
          makeOption("نعم، أتعهد بذلك", 0),
          makeOption("لا", 1),
        ],
      }),
      makeQuestion({
        sectionId: s3Id,
        title: "تقييم وضوح الاستمارة",
        type: "rating",
        required: false,
        order: 1,
        maxRating: 5,
      }),
    ],
  };

  form1.sections = [section1, section2, section3];
  db.forms.set(form1.id, clone(form1));
  [section1, section2, section3].forEach((s) => db.sections.set(s.id, clone(s)));
  [section1, section2, section3].forEach((s) =>
    s.questions.forEach((q) => {
      db.questions.set(q.id, clone(q));
      q.options.forEach((o) => db.options.set(o.id, clone(o)));
    })
  );

  // ── Form 2: استبيان رضا المواطن عن الخدمات ──
  const form2Id = "a2b3c4d5-e2f3-4a5b-6c7d-8e9f0a1b2c3d";
  const f2s1 = uuid();
  const f2s2 = uuid();

  const form2: Form = {
    id: form2Id,
    title: "استبيان رضا المواطن عن الخدمات الحكومية",
    description:
      "نسعى لتحسين جودة خدماتنا المقدمة لكم. يرجى تخصيص دقائق للإجابة على هذا الاستبيان.",
    status: "published",
    entityName: "وزارة الخدمة المدنية",
    accentColor: "#B69D6E",
    createdAt: "2024-10-10T09:00:00.000Z",
    updatedAt: "2024-12-01T14:00:00.000Z",
    publishedAt: "2024-12-01T14:00:00.000Z",
    sections: [],
  };

  const f2sec1: Section = {
    id: f2s1,
    formId: form2Id,
    title: "معلومات عامة",
    order: 0,
    isRepeatable: false,
    minRepeat: 1,
    maxRepeat: 1,
    repeatLabel: "",
    questions: [
      makeQuestion({
        sectionId: f2s1,
        title: "الفئة العمرية",
        type: "single_choice",
        required: true,
        order: 0,
        options: [
          makeOption("18 - 25", 0),
          makeOption("26 - 35", 1),
          makeOption("36 - 45", 2),
          makeOption("46 - 55", 3),
          makeOption("أكبر من 55", 4),
        ],
      }),
      makeQuestion({
        sectionId: f2s1,
        title: "الخدمات التي استفدت منها (يمكن اختيار أكثر من واحدة)",
        type: "multiple_choice",
        required: true,
        order: 1,
        options: [
          makeOption("خدمات جوازات السفر", 0),
          makeOption("خدمات الأحوال المدنية", 1),
          makeOption("الخدمات البلدية", 2),
          makeOption("الخدمات التعليمية", 3),
          makeOption("الخدمات الصحية", 4),
        ],
      }),
    ],
  };

  const f2sec2: Section = {
    id: f2s2,
    formId: form2Id,
    title: "تقييم الخدمات المستخدمة",
    description: "كرر هذا القسم لكل خدمة استفدت منها",
    order: 1,
    isRepeatable: true,
    minRepeat: 1,
    maxRepeat: 4,
    repeatLabel: "خدمة",
    questions: [
      makeQuestion({
        sectionId: f2s2,
        title: "اسم الخدمة",
        type: "short_text",
        required: true,
        order: 0,
      }),
      makeQuestion({
        sectionId: f2s2,
        title: "مدى الرضا عن الخدمة",
        type: "rating",
        required: true,
        order: 1,
        maxRating: 5,
      }),
      makeQuestion({
        sectionId: f2s2,
        title: "ملاحظات إضافية",
        type: "long_text",
        required: false,
        order: 2,
        placeholder: "شاركنا اقتراحاتك للتحسين...",
      }),
    ],
  };

  form2.sections = [f2sec1, f2sec2];
  db.forms.set(form2.id, clone(form2));
  [f2sec1, f2sec2].forEach((s) => db.sections.set(s.id, clone(s)));
  [f2sec1, f2sec2].forEach((s) =>
    s.questions.forEach((q) => {
      db.questions.set(q.id, clone(q));
      q.options.forEach((o) => db.options.set(o.id, clone(o)));
    })
  );

  // ── Form 3: نموذج تقديم وظيفة ──
  const form3Id = "b3c4d5e6-f3a4-5b6c-7d8e-9f0a1b2c3d4e";
  const f3s1 = uuid();
  const f3s2 = uuid();
  const f3s3 = uuid();

  const form3: Form = {
    id: form3Id,
    title: "نموذج تقديم على وظيفة",
    description: "استمارة التقدم للوظائف الشاغرة في الجهة الحكومية.",
    status: "draft",
    entityName: "الهيئة العامة للتدريب",
    accentColor: "#B69D6E",
    createdAt: "2024-11-20T11:00:00.000Z",
    updatedAt: "2024-12-10T16:00:00.000Z",
    sections: [],
  };

  const f3sec1: Section = {
    id: f3s1,
    formId: form3Id,
    title: "البيانات الشخصية",
    order: 0,
    isRepeatable: false,
    minRepeat: 1,
    maxRepeat: 1,
    repeatLabel: "",
    questions: [
      makeQuestion({
        sectionId: f3s1,
        title: "الاسم الكامل",
        type: "short_text",
        required: true,
        order: 0,
      }),
      makeQuestion({
        sectionId: f3s1,
        title: "تاريخ الميلاد",
        type: "date",
        required: true,
        order: 1,
      }),
      makeQuestion({
        sectionId: f3s1,
        title: "الجنسية",
        type: "short_text",
        required: true,
        order: 2,
      }),
    ],
  };

  const f3sec2: Section = {
    id: f3s2,
    formId: form3Id,
    title: "المؤهلات العلمية",
    description: "أضف كل مؤهل علمي حصلت عليه",
    order: 1,
    isRepeatable: true,
    minRepeat: 1,
    maxRepeat: 6,
    repeatLabel: "مؤهل",
    questions: [
      makeQuestion({
        sectionId: f3s2,
        title: "اسم المؤهل",
        type: "short_text",
        required: true,
        order: 0,
      }),
      makeQuestion({
        sectionId: f3s2,
        title: "التخصص",
        type: "short_text",
        required: true,
        order: 1,
      }),
      makeQuestion({
        sectionId: f3s2,
        title: "سنة التخرج",
        type: "number",
        required: true,
        order: 2,
        min: 1970,
        max: 2030,
      }),
      makeQuestion({
        sectionId: f3s2,
        title: "جهة التخرج",
        type: "short_text",
        required: true,
        order: 3,
      }),
      makeQuestion({
        sectionId: f3s2,
        title: "الشهادة المرفقة",
        type: "file_upload",
        required: true,
        order: 4,
        allowedExtensions: [".pdf"],
        maxFileSizeMB: 3,
      }),
    ],
  };

  const f3sec3: Section = {
    id: f3s3,
    formId: form3Id,
    title: "الخبرات العملية",
    description: "أضف كل خبرة عملية سابقة",
    order: 2,
    isRepeatable: true,
    minRepeat: 0,
    maxRepeat: 8,
    repeatLabel: "خبرة",
    questions: [
      makeQuestion({
        sectionId: f3s3,
        title: "اسم جهة العمل",
        type: "short_text",
        required: true,
        order: 0,
      }),
      makeQuestion({
        sectionId: f3s3,
        title: "المسمى الوظيفي",
        type: "short_text",
        required: true,
        order: 1,
      }),
      makeQuestion({
        sectionId: f3s3,
        title: "مدة العمل بالسنوات",
        type: "number",
        required: true,
        order: 2,
        min: 1,
      }),
      makeQuestion({
        sectionId: f3s3,
        title: "وصف المهام",
        type: "long_text",
        required: false,
        order: 3,
      }),
    ],
  };

  form3.sections = [f3sec1, f3sec2, f3sec3];
  db.forms.set(form3.id, clone(form3));
  [f3sec1, f3sec2, f3sec3].forEach((s) => db.sections.set(s.id, clone(s)));
  [f3sec1, f3sec2, f3sec3].forEach((s) =>
    s.questions.forEach((q) => {
      db.questions.set(q.id, clone(q));
      q.options.forEach((o) => db.options.set(o.id, clone(o)));
    })
  );

  // ── Form 4: نموذج الشكاوى والبلاغات ──
  const form4Id = "c4d5e6f7-a4b5-6c7d-8e9f-0a1b2c3d4e5f";
  const f4s1 = uuid();

  const form4: Form = {
    id: form4Id,
    title: "نموذج تقديم شكوى أو بلاغ",
    description: "للإبلاغ عن أي مخالفة أو تقديم شكوى رسمية.",
    status: "published",
    entityName: "الجهة الحكومية",
    accentColor: "#B69D6E",
    createdAt: "2024-08-05T07:00:00.000Z",
    updatedAt: "2024-11-30T12:00:00.000Z",
    publishedAt: "2024-11-30T12:00:00.000Z",
    sections: [],
  };

  const f4sec1: Section = {
    id: f4s1,
    formId: form4Id,
    title: "تفاصيل الشكوى",
    order: 0,
    isRepeatable: false,
    minRepeat: 1,
    maxRepeat: 1,
    repeatLabel: "",
    questions: [
      makeQuestion({
        sectionId: f4s1,
        title: "نوع الشكوى",
        type: "single_choice",
        required: true,
        order: 0,
        options: [
          makeOption("مخالفة بلدية", 0),
          makeOption("تجاوز سلامة", 1),
          makeOption("أخرى", 2),
        ],
      }),
      makeQuestion({
        sectionId: f4s1,
        title: "وصف تفصيلي للشكوى",
        type: "long_text",
        required: true,
        order: 1,
        placeholder: "اشرح بالتفصيل...",
      }),
      makeQuestion({
        sectionId: f4s1,
        title: "الأدلة والوثائق",
        type: "file_upload",
        required: false,
        order: 2,
        allowedExtensions: [".pdf", ".jpg", ".png", ".docx"],
        maxFileSizeMB: 8,
      }),
    ],
  };

  form4.sections = [f4sec1];
  db.forms.set(form4.id, clone(form4));
  db.sections.set(f4sec1.id, clone(f4sec1));
  f4sec1.questions.forEach((q) => {
    db.questions.set(q.id, clone(q));
    q.options.forEach((o) => db.options.set(o.id, clone(o)));
  });

  // ── Seed a few responses for form 1 ──
  seedResponses(form1Id, form1);
  seedResponses(form2Id, form2);
}

function seedResponses(formId: string, form: Form) {
  const count = formId === "f1a2b3c4-d1e2-3f4a-5b6c-7d8e9f0a1b2c" ? 3 : 2;
  const names = ["أحمد محمد العلي", "فاطمة خالد السالم", "عبدالله إبراهيم النعيمي", "نورة سعد القحطاني"];

  for (let i = 0; i < count; i++) {
    const sections = form.sections.map((s) => {
      const instanceCount = s.isRepeatable
        ? Math.min(s.maxRepeat, Math.max(s.minRepeat, 1 + (i % 2)))
        : 1;
      const instances = Array.from({ length: instanceCount }).map((_, idx) => {
        const answers: Record<string, unknown> = {};
        s.questions.forEach((q) => {
          switch (q.type) {
            case "short_text":
              answers[q.id] = idx === 0 ? names[i] : `${names[i]} - ${idx + 1}`;
              break;
            case "long_text":
              answers[q.id] = "هذه إجابة تجريبية لتوضيح شكل البيانات في تفاصيل الاستمارة.";
              break;
            case "number":
              answers[q.id] = q.type === "number" ? 1000 + i * 100 + idx : null;
              break;
            case "single_choice":
              answers[q.id] = q.options[i % q.options.length]?.value ?? "";
              break;
            case "multiple_choice":
              answers[q.id] = [q.options[0]?.value, q.options[2]?.value].filter(Boolean);
              break;
            case "rating":
              answers[q.id] = 3 + (i % 3);
              break;
            case "file_upload":
              answers[q.id] = [];
              break;
            default:
              answers[q.id] = null;
          }
        });
        return {
          instanceId: uuid(),
          instanceIndex: idx,
          answers: answers as never,
        };
      });
      return { sectionId: s.id, instances };
    });

    const response: FormResponse = {
      id: uuid(),
      formId,
      submittedAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
      submitterName: names[i % names.length],
      submitterEmail: `user${i + 1}@example.gov.sa`,
      sections: sections as never,
      completion: 100,
    };
    db.responses.set(response.id, clone(response));
  }
}

/** Initialize the database with seed data if not already done. */
export function initDb() {
  if (db.initialized) return;
  db.initialized = true;
  seedForms();
}

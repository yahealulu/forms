# Worklog — Dynamic Electronic Forms Management System

---
Task ID: 1-5
Agent: Main (Z.ai Code)
Task: Foundation setup — install deps, RTL + Arabic fonts, design tokens, shared types, security utils, in-memory DB with seed data, API routes, TanStack Query hooks, providers, UI store, layout components (Logo, Header, Sidebar, Footer), and Forms List dashboard view.

Work Log:
- Installed: xlsx, gsap, dompurify, @faker-js/faker
- Copied emblem.png (gold eagle + 3 stars, ~#B69D6E) to /public
- globals.css: charcoal/gold government palette, RTL scrollbar, shimmer + attention-pulse utilities
- layout.tsx: Cairo + IBM Plex Sans Arabic fonts, dir="rtl", lang="ar", Providers + Toaster + Sonner
- next.config.ts: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy
- design-tokens.ts: motionTokens (duration/ease/stagger), colorTokens, layoutTokens
- shared/types/index.ts: Form, Section, Question, Option, FormResponse, SectionResponse, RepeatableInstance, QuestionType, ExcelColumn
- shared/lib/security: DOMPurify sanitizeHtml/sanitizeText, isValidUUID, validateFile (magic bytes + forbidden extensions), verifyFileSignature
- shared/lib/api-client.ts: typed fetch wrapper (get/post/patch/delete/upload) + ApiError
- mocks/db/store.ts: globalThis singleton with Maps per entity (forms, sections, questions, options, responses, files) + clone/uuid/now helpers
- mocks/db/seed.ts: 4 seeded forms (commercial license, citizen satisfaction survey, job application, complaints) covering ALL question types + repeatable sections; 5 seeded responses
- mocks/db/queries.ts: full CRUD + reorder + bulk import + file storage + response creation
- mocks/utils/delay.ts: randomDelay(300-900ms) simulated latency
- API routes (all under /api): forms (GET/POST), forms/[formId] (GET/PATCH/DELETE with type-to-confirm + force-delete), forms/[formId]/responses (GET/POST), forms/[formId]/responses/[responseId] (GET), sections (POST), sections/[sectionId] (PATCH/DELETE), sections/[sectionId]/reorder (PATCH), questions (POST), questions/[questionId] (PATCH/DELETE), questions/[questionId]/reorder (PATCH), questions/[questionId]/options (POST), questions/[questionId]/options/[optionId] (PATCH/DELETE), questions/[questionId]/options/import-excel (POST), files/upload (POST FormData → data URL)
- components/providers.tsx: QueryClientProvider (staleTime 30s, retry 1)
- stores/useUIStore.ts: Zustand view-navigation store (dashboard, builder, responses, response-detail, filler) + sidebarCollapsed
- shared/components/motion: FadeIn, StaggerList, StaggerItem, PageTransition using motionTokens
- shared/components/layout: Logo (emblem.png, faint mode), Header (sticky, view title, RTL), Sidebar (280px, RTL right-side, contextual nav), Footer (sticky bottom, mt-auto)
- features/forms-management/hooks/useForms.ts: useForms, useForm, useCreateForm, useUpdateForm, useDeleteForm + formsKeys
- features/form-builder/hooks/useFormBuilder.ts: useCreateSection, useUpdateSection, useDeleteSection, useReorderSections, useCreateQuestion, useUpdateQuestion, useDeleteQuestion, useReorderQuestions, useAddOption, useUpdateOption, useDeleteOption, useImportExcelOptions
- features/responses/hooks/useResponses.ts: useFormResponses, useFormResponse, useSubmitFormResponse + responsesKeys
- features/form-filler/hooks/useFiles.ts: useUploadFile
- features/forms-management/components/FormsListView.tsx: dashboard with stats band, staggered form cards, create dialog, type-to-confirm delete with force-delete for forms with responses, empty state
- app/page.tsx: single-route shell with AnimatePresence view switching

Stage Summary:
- Foundation + API layer + all TanStack hooks + layout + dashboard fully implemented.
- Established patterns: use `toast` from sonner, motionTokens for all animations, government gold/charcoal palette, RTL throughout.
- Available hooks for subagents: useForms/useForm/useCreateForm/useUpdateForm/useDeleteForm, useFormBuilder.* (sections/questions/options/import-excel), useResponses/useFormResponses/useFormResponse/useSubmitFormResponse, useUploadFile.
- Shared types in @/shared/types. Security in @/shared/lib/security. Motion in @/shared/components/motion. Design tokens in @/styles/design-tokens.
- View switching via useUIStore.setView({ name: "builder"|"responses"|"response-detail"|"filler", formId, responseId? }).
- Dev server running on port 3000.

---
Task ID: 11
Agent: Responses feature (Z.ai Code)
Task: Build the **Responses** feature — list view (table with filtering + sorting) and a Sheet-based detail viewer, plus a full-page detail view, all RTL Arabic with government gold/charcoal palette.

Files created:
- `src/features/responses/components/ResponsesView.tsx` — exported named `ResponsesView({ formId })`. Hero header (back-to-builder button, form title, count badge "X استجابة", entity sub-label, "تحرير النموذج" shortcut), 3-card stats strip (total responses / avg completion / latest submission date), body renders `ResponsesTable`, mounts `ResponseDetailSheet`. Loading state → `TableBlockSkeleton`. Empty state → friendly "لا توجد استجابات بعد لهذا النموذج." with icon and helper text. Uses `useForm` + `useFormResponses`.
- `src/features/responses/components/ResponsesTable.tsx` — shadcn `Table` based (no TanStack Table, kept dependency-light). Columns (RTL → submitter on right): مقدم الطلب (avatar initial + name + email), تاريخ الإرسال (sortable), نسبة الاكتمال (sortable, inline RTL progress bar), عدد العناصر (count of section instances, badge), إجراءات (عرض button). Search input filters by submitter name/email. Sort toggle on date & completion headers with `ChevronsUpDown` / `ChevronUp` / `ChevronDown` icons + `aria-sort` on the `<th>`. Rows use Framer Motion staggered entrance (`motion.tr` with delay capped at 0.4s), `hover:bg-muted/50`, row click opens Sheet. Includes `TableSkeleton` and `EmptyTable` (differentiates query-empty vs no-data).
- `src/features/responses/components/ResponseDetailSheet.tsx` — shadcn `Sheet` with `side="left"` (trailing edge in RTL) and `sm:max-w-[640px]`. Header has submitter title + form sub-label + "فتح في صفحة كاملة" button (deferred `setView({ name: "response-detail", formId, responseId })` after 120ms to let the close animation start). Body wrapped in `ScrollArea`, renders `ResponseDetailContent`. Loading skeleton + not-found state with `AlertCircle`. Uses `useForm` + `useFormResponse`.
- `src/features/responses/components/ResponseDetailView.tsx` — exported named `ResponseDetailView({ formId, responseId })`. Full-page version: header with back-to-responses button (chevron `rtl-flip`), form title, response id badge; body renders same `ResponseDetailContent`. Loading skeleton + dedicated "الاستجابة غير موجودة" not-found state with back CTA.
- `src/features/responses/components/ResponseDetailContent.tsx` — shared body for Sheet + DetailView (DRY). Submitter header card (gold-tinted gradient, mailto link, completion badge + RTL progress bar). Mirrors the form's structure: iterates `form.sections` → for non-repeatable sections renders a Q&A grid (`grid-cols-[1fr_1.4fr]` on sm+), for repeatable sections renders each instance as a numbered block using `section.repeatLabel` (e.g. "مشروع 1"). Each section block is a Card with `Layers` icon header, repeatable sections also show instance count badge. Per-question rows show required asterisk + description. Uses Framer Motion entrance per section (delay = index * 0.05).
- `src/features/responses/components/AnswerDisplay.tsx` — exported `AnswerDisplay({ question, value })` (helper) + `CompletionBar({ value, className, showLabel })`. AnswerDisplay switches on `question.type`:
  - `short_text` / `long_text` → `sanitizeText(value)` then render (long_text preserves whitespace via `whitespace-pre-wrap`)
  - `number` → tabular-nums with `Hash` icon, `toLocaleString("ar-EG")`
  - `date` → `toLocaleDateString("ar-SA", { year, month: 'long', day })` with `CalendarDays` icon
  - `single_choice` → matches option by value/label, gold-tinted Badge
  - `multiple_choice` → filtered option labels as outline Badges
  - `rating` → row of `Star` icons (filled gold up to value, muted remainder) + numeric ratio
  - `file_upload` → file-name Badges with `Paperclip` icon, names sanitized
  - Exhaustive `never` guard for future question types
  - `EmptyAnswer` returns italic muted "لا توجد إجابة" with `FileText` icon
  - `CompletionBar` is a custom inline RTL progress bar (gold-gradient fill anchored to `right-0`) since the stock shadcn `Progress` slides from the left (LTR semantics).

Key decisions:
- **Kept the table dependency-light** — used shadcn `Table` directly with local `useMemo` filter/sort instead of TanStack Table; avoids an 80KB+ dep for 4 columns.
- **Shared `ResponseDetailContent`** between the Sheet and the full-page DetailView to guarantee identical rendering and reduce duplication; the same `AnswerDisplay` helper covers all 8 question types.
- **Sheet slides from `side="left"`** — that's the trailing edge in RTL, which matches how detail panels conventionally appear in right-to-left UIs.
- **All free-text answers (short_text, long_text) pass through `sanitizeText`** before rendering; file names in `file_upload` are also sanitized to neutralize any XSS attempt via crafted filenames.
- **Custom RTL progress bar** instead of shadcn `Progress` so the fill grows from the right edge in RTL.
- **Exhaustive switch on `question.type`** with a `_exhaustive: never` guard surfaces future question types at compile time.
- **`aria-sort`** is on the `<th>` (not the inner button) per a11y semantics — fixed during lint pass.
- Strict TypeScript throughout; no `any`. The `answers` records in instances are typed as `Record<string, AnswerValue | unknown>` at the boundary because seed data assigns `unknown` via `as never` — value lookup falls back to `null` which renders the `EmptyAnswer` placeholder.
- All animations use `motionTokens.duration` / `ease` / `stagger` — no magic numbers.

Quality checks:
- `bunx eslint src/features/responses --max-warnings=0` → exit 0 (0 errors, 0 warnings).
- Verified filter (name/email substring), sort toggle (asc/desc on date and completion), row click → Sheet opens, Sheet "فتح في صفحة كاملة" → setView to `response-detail`.
- Verified the structured detail mirrors the form: non-repeatable sections render Q&A list; repeatable sections render numbered instance blocks using `section.repeatLabel`.
- Verified `sanitizeText` is applied to every short_text/long_text/file-name render path.

Notes for downstream agents:
- `page.tsx` already imports `ResponsesView` and `ResponseDetailView` (added by main scaffold) — both now exist, so the only remaining missing modules are `FormBuilderView` (Task ID for form-builder) and `FormFillerView` (Task ID for form-filler).
- `useUIStore.setView({ name: "responses", formId })` is the canonical entry point to this view; the FormsListView dropdown already wires this.
- If a future agent adds a new `QuestionType`, they must extend `AnswerDisplay`'s switch (the `never` guard will fail to compile until they do).

---
Task ID: 8-9
Agent: Subagent — Form Builder (Z.ai Code)
Task: Build the complete admin Form Builder view (interactive canvas) plus the `useExcelParser` hook and the Excel import column-picker modal.

Files Created:
- `src/features/form-builder/components/FormBuilderView.tsx` — main three-zone view (palette right, canvas center, live preview left), DnD-context with `closestCenter`, top toolbar with inline-editable title / status badge / معاينة / الاستجابات / حفظ ونشر, loading skeleton, error fallback, empty state with attention-pulsed CTA, mobile palette Sheet.
- `src/features/form-builder/components/SectionCard.tsx` — dnd-kit sortable card (header drag-handle, inline title, repeatable Switch, collapse toggle, AlertDialog delete); smoothly expands `RepeatableSectionSettings` when `isRepeatable`; nested `SortableContext` for its questions; "إضافة سؤال" button with `animate-attention-pulse`.
- `src/features/form-builder/components/QuestionEditor.tsx` — dnd-kit sortable row (drag handle, type Select with per-type icon, inline title, required Switch, خيارات Popover → OptionsManager, type-specific config panels for file_upload/rating/number with `useAdjustableState`, AlertDialog delete).
- `src/features/form-builder/components/OptionsManager.tsx` — list of options with inline-edit + delete (group-hover reveals actions), manual add input, embedded `ExcelImportDropzone`, staggered fade+slide-up entrance for new options via Framer Motion `staggerChildren`.
- `src/features/form-builder/components/RepeatableSectionSettings.tsx` — min/max (0..20) + repeatLabel inputs in a gold-tinted panel; smooth height-auto expand/collapse via Framer Motion `AnimatePresence`.
- `src/features/form-builder/components/LivePreviewPanel.tsx` — collapsible LEFT preview (~400px) rendering each question type as a non-functional input (radio/checkbox/text/textarea/number/date/file-dropzone/stars); `Eye`/`EyeOff` toggle, scrollable.
- `src/features/form-builder/components/ExcelImportDropzone.tsx` — dashed dropzone, Framer Motion scale 1.02 + `border-gold` on drag-over, accepts `.xlsx/.xls/.csv`; 1 column → direct `useImportExcelOptions`; >1 column → opens `ExcelColumnPickerModal`.
- `src/features/form-builder/components/ExcelColumnPickerModal.tsx` — the precisely-specified feature:
  - Dialog titled exactly: «هذا الملف يحتوي على أكثر من مجموعة خيارات — اختر واحدة لهذا السؤال.»
  - Each column → independent Card in a 1-col (mobile) / 2-col (desktop) grid.
  - Cards stagger in with `motionTokens.stagger.cards`.
  - Selected card: `ring-2 ring-gold shadow-[0_0_0_4px_rgba(182,157,110,0.15)]` + animated CheckCircle2 corner badge.
  - Multi-select IS NOT permitted: clicking a 2nd card → newly-clicked card SHAKES (`animate={{ x: [0, -4, 4, -4, 0] }}` with `transition={{ duration: 0.25 }}`) + the EXACT toast message («يمكنك اختيار مجموعة واحدة فقط لهذا السؤال — يقتصر الاختيار على واحدة من المجموعات الأربع.») is shown; original selection remains.
  - Confirm button disabled until exactly one card is selected; animates smooth color transition when enabled (AnimatePresence opacity swap + `transition-colors duration-300`).
  - On confirm → Dialog exit animation, then `useImportExcelOptions` is called with the selected column's values.
- `src/features/form-builder/components/question-type-meta.ts` — central registry mapping each `QuestionType` to `{ label, icon, hasOptions }` (CircleDot / CheckSquare / Type / AlignRight / Hash / Calendar / Upload / Star) and `questionTypeOrder`.
- `src/features/form-builder/hooks/useExcelParser.ts` — standalone reusable hook returning `{ parse, columns, isParsing, error, reset }`; uses SheetJS to read the first sheet, detects columns via header-row heuristic, infers `columnLabel` (e.g. «العمود A — <preview>») when no header, filters empty values, works for any column count (4 is the typical case, enforced at the UI layer).
- `src/features/form-builder/hooks/useAdjustableState.ts` — small helper implementing the React «adjusting state when a prop changes» pattern (replaces `useEffect`-based syncing so the `react-hooks/set-state-in-effect` lint rule passes).

Key Decisions:
- **Avoided `useEffect` for prop→state sync.** React 19 / Next.js 16's `react-hooks/set-state-in-effect` rule disallows `setState` inside effects. Built `useAdjustableState` (uses the «adjust state during render» pattern from react.dev) — used in `FormBuilderView` (form title), `SectionCard` (section title), `QuestionEditor` (question title + file/rating/number config drafts).
- **DnD scope.** A single `DndContext` wraps the whole builder. `onDragEnd` checks whether both `active.id` and `over.id` are section ids → reorder sections; else whether both belong to the SAME section's question ids → reorder questions inside that section. Cross-section question moves intentionally no-op (matches spec: «sortable within the section»). `PointerSensor` activation constraint = 6px so taps on inputs inside sortable rows don't start a drag; drag handle is the only listener target.
- **Inline editing.** All editable inputs (form title, section title, question title, option labels, repeatable settings) commit on blur or Enter; empty values revert to the last server value with a toast.
- **Mobile responsiveness.** Palette collapses to a Sheet triggered by a `Wand2` icon button in the toolbar (`lg:hidden`); live-preview panel is `hidden lg:block` and toggles via `Eye`/`EyeOff`; on mobile the toolbar «معاينة» button invokes the full filler view (interactive preview).
- **Excel picker behaviour.** Single-select enforced at the click handler: a 2nd card click triggers the shake animation on the newly-clicked card only (via transient `shakingIdx` state that auto-clears after 280ms), the original selection is left untouched, and the exact government copy is toasted. To switch columns the user must first deselect.
- **All animations** use `motionTokens` (duration.fast/base/slow/page, ease.smooth/snappy/gentle, stagger.list/cards) — no hardcoded magic numbers. Government palette respected (`text-gold`, `bg-gold/10`, `border-gold`, `ring-gold`, `bg-gold-dark text-white`).

Quality:
- `bun run lint` — 0 errors / 0 warnings in all newly-created files (one unrelated warning in another agent's `useDynamicFormSchema.ts`).
- Dev server compiles successfully (HTTP 200, `GET / 200 in ~50ms`).
- Verified form detail API shape (`/api/forms/[id]`) matches `Form`/`Section`/`Question`/`Option` types consumed by the components.

Integration Notes for Next Agents:
- `FormBuilderView` is exported as a named export and accepts `{ formId: string }`.
- All sub-components are co-located under `src/features/form-builder/components/` and import shared hooks (`useFormBuilder.*`, `useForm`, `useUpdateForm`) and shared types from `@/shared/types`.
- `question-type-meta.ts` is reusable — future agents (Form Filler, Responses, Live Preview) should import `questionTypeMeta` and `questionTypeOrder` from here to avoid drift.
- `useExcelParser` is standalone and reusable for any client-side Excel column detection.

---
Task ID: 10
Agent: Form Filler Subagent (Z.ai Code)
Task: Build the complete public form-filling view (FormFillerView) — the dynamic rendering engine — including all supporting components and the dynamic Zod schema hook.

Files created:
- src/features/form-filler/hooks/useDynamicFormSchema.ts — builds a Zod schema at runtime from the Form definition. Per-question schemas cover all 8 question types (single_choice, multiple_choice, short_text, long_text, number, date, file_upload, rating). Repeatable sections become `z.array(z.object(...)).min(minRepeat).max(maxRepeat)`. Also exports `buildDefaultValues(form)` (seeds RHF with the right shape: empty string for scalar fields, [] for multi/file, and `minRepeat` instances for repeatable sections) and the `FormValues = Record<string, any>` alias shared across the feature.
- src/features/form-filler/components/QuestionField/_QuestionShell.tsx — internal shared wrapper that renders the question title (with red asterisk for required, "(اختياري)" tag otherwise), description, children slot, and validation error slot.
- src/features/form-filler/components/QuestionField/SingleChoiceField.tsx — shadcn RadioGroup, vertical layout, hover row highlight.
- src/features/form-filler/components/QuestionField/MultiChoiceField.tsx — shadcn Checkbox per option, toggles values in/out of the array.
- src/features/form-filler/components/QuestionField/TextField.tsx — Input for short_text, Textarea for long_text (resizable, min-h-24).
- src/features/form-filler/components/QuestionField/NumberField.tsx — Input type=number with min/max; helper text shows allowed range.
- src/features/form-filler/components/QuestionField/DateField.tsx — Input type=date (ISO format).
- src/features/form-filler/components/QuestionField/FileField.tsx — dropzone/button with full upload pipeline: validateFile → verifyFileSignature → useUploadFile. Shows pending spinner, allowed extensions + max size as helper text, uploaded file list with per-file remove button, toasts on rejection.
- src/features/form-filler/components/QuestionField/RatingField.tsx — row of Lucide Star buttons (default 5, configurable maxRating). Hover highlights stars up to cursor; smooth color/scale transition using motionTokens durations. ARIA radiogroup semantics.
- src/features/form-filler/components/QuestionField/index.tsx — dispatcher that picks the right sub-field by question.type via a static FIELD_MAP.
- src/features/form-filler/components/RepeatableSectionBlock.tsx — uses useFieldArray({ control, name: section.id }). Numbered instance cards titled `${repeatLabel} ${index+1}`. Delete button appears only on hover/focus (opacity-0 → group-hover). AnimatePresence + motion.div layout for smooth exit (fade + slide + height collapse) and reflow. "+ إضافة [repeatLabel]" button auto-disables at maxRepeat with Tooltip "لقد وصلت إلى الحد الأقصى المسموح (X)". minRepeat instances guaranteed on mount via useEffect safety-net. Delete disabled (with Lock icon + tooltip) when at minRepeat.
- src/features/form-filler/components/ProgressIndicator.tsx — shadcn Progress bar at top, subscribes to RHF watch() for real-time updates. Counts required questions across all sections (repeatable sections weighted by minRepeat) and computes filled/total/percent. Gold indicator fill. Shows "جاهز للإرسال" badge at 100%.
- src/features/form-filler/components/SubmitSuccessAnimation.tsx — full-screen fixed overlay with backdrop blur. GSAP 3-step timeline inside useLayoutEffect + gsap.context() (cleanup via revert()): (1) draw SVG circle via strokeDasharray/strokeDashoffset (0.6s power2.out), (2) draw checkmark path using getTotalLength() (0.4s power2.out, ">-0.05" overlap), (3) fade-in "تم إرسال استمارتك بنجاح" + sub-text + "العودة للوحة التحكم" button (gsap.fromTo opacity+y, "+=0.1"). Faint Logo in background (opacity 0.06). Gold accent for circle/checkmark. Button calls useUIStore.setView({ name: "dashboard" }).
- src/features/form-filler/components/FormRenderer.tsx — dynamic rendering engine. Iterates over form.sections (sorted by order). Each section wrapped in motion.section with initial={{ opacity:0, y:20 }}, whileInView, viewport={{ once:true, margin:"-50px" }}, transition uses motionTokens.duration.slow + ease.smooth. Non-repeatable sections render as Card with QuestionField per question (name=`${sectionId}.${questionId}`). Repeatable sections delegate to RepeatableSectionBlock.
- src/features/form-filler/components/FormFillerView.tsx — top-level public view. Fetches form via useForm(formId). Loading → FormFillerSkeleton. Not-found/archived/draft → Alert with "النموذج غير موجود أو لم يعد متاحاً." + return button. Builds schema via useDynamicFormSchema + useForm({ resolver: zodResolver(schema), defaultValues, mode: "onTouched" }). Wraps everything in FormProvider so ProgressIndicator / FormRenderer / RepeatableSectionBlock / QuestionField all use useFormContext. Simplified public header (Logo + entityName + title + description). Sticky bottom submit bar with motion.div whileHover/whileTap (scale 1.02/0.97). Button disabled for the entire submit lifecycle (RHF formState.isSubmitting || mutation.isPending) — prevents double submission. On success → SubmitSuccessAnimation overlay. On error → sonner toast. Submit transforms RHF values → FormResponse["sections"] shape via transformToFormResponse: each non-repeatable section → one instance at index 0; each repeatable section → array of instances. instanceId via crypto.randomUUID() with fallback. sanitizeAnswers strips empty strings and coerces number/rating answers from input strings to actual numbers.

Key decisions:
- Lifted `useForm` to FormFillerView and exposed state via `FormProvider`. This lets ProgressIndicator subscribe to the whole form via `watch()` without prop-drilling, and lets RepeatableSectionBlock use `useFieldArray` cleanly.
- Used `FormValues = Record<string, any>` (with explanatory comment) as the RHF values type. The schema is built at runtime, so static typing of nested paths is impossible. `any` is necessary for `useFieldArray`'s `FieldArrayPath` resolution.
- For repeatable sections, `useFieldArray` name = `sectionId`, and child QuestionField names follow `${sectionId}.${index}.${questionId}` (RHF resolves the index as an array access).
- Default values pre-populate repeatable sections with `Math.max(1, minRepeat)` empty instances, so the field array always starts in a valid state. A useEffect safety-net re-appends if the count ever drops below minRepeat.
- Submit bar uses BOTH `methods.formState.isSubmitting` (covers RHF validation + handler window) AND `submitMutation.isPending` (covers the network window) to disable the button — closes the race window between click and React state propagation.
- The success animation uses `gsap.context()` scoped to a ref for safe cleanup on unmount; `getTotalLength()` is called on the checkmark path at runtime so the stroke-draw effect adapts to any path geometry.
- File upload pipeline enforces the full security chain: validateFile (extension + magic-byte-eligible + size) → verifyFileSignature (actual magic bytes) → useUploadFile. Each rejection path produces a targeted sonner toast with the file name as description.
- All animations use motionTokens (durations + eases). Gold accent color (`--gold` / `--gold-dark`) is used consistently for progress fill, success ring/checkmark, submit button gradient, and rating stars.
- Section entrance animations use `whileInView` with `viewport={{ once: true, margin: "-50px" }}` so they don't replay on scroll-up.

Quality gates:
- `bun run lint` — passes (0 errors, 0 warnings) on all form-filler files.
- `tsc --noEmit --skipLibCheck` — no errors in any form-filler file.
- Dev server (`bun run dev`) compiles successfully; GET / returns 200; no runtime errors in dev.log for the form-filler feature.

Stage summary:
- The form-filler feature is fully implemented and ready for end-to-end testing once a published form is opened via the dashboard's "filler" action.
- Hooks available for downstream agents: `useDynamicFormSchema(form)` returns the memoised Zod schema; `buildDefaultValues(form)` and `buildDynamicFormSchema(form)` are exported for reuse (e.g. by a future "edit response" feature).
- The dynamic schema + FormProvider architecture means future question types can be added by extending `buildQuestionSchema` + the FIELD_MAP in QuestionField/index.tsx — no changes needed to FormRenderer or FormFillerView.

---
Task ID: 12 (final integration & verification)
Agent: Main (Z.ai Code)
Task: Wire everything into single / route, fix runtime bugs, verify all flows with Agent Browser.

Work Log:
- Fixed critical runtime error: `ReferenceError: n is not defined` in RepeatableSectionSettings.tsx — literal `{n}` in JSX was interpreted as a variable. Replaced with static text "#1، #2...".
- Fixed Form Filler blocking draft forms: relaxed the status check to allow previewing drafts from the builder (only block "archived").
- Fixed Excel import mutation not firing: root cause was the OptionsManager used a Radix Popover that closed (unmounting ExcelImportDropzone) when the ExcelColumnPickerModal Dialog opened on top. Converted the OptionsManager container from Popover to Dialog (nested dialogs are supported by Radix). Removed the AnimatePresence wrapper around the confirm button that was also intercepting clicks.
- Fixed emblem image aspect-ratio warning: added `style={{ width: size, height: "auto" }}` to next/image.
- Verified via Agent Browser (VLM analysis):
  - Dashboard: 9/10 — professional government dashboard, flawless RTL, gold/charcoal palette, staggered cards.
  - Form Builder: 8.5/10 — three-zone layout (palette right, canvas center, preview left), dnd-kit sortable sections + questions, repeatable toggle with animated settings, all 8 question types with icons.
  - Form Filler: 8/10 — dynamic rendering of all question types, repeatable "مشروع 1/مشروع 2" instances with add/remove, progress indicator, GSAP success animation (circle draw → checkmark draw → text fade).
  - Success screen: 9/10 — GSAP-drawn checkmark in circle, gold accent, formal government tone, faint emblem background.
  - Excel column picker modal: 8/10 — 2x2 grid of column cards, staggered entrance, gold selection highlight + checkmark, shake animation + toast on multi-select attempt (exact specified copy), disabled confirm until one selected.
  - Responses detail sheet: 9/10 — mirrors form structure including repeatable section instances, sanitized text, RTL correct.
- Verified Excel import end-to-end: POST /api/questions/:id/options/import-excel returns 201, options count went from 7 → 13 (6 imported), cache invalidation refreshes the UI.
- `bun run lint` passes with 0 errors, 0 warnings.

Stage Summary:
- ALL features functional and verified in the browser:
  1. Dashboard with 4 seeded forms, stats, create dialog, type-to-confirm delete.
  2. Form Builder with drag-and-drop sections/questions, repeatable settings, live preview, all question types, Excel import with the precise single-select modal.
  3. Form Filler with dynamic Zod validation, all 8 field types, repeatable sections with AnimatePresence, progress indicator, GSAP success animation, double-submit prevention.
  4. Responses table with search/sort + detail sheet mirroring form structure.
- 100% RTL Arabic, government gold/charcoal identity, motionTokens used everywhere, security headers (CSP, X-Frame-Options, nosniff), DOMPurify sanitization, file validation (magic bytes + forbidden extensions), UUID validation on routes.
- Single `/` route with view-switching via Zustand, sticky footer, responsive.

---
Task ID: 13 (archive + download button)
Agent: Main (Z.ai Code)
Task: Add (1) a terminal command to archive the whole project into a folder, and (2) a small download button on the website to download the project locally.

Work Log:
- Created `scripts/archive.sh` — a bash script that zips the entire project (excluding node_modules, .next, .git, logs, db, screenshots, etc.) into the `archive/` folder. Supports custom names: `bash scripts/archive.sh [name]`. Default name includes timestamp.
- Added `"archive"` script to package.json → `bun run archive` or `bash scripts/archive.sh`.
- Created API route `GET /api/project/export` (`src/app/api/project/export/route.ts`) — generates the zip on-demand using the system `zip` command into a temp dir, returns it as a downloadable `application/zip` attachment with `Content-Disposition: attachment; filename="forms-system-<timestamp>.zip"`.
- Created `DownloadProjectButton` component (`src/shared/components/layout/DownloadProjectButton.tsx`) — a compact button with 3 animated states (idle/downloading/done), Framer Motion transitions, tooltip, and a success toast. Uses fetch → blob → programmatic `<a download>` click to trigger the browser download.
- Added the button to the Header (visible on all non-filler views, top-left in RTL).
- Verified: `bun run lint` passes (0 errors). API returns HTTP 200 with 224KB valid zip (216 files). Browser click triggers the download + shows "تم التنزيل" success state + toast with filename.
- The archive excludes: node_modules, .next, .git, archive/, tests/, upload/, download/, skills/, agent-ctx/, *.log, *.db, screenshots, tsconfig.tsbuildinfo, bun.lock.

Stage Summary:
- Terminal command: `bun run archive` or `bash scripts/archive.sh [optional-name]` → creates `archive/forms-system-<timestamp>.zip` (1.5M, source only).
- Website button: "تنزيل المشروع" button in the header → downloads the project zip to the user's device with animated loading/success states + toast confirmation.
- Both verified working via Agent Browser and curl.

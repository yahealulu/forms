# Frontend migration — NestJS API (plan only)

This file is the plan to detach the Next.js SPA from the in-memory mock and talk only to the NestJS backend. **Do not apply these code changes until the backend is running.**

Backend lives at `../backend` (sibling of this repo). Contract is identical: `{ data, message }` / `{ error, code }`.

## 1. Goal

- Next.js = UI only (no `src/app/api/*`, no `src/mocks`)
- All data from NestJS on port **3001**
- Remove `randomDelay` (it lives only in mock routes)

## 2. Environment

Add `.env.local` (and `.env.example` if you keep one):

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Never commit real secrets. CORS on the API must include this app origin (`http://localhost:3000` by default).

## 3. `api-client.ts`

Today `fetch(url)` uses relative paths (`/api/forms`). Change `request()` to prefix:

```ts
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const path = url.startsWith("http") ? url : `${API_BASE}${url}`;
  // ... existing fetch(path, ...)
}
```

Keep `ApiError` parsing of `error` / `message` / `code` unchanged.

## 4. Delete mock backend

After the client points at Nest:

- Delete `src/app/api/` (all route handlers)
- Delete `src/mocks/` (`db/store`, `seed`, `queries`, `utils/delay.ts`)
- Search repo for `randomDelay`, `mocks/db`, `@/mocks` — should be zero
- Do **not** delete `src/shared/types` or `src/shared/lib/security` (client validation + sanitization still useful)

`useExcelParser` stays client-side (SheetJS). Only the import-excel **HTTP** call hits Nest.

## 5. File preview URL

Mock returned a **data URL** in `previewUrl`. Nest returns:

`{PUBLIC_URL}/api/files/:fileId` e.g. `http://localhost:3001/api/files/<uuid>`

Filler / response-detail that render `previewUrl` or `<img src>` should use that URL as-is (GET is public). If any UI still assumes `data:` prefix, drop that assumption.

Answers still store `{ fileId, fileName }[]` — unchanged.

## 6. Dates

API returns ISO strings (`createdAt`, `updatedAt`, `publishedAt`, `submittedAt`) — same as mock. No frontend date parsing change.

## 7. Extra fields

List endpoint still sends `_questionCount` and `_responseCount`. Nested GET still sends full `sections → questions → options`.

## 8. Publish improvement

Backend now sets `publishedAt` on first transition to `published`. UI already displays it if present.

## 9. Verification checklist

- [ ] `npm run dev` on frontend + Nest on 3001
- [ ] Dashboard lists 4 seed forms
- [ ] Open builder, add section/question/option, reorder
- [ ] Publish + toggle enable
- [ ] Fill public form, upload file, submit
- [ ] Responses list + detail
- [ ] Delete form with confirm `حذف` (and force-delete path)
- [ ] No calls to `/api` on the Next origin except Next internals
- [ ] Network tab: requests go to `:3001`

## 10. Hooks that must keep working (no signature change)

`useForms`, `useForm`, `useCreateForm`, `useUpdateForm`, `useDeleteForm`, builder hooks in `useFormBuilder.ts`, `useFormResponses`, `useFormResponse`, `useSubmitFormResponse`, `useUploadFile`.

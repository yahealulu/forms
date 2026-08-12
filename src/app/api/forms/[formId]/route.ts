import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { getFormWithRelations, updateForm, deleteForm, getResponsesForForm } from "@/mocks/db/queries";
import { isValidUUID } from "@/shared/lib/security";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  await randomDelay();
  const { formId } = await params;
  if (!isValidUUID(formId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const form = getFormWithRelations(formId);
  if (!form) {
    return NextResponse.json({ error: "النموذج غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ data: form });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  await randomDelay();
  const { formId } = await params;
  if (!isValidUUID(formId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  const updated = updateForm(formId, body);
  if (!updated) {
    return NextResponse.json({ error: "النموذج غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ data: updated, message: "تم تحديث النموذج" });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  await randomDelay();
  const { formId } = await params;
  if (!isValidUUID(formId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  if (body.confirmText !== "حذف") {
    return NextResponse.json(
      { error: "يتطلب التأكيد كتابة كلمة «حذف»" },
      { status: 422 }
    );
  }
  const responses = getResponsesForForm(formId);
  if (responses.length > 0 && body.forceDelete !== true) {
    return NextResponse.json(
      {
        error: `لا يمكن حذف النموذج لأنه يحتوي على ${responses.length} استجابة. أكد الحذف الإجباري للمتابعة.`,
        code: "HAS_RESPONSES",
      },
      { status: 422 }
    );
  }
  const ok = deleteForm(formId);
  if (!ok) {
    return NextResponse.json({ error: "النموذج غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ message: "تم حذف النموذج" });
}

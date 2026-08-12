import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { updateQuestion, deleteQuestion } from "@/mocks/db/queries";
import { isValidUUID } from "@/shared/lib/security";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  await randomDelay();
  const { questionId } = await params;
  if (!isValidUUID(questionId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  const updated = updateQuestion(questionId, body);
  if (!updated) {
    return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ data: updated, message: "تم تحديث السؤال" });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  await randomDelay();
  const { questionId } = await params;
  if (!isValidUUID(questionId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const ok = deleteQuestion(questionId);
  if (!ok) {
    return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ message: "تم حذف السؤال" });
}

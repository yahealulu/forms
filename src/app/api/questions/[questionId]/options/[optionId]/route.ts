import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { updateOption, deleteOption } from "@/mocks/db/queries";
import { isValidUUID } from "@/shared/lib/security";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string; optionId: string }> }
) {
  await randomDelay(150, 400);
  const { optionId } = await params;
  if (!isValidUUID(optionId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  if (!body.label) {
    return NextResponse.json({ error: "نص الخيار مطلوب" }, { status: 400 });
  }
  const updated = updateOption(optionId, body.label);
  if (!updated) {
    return NextResponse.json({ error: "الخيار غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ data: updated, message: "تم تحديث الخيار" });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ questionId: string; optionId: string }> }
) {
  await randomDelay(150, 400);
  const { optionId } = await params;
  if (!isValidUUID(optionId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const ok = deleteOption(optionId);
  if (!ok) {
    return NextResponse.json({ error: "الخيار غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ message: "تم حذف الخيار" });
}

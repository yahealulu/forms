import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { updateSection, deleteSection } from "@/mocks/db/queries";
import { isValidUUID } from "@/shared/lib/security";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  await randomDelay();
  const { sectionId } = await params;
  if (!isValidUUID(sectionId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  const updated = updateSection(sectionId, body);
  if (!updated) {
    return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ data: updated, message: "تم تحديث القسم" });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  await randomDelay();
  const { sectionId } = await params;
  if (!isValidUUID(sectionId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const ok = deleteSection(sectionId);
  if (!ok) {
    return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ message: "تم حذف القسم" });
}

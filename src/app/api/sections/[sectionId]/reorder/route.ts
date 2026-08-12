import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { reorderSections } from "@/mocks/db/queries";
import { isValidUUID } from "@/shared/lib/security";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  await randomDelay(150, 350);
  const { sectionId } = await params;
  if (!isValidUUID(sectionId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  const { formId, orderedIds } = body;
  if (!formId || !Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "بيانات إعادة الترتيب غير مكتملة" }, { status: 400 });
  }
  reorderSections(formId, orderedIds);
  return NextResponse.json({ message: "تم إعادة الترتيب" });
}

import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { reorderQuestions } from "@/mocks/db/queries";
import { isValidUUID } from "@/shared/lib/security";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  await randomDelay(150, 350);
  const { questionId } = await params;
  if (!isValidUUID(questionId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  const { sectionId, orderedIds } = body;
  if (!sectionId || !Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "بيانات إعادة الترتيب غير مكتملة" }, { status: 400 });
  }
  reorderQuestions(sectionId, orderedIds);
  return NextResponse.json({ message: "تم إعادة الترتيب" });
}

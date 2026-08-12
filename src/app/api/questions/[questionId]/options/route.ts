import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { addOption } from "@/mocks/db/queries";
import { isValidUUID } from "@/shared/lib/security";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  await randomDelay(150, 400);
  const { questionId } = await params;
  if (!isValidUUID(questionId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  if (!body.label || typeof body.label !== "string") {
    return NextResponse.json({ error: "نص الخيار مطلوب" }, { status: 400 });
  }
  const option = addOption(questionId, body.label);
  if (!option) {
    return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ data: option, message: "تمت إضافة الخيار" }, { status: 201 });
}

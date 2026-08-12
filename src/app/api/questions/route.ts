import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { createQuestion } from "@/mocks/db/queries";

export async function POST(req: NextRequest) {
  await randomDelay();
  const body = await req.json();
  const { sectionId, ...data } = body;
  if (!sectionId) {
    return NextResponse.json({ error: "معرّف القسم مطلوب" }, { status: 400 });
  }
  const question = createQuestion(sectionId, data);
  if (!question) {
    return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ data: question, message: "تم إنشاء السؤال" }, { status: 201 });
}

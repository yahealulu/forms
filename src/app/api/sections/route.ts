import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { createSection } from "@/mocks/db/queries";

export async function POST(req: NextRequest) {
  await randomDelay();
  const body = await req.json();
  const { formId, ...data } = body;
  if (!formId) {
    return NextResponse.json({ error: "معرّف النموذج مطلوب" }, { status: 400 });
  }
  const section = createSection(formId, data);
  if (!section) {
    return NextResponse.json({ error: "النموذج غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ data: section, message: "تم إنشاء القسم" }, { status: 201 });
}

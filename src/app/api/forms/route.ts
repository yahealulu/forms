import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { getAllForms, createForm } from "@/mocks/db/queries";

export async function GET() {
  await randomDelay();
  const forms = getAllForms();
  return NextResponse.json({ data: forms });
}

export async function POST(req: NextRequest) {
  await randomDelay();
  const body = await req.json();
  const { title, description, entityName } = body;
  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { error: "عنوان النموذج مطلوب" },
      { status: 400 }
    );
  }
  const form = createForm(title, description || "", entityName || "الجهة الحكومية");
  return NextResponse.json({ data: form, message: "تم إنشاء النموذج بنجاح" }, { status: 201 });
}

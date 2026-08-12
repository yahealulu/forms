import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { getResponsesForForm, createResponse } from "@/mocks/db/queries";
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
  const responses = getResponsesForForm(formId);
  return NextResponse.json({ data: responses });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  await randomDelay(500, 1200);
  const { formId } = await params;
  if (!isValidUUID(formId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  if (!body.sections || !Array.isArray(body.sections)) {
    return NextResponse.json(
      { error: "بيانات الاستمارة غير مكتملة" },
      { status: 400 }
    );
  }
  const response = createResponse(formId, body);
  if (!response) {
    return NextResponse.json({ error: "النموذج غير موجود" }, { status: 404 });
  }
  return NextResponse.json(
    { data: response, message: "تم إرسال الاستمارة بنجاح" },
    { status: 201 }
  );
}

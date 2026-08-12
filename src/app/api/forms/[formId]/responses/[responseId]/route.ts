import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { getResponse } from "@/mocks/db/queries";
import { isValidUUID } from "@/shared/lib/security";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ formId: string; responseId: string }> }
) {
  await randomDelay();
  const { responseId } = await params;
  if (!isValidUUID(responseId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const response = getResponse(responseId);
  if (!response) {
    return NextResponse.json({ error: "الاستجابة غير موجودة" }, { status: 404 });
  }
  return NextResponse.json({ data: response });
}

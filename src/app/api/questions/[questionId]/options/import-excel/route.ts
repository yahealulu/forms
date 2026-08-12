import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { importOptionsBulk } from "@/mocks/db/queries";
import { isValidUUID } from "@/shared/lib/security";

/**
 * Bulk-import options for a question from a chosen Excel column.
 * The client parses the Excel file (SheetJS) and sends the selected column's values.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  await randomDelay(400, 800);
  const { questionId } = await params;
  if (!isValidUUID(questionId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json();
  const { values } = body;
  if (!Array.isArray(values) || values.length === 0) {
    return NextResponse.json(
      { error: "قائمة القيم فارغة أو غير صالحة" },
      { status: 400 }
    );
  }
  const created = importOptionsBulk(questionId, values);
  if (created.length === 0) {
    return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 });
  }
  return NextResponse.json(
    { data: created, message: `تم استيراد ${created.length} خيار بنجاح` },
    { status: 201 }
  );
}

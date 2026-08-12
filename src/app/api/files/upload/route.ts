import { NextRequest, NextResponse } from "next/server";
import { randomDelay } from "@/mocks/utils/delay";
import { storeFile } from "@/mocks/db/queries";

/**
 * File upload handler — accepts FormData, stores the file as a data URL
 * in the in-memory store, and returns a real, browser-usable file_id + preview link.
 */
export async function POST(req: NextRequest) {
  await randomDelay(600, 1200);
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
  }

  // Convert to data URL for in-memory storage + instant preview
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  const fileId = storeFile(file.name, file.type, dataUrl, file.size);

  return NextResponse.json(
    {
      data: {
        fileId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        previewUrl: dataUrl,
      },
      message: "تم رفع الملف بنجاح",
    },
    { status: 201 }
  );
}

import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(
  /\/$/,
  ""
);

/**
 * JSON envelope so IDM never sees application/pdf / attachment.
 * Client rebuilds a Blob and previews/downloads from blob: URLs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const fileName = request.nextUrl.searchParams.get("name") ?? "file";

    const upstream = await fetch(
      `${API_BASE}/api/files/${encodeURIComponent(fileId)}`
    );

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "تعذّر جلب الملف" },
        { status: upstream.status || 502 }
      );
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";

    return NextResponse.json(
      {
        data: buffer.toString("base64"),
        contentType,
        fileName,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "تعذّر جلب الملف" }, { status: 502 });
  }
}

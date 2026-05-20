import { NextRequest, NextResponse } from "next/server";
import { getOCRWorker } from "@/lib/ocrWorker";
import { hashBuffer, getFromCache, setToCache } from "@/lib/ocrCache";
import { parseCalendarText } from "@/lib/parseCalendarText";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const OCR_TIMEOUT_MS = 15_000;

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await req.json();

    const {
      imageBase64,
      mediaType,
      year,
      month,
    }: {
      imageBase64?: string;
      mediaType?: string;
      year?: number;
      month?: number;
    } = body;

    if (!imageBase64 || !mediaType || !year || !month) {
      return NextResponse.json(
        { error: "Missing required fields", requestId },
        { status: 400 }
      );
    }

    // 1. base64 clean
    const cleanBase64 = imageBase64.replace(
      /^data:image\/\w+;base64,/i,
      ""
    );

    const buffer = Buffer.from(cleanBase64, "base64");

    // 2. size check
    if (buffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image too large", requestId },
        { status: 413 }
      );
    }

    // 3. cache
    const key = hashBuffer(buffer);
    const cached = getFromCache(key);

    if (cached) {
      return NextResponse.json({
        events: cached.events,
        requestId,
        fromCache: true,
      });
    }

    // 4. OCR worker
    const worker = await getOCRWorker();

    const recognizePromise = worker.recognize(buffer);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("OCR timeout")), OCR_TIMEOUT_MS)
    );

    const result = await Promise.race([
      recognizePromise,
      timeoutPromise,
    ]);

    const text = result.data.text;

    // 5. parse
    const events = parseCalendarText(text, year, month);

    // 6. cache save (🔥 ts 필수)
    setToCache(key, {
      ts: Date.now(),
      events,
    });

    return NextResponse.json({
      events,
      requestId,
      fromCache: false,
    });
  } catch (err: any) {
    console.error("[OCR ERROR]", err);

    return NextResponse.json(
      {
        error: "OCR failed",
        detail: err.message,
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { hashBuffer, getFromCache, setToCache } from "@/lib/ocrCache";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Gemini 무료 모델: gemini-1.5-flash (분당 15회, 하루 1500회 무료)
const GEMINI_MODEL = "gemini-1.5-flash-8b-latest";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function POST(req: NextRequest) {
  const requestId = randomUUID();

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
        { error: "필수 필드 누락", requestId },
        { status: 400 }
      );
    }

    // 1. data URL 접두사 제거
    const cleanBase64 = imageBase64.replace(
      /^data:image\/\w+;base64,/i,
      ""
    );

    const buffer = Buffer.from(cleanBase64, "base64");

    // 2. 용량 체크
    if (buffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "이미지가 너무 큽니다 (최대 5MB)", requestId },
        { status: 413 }
      );
    }

    // 3. 캐시 확인
    const key = `${hashBuffer(buffer)}:${year}:${month}`;
    const cached = getFromCache(key);

    if (cached) {
      return NextResponse.json({
        events: cached.events,
        requestId,
        fromCache: true,
      });
    }

    // 4. Gemini Vision API 호출
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY가 설정되지 않았습니다", requestId },
        { status: 500 }
      );
    }

    const prompt = `이 사진은 ${year}년 ${month}월 벽달력입니다.

달력에서 일정을 모두 찾아서 아래 형식으로만 출력해줘:
YYYY-MM-DD|HH:MM|일정 제목

규칙:
- 연도는 ${year}, 월은 ${String(month).padStart(2, "0")} 사용
- 시간이 없으면 두 번째 칸을 비워둬: YYYY-MM-DD||일정 제목
- 날짜가 불분명하면 해당 항목은 건너뜀
- 한글 그대로 출력
- 설명 없이 데이터만 출력

예시:
${year}-${String(month).padStart(2, "0")}-05|14:00|치과 예약
${year}-${String(month).padStart(2, "0")}-12||엄마 생신`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mediaType.startsWith("image/")
                    ? mediaType
                    : "image/jpeg",
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // 낮을수록 일관된 출력
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("[Gemini API 오류]", geminiRes.status, errBody);
      return NextResponse.json(
        { error: "Vision API 실패", detail: errBody, requestId },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();

    // Gemini 응답 구조: candidates[0].content.parts[0].text
    const rawText: string =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    console.log("[Gemini OCR 결과]", rawText);

    // 5. 파싱
    const events = parseStructuredText(rawText, year, month);

    // 6. 캐시 저장
    setToCache(key, { ts: Date.now(), events });

    return NextResponse.json({ events, requestId, fromCache: false });

  } catch (err: any) {
    console.error("[OCR 오류]", err);
    return NextResponse.json(
      { error: "OCR 실패", detail: err?.message ?? "알 수 없는 오류" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// 파이프 구분 형식 파싱
// YYYY-MM-DD|HH:MM|제목  또는  YYYY-MM-DD||제목
// ─────────────────────────────────────────────
function parseStructuredText(
  text: string,
  year: number,
  month: number
) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const events: { date: string; title: string; time: string }[] = [];

  for (const line of lines) {
    const parts = line.split("|");

    if (parts.length >= 3) {
      const [datePart, timePart, ...titleParts] = parts;
      const title = titleParts.join("|").trim();
      const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(datePart.trim());

      if (dateOk && title) {
        events.push({
          date: datePart.trim(),
          time: timePart.trim(),
          title,
        });
      }
    }
    // 형식 불일치 줄은 조용히 무시
    // (필요하면 parseCalendarText 폴백 추가 가능)
  }

  // 중복 제거
  return events.filter(
    (e, i, arr) =>
      i === arr.findIndex(
        (x) => x.date === e.date && x.title === e.title && x.time === e.time
      )
  );
}
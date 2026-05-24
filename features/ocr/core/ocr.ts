import { GoogleGenAI } from "@google/genai";
import type { OcrEvent } from '../types';

/**
 * Run OCR on an image blob using Gemini Vision.
 * @param blob - Image file blob
 * @returns Object containing raw text, normalized events, and tasks
 */
export async function runOCR(blob: Blob): Promise<{
  raw: string;
  normalized: OcrEvent[];
  tasks: OcrEvent[];
}> {
  // Debug: Check if API key is available
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  console.log('[OCR] API Key 존재 여부:', !!apiKey, apiKey?.slice(0, 8) + '...'); // 앞 8자만 출력

  // Initialize AI inside function to avoid browser API key issues
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  console.log("[OCR] 프로세스 시작 (Gemini Vision)");

  try {
    const base64 = await blobToBase64(blob);
    const mimeType = blob.type as "image/jpeg" | "image/png" | "image/webp";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
            {
              text: `이 달력 이미지에서 날짜별 손글씨 일정을 모두 추출해줘.
손글씨가 흘려 쓰여 있어도 최대한 읽어줘.
반드시 아래 JSON 형식으로만 응답해. 다른 텍스트 없이 JSON만:
[
  { "date": "YYYY-MM-DD", "title": "일정 내용" }
]
날짜가 불분명하면 건너뛰고, 일정이 없는 날은 포함하지 마.`,
            },
          ],
        },
      ],
    });

    const text = response.text ?? '';
    console.log('[OCR] Gemini 응답 원문:', text);

    // JSON 파싱 (마크다운 코드블록 제거)
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed: Array<{ date: string; title: string }> = JSON.parse(clean);

    const events: OcrEvent[] = parsed
      .filter(e => e.date && e.title && e.title.trim().length > 0)
      .map(e => ({
        date: e.date,
        title: e.title.trim(),
        time: null,
        confidence: 0.95,
      } as OcrEvent));

    console.log('[OCR] 최종 추출 이벤트:', events);
    return { raw: text, normalized: events, tasks: events };

  } catch (error) {
    console.error('[OCR] 오류:', error);
    return { raw: '', normalized: [], tasks: [] };
  }
}

// ─── 헬퍼 ──────────────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // "data:image/...;base64," 제거
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
import { GoogleGenAI } from "@google/genai";
import type { OcrEvent } from '../types';

/**
 * Run OCR on an image blob using Gemini Vision with fallback and retry.
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

  // Helper function for sleep/delay
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Model fallback list - ordered by preference (more stable models first)
  // Note: gemini-2.5-flash-lite often has more 503 errors, so we try standard flash first
  const MODELS = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.5-flash-lite"
  ];

  let lastError;

  // Try each model with retry logic
  for (const model of MODELS) {
    console.log(`[OCR] Trying model: ${model}`);

    // Try up to 3 times per model with exponential backoff
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: blob.type as "image/jpeg" | "image/png" | "image/webp",
                    data: await blobToBase64(blob),
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
        console.log(`[OCR] Gemini 응답 원문 (${model}):`, text);

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

      } catch (err: any) {
        console.error(`[OCR] Model ${model} attempt ${attempt + 1} failed:`, err);

        // Check if it's a 503/UNAVAILABLE error that we should retry
        const is503 =
          err?.message?.includes("503") ||
          err?.message?.includes("UNAVAILABLE") ||
          err?.status === "UNAVAILABLE" ||
          err?.code === 503;

        // If it's not a retryable error or we're on the last attempt, break
        if (!is503 || attempt === 2) {
          lastError = err;
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        await sleep(1000 * (attempt + 1));
      }
    }

    // If we succeeded with this model, we would have returned already
    // If we're here, all retries for this model failed, try next model
    console.log(`[OCR] All retries failed for model: ${model}`);
  }

  // If we get here, all models failed
  console.error('[OCR] All models failed:', lastError);

  // Determine error message
  let errorMessage = 'OCR 처리 중 오류가 발생했습니다.';
  if (lastError?.message?.includes("503") || lastError?.message?.includes("UNAVAILABLE")) {
    errorMessage = 'OCR 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.';
  } else if (lastError?.message?.includes("429")) {
    errorMessage = 'OCR 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
  }

  console.error('[OCR] Final error:', errorMessage);
  throw new Error(errorMessage);
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
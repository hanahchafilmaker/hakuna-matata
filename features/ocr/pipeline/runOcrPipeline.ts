// ─── runOcrPipeline.ts ─────────────────────────────────────────────
// OCR → 정규화 (OCrEvent) → task 변환
import { ocr } from "@/features/ocr/core/ocr";
import { normalizeEvent } from "@/features/ocr/core/normalize";
import { mapToTask } from "@/features/ocr/core/mapToTask";

/**
 * OCR 파이프라인 메인 함수
 * @param file - 업로드된 이미지 파일
 */
export async function runOcrPipeline(file: File) {
  try {
    // 1️⃣ OCR 추출
    const raw = await ocr(file);

    // 2️⃣ 정규화 (OCrEvent[])
    const normalized = raw.map(normalizeEvent);

    // 3️⃣ task 변환 (캘린더용 구조)
    const tasks = mapToTask(normalized);

    return {
      raw,
      normalized,
      tasks,
    };
  } catch (e: unknown) {
    console.error("OCR pipeline error:", e);

    // 오류 시에도 구조는 그대로 유지
    return {
      raw: [],
      normalized: [],
      tasks: [],
    };
  }
}
// ─── runOcrPipeline.ts ─────────────────────────────────────────────
// OCR 파이프라인 메인 함수 - 직접 runOCR 결과 반환
import { runOCR } from "@/features/ocr/core/ocr";

/**
 * OCR 파이프라인 메인 함수
 * @param file - 업로드된 이미지 파일
 */
export async function runOcrPipeline(file: File) {
  try {
    return await runOCR(file);
  } catch (error) {
    console.error("OCR pipeline error:", error);
    return {
      raw: "",
      normalized: [],
      tasks: [],
    };
  }
}
// ─── useOcr.ts ─────────────────────────────────────────────────────
// OCR 파이프라인을 호출하는 커스텀 훅
import { runOcrPipeline } from "../pipeline/runOcrPipeline";

/**
 * OCR을 수행하는 훅
 * @returns {{ runOcr: (file: File) => Promise<any> }}
 */
export function useOcr() {
  const runOcr = async (file: File) => {
    return await runOcrPipeline(file);
  };

  return { runOcr };
}
import { runOcrPipeline } from "@/features/ocr/pipeline/runOcrPipeline";

export async function runScanPipeline(file: File) {
  return await runOcrPipeline(file);
}
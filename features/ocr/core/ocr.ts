import type { OcrEvent } from '../types';

/**
 * Run OCR on an image blob.
 * @param blob - Image file blob
 * @returns Array of OCR events with date, title, time, confidence
 */
export async function runOCR(blob: Blob): Promise<OcrEvent[]> {
  // Stub implementation - replace with actual OCR logic (Tesseract, etc.)
  // For now, return empty array to avoid breaking the pipeline
  return [];
}
// ─── mapOcrToTask.ts ─────────────────────────────────────────────────
// OCR 정규화 결과를 UI 프리뷰용 객체로 변환

/**
 * OCR 정규화 아이템
 */
export interface NormalizedOcrItem {
  text: string;
  start: number | null;
  end: number | null;
}

/**
 * 프리뷰용 객체
 */
export interface PreviewItem {
  label: string;
  range: string;
}

/**
 * 정규화된 배열을 프리뷰 배열로 변환
 * @param items - OCR 정규화 결과
 */
export function mapOcrToTask(items: NormalizedOcrItem[]): PreviewItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    label: item.text,
    range: `${item.start ?? "?"} ~ ${item.end ?? "?"}`,
  }));
}
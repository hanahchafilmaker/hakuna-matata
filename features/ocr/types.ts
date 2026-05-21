
/**
 * ─────────────────────────────────────────────
 * OCR DOMAIN TYPES (CALENDAR SYSTEM)
 * ─────────────────────────────────────────────
 */

/**
 * 단일 OCR 이벤트
 * - 캘린더 셀에서 추출된 1개의 일정
 */
export interface OcrEvent {
  /**
   * YYYY-MM-DD
   */
  date: string;

  /**
   * 일정 제목 (OCR → 정제된 텍스트)
   */
  title: string;

  /**
   * HH:mm 형식
   * - 없으면 null
   * - "" 금지 (일관성 유지)
   */
  time: string | null;

  /**
   * OCR 신뢰도 (0~1)
   * - 선택값 (Tesseract or LLM confidence)
   */
  confidence?: number;

  /**
   * (옵션) 원본 OCR 텍스트
   * - 디버깅용
   */
  raw?: string;
}

/**
 * ─────────────────────────────────────────────
 * REQUEST
 * ─────────────────────────────────────────────
 */
export interface ScanCalendarRequest {
  /**
   * base64 image string
   * - data:image/png;base64,... 가능
   */
  imageBase64: string;

  /**
   * MIME type
   * ex) image/png, image/jpeg
   */
  mediaType: string;

  /**
   * 기준 연도
   */
  year: number;

  /**
   * 기준 월 (1~12)
   */
  month: number;
}

/**
 * ─────────────────────────────────────────────
 * RESPONSE
 * ─────────────────────────────────────────────
 */
export interface ScanCalendarResponse {
  /**
   * 최종 OCR 이벤트 리스트
   */
  events: OcrEvent[];

  /**
   * 메타 정보 (디버깅 / 성능 / 캐시)
   */
  meta?: {
    /**
     * 캐시 사용 여부
     */
    fromCache?: boolean;

    /**
     * 전체 처리 시간 (ms)
     */
    processingTimeMs?: number;

    /**
     * 평균 OCR confidence
     */
    confidence?: number;

    /**
     * 사용된 엔진
     * - "tesseract"
     * - "gemini"
     * - "hybrid"
     */
    engine?: "tesseract" | "gemini" | "hybrid";
  };
}

/**
 * ─────────────────────────────────────────────
 * INTERNAL GRID TYPES (옵션 확장용)
 * ─────────────────────────────────────────────
 */

/**
 * 캘린더 셀 (OpenCV segmentation 결과)
 */
export interface OcrGridCell {
  x: number;
  y: number;
  w: number;
  h: number;

  /**
   * base64 cropped image
   */
  image: string;
}

/**
 * OCR raw result (cell 단위)
 */
export interface OcrRawResult {
  text: string;
  x: number;
  y: number;
  confidence?: number;
}
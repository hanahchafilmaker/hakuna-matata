import type { OcrEvent } from "@/features/ocr/types";
import type { Task } from "@/components/tasks/task-card";

/**
 * OCR Event → Task 변환
 * - OCR raw 데이터를 앱 Task 구조로 정규화
 */
export function mapOcrToTask(event: OcrEvent): Partial<Task> {
  return {
    text: cleanTitle(event.title),

    /**
     * OCR date → Task date
     * (이미 YYYY-MM-DD 기준이라고 가정)
     */
    date_start: normalizeDate(event.date),
    date_end: normalizeDate(event.date),

    /**
     * 🔥 핵심: null → undefined 변환
     * Task는 undefined 기반 구조
     */
    time: event.time ?? undefined,

    assignee: "함께",
    type: "ocr",
    repeat: "none",
    done: false,
    memo: "",
  };
}

// ─────────────────────────────────────────────
// TITLE CLEANING
// ─────────────────────────────────────────────

function cleanTitle(title: string) {
  return title
    .replace(/\s+/g, " ")
    .replace(/[()[\]{}]/g, "")
    .replace(/[:·•●]/g, "")
    .trim();
}

// ─────────────────────────────────────────────
// DATE NORMALIZATION (SAFETY)
// ─────────────────────────────────────────────

function normalizeDate(date: string): string {
  if (!date) return "";

  // YYYY-MM-DD
  let match = date.match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // YY-MM-DD
  match = date.match(/(\d{2})\D(\d{1,2})\D(\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `20${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // M월 D일
  match = date.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (match) {
    const [, m, d] = match;
    const year = new Date().getFullYear();
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // fallback (안전)
  return "";
}

// ─────────────────────────────────────────────
// TIME NORMALIZATION
// ─────────────────────────────────────────────

function normalizeTime(time?: string | null): string | undefined {
  if (!time) return undefined;

  // HH:MM or HH.MM
  let match = time.match(/(\d{1,2})\s*[:.]\s*(\d{1,2})/);
  if (match) {
    const [, h, m] = match;
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  }

  // HH시 MM분
  match = time.match(/(\d{1,2})\s*시\s*(\d{1,2})\s*분/);
  if (match) {
    const [, h, m] = match;
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  }

  // HH시
  match = time.match(/(\d{1,2})\s*시/);
  if (match) {
    const [, h] = match;
    return `${h.padStart(2, "0")}:00`;
  }

  return undefined;
}
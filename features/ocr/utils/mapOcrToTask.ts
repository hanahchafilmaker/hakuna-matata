import type { OcrEvent } from '@/features/ocr/types';
import type { Task } from '@/components/tasks/task-card';

export function mapOcrToTask(event: OcrEvent): Partial<Task> {
  return {
    text: cleanTitle(event.title),
    date_start: normalizeDate(event.date),
    date_end: normalizeDate(event.date),
    time: normalizeTime(event.time),
    assignee: '함께',
    type: 'ocr',
    repeat: 'none',
    done: false,
    memo: '',
  };
}

function cleanTitle(title: string) {
  return title
    .replace(/\s+/g, ' ')
    .replace(/[()[\]]/g, '')
    .trim();
}

function normalizeDate(date: string) {
  // 2026.05.20 / 2026-5-20 / 5월 20일 대응
  const match = date.match(/(\d{1,4})[^\d](\d{1,2})[^\d](\d{1,2})/);

  if (!match) return date;

  const [, y, m, d] = match;
  const year = y.length === 2 ? `20${y}` : y;

  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function normalizeTime(time?: string) {
  if (!time) return undefined;

  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return time;

  const [, h, m] = match;

  return `${h.padStart(2, '0')}:${m}`;
}
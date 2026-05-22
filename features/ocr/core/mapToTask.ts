import type { OcrEvent } from '../types';
import type { Task } from '@/components/tasks/task-card';

export function mapToTask(event: OcrEvent): Partial<Task> {
  return {
    text: event.title,
    date_start: event.date,
    date_end: event.date,
    time: event.time ?? undefined,
    type: 'ocr',
    done: false,
    memo: '',
  };
}
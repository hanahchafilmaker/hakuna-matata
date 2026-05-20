"use client";

import { useState } from 'react';
import { OcrEvent } from '@/features/ocr/types';
import { useTasks } from '@/hooks/use-tasks';
import type { Task } from "@/components/tasks/task-card";

export function OCRPreviewModal({
  isOpen,
  onClose,
  events,
}: {
  isOpen: boolean;
  onClose: () => void;
  events: OcrEvent[];
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const { addTask } = useTasks();

  const handleSave = async () => {
    setIsSaving(true);
    let count = 0;
    try {
      for (const event of events) {
        // Create a task object from the event with OCR-specific assignee and type
        const task: Partial<Task> = {
          text: event.title,
          date_start: event.date,
          date_end: event.date, // assuming same-day events
          time: event.time,
          assignee: '함께',
          type: 'ocr',
          repeat: 'none',
          done: false,
          memo: '',
        };
        try {
          await addTask(task);
          count++;
        } catch (err) {
          console.error('Failed to add task:', err);
        }
      }
      setSavedCount(count);
    } finally {
      setIsSaving(false);
    }
    // Close after a short delay to let the user see the saved count
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white/10 text-white/90 rounded-xl p-6 max-w-md w-full mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/50 hover:text-white transition-opacity"
        >
          ×
        </button>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">추출된 일정</h3>

          {events.length === 0 ? (
            <p className="text-white/50 text-center">일정이 감지되지 않았습니다.</p>
          ) : (
            <ul className="space-y-2">
              {events.map((event, index) => (
                <li key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {event.date}
                    </p>
                    <p className="line-clamp-1">
                      {event.time ? `${event.time} ` : ''}{event.title}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {isSaving ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white/70">저장 중...</span>
            </div>
          ) : (
            <div className="flex justify-between pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white ml-2 ${
                  isSaving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {savedCount > 0 ? `${savedCount}개 저장` : '모두 저장'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
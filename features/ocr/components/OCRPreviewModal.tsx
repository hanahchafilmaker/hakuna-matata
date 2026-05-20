"use client";

import { useState } from "react";
import { OcrEvent } from "@/features/ocr/types";
import type { Task } from "@/components/tasks/task-card";
import { mapOcrToTask } from "../utils/mapOcrToTask";

export function OCRPreviewModal({
  isOpen,
  onClose,
  events,
  addTask,
}: {
  isOpen: boolean;
  onClose: () => void;
  events: OcrEvent[];
  addTask: (task: Partial<Task>) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const handleSave = async () => {
    setIsSaving(true);
    let count = 0;

    try {
      for (const event of events) {
        if (!event?.title || !event?.date) continue;

        const task = mapOcrToTask(event);

        try {
          await addTask(task);
          count++;
        } catch (err) {
          console.error("Failed to add task:", err);
        }
      }

      setSavedCount(count);
    } finally {
      setIsSaving(false);
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white/10 text-white/90 rounded-xl p-6 max-w-md w-full mx-4">

        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/50 hover:text-white"
        >
          ×
        </button>

        <div className="space-y-4">

          <h3 className="text-lg font-semibold">추출된 일정</h3>

          {events.length === 0 ? (
            <p className="text-white/50 text-center">
              일정이 감지되지 않았습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {events.map((event, index) => (
                <li
                  key={index}
                  className="p-3 bg-white/5 rounded-lg"
                >
                  <p className="text-sm font-medium">
                    {event.date}
                  </p>
                  <p className="text-sm text-white/80">
                    {event.time ? `${event.time} ` : ""}
                    {event.title}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* footer */}
          {isSaving ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
              <span>저장 중...</span>
            </div>
          ) : (
            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white/10 rounded-lg"
              >
                취소
              </button>

              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-white/20 rounded-lg"
              >
                {savedCount > 0
                  ? `${savedCount}개 저장`
                  : "모두 저장"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
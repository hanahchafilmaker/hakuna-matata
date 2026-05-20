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
  // "idle" | "saving" | "saved"
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [savedCount, setSavedCount] = useState(0);

  // 모달이 닫힐 때 내부 상태 초기화
  function handleClose() {
    setSaveState("idle");
    setSavedCount(0);
    onClose();
  }

  const handleSave = async () => {
    if (saveState !== "idle") return;

    setSaveState("saving");
    let count = 0;

    for (const event of events) {
      if (!event?.title || !event?.date) continue;

      try {
        await addTask(mapOcrToTask(event));
        count++;
      } catch (err) {
        console.error("일정 저장 실패:", err);
      }
    }

    setSavedCount(count);
    setSaveState("saved");

    // 저장 완료 메시지 1.2초 후 자동 닫기
    setTimeout(() => {
      handleClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white/10 text-white/90 rounded-xl p-6 max-w-md w-full mx-4">

        {/* 닫기 버튼 — 저장 중엔 비활성 */}
        <button
          onClick={handleClose}
          disabled={saveState === "saving"}
          className="absolute top-3 right-3 text-white/50 hover:text-white disabled:opacity-30"
          aria-label="닫기"
        >
          ×
        </button>

        <div className="space-y-4">

          <h3 className="text-lg font-semibold">추출된 일정</h3>

          {events.length === 0 ? (
            <p className="text-white/50 text-center py-4">
              감지된 일정이 없습니다.
            </p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {events.map((event, index) => (
                <li key={index} className="p-3 bg-white/5 rounded-lg">
                  <p className="text-sm font-medium">{event.date}</p>
                  <p className="text-sm text-white/80">
                    {event.time ? `${event.time} ` : ""}
                    {event.title}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* 푸터 */}
          {saveState === "saving" && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">저장 중...</span>
            </div>
          )}

          {saveState === "saved" && (
            <p className="text-center text-sm text-white/80 py-2">
              ✓ {savedCount}개 일정이 저장됐어요
            </p>
          )}

          {saveState === "idle" && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-white/10 rounded-lg text-sm"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={events.length === 0}
                className="flex-1 px-4 py-2 bg-white/20 rounded-lg text-sm disabled:opacity-40"
              >
                모두 저장 ({events.length}개)
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
"use client";

import { useOcr } from "@/features/ocr/useOcr";
import { OCRPreviewModal } from "./OCRPreviewModal";
import { OcrEvent } from "@/features/ocr/types";
import type { Task } from "@/components/tasks/task-card";
import { useState } from "react";

export function OCRUploadButton({
  year,
  month,
  addTask,
  onEventsParsed,
}: {
  year: number;
  month: number;
  addTask: (task: Partial<Task>) => Promise<void>;
  onEventsParsed?: (events: OcrEvent[]) => void;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { status, progressMsg, error, events, inputRef, openPicker, handleFileChange, reset } =
    useOcr(year, month, (parsed) => {
      onEventsParsed?.(parsed);
      // 파싱 완료 시 미리보기 모달 열기
      if (parsed.length > 0) setIsPreviewOpen(true);
    });

  const isLoading = status !== "idle" && status !== "done" && status !== "error";

  function handleClose() {
    setIsPreviewOpen(false);
    reset();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={openPicker}
        disabled={isLoading}
        className={`ocr-upload-btn ${isLoading ? "is-uploading" : ""}`}
      >
        {isLoading
          ? progressMsg || "처리 중..."
          : status === "done" && events.length === 0
          ? "감지된 일정 없음"
          : "사진으로 일정 등록"}
      </button>

      {error && (
        <p className="ocr-upload-btn__error">{error}</p>
      )}

      {/* 감지 없음 안내 — 모달 없이 인라인으로 */}
      {status === "done" && events.length === 0 && !error && (
        <p className="ocr-upload-btn__hint">
          달력이 선명하게 찍혀 있는지 확인하고 다시 시도해보세요.
        </p>
      )}

      <OCRPreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClose}
        events={events}
        addTask={addTask}
      />
    </>
  );
}
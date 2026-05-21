"use client";

import { useOcr } from "@/features/ocr/useOcr";
import { OCRPreviewModal } from "./OCRPreviewModal";
import { OcrEvent } from "@/features/ocr/types";
import type { Task } from "@/components/tasks/task-card";
import { useState, useRef } from "react";

export function OCRUploadButton({
  addTask,
  onEventsParsed,
}: {
  addTask: (task: Partial<Task>) => Promise<void>;
  onEventsParsed?: (events: OcrEvent[]) => void;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [events, setEvents] = useState<OcrEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { runOcr } = useOcr();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChangeAsync(e).catch(console.error);
  };

  const handleFileChangeAsync = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await runOcr(file);
      // result.preview is an array of { label: string; range: string }
      // We'll use it for the modal preview
      setEvents(result.preview as unknown as OcrEvent[]);
      if (onEventsParsed) {
        // For compatibility, we pass an empty array as OcrEvent[]
        // In the future, we might want to convert preview to OcrEvent shape
        onEventsParsed([]);
      }
      if (result.preview.length > 0) {
        setIsPreviewOpen(true);
      }
    } catch (err) {
      console.error(err);
      setError("OCR 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      // Reset input value to allow same file to be selected again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleOpenPicker = () => {
    inputRef.current?.click();
  };

  const handleClose = () => {
    setIsPreviewOpen(false);
    setEvents([]);
    setError(null);
    setIsLoading(false);
  };

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
        onClick={handleOpenPicker}
        disabled={isLoading}
        className={`ocr-upload-btn ${isLoading ? "is-uploading" : ""}`}
      >
        {isLoading
          ? "처리 중..."
          : events.length === 0 && !error
          ? "감지된 일정 없음"
          : "사진으로 일정 등록"}
      </button>

      {error && (
        <p className="ocr-upload-btn__error">{error}</p>
      )}

      {/* 감지 없음 안내 — 모달 없이 인라인으로 */}
      {events.length === 0 && !error && !isLoading && (
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
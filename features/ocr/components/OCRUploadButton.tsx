"use client";

import { useRef, useState } from "react";
import { OcrEvent } from "@/features/ocr/types";
import { OCRPreviewModal } from "./OCRPreviewModal";
import type { Task } from "@/components/tasks/task-card";
import { parseCalendarText } from "@/lib/parseCalendarText";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<OcrEvent[]>([]);

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress("Tesseract 로딩 중...");

    try {
      // 브라우저에서 직접 Tesseract 실행 (서버 불필요)
      const Tesseract = await import("tesseract.js");

      setProgress("이미지 분석 중...");

      const result = await Tesseract.recognize(file, "kor+eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(`인식 중... ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const text = result.data.text;
      console.log("[Tesseract OCR]", text);

      setProgress("일정 파싱 중...");

      const events = parseCalendarText(text, year, month);

      setPreviewEvents(events);
      setIsPreviewOpen(true);
      onEventsParsed?.(events);
    } catch (err) {
      console.error(err);
      alert("OCR 처리 실패. 다시 시도해주세요.");
    } finally {
      setIsUploading(false);
      setProgress("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openCamera = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleImageChange}
      />

      <button
        type="button"
        onClick={openCamera}
        disabled={isUploading}
        className={`ocr-upload-btn ${isUploading ? "is-uploading" : ""}`}
      >
        {isUploading ? progress || "처리 중..." : "사진으로 일정 등록"}
      </button>

      {isPreviewOpen && (
        <OCRPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          events={previewEvents}
          addTask={addTask}
        />
      )}
    </>
  );
}
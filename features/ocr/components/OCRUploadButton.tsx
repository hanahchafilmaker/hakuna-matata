"use client";

import { useRef, useState } from "react";
import { OcrEvent } from "@/features/ocr/types";
import { OCRPreviewModal } from "./OCRPreviewModal";
import type { Task } from "@/components/tasks/task-card";

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<OcrEvent[]>([]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result.split(",")[1]);
        } else {
          reject(new Error("Failed to read file"));
        }
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const base64 = await fileToBase64(file);

      const response = await fetch("/api/scan-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: file.type,
          year,
          month,
        }),
      });

      if (!response.ok) throw new Error("OCR API error");

      const data = await response.json();

      const events: OcrEvent[] = data.events || [];

      setPreviewEvents(events);
      setIsPreviewOpen(true);

      onEventsParsed?.(events);
    } catch (err) {
      console.error(err);
      alert("OCR 처리 실패");
    } finally {
      setIsUploading(false);
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
        className={`ocr-upload-btn ${
          isUploading ? "is-uploading" : ""
        }`}
      >
        {isUploading ? "처리 중..." : "사진으로 일정 등록"}
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
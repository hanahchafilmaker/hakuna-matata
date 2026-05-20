"use client";

import { useState } from 'react';
import { OcrEvent } from '@/features/ocr/types';
import { OCRPreviewModal } from './OCRPreviewModal';
import type { Task } from '@/components/tasks/task-card';

// Props 타입을 별도 인터페이스로 분리하면 관리하기 편합니다.
interface OCRUploadButtonProps {
  year: number;
  month: number;
  addTask: (task: Partial<Task>) => Promise<void>;
  onEventsParsed?: (events: OcrEvent[]) => void;
  tasks: Task[]; // <--- 이 줄을 추가했습니다.
}

export function OCRUploadButton({
  year,
  month,
  addTask,
  onEventsParsed,
  tasks, // <--- 여기에도 추가했습니다.
}: OCRUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<OcrEvent[]>([]);

  // ... (이하 나머지 코드는 동일)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const response = await fetch('/api/scan-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: file.type,
          year,
          month,
        }),
      });
      if (!response.ok) {
        throw new Error(`OCR API error: ${response.status}`);
      }
      const data = await response.json();
      const events: OcrEvent[] = data.events;
      setPreviewEvents(events);
      setIsPreviewOpen(true);
      if (onEventsParsed) {
        onEventsParsed(events);
      }
    } catch (error) {
      console.error('OCR upload failed:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        id="ocr-file-input"
        style={{ display: 'none' }}
        onChange={handleImageChange}
      />
      <button
        type="button"
        onClick={() => document.getElementById('ocr-file-input')?.click()}
        disabled={isUploading}
        className={`ocr-upload-btn ${isUploading ? 'is-uploading' : ''}`}
      >
        {isUploading ? '처리 중...' : '사진으로 일정 등록'}
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
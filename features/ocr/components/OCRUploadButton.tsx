"use client";

import { useState } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { OcrEvent } from '@/features/ocr/types';

export function OCRUploadButton({
  year,
  month,
  onEventsParsed
}: {
  year: number;
  month: number;
  onEventsParsed?: (events: OcrEvent[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<OcrEvent[]>([]);
  const { tasks, addTask } = useTasks();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // reader.result is data: URL; we need to extract the base64 part
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
    // Reset file input to allow same file to be selected again
    e.target.value = '';
  };

  const handleSaveAll = async () => {
    // Prevent duplicate insertion: check if a task with same date, title, time already exists.
    // We have tasks from the hook (already fetched via realtime).
    for (const event of previewEvents) {
      const exists = tasks.some(
        task =>
          task.date_start === event.date &&
          task.text === event.title &&
          task.time === event.time
      );
      if (!exists) {
        // Create a task object from the event
        const task: Partial<Task> = {
          text: event.title,
          date_start: event.date,
          date_end: event.date, // assuming same-day events
          time: event.time,
          assignee: '하나',
          type: 'ui',
          repeat: 'none',
          done: false,
          memo: '', // could add a note about OCR source if desired
        };
        try {
          await addTask(task);
        } catch (err) {
          console.error('Failed to add task:', err);
          // Optionally show a toast or alert
        }
      }
    }
    setIsPreviewOpen(false);
    setPreviewEvents([]);
  };

  return (
    <>
      {/* Hidden file input */}
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

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="ocr-preview-modal-overlay" onClick={handleCloseOutside}>
          <div className="ocr-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="ocr-preview-modal__header">
              <h3>추출된 일정</h3>
              <button
                type="button"
                className="ocr-preview-modal__close"
                onClick={() => setIsPreviewOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="ocr-preview-modal__body">
              {previewEvents.length === 0 ? (
                <p>일정이 감지되지 않았습니다.</p>
              ) : (
                <ul className="ocr-preview-list">
                  {previewEvents.map((event, index) => (
                    <li key={index} className="ocr-preview-item">
                      <span className="ocr-preview-item__date">
                        {event.date}
                      </span>
                      <span className="ocr-preview-item__time">
                        {event.time ? `${event.time} ` : ''}
                      </span>
                      <span className="ocr-preview-item__title">
                        {event.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="ocr-preview-modal__footer">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="ocr-preview-modal__cancel"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                className="ocr-preview-modal__save"
              >
                모두 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  function handleCloseOutside(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      setIsPreviewOpen(false);
      setPreviewEvents([]);
    }
  }
}
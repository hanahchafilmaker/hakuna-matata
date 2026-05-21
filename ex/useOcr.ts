"use client";

import { useRef, useState } from "react";
import { OcrEvent } from "@/features/ocr/types";

export type OcrStatus =
  | "idle"
  | "loading-image"
  | "warping"
  | "recognizing"
  | "parsing"
  | "done"
  | "error";

export interface UseOcrReturn {
  status: OcrStatus;
  progressMsg: string;
  error: string;
  events: OcrEvent[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  openPicker: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
}

// ─────────────────────────────────────────────
// OpenCV loader (lazy)
// ─────────────────────────────────────────────

let cvPromise: Promise<any> | null = null;

function loadOpenCV(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("SSR");
  if ((window as any).cv?.Mat) return Promise.resolve((window as any).cv);

  if (!cvPromise) {
    cvPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://docs.opencv.org/4.x/opencv.js";
      script.async = true;

      script.onload = () => {
        const wait = setInterval(() => {
          if ((window as any).cv?.Mat) {
            clearInterval(wait);
            resolve((window as any).cv);
          }
        }, 100);
      };

      script.onerror = reject;

      document.head.appendChild(script);
    });
  }

  return cvPromise;
}

// ─────────────────────────────────────────────
// OCR API
// ─────────────────────────────────────────────

async function callOCR(file: File): Promise<OcrEvent[]> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/scan-calendar", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const json = await res.json();
  return json?.data?.events ?? [];
}

// ─────────────────────────────────────────────

export function useOcr(
  year: number,
  month: number,
  onSuccess?: (events: OcrEvent[]) => void
): UseOcrReturn {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = useState<OcrStatus>("idle");
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState("");
  const [events, setEvents] = useState<OcrEvent[]>([]);

  function reset() {
    setStatus("idle");
    setProgressMsg("");
    setError("");
    setEvents([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setEvents([]);

    try {
      // 1. image load
      setStatus("loading-image");
      setProgressMsg("이미지 로딩 중...");

      const imageUrl = URL.createObjectURL(file);
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const el = new Image();
        el.onload = () => res(el);
        el.onerror = rej;
        el.src = imageUrl;
      });

      URL.revokeObjectURL(imageUrl);

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      // 2. warp (optional OpenCV)
      setStatus("warping");
      setProgressMsg("이미지 보정 중...");

      try {
        const cv = await loadOpenCV();
        // TODO: detectGridWarp(cv, canvas)
        // 지금은 placeholder
      } catch {
        // OpenCV 실패해도 계속 진행
      }

      // 3. OCR
      setStatus("recognizing");
      setProgressMsg("텍스트 인식 중...");

      const parsed = await callOCR(file);

      // 4. parsing
      setStatus("parsing");
      setProgressMsg("데이터 정리 중...");

      // 약간 UX delay
      await new Promise((r) => setTimeout(r, 100));

      // 5. done
      setStatus("done");
      setProgressMsg("");

      setEvents(parsed);
      onSuccess?.(parsed);
    } catch (err: any) {
      setStatus("error");
      setError(err?.message ?? "OCR 실패");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return {
    status,
    progressMsg,
    error,
    events,
    inputRef,
    openPicker,
    handleFileChange,
    reset,
  };
}
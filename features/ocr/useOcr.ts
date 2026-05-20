"use client";

/**
 * useOcr
 * -------
 * 단일 OCR 파이프라인 훅
 * 1. FileReader  → 이미지 로드
 * 2. OpenCV.js   → 그레이스케일 + 가우시안 블러 + 적응형 임계값 전처리
 * 3. Tesseract   → 한국어+영어 텍스트 인식
 * 4. parseCalendarText → OcrEvent[] 파싱
 *
 * 사용처: OCRUploadButton, settings-screen
 */

import { useRef, useState } from "react";
import { OcrEvent } from "@/features/ocr/types";
import { parseCalendarText } from "@/lib/parseCalendarText";

// ─── 상태 타입 ──────────────────────────────────────────────

export type OcrStatus = "idle" | "loading-cv" | "preprocessing" | "recognizing" | "parsing" | "done" | "error";

export interface UseOcrReturn {
  status: OcrStatus;
  /** 사용자에게 보여줄 진행 메시지 */
  progressMsg: string;
  error: string;
  events: OcrEvent[];
  inputRef: React.RefObject<HTMLInputElement>;
  openPicker: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
}

// ─── OpenCV.js 로더 (싱글톤) ──────────────────────────────

let cvPromise: Promise<any> | null = null;

function loadOpenCV(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("SSR");
  if ((window as any).cv?.imread) return Promise.resolve((window as any).cv);

  if (!cvPromise) {
    cvPromise = new Promise((resolve, reject) => {
      // 이미 스크립트가 삽입된 경우
      if (document.getElementById("opencv-script")) {
        const poll = setInterval(() => {
          if ((window as any).cv?.imread) {
            clearInterval(poll);
            resolve((window as any).cv);
          }
        }, 100);
        return;
      }

      const script = document.createElement("script");
      script.id = "opencv-script";
      script.src = "https://docs.opencv.org/4.8.0/opencv.js";
      script.async = true;

      script.onload = () => {
        // OpenCV.js는 로드 후 onRuntimeInitialized 콜백으로 준비 완료를 알림
        const checkReady = setInterval(() => {
          if ((window as any).cv?.imread) {
            clearInterval(checkReady);
            resolve((window as any).cv);
          }
        }, 100);
      };
      script.onerror = () => reject(new Error("OpenCV.js 로드 실패"));

      document.head.appendChild(script);
    });
  }

  return cvPromise;
}

// ─── 전처리 함수 ───────────────────────────────────────────

/**
 * OpenCV.js로 화이트보드/달력 이미지를 전처리
 * 그레이스케일 → 가우시안 블러 → 적응형 이진화
 * @returns 전처리된 이미지의 dataURL (Tesseract에 바로 넘길 수 있음)
 */
async function preprocessImage(
  cv: any,
  imageBlob: Blob
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // 캔버스에 이미지 그리기
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      let src: any;
      let dst: any;

      try {
        src = cv.imread(canvas);
        dst = new cv.Mat();

        // 1. 그레이스케일 변환
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

        // 2. 가우시안 블러 — 카메라 노이즈 완화
        cv.GaussianBlur(src, src, new cv.Size(5, 5), 0);

        // 3. 적응형 임계값 처리
        //    - ADAPTIVE_THRESH_GAUSSIAN_C: 조명 불균형(그림자)에 강함
        //    - blockSize 11, C 2: 화이트보드/달력에 최적화된 값
        cv.adaptiveThreshold(
          src,
          dst,
          255,
          cv.ADAPTIVE_THRESH_GAUSSIAN_C,
          cv.THRESH_BINARY,
          11,
          2
        );

        // 결과를 출력 캔버스에 그리고 Blob으로 반환
        const outputCanvas = document.createElement("canvas");
        cv.imshow(outputCanvas, dst);

        outputCanvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("캔버스 → Blob 변환 실패"));
          },
          "image/png"
        );
      } catch (err) {
        reject(err);
      } finally {
        src?.delete();
        dst?.delete();
      }
    };

    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.src = url;
  });
}

// ─── 메인 훅 ───────────────────────────────────────────────

export function useOcr(
  year: number,
  month: number,
  onSuccess?: (events: OcrEvent[]) => void
): UseOcrReturn {
  const inputRef = useRef<HTMLInputElement>(null);

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

    // 상태 초기화
    setError("");
    setEvents([]);

    try {
      // ── Step 1: OpenCV.js 로드 ──────────────────────────
      setStatus("loading-cv");
      setProgressMsg("이미지 처리 준비 중...");

      let processedFile: Blob = file;
      try {
        const cv = await loadOpenCV();

        // ── Step 2: 전처리 ─────────────────────────────────
        setStatus("preprocessing");
        setProgressMsg("이미지 전처리 중...");
        processedFile = await preprocessImage(cv, file);
      } catch (cvErr) {
        // OpenCV 로드/전처리 실패 시 원본으로 폴백 (Tesseract는 계속 진행)
        console.warn("[OCR] OpenCV 전처리 실패, 원본 사용:", cvErr);
        processedFile = file;
      }

      // ── Step 3: Tesseract OCR ──────────────────────────
      setStatus("recognizing");
      setProgressMsg("텍스트 인식 중...");

      const Tesseract = await import("tesseract.js");

      const result = await Tesseract.recognize(processedFile, "kor+eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgressMsg(`텍스트 인식 중... ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const rawText = result.data.text;
      console.log("[OCR] Tesseract 원문:\n", rawText);

      // ── Step 4: 파싱 ───────────────────────────────────
      setStatus("parsing");
      setProgressMsg("일정 파싱 중...");

      const parsed = parseCalendarText(rawText, year, month);
      console.log("[OCR] 파싱 결과:", parsed);

      setEvents(parsed);
      setStatus("done");
      setProgressMsg("");

      onSuccess?.(parsed);
    } catch (err: any) {
      console.error("[OCR] 오류:", err);
      setStatus("error");
      setError(err?.message ?? "OCR 처리 중 오류가 발생했습니다.");
      setProgressMsg("");
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

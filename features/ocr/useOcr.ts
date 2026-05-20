"use client";

/**
 * useOcr — Template-based Monthly Planner OCR
 * ─────────────────────────────────────────────
 * 고정 템플릿 월간 플래너 파서.
 * 범용 contour OCR ❌  /  좌표 기반 template parsing ⭕
 *
 * 파이프라인:
 * upload image
 * → detectAndWarp (approxPolyDP + warpPerspective)
 * → toBinaryMat (CLAHE + GaussianBlur + adaptiveThreshold + MORPH_OPEN)
 * → fixed grid slicing (JS Date 기반 firstDay 계산)
 * → per-cell OCR (날짜 영역 제외, 일정 영역만)
 * → 후처리 (이름 보정 → 공휴일 → 루틴 → 장소 → 이벤트 → 사람 매핑)
 * → 구조화된 ParsedEvent[]
 */

import { useRef, useState } from "react";
import { OcrEvent } from "@/features/ocr/types";

// ─── 상수 ─────────────────────────────────────────────────

const COLS = 7;
const DATE_AREA_RATIO = 0.18; // 셀 상단 날짜 영역 비율 (OCR 제외)
const INK_RATIO_THRESHOLD = 0.01; // 빈 셀 스킵 임계값

// ─── 사람 이름 보정 ────────────────────────────────────────

const NAME_ALIASES: Record<string, string> = {
  "민호": "민효",
  "민흐": "민효",
  "하느": "하나",
};

const KNOWN_PERSONS = ["민효", "하나"] as const;
type Person = "민효" | "하나" | "함께";

// ─── 장소 키워드 ───────────────────────────────────────────

const LOCATION_KEYWORDS = [
  "송도 컨벤시아",
  "삼성 코엑스",
  "킨텍스",
  "달빛축제공원",
  "삼성",
  "갈산역",
  "학여울",
  "던킨",
  "시청자미디어센터",
  "영자원",
  "인천센터",
];

const LOCATION_SUFFIXES = ["역", "학교"];

// ─── 이벤트 키워드 ─────────────────────────────────────────

const EVENT_KEYWORDS: Record<string, string> = {
  "면접": "interview",
  "출근": "work",
  "미팅": "meeting",
  "방문": "visit",
  "영화": "movie",
  "국화빵": "food",
};

// ─── 루틴 키워드 ───────────────────────────────────────────

const LAUNDRY_KEYWORDS = ["외출복", "수건", "속옷"];
const CLEANING_KEYWORDS = ["로이 케어"];

// ─── 상태 타입 ─────────────────────────────────────────────

export type OcrStatus =
  | "idle"
  | "loading-cv"
  | "warping"
  | "slicing"
  | "recognizing"
  | "parsing"
  | "done"
  | "error";

export interface UseOcrReturn {
  status: OcrStatus;
  progressMsg: string;
  error: string;
  events: OcrEvent[];
  inputRef: React.RefObject<HTMLInputElement>;
  openPicker: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
}

// ─── OpenCV.js 싱글톤 로더 ────────────────────────────────

let cvPromise: Promise<any> | null = null;

function loadOpenCV(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("SSR");
  if ((window as any).cv?.imread) return Promise.resolve((window as any).cv);

  if (!cvPromise) {
    cvPromise = new Promise((resolve, reject) => {
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

// ─── detectAndWarp ─────────────────────────────────────────
/**
 * 달력 외곽 검출 + perspective correction
 * boundingRect() 금지 — approxPolyDP로 4-point polygon 검출 후
 * getPerspectiveTransform + warpPerspective 사용.
 */
function detectAndWarp(cv: any, canvas: HTMLCanvasElement): HTMLCanvasElement {
  let src: any = null;
  let gray: any = null;
  let blurred: any = null;
  let edges: any = null;
  let contours: any = null;
  let hierarchy: any = null;
  let approx: any = null;
  let dst: any = null;

  try {
    src = cv.imread(canvas);

    // 그레이스케일 변환
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    // 블러 + Canny 엣지 검출
    blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    edges = new cv.Mat();
    cv.Canny(blurred, edges, 75, 200);

    // Dilate로 엣지 연결
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    cv.dilate(edges, edges, kernel);
    kernel.delete();

    // 컨투어 검출
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    // 가장 큰 4각형 컨투어 찾기 (approxPolyDP 사용)
    let bestContour: any = null;
    let bestArea = 0;

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt);
      const peri = cv.arcLength(cnt, true);

      approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

      if (approx.rows === 4 && area > bestArea && area > (src.cols * src.rows * 0.1)) {
        if (bestContour) bestContour.delete();
        bestContour = approx;
        bestArea = area;
        approx = null; // 소유권 이전
      } else {
        approx.delete();
        approx = null;
      }

      cnt.delete();
    }

    // 4각형을 찾지 못한 경우 원본 반환
    if (!bestContour) {
      const fallback = document.createElement("canvas");
      fallback.width = canvas.width;
      fallback.height = canvas.height;
      fallback.getContext("2d")!.drawImage(canvas, 0, 0);
      return fallback;
    }

    // 4 꼭짓점 추출 (top-left, top-right, bottom-right, bottom-left 순)
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 4; i++) {
      points.push({
        x: bestContour.intAt(i, 0),
        y: bestContour.intAt(i, 1),
      });
    }
    bestContour.delete();

    // 합(sum)이 작은 것 = top-left, 큰 것 = bottom-right
    // 차(diff)가 작은 것 = top-right, 큰 것 = bottom-left
    const sorted = [...points].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    const tl = sorted[0];
    const br = sorted[3];
    const remain = [sorted[1], sorted[2]].sort((a, b) => a.x - b.x);
    const [bl, tr] = remain[0].y > remain[1].y ? [remain[0], remain[1]] : [remain[1], remain[0]];

    const W = Math.max(
      Math.hypot(br.x - bl.x, br.y - bl.y),
      Math.hypot(tr.x - tl.x, tr.y - tl.y)
    );
    const H = Math.max(
      Math.hypot(tr.x - br.x, tr.y - br.y),
      Math.hypot(tl.x - bl.x, tl.y - bl.y)
    );

    const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      tl.x, tl.y,
      tr.x, tr.y,
      br.x, br.y,
      bl.x, bl.y,
    ]);

    const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      W, 0,
      W, H,
      0, H,
    ]);

    const M = cv.getPerspectiveTransform(srcPts, dstPts);
    dst = new cv.Mat();
    cv.warpPerspective(src, dst, M, new cv.Size(W, H));

    srcPts.delete();
    dstPts.delete();
    M.delete();

    const outputCanvas = document.createElement("canvas");
    cv.imshow(outputCanvas, dst);
    return outputCanvas;

  } finally {
    src?.delete();
    gray?.delete();
    blurred?.delete();
    edges?.delete();
    contours?.delete();
    hierarchy?.delete();
    approx?.delete();
    dst?.delete();
  }
}

// ─── toBinaryMat ───────────────────────────────────────────
/**
 * OCR용 전처리
 * CLAHE → GaussianBlur → adaptiveThreshold → THRESH_BINARY_INV → MORPH_OPEN
 */
function toBinaryCanvas(cv: any, srcCanvas: HTMLCanvasElement): HTMLCanvasElement {
  let src: any = null;
  let gray: any = null;
  let dst: any = null;
  let morphed: any = null;

  try {
    src = cv.imread(srcCanvas);

    // 그레이스케일
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    // CLAHE (Contrast Limited Adaptive Histogram Equalization)
    const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
    const equalized = new cv.Mat();
    clahe.apply(gray, equalized);
    clahe.delete();
    gray.delete();
    gray = equalized;

    // 가우시안 블러
    cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);

    // 적응형 임계값 (THRESH_BINARY_INV: 글씨=흰색, 배경=검정 → Tesseract에 유리)
    dst = new cv.Mat();
    cv.adaptiveThreshold(
      gray,
      dst,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY_INV,
      11,
      2
    );

    // MORPH_OPEN으로 노이즈 제거
    morphed = new cv.Mat();
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    cv.morphologyEx(dst, morphed, cv.MORPH_OPEN, kernel);
    kernel.delete();

    const outputCanvas = document.createElement("canvas");
    cv.imshow(outputCanvas, morphed);
    return outputCanvas;

  } finally {
    src?.delete();
    gray?.delete();
    dst?.delete();
    morphed?.delete();
  }
}

// ─── inkRatio 계산 ────────────────────────────────────────
/**
 * 캔버스의 비(非)흰색 픽셀 비율 계산.
 * 임계값 미만이면 빈 셀로 간주하고 OCR 스킵.
 */
function getInkRatio(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const data = ctx.getImageData(0, 0, w, h).data;
  let inked = 0;
  for (let i = 0; i < data.length; i += 4) {
    // THRESH_BINARY_INV 결과: 글씨=흰색(255), 배경=검정(0)
    if (data[i] > 128) inked++;
  }
  return inked / (w * h);
}

// ─── 후처리 유틸 ───────────────────────────────────────────

/** 이름 오타 보정 (단어 경계 기준 replaceAll) */
function correctNames(text: string): string {
  let result = text;
  for (const [wrong, correct] of Object.entries(NAME_ALIASES)) {
    result = result.replace(new RegExp(`\\b${wrong}\\b`, "g"), correct);
  }
  return result;
}

/** 사람 이름 추출 */
function extractPerson(text: string): { person: Person; cleaned: string } {
  for (const name of KNOWN_PERSONS) {
    if (text.includes(name)) {
      return { person: name, cleaned: text.replace(name, "").trim() };
    }
  }
  return { person: "함께", cleaned: text };
}

/** 장소 추출 */
function extractLocation(text: string): { location?: string; cleaned: string } {
  for (const kw of LOCATION_KEYWORDS) {
    if (text.includes(kw)) {
      return { location: kw, cleaned: text.replace(kw, "").trim() };
    }
  }
  for (const suffix of LOCATION_SUFFIXES) {
    const match = text.match(new RegExp(`[가-힣a-zA-Z0-9]+${suffix}`));
    if (match) {
      return { location: match[0], cleaned: text.replace(match[0], "").trim() };
    }
  }
  return { cleaned: text };
}

/** 이벤트 타입 감지 */
function detectEventType(text: string): string | undefined {
  for (const [kw, type] of Object.entries(EVENT_KEYWORDS)) {
    if (text.includes(kw)) return type;
  }
  if (LAUNDRY_KEYWORDS.some((kw) => text.includes(kw))) return "laundry";
  if (CLEANING_KEYWORDS.some((kw) => text.includes(kw))) return "cleaning";
  return undefined;
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

    setError("");
    setEvents([]);

    try {
      // ── Step 1: 이미지 → Canvas ───────────────────────────
      setStatus("loading-cv");
      setProgressMsg("이미지 처리 준비 중...");

      const imageUrl = URL.createObjectURL(file);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = imageUrl;
      });
      URL.revokeObjectURL(imageUrl);

      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = img.naturalWidth;
      sourceCanvas.height = img.naturalHeight;
      sourceCanvas.getContext("2d")!.drawImage(img, 0, 0);

      // ── Step 2: OpenCV — detectAndWarp ────────────────────
      setStatus("warping");
      setProgressMsg("달력 영역 검출 중...");

      let warpedCanvas: HTMLCanvasElement = sourceCanvas;
      let binaryCanvas: HTMLCanvasElement;

      try {
        const cv = await loadOpenCV();
        warpedCanvas = detectAndWarp(cv, sourceCanvas);
        binaryCanvas = toBinaryCanvas(cv, warpedCanvas);
      } catch (cvErr) {
        console.warn("[OCR] OpenCV 처리 실패, 원본 사용:", cvErr);
        binaryCanvas = sourceCanvas;
      }

      // ── Step 3: Grid 계산 (JS Date 기반) ─────────────────
      setStatus("slicing");
      setProgressMsg("그리드 분할 중...");

      const firstDay = new Date(year, month - 1, 1).getDay(); // 0=일, 6=토
      const lastDate = new Date(year, month, 0).getDate();
      const ROWS = Math.ceil((firstDay + lastDate) / 7);

      const W = binaryCanvas.width;
      const H = binaryCanvas.height;
      const cellW = Math.floor(W / COLS);
      const cellH = Math.floor(H / ROWS);

      // ── Step 4: Tesseract OCR ─────────────────────────────
      setStatus("recognizing");
      setProgressMsg("텍스트 인식 중...");

      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker("kor+eng");

      await worker.setParameters({
        tessedit_pageseg_mode: "11" as any, // Sparse text
        preserve_interword_spaces: "1",
      });

      const cellResults: { date: string; rawText: string }[] = [];
      let totalCells = 0;
      let processedCells = 0;

      // 실제 날짜가 있는 셀만 OCR 대상
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const cellIndex = row * COLS + col;
          const dayNumber = cellIndex - firstDay + 1;
          if (dayNumber < 1 || dayNumber > lastDate) continue;
          totalCells++;
        }
      }

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const cellIndex = row * COLS + col;
          const dayNumber = cellIndex - firstDay + 1;

          // 날짜 범위 밖 → 스킵
          if (dayNumber < 1 || dayNumber > lastDate) continue;

          const x = col * cellW;
          const y = row * cellH;

          // 날짜 영역 제외: 셀 상단 DATE_AREA_RATIO 만큼 건너뜀
          const contentY = y + Math.floor(cellH * DATE_AREA_RATIO);
          const contentH = cellH - Math.floor(cellH * DATE_AREA_RATIO);

          // 빈 셀 스킵 (inkRatio)
          const cellCanvas = document.createElement("canvas");
          cellCanvas.width = cellW;
          cellCanvas.height = contentH;
          const cellCtx = cellCanvas.getContext("2d")!;
          cellCtx.drawImage(binaryCanvas, x, contentY, cellW, contentH, 0, 0, cellW, contentH);

          const inkRatio = getInkRatio(cellCtx, cellW, contentH);
          processedCells++;

          if (inkRatio < INK_RATIO_THRESHOLD) {
            setProgressMsg(`텍스트 인식 중... ${Math.round((processedCells / totalCells) * 100)}%`);
            continue;
          }

          const date = `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;

          try {
            const { data } = await worker.recognize(cellCanvas);
            const rawText = data.text.trim();

            if (rawText) {
              cellResults.push({ date, rawText });
            }
          } catch (cellErr) {
            console.warn(`[OCR] 셀 ${date} 인식 실패:`, cellErr);
          }

          setProgressMsg(`텍스트 인식 중... ${Math.round((processedCells / totalCells) * 100)}%`);
        }
      }

      await worker.terminate();

      // ── Step 5: 후처리 파싱 ───────────────────────────────
      setStatus("parsing");
      setProgressMsg("일정 파싱 중...");

      const parsed = parseResults(cellResults);
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

// ─── 후처리 파싱 ───────────────────────────────────────────
/**
 * 후처리 우선순위:
 * 1. 이름 보정
 * 2. 공휴일 감지 (TODO: HSV red mask)
 * 3. 빨래/청소 루틴 분류
 * 4. 장소 추출
 * 5. 이벤트 키워드 추출
 * 6. 사람 매핑
 * 7. 일반 일정 fallback
 */
function parseResults(
  cellResults: { date: string; rawText: string }[]
): OcrEvent[] {
  const events: OcrEvent[] = [];

  for (const { date, rawText } of cellResults) {
    // 셀 내 여러 줄을 각각의 이벤트로 처리
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      // 1. 이름 보정
      let text = correctNames(line);

      // 2. 시간 추출
      const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
      let time = "";
      if (timeMatch) {
        time = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
        text = text.replace(timeMatch[0], "").trim();
      }

      // 텍스트가 없으면 스킵
      if (!text) continue;

      // 3. 루틴 감지
      const eventType = detectEventType(text);

      // 4. 장소 추출
      const { location, cleaned: afterLocation } = extractLocation(text);

      // 5. 사람 매핑
      const { person, cleaned: title } = extractPerson(afterLocation);

      if (!title && !location) continue;

      const event: OcrEvent & {
        person?: Person;
        location?: string;
        type?: string;
      } = {
        date,
        title: title || location || text,
        time,
        person,
        ...(location && { location }),
        ...(eventType && { type: eventType }),
      };

      events.push(event);
    }
  }

  return dedupeEvents(events);
}

function dedupeEvents(events: OcrEvent[]): OcrEvent[] {
  return events.filter(
    (e, i, arr) =>
      i === arr.findIndex(
        (x) => x.date === e.date && x.title === e.title && x.time === e.time
      )
  );
}
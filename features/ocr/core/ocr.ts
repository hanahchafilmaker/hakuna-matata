import type { OcrEvent } from '../types';
import { normalizeEvent } from './normalize';
import { mapToTask } from './mapToTask';
import Tesseract from 'tesseract.js';

/**
 * Run OCR on an image blob using Tesseract.js.
 * @param blob - Image file blob
 * @returns Object containing raw text, normalized events, and tasks
 */
export async function runOCR(blob: Blob): Promise<{
  raw: string;
  normalized: OcrEvent[];
  tasks: OcrEvent[];
}> {
  console.log("[OCR] 프로세스 시작");

  try {
    const imageBitmap = await createImageBitmap(blob);
    const origW = imageBitmap.width;
    const origH = imageBitmap.height;

    // ─── [Phase 1] 이미지 다운샘플링 (최대 2400px, 비율 유지) ───
    const MAX_SIZE = 2400;
    const scale = Math.min(1, MAX_SIZE / Math.max(origW, origH));
    const rW = Math.floor(origW * scale);
    const rH = Math.floor(origH * scale);

    const resizeCanvas = document.createElement('canvas');
    resizeCanvas.width = rW;
    resizeCanvas.height = rH;
    const resizeCtx = resizeCanvas.getContext('2d')!;
    resizeCtx.drawImage(imageBitmap, 0, 0, rW, rH);

    const imageData = resizeCtx.getImageData(0, 0, rW, rH);

    // 1. 연도/월 추출 (상단 헤더 영역 자르기 및 이진화)
    const headerCanvas = cropCanvas(resizeCanvas, 0, 0, rW, Math.floor(rH * 0.18));
    const headerBlob = await canvasToBlob(preprocessGray(headerCanvas));
    const { data: { text: headerText } } = await Tesseract.recognize(headerBlob, 'kor+eng', { logger: () => {} });

    console.log('[OCR] 헤더 텍스트:', headerText);
    const { year, month } = detectYearMonth(headerText);
    console.log(`[OCR] 분석 대상 날짜: ${year}년 ${month}월`);

    // 2. [Phase 1] HSV 근사를 통한 색상별 마스크 추출
    const redMask = extractColorMask(imageData, 'red');
    const blueMask = extractColorMask(imageData, 'blue');
    const darkMask = extractColorMask(imageData, 'dark');

    // 3. [Phase 2] 적응형 임계값 레이어 결합 + 격자선 화이트아웃 제거
    const cleanCanvas = buildCleanCanvas(imageData, redMask, blueMask, darkMask, rW, rH);

    // 4. [Phase 3 & 4] 7열 그리드 분할 및 칸별 최적화 OCR 수행 (SCALE 2.0으로 최적화)
    const events = await extractByGrid(resizeCanvas, cleanCanvas, year, month, rW, rH);

    console.log('[OCR] 최종 추출된 이벤트 리스트:', events);
    return { raw: headerText, normalized: events, tasks: events };

  } catch (error) {
    console.error('[OCR] 치명적 오류 발생:', error);
    return { raw: '', normalized: [], tasks: [] };
  }
}

// ─── [Phase 1] HSV 색상 마스크 추출 함수 ─────────────────────────────────────

type ColorTarget = 'red' | 'blue' | 'dark';

function extractColorMask(imageData: ImageData, target: ColorTarget): Uint8Array {
  const { data, width, height } = imageData;
  const mask = new Uint8Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const s = max === 0 ? 0 : (max - min) / max;
    const v = max / 255;

    let h = 0;
    if (max !== min) {
      if (max === r) h = ((g - b) / (max - min)) % 6;
      else if (max === g) h = (b - r) / (max - min) + 2;
      else h = (r - g) / (max - min) + 4;
      h = h * 60;
      if (h < 0) h += 360;
    }

    if (target === 'red') {
      // 빨간색: 공휴일 및 주요 마킹 (H: 0~15 또는 345~360)
      mask[i] = (s > 0.4 && v > 0.3 && (h < 15 || h > 345)) ? 1 : 0;
    } else if (target === 'blue') {
      // 파란색: 토요일 숫자 및 파란색 일정 마킹 (H: 190~260)
      mask[i] = (s > 0.3 && v > 0.3 && h > 190 && h < 260) ? 1 : 0;
    } else {
      // 어두운 색상: 일반 수기 펜 및 달력 그리드 선 (V < 0.38)
      mask[i] = (v < 0.38 && s < 0.4) ? 1 : 0;
    }
  }

  return mask;
}

// ─── [Phase 2] 적응형 임계값 결합 + 픽셀 프로파일 격자 제거 ───────────────────

function buildCleanCanvas(
  imageData: ImageData,
  redMask: Uint8Array,
  blueMask: Uint8Array,
  darkMask: Uint8Array,
  W: number,
  H: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const out = ctx.createImageData(W, H);

  // 픽셀 투영 프로파일 기법으로 격자선 위치 추적
  const rowDark = new Float32Array(H);
  const colDark = new Float32Array(W);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (darkMask[y * W + x]) {
        rowDark[y]++;
        colDark[x]++;
      }
    }
  }

  const isGridRow = new Uint8Array(H);
  const isGridCol = new Uint8Array(W);
  // 전체 축소 해상도 기준, 가로의 35% 혹은 세로의 15%를 넘어서는 선형 어두운 픽셀군을 그리드로 파싱 (격자선 오인식 방지)
  for (let y = 0; y < H; y++) if (rowDark[y] > W * 0.35) isGridRow[y] = 1;
  for (let x = 0; x < W; x++) if (colDark[x] > H * 0.15) isGridCol[x] = 1;

  for (let i = 0; i < W * H; i++) {
    const x = i % W;
    const y = Math.floor(i / W);
    const isGrid = isGridRow[y] || isGridCol[x];
    const isText = (redMask[i] || blueMask[i] || darkMask[i]) && !isGrid;

    // 최종 이진화 레이어: 글자는 검은색(0), 배경 및 제거된 격자는 하얀색(255)
    const val = isText ? 0 : 255;
    out.data[i * 4] = val;
    out.data[i * 4 + 1] = val;
    out.data[i * 4 + 2] = val;
    out.data[i * 4 + 3] = 255;
  }

  ctx.putImageData(out, 0, 0);
  return canvas;
}

// ─── [Phase 3 & 4] 7열 논리 그리드 분할 및 독립 칸별 OCR ────────────────────

const KNOWN_PLACES = ['코엑스', '킨텍스', '컨벤시아', '스타필드', '던킨', '갈산역', 'DMC'];
const KNOWN_PEOPLE = ['민효', '하나', '리나'];
const SKIP_WORDS = ['SUN','MON','TUE','WED','THU','FRI','SAT','MONTHLY','PLANNER','MONTH', 'YEAR'];

async function extractByGrid(
  original: HTMLCanvasElement,
  cleanCanvas: HTMLCanvasElement,
  year: number,
  month: number,
  W: number,
  H: number
): Promise<OcrEvent[]> {
  const events: OcrEvent[] = [];

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks = Math.ceil((firstDay + daysInMonth) / 7);

  // 달력 템플릿의 전체적인 기하학적 ROI 감지 (헤더 영역 제외 비율 조정)
  const gTop = Math.floor(H * 0.19);
  const gBottom = Math.floor(H * 0.97);
  const gLeft = Math.floor(W * 0.005);
  const gRight = Math.floor(W * 0.995);
  const cellW = (gRight - gLeft) / 7;
  const cellH = (gBottom - gTop) / weeks;

  const pad = 6; // 외곽 테두리 노이즈 유입 방지 패딩
  const innerW = cellW - pad * 2;
  const innerH = cellH - pad * 2;

  // 너무 작은 셀은 전체 처리 중단
  const MIN_CELL_PX = 10;
  if (innerW < MIN_CELL_PX || innerH < MIN_CELL_PX) {
    console.warn(`[OCR] 셀이 너무 작아 처리 중단: ${innerW.toFixed(1)}x${innerH.toFixed(1)}px`);
    return events;
  }

  // SCALE을 루프 밖에서 단일 선언 (if/else 블록 스코프 오류 방지)
  // 목표 높이 120px 기준, 최소 1.0 / 최대 4.0 제한
  const TARGET_HEIGHT = 120;
  const SCALE = Math.min(4.0, Math.max(1.0, TARGET_HEIGHT / innerH));

  console.log(`[OCR] 셀 크기: ${innerW.toFixed(1)}x${innerH.toFixed(1)}px, SCALE: ${SCALE.toFixed(2)}`);

  const cellCanvas = document.createElement('canvas');
  const cellCtx = cellCanvas.getContext('2d')!;

  for (let week = 0; week < weeks; week++) {
    for (let dow = 0; dow < 7; dow++) {
      const dayNum = week * 7 + dow - firstDay + 1;
      if (dayNum < 1 || dayNum > daysInMonth) continue;

      const x = gLeft + dow * cellW;
      const y = gTop + week * cellH;

      const scaledW = Math.floor(innerW * SCALE);
      const scaledH = Math.floor(innerH * SCALE);

      // 스케일 후에도 너무 작으면 해당 셀 스킵
      if (scaledW < 3 || scaledH < 3) {
        console.warn(`[OCR] 스케일 후 셀 스킵: ${scaledW}x${scaledH}px (${month}월 ${dayNum}일)`);
        continue;
      }

      cellCanvas.width = scaledW;
      cellCanvas.height = scaledH;
      cellCtx.fillStyle = 'white';
      cellCtx.fillRect(0, 0, scaledW, scaledH);

      // 분리된 클린 레이어로부터 매핑 칸 크롭 후 캔버스 업스케일링 드로우
      cellCtx.drawImage(
        cleanCanvas,
        x + pad, y + pad, innerW, innerH,
        0, 0, scaledW, scaledH
      );

      const cellBlob = await canvasToBlob(cellCanvas);

      try {
        const { data: { text } } = await Tesseract.recognize(cellBlob, 'kor+eng', {
          logger: () => {},
        });

        // ─── [Phase 5] 룰 기반 컨텍스트 정제 및 데이터 구조화 ───
        const lines = text.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 1)
          .filter(l => !SKIP_WORDS.includes(l.toUpperCase()))
          .filter(l => !/^\d{1,2}$/.test(l)); // 기본 날짜 프린트 숫자 매칭 제외

        if (lines.length === 0) continue;

        console.log(`[OCR 파싱 성공] ${month}월 ${dayNum}일:`, lines);
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

        for (const line of lines) {
          const event = parseEventLine(line, dateStr);
          if (event) events.push(event);
        }
      } catch {
        // 단일 셀 실패 개별 격리 처리
      }
    }
  }

  return events;
}

function parseEventLine(line: string, date: string): OcrEvent | null {
  if (line.length < 2) return null;
  // 영문과 기호만으로 구성된 줄 제거 (격자선 오인식 방지)
  if (/^[a-zA-Z\s\-_/\\|.~\[\]{}():]+$/.test(line)) return null;
  // 한글이 2자 미만이면 제거의미 없는 텍스트 필터링
  if (line.replace(/[^가-힣]/g, '').length < 2) return null;
  // 숫자와 기호만으로 구성된 줄 제거
  if (/^[\d\s~\-=\[\]|]+$/.test(line)) return null;

  let title = line;
  let person: string | undefined;
  let location: string | undefined;

  // 딕셔너리 기반 핵심 컨텍스트 바인딩
  for (const p of KNOWN_PEOPLE) {
    if (title.includes(p)) {
      person = p;
      title = title.replace(p, '').replace(/^[-·\s]+|[-·\s]+$/g, '').trim();
    }
  }
  for (const pl of KNOWN_PLACES) {
    if (title.includes(pl)) location = pl;
  }

  const finalTitle = [person, title].filter(Boolean).join(' ').trim();
  if (!finalTitle || finalTitle.length < 2) return null;

  return {
    date,
    title: finalTitle,
    time: null,
    confidence: 0.84,
    location
  } as OcrEvent;
}

// ─── 순수 웹 API 기반 이미지 헬퍼 유틸리티 함수군 ──────────────────────────────

function cropCanvas(src: HTMLCanvasElement, x: number, y: number, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d')!.drawImage(src, x, y, w, h, 0, 0, w, h);
  return c;
}

function preprocessGray(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < id.data.length; i += 4) {
    const g = 0.299 * id.data[i] + 0.587 * id.data[i + 1] + 0.114 * id.data[i + 2];
    const v = g > 150 ? 255 : 0; // 전역 스레시홀드 임계점 적용
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
  }
  ctx.putImageData(id, 0, 0);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas Blob 변환에 실패했습니다.')), 'image/png');
  });
}

function detectYearMonth(text: string): { year: number; month: number } {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  const y = text.match(/\b(20\d{2})\b/);
  if (y) year = parseInt(y[1]);

  const m = text.match(/\b([1-9]|1[0-2])\s(?:MONTH|월)/i);
  if (m) month = parseInt(m[1]);

  return { year, month };
}
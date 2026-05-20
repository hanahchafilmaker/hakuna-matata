/**
 * parseCalendarText — Rule-based Planner Event Parser
 * ─────────────────────────────────────────────────────
 * 고정 템플릿 월간 플래너용 후처리 파서.
 *
 * useOcr의 per-cell OCR 결과를 받아 구조화된 ParsedEvent[]로 변환.
 * (기존 범용 라인 기반 파서를 템플릿 파서 전용으로 재작성)
 *
 * 후처리 우선순위:
 * 1. 이름 보정 (OCR 오타)
 * 2. 공휴일 감지
 * 3. 빨래/청소 루틴 분류
 * 4. 장소 추출
 * 5. 이벤트 키워드 추출
 * 6. 사람 매핑
 * 7. 일반 일정 fallback → person: "함께"
 */

// ─── 타입 ──────────────────────────────────────────────────

export type ParsedEventType =
  | "schedule"
  | "laundry"
  | "cleaning"
  | "holiday"
  | "work"
  | "meeting"
  | "visit"
  | "interview"
  | "movie"
  | "food";

export type ParsedEvent = {
  date: string;                        // YYYY-MM-DD
  person?: "민효" | "하나" | "함께";
  title: string;
  location?: string;
  type?: ParsedEventType;
  time?: string;                       // HH:mm 또는 빈 문자열
};

// ─── 사람 이름 ─────────────────────────────────────────────

const KNOWN_PERSONS = ["민효", "하나"] as const;
type KnownPerson = typeof KNOWN_PERSONS[number];

/**
 * OCR 오타 보정 테이블.
 * 단순 replaceAll 금지 — 반드시 단어 경계(\\b) 정규식 사용.
 */
const NAME_ALIASES: Record<string, string> = {
  "민호": "민효",
  "민흐": "민효",
  "하느": "하나",
};

// ─── 장소 ──────────────────────────────────────────────────

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

/** "역", "학교" suffix로 끝나는 단어는 장소로 분류 */
const LOCATION_SUFFIXES = ["역", "학교"];

// ─── 이벤트 키워드 ─────────────────────────────────────────

const EVENT_KEYWORDS: Record<string, ParsedEventType> = {
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

// ─── 메인 파서 ─────────────────────────────────────────────

/**
 * per-cell OCR 결과 배열을 ParsedEvent[]로 변환.
 *
 * @param cellResults - { date: 'YYYY-MM-DD', rawText: string }[]
 *                      (useOcr에서 셀 단위로 넘겨주는 형태)
 *
 * 하위 호환을 위해 기존 parseCalendarText(text, year, month) 시그니처도
 * 유지하지만, 신규 코드에서는 parseCellResults를 직접 사용 권장.
 */
export function parseCellResults(
  cellResults: { date: string; rawText: string }[]
): ParsedEvent[] {
  const events: ParsedEvent[] = [];

  for (const { date, rawText } of cellResults) {
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const event = parseLine(line, date);
      if (event) events.push(event);
    }
  }

  return dedupeEvents(events);
}

/**
 * 기존 시그니처 호환용 래퍼.
 * 단일 텍스트 블록을 받아 날짜 없이 파싱 (레거시 경로).
 * 신규 코드에서는 parseCellResults 사용을 권장.
 */
export function parseCalendarText(
  text: string,
  year: number,
  month: number
): ParsedEvent[] {
  // 레거시: 파이프(|) 구분 포맷 지원 (route.ts의 Gemini 응답 포맷)
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const events: ParsedEvent[] = [];

  for (const line of lines) {
    // YYYY-MM-DD|HH:MM|제목 또는 YYYY-MM-DD||제목 포맷
    const pipeParts = line.split("|");
    if (pipeParts.length >= 3) {
      const [datePart, timePart, ...titleParts] = pipeParts;
      const title = titleParts.join("|").trim();

      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart.trim()) && title) {
        const event = parseLine(title, datePart.trim());
        if (event) {
          event.time = timePart.trim() || undefined;
          events.push(event);
        }
      }
      continue;
    }

    // 날짜 추출 시도 (MM월 DD일, MM/DD, MM-DD 등)
    const mdMatch = line.match(/(\d{1,2})[\/\-월]\s*(\d{1,2})[일]?/);
    const odMatch = !mdMatch ? line.match(/^(\d{1,2})일$/) : null;

    let date = "";
    let textBody = line;

    if (mdMatch) {
      const m = Number(mdMatch[1]);
      const d = Number(mdMatch[2]);
      const dateObj = new Date(year, m - 1, d);
      if (!isNaN(dateObj.getTime())) {
        date = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        textBody = line.replace(mdMatch[0], "").trim();
      }
    } else if (odMatch) {
      const d = Number(odMatch[1]);
      const dateObj = new Date(year, month - 1, d);
      if (!isNaN(dateObj.getTime())) {
        date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        textBody = line.replace(odMatch[0], "").trim();
      }
    }

    if (!date || !textBody) continue;

    const event = parseLine(textBody, date);
    if (event) events.push(event);
  }

  return dedupeEvents(events);
}

// ─── 단일 라인 파싱 ────────────────────────────────────────

function parseLine(line: string, date: string): ParsedEvent | null {
  // 1. 이름 보정
  let text = correctNames(line);

  // 2. 시간 추출
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  let time: string | undefined;
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
    text = text.replace(timeMatch[0], "").trim();
  }

  // 공백/특수문자 정리
  text = text.replace(/^[:\-\s•◦]+/, "").trim();
  if (!text) return null;

  // 3. 루틴 분류
  const eventType = detectEventType(text);

  // 4. 장소 추출
  const { location, cleaned: afterLocation } = extractLocation(text);

  // 5. 사람 매핑
  const { person, cleaned: title } = extractPerson(afterLocation);

  // 제목이 없고 장소만 있는 경우 location을 title로 사용
  const finalTitle = title || location || text;
  if (!finalTitle) return null;

  return {
    date,
    title: finalTitle,
    ...(time && { time }),
    person,
    ...(location && { location }),
    ...(eventType && { type: eventType }),
  };
}

// ─── 유틸 함수 ─────────────────────────────────────────────

/** OCR 오타 이름 보정 — 단어 경계(\\b) 정규식 사용 */
function correctNames(text: string): string {
  let result = text;
  for (const [wrong, correct] of Object.entries(NAME_ALIASES)) {
    result = result.replace(new RegExp(`\\b${wrong}\\b`, "g"), correct);
  }
  return result;
}

/** 사람 이름 추출. 없으면 "함께" */
function extractPerson(
  text: string
): { person: "민효" | "하나" | "함께"; cleaned: string } {
  for (const name of KNOWN_PERSONS) {
    if (text.includes(name)) {
      return { person: name, cleaned: text.replace(name, "").trim() };
    }
  }
  return { person: "함께", cleaned: text };
}

/** 장소 키워드 / suffix 기반 추출 */
function extractLocation(
  text: string
): { location?: string; cleaned: string } {
  // 긴 키워드 우선 매칭
  for (const kw of [...LOCATION_KEYWORDS].sort((a, b) => b.length - a.length)) {
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

/** 이벤트 타입 감지 (우선순위: 루틴 > 이벤트 키워드) */
function detectEventType(text: string): ParsedEventType | undefined {
  if (LAUNDRY_KEYWORDS.some((kw) => text.includes(kw))) return "laundry";
  if (CLEANING_KEYWORDS.some((kw) => text.includes(kw))) return "cleaning";
  for (const [kw, type] of Object.entries(EVENT_KEYWORDS)) {
    if (text.includes(kw)) return type;
  }
  return undefined;
}

/** 중복 제거 */
function dedupeEvents(events: ParsedEvent[]): ParsedEvent[] {
  return events.filter(
    (event, index, self) =>
      index ===
      self.findIndex(
        (e) =>
          e.date === event.date &&
          e.title === event.title &&
          e.time === event.time
      )
  );
}
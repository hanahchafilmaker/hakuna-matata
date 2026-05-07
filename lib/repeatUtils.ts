// ─── repeatUtils.ts ───────────────────────────────────────────
// repeat 필드 파싱 / 확장 유틸

/** 내부 표준 요일 코드 */
export type DayCode = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

/** JS Date.getDay() → DayCode */
const IDX_TO_CODE: DayCode[] = ['sun','mon','tue','wed','thu','fri','sat']

/** 한글/영문 요일 → 내부 코드 */
const ALIAS: Record<string, DayCode> = {
  일: 'sun', 월: 'mon', 화: 'tue', 수: 'wed', 목: 'thu', 금: 'fri', 토: 'sat',
  sun: 'sun', mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu', fri: 'fri', sat: 'sat',
  sunday: 'sun', monday: 'mon', tuesday: 'tue', wednesday: 'wed',
  thursday: 'thu', friday: 'fri', saturday: 'sat',
  '0': 'sun', '1': 'mon', '2': 'tue', '3': 'wed', '4': 'thu', '5': 'fri', '6': 'sat',
}

/** repeat 값 → DayCode[] 파싱 (방어적) */
export function parseRepeat(value?: string | string[] | null): DayCode[] {
  if (!value) return []
  // 배열인 경우
  if (Array.isArray(value)) {
    return value.flatMap((v) => parseRepeat(v))
  }
  const s = String(value).trim().toLowerCase()
  if (!s || s === 'none' || s === 'false' || s === '0') return []
  if (s === 'daily' || s === 'everyday' || s === '매일') {
    return ['sun','mon','tue','wed','thu','fri','sat']
  }
  if (s === '평일' || s === 'weekdays') return ['mon','tue','wed','thu','fri']
  if (s === '주말' || s === 'weekends') return ['sat','sun']

  // 콤마/슬래시/공백 구분
  const parts = s.split(/[,/\s]+/).map((p) => p.trim()).filter(Boolean)
  const result: DayCode[] = []
  for (const part of parts) {
    const code = ALIAS[part]
    if (code && !result.includes(code)) result.push(code)
  }
  return result
}

/** DayCode[] → 저장용 문자열 (쉼표 구분 영문 소문자) */
export function serializeRepeat(days: DayCode[]): string {
  if (!days || days.length === 0) return 'none'
  if (days.length === 7) return 'daily'
  return days.join(',')
}

/** repeat 값이 반복 일정인지 */
export function isRepeating(value?: string | string[] | null): boolean {
  return parseRepeat(value).length > 0
}

/** DayCode → 한글 라벨 */
export const DAY_LABELS: Record<DayCode, string> = {
  sun: '일', mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토',
}

/** DayCode 정렬 순서 (일~토) */
const DAY_ORDER: DayCode[] = ['sun','mon','tue','wed','thu','fri','sat']

/** 선택된 요일 표시 텍스트 */
export function repeatLabel(value?: string | string[] | null): string {
  const days = parseRepeat(value)
  if (days.length === 0) return '반복 안 함'
  if (days.length === 7) return '매일'
  if (['mon','tue','wed','thu','fri'].every((d) => days.includes(d as DayCode)) && days.length === 5) return '평일'
  if (['sat','sun'].every((d) => days.includes(d as DayCode)) && days.length === 2) return '주말'
  return days
    .slice()
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    .map((d) => DAY_LABELS[d])
    .join('·')
}

/**
 * 주어진 기간(start~end) 내에서 repeat 요일에 해당하는 Date[] 생성
 * (렌더링용 — 원본 task는 복제하지 않음)
 */
export function expandRepeat(
  repeatValue: string | string[] | null | undefined,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const days = parseRepeat(repeatValue)
  if (days.length === 0) return []
  const result: Date[] = []
  let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate())
  const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate())
  while (cur <= end) {
    const code = IDX_TO_CODE[cur.getDay()]
    if (days.includes(code)) result.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

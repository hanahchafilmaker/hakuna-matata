// ─── dateUtils.ts ─────────────────────────────────────────────
// 날짜/시간 파싱 유틸 — timezone 하루 밀림 없이 처리

/** "YYYY-MM-DD" 문자열을 로컬 Date로 (UTC 해석 방지) */
export function parseLocalDate(value?: string | null): Date | null {
  if (!value) return null
  // 이미 Date 객체인 경우
  if (value instanceof Date) return isNaN((value as Date).getTime()) ? null : value as unknown as Date
  const s = String(value).trim()
  if (!s) return null
  // YYYY-MM-DD 또는 YYYY/MM/DD
  const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    return isNaN(d.getTime()) ? null : d
  }
  // fallback
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    // UTC→local 보정
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  return null
}

/** Date → "YYYY-MM-DD" */
export function fmtDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 오늘 날짜 문자열 */
export function todayStr(): string {
  return fmtDate(new Date())
}

/** 두 날짜가 같은 날인지 */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

/** date >= start && date <= end */
export function isInRange(date: Date, start: Date, end: Date): boolean {
  const d = date.getTime(), s = start.getTime(), e = end.getTime()
  return d >= s && d <= e
}

/** 달의 첫째 날 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** 달의 마지막 날 */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/** 주의 첫째 날 (일요일 기준) */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - d.getDay())
  return d
}

/** 주의 마지막 날 (토요일 기준) */
export function endOfWeek(date: Date): Date {
  const d = startOfWeek(date)
  d.setDate(d.getDate() + 6)
  return d
}

/** n일 더하기 */
export function addDays(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)
}

/** 두 날짜 차이(일수) — b - a */
export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

/** D-day 텍스트 — 당일 포함 +1 기준 */
export function getDdayLabel(targetStr?: string | null): string {
  const target = parseLocalDate(targetStr)
  if (!target) return '-'
  const today = new Date(); const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diff = diffDays(t, target) + 1   // 당일 포함 +1
  if (diff === 1) return 'D-DAY'
  if (diff > 1) return `D-${diff - 1}`
  return `D+${Math.abs(diff - 1)}`
}

/** 경과일 텍스트 (daysSince: 시작일부터 오늘까지, 당일 포함 1일) */
export function daysSince(startStr?: string | null): string {
  const start = parseLocalDate(startStr)
  if (!start) return '-'
  const today = new Date(); const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diff = diffDays(start, t) + 1
  return `${diff}일`
}

/**
 * time 문자열을 "HH:MM" 형태로 정규화.
 * 비어있거나 파싱 불가면 null 반환.
 */
export function parseTime(value?: string | null): string | null {
  if (!value) return null
  const s = String(value).trim()
  if (!s) return null
  // 이미 HH:MM
  if (/^\d{1,2}:\d{2}$/.test(s)) return s
  // ISO DateTime 문자열에서 시간 추출
  const m = s.match(/T(\d{2}:\d{2})/)
  if (m) return m[1]
  // 숫자만 있는 경우 (예: "1400" → "14:00")
  const nums = s.match(/^(\d{1,2})(\d{2})$/)
  if (nums) return `${nums[1]}:${nums[2]}`
  return null
}

/** 월간 캘린더 그리드용 주 배열 생성 */
export function getCalendarWeeks(baseDate: Date): Date[][] {
  const ms = startOfMonth(baseDate)
  const me = endOfMonth(baseDate)
  const gridStart = startOfWeek(ms)
  const gridEnd = endOfWeek(me)
  const weeks: Date[][] = []
  let cur = new Date(gridStart)
  while (cur <= gridEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(addDays(cur, i)) }
    weeks.push(week)
    cur = addDays(cur, 7)
  }
  return weeks
}

"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, StickyNote } from "lucide-react";
import type { Task } from "@/components/tasks/task-card";
import { parseLocalDate, fmtDate, getCalendarWeeks, diffDays, parseTime } from "@/lib/dateUtils";
import { expandRepeat, isRepeating } from "@/lib/repeatUtils";
import { OCRUploadButton } from "@/features/ocr/components/OCRUploadButton";

type Props = {
  tasks: Task[];
  addTask: (form: Partial<Task>) => Promise<void>;
  updateTask: (form: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (task: Task) => Promise<void>;
  onEdit: (task: Task) => void;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
};

const PALETTE: Record<string, { bg: string; text: string }> = {
  하나: {
    bg: "#e9dfc7",
    text: "#6b5a2b",
  },
  민효: {
    bg: "#ddebe6",
    text: "#2f5f52",
  },
  함께: {
    bg: "#e7e4f5",
    text: "#4b4596",
  },
  데이트: {
    bg: "#f3e1e8",
    text: "#7a3d57",
  },
};

const DEFAULT_PAL = {
  bg: "#eef1f4",
  text: "#3a4452",
};

function getPal(task: Task) {
  return PALETTE[task.assignee] ?? DEFAULT_PAL;
}

function hexToRgb(hex: string) {
  const safe = hex.replace("#", "");
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

type Bar = {
  task: Task;
  weekKey: string;
  startCol: number;
  endCol: number;
  row: number;
};

function isMultiDay(task: Task) {
  return !!(task.date_start && task.date_end && task.date_start !== task.date_end);
}

function buildBars(tasks: Task[], weeks: Date[][]): Bar[] {
  const bars: Bar[] = [];

  weeks.forEach((week) => {
    const ws = week[0];
    const we = week[6];
    const weekKey = fmtDate(ws);

    const candidates = tasks
      .filter((t) => {
        if (!isMultiDay(t)) return false;
        const s = parseLocalDate(t.date_start);
        const e = parseLocalDate(t.date_end || t.date_start);
        if (!s || !e) return false;
        return !(e < ws || s > we);
      })
      .sort(
        (a, b) =>
          (parseLocalDate(a.date_start)?.getTime() ?? 0) -
          (parseLocalDate(b.date_start)?.getTime() ?? 0),
      );

    const used: { sc: number; ec: number; row: number }[] = [];

    candidates.forEach((task) => {
      const rawS = parseLocalDate(task.date_start)!;
      const rawE = parseLocalDate(task.date_end || task.date_start)!;
      const sc = diffDays(ws, rawS < ws ? ws : rawS);
      const ec = diffDays(ws, rawE > we ? we : rawE);

      // Safety: ensure sc and ec are valid numbers and sc <= ec
      if (Number.isNaN(sc) || Number.isNaN(ec) || sc > ec) {
        console.warn('Invalid calendar bar dimensions:', { task, sc, ec, ws, we });
        return; // skip this task to avoid infinite loops
      }

      // Find the first row that has no overlap with existing intervals at that row
      let row = 0;
      const MAX_ROWS = 100; // safety cap to prevent infinite loops
      let overlap: boolean;
      do {
        overlap = used.some((r) => r.row === row && !(ec < r.sc || sc > r.ec));
        if (overlap) row++;
      } while (overlap && row < MAX_ROWS);

      if (row >= MAX_ROWS) {
        console.warn('Exceeded max rows for calendar layout; possible data issue.', { task, sc, ec });
        // fallback: place at row 0 (will overlap but prevents freeze)
        row = 0;
      }

      used.push({ sc, ec, row });
      bars.push({ task, weekKey, startCol: sc, endCol: ec, row });
    });
  });

  return bars;
}

function buildDots(tasks: Task[]): Map<string, string[]> {
  const map = new Map<string, string[]>();

  tasks.forEach((t) => {
    const key = t.date_start;
    if (!key) return;

    const colors = map.get(key) ?? [];
    const c = getPal(t).bg;

    if (!colors.includes(c)) colors.push(c);
    map.set(key, colors);
  });

  return map;
}

function DayPanel({
  date,
  tasks,
  onEdit,
  onToggle,
}: {
  date: Date | null;
  tasks: Task[];
  onEdit: (t: Task) => void;
  onToggle: (t: Task) => void;
}) {
  if (!date) return null;

  const dayTasks = tasks.filter((t) => {
    const s = parseLocalDate(t.date_start);
    const e = parseLocalDate(t.date_end || t.date_start);
    if (!s) return false;
    return date >= s && date <= (e ?? s);
  });

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "14px 14px 10px" }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "rgba(255,255,255,0.88)",
          letterSpacing: "0.02em",
          marginBottom: 10,
        }}
      >
        {date.getMonth() + 1}월 {date.getDate()}일
        <span
          style={{
            marginLeft: 8,
            fontSize: 10,
            fontWeight: 400,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          {dayTasks.length}개 일정
        </span>
      </div>

      {dayTasks.length === 0 ? (
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.28)",
            textAlign: "center",
            padding: "14px 0",
          }}
        >
          일정 없음
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {dayTasks.map((task) => {
            const pal = getPal(task);
            const timeDisplay = parseTime(task.time);

            return (
              <div
                key={task.occurrenceDate ? `${task.id}-${task.occurrenceDate}` : task.id}
                onClick={() => onEdit(task)}
                style={{
                  borderRadius: 14,
                  padding: "10px 12px",
                  cursor: "pointer",
                  background: `rgba(${hexToRgb(pal.bg)},0.12)`,
                  border: `1px solid rgba(${hexToRgb(pal.bg)},0.28)`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 3,
                    borderRadius: 999,
                    alignSelf: "stretch",
                    background: pal.bg,
                    flexShrink: 0,
                    minHeight: 20,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: task.done ? "rgba(255,255,255,0.38)" : "#ffffff",
                      textDecoration: task.done ? "line-through" : "none",
                      lineHeight: 1.35,
                      wordBreak: "break-word",
                    }}
                  >
                    {task.text}
                    {isRepeating(task.repeat) && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 9,
                          color: pal.text,
                          opacity: 0.8,
                          fontWeight: 500,
                          padding: "1px 5px",
                          borderRadius: 4,
                          background: `rgba(${hexToRgb(pal.bg)},0.25)`,
                        }}
                      >
                        루틴
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        padding: "2px 7px",
                        borderRadius: 999,
                        background: `rgba(${hexToRgb(pal.bg)},0.2)`,
                        color: pal.text,
                      }}
                    >
                      {task.assignee}
                    </span>

                    {timeDisplay && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 10,
                          color: "rgba(255,255,255,0.45)",
                        }}
                      >
                        <Clock size={9} />
                        {timeDisplay}
                      </span>
                    )}

                    {task.location && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 10,
                          color: "rgba(255,255,255,0.45)",
                        }}
                      >
                        <MapPin size={9} />
                        {task.location}
                      </span>
                    )}
                  </div>

                  {"memo" in task && task.memo && String(task.memo).trim() && (
                    <div
                      style={{
                        marginTop: 7,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 5,
                        fontSize: 11,
                        lineHeight: 1.45,
                        color: "rgba(255,255,255,0.62)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      <StickyNote
                        size={10}
                        style={{
                          marginTop: 3,
                          flexShrink: 0,
                          opacity: 0.7,
                        }}
                      />
                      <span>{String(task.memo)}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(task);
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    flexShrink: 0,
                    marginTop: 1,
                    border: task.done
                      ? "1px solid rgba(201,168,76,0.45)"
                      : "1px solid rgba(255,255,255,0.18)",
                    background: task.done ? "rgba(201,168,76,0.18)" : "transparent",
                    color: task.done ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0)",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CalendarView({ tasks, onEdit, onToggle }: Props) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<Date | null>(() => new Date());

  const currentMonth = cursor.getMonth();
  const currentYear = cursor.getFullYear();

  const weeks = useMemo(() => getCalendarWeeks(cursor), [cursor]);
  const rangeStart = weeks[0][0];
  const rangeEnd = weeks[weeks.length - 1][6];

  const allDisplayTasks = useMemo(() => {
    const nonRoutine = tasks.filter((t) => !isRepeating(t.repeat));
    const routineExpanded: Task[] = [];

    tasks
      .filter((t) => isRepeating(t.repeat))
      .forEach((t) => {
        const dates = expandRepeat(t.repeat, rangeStart, rangeEnd);

        dates.forEach((d) => {
          const ds = fmtDate(d);

          let completed: string[] = [];
          if (typeof t.completedDates === "string") {
            try {
              completed = JSON.parse(t.completedDates as unknown as string);
            } catch {
              completed = [];
            }
          } else if (Array.isArray(t.completedDates)) {
            completed = t.completedDates;
          }

          routineExpanded.push({
            ...t,
            id: `${t.id}_${ds}`,
            originalId: t.id,
            date_start: ds,
            date_end: ds,
            done: completed.includes(ds),
            occurrenceDate: ds,
            completedDates: completed,
          });
        });
      });

    return [...nonRoutine, ...routineExpanded];
  }, [tasks, rangeStart, rangeEnd]);

  const bars = useMemo(
    () =>
      buildBars(
        allDisplayTasks.filter((t) => !isRepeating(t.repeat)),
        weeks,
      ),
    [allDisplayTasks, weeks],
  );

  const dotMap = useMemo(
    () => buildDots(allDisplayTasks.filter((t) => !isMultiDay(t))),
    [allDisplayTasks],
  );

  const todayKey = fmtDate(new Date());

  function handleDayClick(day: Date) {
    setSelected((prev) => (prev && fmtDate(prev) === fmtDate(day) ? null : day));
  }

  const selectedDayTasks = useMemo(() => {
    if (!selected) return [];

    return allDisplayTasks.filter((t) => {
      const s = parseLocalDate(t.date_start);
      const e = parseLocalDate(t.date_end || t.date_start);
      if (!s) return false;
      return selected >= s && selected <= (e ?? s);
    });
  }, [allDisplayTasks, selected]);

  const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
  const MONTH_LABELS = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  return (
    <div
      style={{
        borderRadius: 26,
        background: "linear-gradient(180deg, rgba(10,15,26,0.98), rgba(5,9,16,0.98))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 18px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          type="button"
          onClick={() => setCursor(new Date(currentYear, currentMonth - 1, 1))}
          style={navBtn}
        >
          <ChevronLeft size={15} />
        </button>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 17,
              fontWeight: 500,
              color: "rgba(255,255,255,0.92)",
              letterSpacing: "0.03em",
            }}
          >
            {MONTH_LABELS[currentMonth]}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>
            {currentYear}년
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setCursor(new Date(currentYear, currentMonth + 1, 1))}
            style={navBtn}
          >
            <ChevronRight size={15} />
          </button>
          <OCRUploadButton
            addTask={addTask}
            onEventsParsed={(events) => {
              // Optionally handle parsed events
              console.log("OCR parsed events:", events);
            }}
          />
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "10px 10px 0" }}
      >
        {WEEKDAY_LABELS.map((d, i) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.04em",
              paddingBottom: 8,
              color:
                i === 0
                  ? "rgba(255,120,120,0.75)"
                  : i === 6
                    ? "rgba(120,160,255,0.65)"
                    : "rgba(255,255,255,0.42)",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ padding: "0 6px 8px" }}>
        {weeks.map((week) => {
          const weekKey = fmtDate(week[0]);
          const weekBars = bars.filter((b) => b.weekKey === weekKey);
          const maxRow = weekBars.length ? Math.max(...weekBars.map((b) => b.row)) : -1;
          const barAreaH = maxRow >= 0 ? (maxRow + 1) * 20 + 4 : 0;

          return (
            <div key={weekKey} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  gap: 2,
                  minHeight: 52,
                }}
              >
                {week.map((day, ci) => {
                  const key = fmtDate(day);
                  const isToday = key === todayKey;
                  const isSel = selected ? fmtDate(selected) === key : false;
                  const isCurMon = day.getMonth() === currentMonth;
                  const isSun = ci === 0;
                  const isSat = ci === 6;
                  const dots = (dotMap.get(key) ?? []).slice(0, 3);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      style={{
                        padding: "7px 2px 5px",
                        cursor: "pointer",
                        borderRadius: 10,
                        border:
                          isSel && !isToday
                            ? "1px solid rgba(201,168,76,0.3)"
                            : "1px solid transparent",
                        background: isSel ? "rgba(201,168,76,0.09)" : "transparent",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 3,
                        transition: "background 0.15s",
                        minHeight: 52,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: isToday ? 600 : isCurMon ? 500 : 400,
                          color: !isCurMon
                            ? "rgba(255,255,255,0.2)"
                            : isToday
                              ? "#151515"
                              : isSun
                                ? "rgba(255,130,130,0.85)"
                                : isSat
                                  ? "rgba(130,170,255,0.8)"
                                  : "#f0ece0",
                          background: isToday ? "#e8a838" : "transparent",
                          flexShrink: 0,
                        }}
                      >
                        {day.getDate()}
                      </div>

                      <div style={{ height: 6, display: "flex", alignItems: "center", gap: 2 }}>
                        {dots.map((color, i) => (
                          <div
                            key={i}
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: 999,
                              background: color,
                              opacity: isCurMon ? 1 : 0.35,
                            }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ position: "relative", height: barAreaH, margin: "2px 4px 0" }}>
                {weekBars.map((bar) => {
                  const pal = getPal(bar.task);

                  return (
                    <button
                      key={`${bar.task.id}-${bar.weekKey}-${bar.row}`}
                      type="button"
                      onClick={() => onEdit(bar.task)}
                      title={bar.task.text}
                      style={{
                        position: "absolute",
                        left: `${(bar.startCol / 7) * 100}%`,
                        width: `${((bar.endCol - bar.startCol + 1) / 7) * 100}%`,
                        top: bar.row * 20 + 1,
                        height: 16,
                        border: "none",
                        borderRadius: 999,
                        padding: "0 6px",
                        background: pal.bg,
                        color: pal.text,
                        fontSize: 8,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "left",
                        cursor: "pointer",
                        opacity: bar.task.done ? 0.4 : 1,
                      }}
                    >
                      {bar.task.text}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <DayPanel date={selected} tasks={selectedDayTasks} onEdit={onEdit} onToggle={onToggle} />
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(255,255,255,0.05)",
  color: "rgba(255,255,255,0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.2s",
};

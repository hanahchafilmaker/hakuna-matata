"use client";

import { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import koLocale from "@fullcalendar/core/locales/ko";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import type { Task } from "@/components/tasks/task-card";
import { fmtDate } from "@/lib/dateUtils";
import { CalendarTaskRow } from "@/components/calendar/calendar-task-row";

type Props = {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
};

function toDateOnly(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function isSameDate(a?: string, b?: string) {
  return toDateOnly(a) === toDateOnly(b);
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatSelectedDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;

  const d = new Date(year, month - 1, day);
  const week = ["일", "월", "화", "수", "목", "금", "토"];
  return `${year}년 ${month}월 ${day}일 ${week[d.getDay()]}요일`;
}

function getTaskTypeLabel(task: Task) {
  if (task.repeat && task.repeat !== "none") return "루틴";
  if (task.type === "routine") return "루틴";
  if (task.type === "ui") return "중요·긴급";
  if (task.type === "nui") return "중요";
  if (task.type === "uni") return "긴급";
  if (task.type === "nuni") return "일반";
  return "일정";
}

function getDateRangeLabel(task: Task) {
  const start = fmtDate(parseLocalDate(toDateOnly(task.date_start)));
  const endValue = toDateOnly(task.date_end);

  if (endValue && endValue !== toDateOnly(task.date_start)) {
    return `${start} ~ ${fmtDate(parseLocalDate(endValue))}`;
  }

  return start;
}

export function CalendarView({ tasks, onEdit, onToggle }: Props) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());

  const events = useMemo(() => {
    return tasks.map((task) => {
      const start = toDateOnly(task.date_start);
      const end = toDateOnly(task.date_end || task.date_start);

      return {
        id: task.id,
        title: task.text || "제목 없음",
        start,
        end:
          end && end !== start
            ? getLocalDateString(new Date(parseLocalDate(end).getTime() + 24 * 60 * 60 * 1000))
            : undefined,
        allDay: true,
        extendedProps: {
          task,
        },
      };
    });
  }, [tasks]);

  const selectedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const start = toDateOnly(task.date_start);
        const end = toDateOnly(task.date_end || task.date_start);

        if (!start) return false;
        if (!end) return isSameDate(start, selectedDate);

        return start <= selectedDate && selectedDate <= end;
      })
      .sort((a, b) => {
        if ((a.done ? 1 : 0) !== (b.done ? 1 : 0)) {
          return (a.done ? 1 : 0) - (b.done ? 1 : 0);
        }
        return toDateOnly(a.date_start).localeCompare(toDateOnly(b.date_start));
      });
  }, [tasks, selectedDate]);

  function handleDateClick(arg: DateClickArg) {
    setSelectedDate(arg.dateStr);
  }

  function handleEventClick(arg: EventClickArg) {
    const task = arg.event.extendedProps.task as Task | undefined;
    if (!task) return;
    setSelectedDate(toDateOnly(arg.event.startStr));
    onEdit(task);
  }

  function goToday() {
    const api = calendarRef.current?.getApi();
    api?.today();
    setSelectedDate(getLocalDateString());
  }

  function renderEventContent(arg: EventContentArg) {
    return (
      <div className="calendar-event-chip">
        <span className="calendar-event-chip__text">{arg.event.title}</span>
      </div>
    );
  }

  return (
    <section className="calendar-view">
      <div className="calendar-shell">
        <div className="calendar-topbar">
          <div>
            <p className="calendar-topbar__eyebrow">MONTHLY</p>
            <h2 className="calendar-topbar__title">캘린더</h2>
          </div>

          <button type="button" className="calendar-today-btn" onClick={goToday}>
            오늘
          </button>
        </div>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={koLocale}
          locales={[koLocale]}
          fixedWeekCount={false}
          height="auto"
          headerToolbar={{
            left: "prev",
            center: "title",
            right: "next",
          }}
          dayMaxEventRows={2}
          moreLinkText={(count) => `+${count}`}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          dayHeaderFormat={{ weekday: "short" }}
          titleFormat={{ year: "numeric", month: "long" }}
          dayHeaderContent={(arg) => arg.text.replace("요일", "")}
          dayCellContent={(arg) => ({
            html: `<a class="fc-daygrid-day-number">${arg.date.getDate()}</a>`,
          })}
          buttonText={{
            today: "오늘",
          }}
        />
      </div>

      <section className="calendar-selected card">
        <div className="calendar-selected__head">
          <div>
            <p className="calendar-selected__eyebrow">SELECTED</p>
            <h3 className="calendar-selected__title">{formatSelectedDate(selectedDate)}</h3>
          </div>
          <span className="calendar-selected__count">{selectedTasks.length}</span>
        </div>

        {selectedTasks.length > 0 ? (
          <div className="section-stack">
            {selectedTasks.map((task) => (
              <CalendarTaskRow
                key={task.id}
                task={task}
                typeLabel={getTaskTypeLabel(task)}
                dateLabel={getDateRangeLabel(task)}
                onEdit={onEdit}
                onToggle={onToggle}
              />
            ))}
          </div>
        ) : (
          <div className="empty-card card calendar-empty">
            <p>선택한 날짜에 일정이 없어.</p>
          </div>
        )}
      </section>
    </section>
  );
}

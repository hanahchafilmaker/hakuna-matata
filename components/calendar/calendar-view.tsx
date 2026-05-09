"use client"

import { useMemo, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import koLocale from "@fullcalendar/core/locales/ko"
import type { DateClickArg } from "@fullcalendar/interaction"
import type { EventClickArg, EventContentArg } from "@fullcalendar/core"
import type { Task } from "@/components/tasks/task-card"
import { TaskCard } from "@/components/tasks/task-card"
import { fmtDate } from "@/lib/dateUtils"

type Props = {
  tasks: Task[]
  onEdit: (task: Task) => void
  onToggle: (task: Task) => void
  onDelete: (id: string) => void
}

function toDateOnly(value?: string) {
  if (!value) return ""
  return value.slice(0, 10)
}

function isSameDate(a?: string, b?: string) {
  return toDateOnly(a) === toDateOnly(b)
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatSelectedDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  if (!year || !month || !day) return dateStr

  const d = new Date(year, month - 1, day)
  const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")} ${week[d.getDay()]}`
}

function getTaskTypeLabel(task: Task) {
  if (task.repeat && task.repeat !== "none") return "Routine"
  if (task.type === "meeting") return "Meeting"
  if (task.type === "work") return "Work"
  if (task.type === "life") return "Life"
  if (task.type === "ui") return "Task"
  return "Task"
}

export function CalendarView({ tasks, onEdit, onToggle, onDelete }: Props) {
  const calendarRef = useRef<FullCalendar | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString())

  const events = useMemo(() => {
    return tasks.map((task) => {
      const start = toDateOnly(task.date_start)
      const end = toDateOnly(task.date_end || task.date_start)

      return {
        id: task.id,
        title: task.text || "Untitled",
        start,
        end:
          end && end !== start
            ? getLocalDateString(new Date(parseLocalDate(end).getTime() + 24 * 60 * 60 * 1000))
            : undefined,
        allDay: true,
        extendedProps: {
          task,
        },
      }
    })
  }, [tasks])

  const selectedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const start = toDateOnly(task.date_start)
        const end = toDateOnly(task.date_end || task.date_start)

        if (!start) return false
        if (!end) return isSameDate(start, selectedDate)

        return start <= selectedDate && selectedDate <= end
      })
      .sort((a, b) => {
        if ((a.done ? 1 : 0) !== (b.done ? 1 : 0)) {
          return (a.done ? 1 : 0) - (b.done ? 1 : 0)
        }
        return toDateOnly(a.date_start).localeCompare(toDateOnly(b.date_start))
      })
  }, [tasks, selectedDate])

  function handleDateClick(arg: DateClickArg) {
    setSelectedDate(arg.dateStr)
  }

  function handleEventClick(arg: EventClickArg) {
    const task = arg.event.extendedProps.task as Task | undefined
    if (!task) return
    setSelectedDate(toDateOnly(arg.event.startStr))
    onEdit(task)
  }

  function goToday() {
    const api = calendarRef.current?.getApi()
    api?.today()
    setSelectedDate(getLocalDateString())
  }

  function renderEventContent(arg: EventContentArg) {
    return (
      <div className="calendar-event-chip">
        <span className="calendar-event-chip__text">{arg.event.title}</span>
      </div>
    )
  }

  return (
    <section className="calendar-view">
      <div className="calendar-shell">
        <div className="calendar-topbar">
          <div>
            <p className="calendar-topbar__eyebrow">Monthly View</p>
            <h2 className="calendar-topbar__title">Calendar</h2>
          </div>

          <button type="button" className="calendar-today-btn" onClick={goToday}>
            Today
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
          buttonText={{
            today: "Today",
          }}
        />
      </div>

      <section className="calendar-selected card">
        <div className="calendar-selected__head">
          <div>
            <p className="calendar-selected__eyebrow">Selected Day</p>
            <h3 className="calendar-selected__title">{formatSelectedDate(selectedDate)}</h3>
          </div>
          <span className="calendar-selected__count">{selectedTasks.length}</span>
        </div>

        {selectedTasks.length > 0 ? (
          <div className="section-stack">
            {selectedTasks.map((task) => (
              <div key={task.id} className="calendar-task-wrap">
                <div className="calendar-task-meta">
                  <span className="calendar-task-meta__type">{getTaskTypeLabel(task)}</span>
                  <span className="calendar-task-meta__date">
                    {task.date_end && task.date_end !== task.date_start
                      ? `${fmtDate(parseLocalDate(toDateOnly(task.date_start)))} ~ ${fmtDate(
                          parseLocalDate(toDateOnly(task.date_end))
                        )}`
                      : fmtDate(parseLocalDate(toDateOnly(task.date_start)))}
                  </span>
                </div>

                <TaskCard task={task} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-card card calendar-empty">
            <p>No task on this date.</p>
          </div>
        )}
      </section>
    </section>
  )
}

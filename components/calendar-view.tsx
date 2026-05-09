'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'
import type { EventInput } from '@fullcalendar/core'
import type FullCalendarApi from '@fullcalendar/core'
import type { Task } from '@/components/task-card'
import { ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react'

type Props = {
  tasks?: Task[]
  onEdit?: (task: Task) => void
  onToggle?: (task: Task) => void
  onDelete?: (id: string) => void
}

type SheetTask = {
  id?: string
  date_start?: string
  date_end?: string
  assignee?: string
  text?: string
  location?: string
  time?: string
  type?: string
  repeat?: string
  done?: boolean
}

const ASSIGNEE_COLOR: Record<string, string> = {
  하나: '#89a35c',
  민효: '#4d8df7',
  함께: '#b232d6',
  데이트: '#f08a24',
}

function toDateOnly(value?: string) {
  if (!value) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''

  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
}

function addOneDay(dateStr: string) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)

  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
}

function parseTimeLabel(value?: string) {
  if (!value) return ''

  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) {
    const hh = d.getHours()
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ampm = hh < 12 ? '오전' : '오후'
    const h12 = hh % 12 || 12
    return `${ampm} ${h12}:${mm}`
  }

  return value
}

function sheetTaskToEvent(task: SheetTask): EventInput | null {
  const start = toDateOnly(task.date_start)
  if (!start) return null

  const endRaw = toDateOnly(task.date_end || task.date_start)
  const isMulti = endRaw && endRaw !== start
  const title = task.text || '일정'

  const color = ASSIGNEE_COLOR[task.assignee || ''] || '#6d8fd8'

  return {
    id: task.id || `${start}-${title}`,
    title,
    start,
    end: isMulti ? addOneDay(endRaw) : undefined,
    allDay: true,
    display: 'block',
    backgroundColor: isMulti ? color : 'transparent',
    borderColor: isMulti ? color : 'transparent',
    textColor: isMulti ? '#ffffff' : color,
    classNames: isMulti ? ['multi-day-event'] : ['single-day-event'],
    extendedProps: {
      raw: task,
      isMultiDay: isMulti,
      eventColor: color,
    },
  }
}

async function fetchHolidays(year: number): Promise<EventInput[]> {
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`)
    if (!res.ok) return []

    const data = await res.json()

    return data.map((h: any) => ({
      id: `holiday-${h.date}`,
      title: h.localName,
      start: h.date,
      allDay: true,
      classNames: ['holiday-event'],
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: '#ef4444',
      extendedProps: {
        isHoliday: true,
      },
    }))
  } catch {
    return []
  }
}

export function CalendarView({ tasks = [], onEdit }: Props) {
  const calendarRef = useRef<FullCalendar>(null)
  const [sheetTasks, setSheetTasks] = useState<SheetTask[]>([])
  const [holidays, setHolidays] = useState<EventInput[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentView, setCurrentView] = useState<'month' | 'list'>('month')

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true)

        // Use server-side API route to avoid CORS issues
        const res = await fetch('/api/tasks')
        const json = await res.json()

        const rows = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
            ? json.data
            : []

        setSheetTasks(rows)
      } catch (err) {
        console.error('일정 불러오기 실패:', err)
        setSheetTasks([])
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  useEffect(() => {
    async function loadHolidayEvents() {
      const currentYear = new Date().getFullYear()
      const result = await Promise.all([
        fetchHolidays(currentYear - 1),
        fetchHolidays(currentYear),
        fetchHolidays(currentYear + 1),
      ])

      setHolidays(result.flat())
    }

    loadHolidayEvents()
  }, [])

  const events = useMemo(() => {
    // sheetTasks 로딩 완료 시 sheetTasks 우선 사용 (tasks props와 중복 방지)
    const sourceItems: SheetTask[] = sheetTasks.length > 0
      ? sheetTasks
      : tasks.map((t) => ({
          id: t.id,
          date_start: t.date_start,
          date_end: t.date_end,
          assignee: t.assignee,
          text: t.text,
          location: t.location,
          time: t.time,
          type: t.type,
          repeat: t.repeat,
          done: t.done,
        }))

    const fromItems = sourceItems.map(sheetTaskToEvent).filter(Boolean) as EventInput[]

    return [...fromItems, ...holidays]
  }, [tasks, sheetTasks, holidays])

  const handlePrev = () => {
    calendarRef.current?.getApi().prev()
    updateTitle()
  }

  const handleNext = () => {
    calendarRef.current?.getApi().next()
    updateTitle()
  }

  const handleToday = () => {
    calendarRef.current?.getApi().today()
    updateTitle()
  }

  const updateTitle = () => {
    setTimeout(() => {
      const api = calendarRef.current?.getApi()
      if (api) {
        const date = api.getDate()
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        setCurrentTitle(`${year}년 ${month}월`)
      }
    }, 0)
  }

  const toggleView = () => {
    const api = calendarRef.current?.getApi()
    if (!api) return

    if (currentView === 'month') {
      api.changeView('listMonth')
      setCurrentView('list')
    } else {
      api.changeView('dayGridMonth')
      setCurrentView('month')
    }
  }

  useEffect(() => {
    updateTitle()
  }, [])

  return (
    <div className="calendar-shell">
      {/* Custom Header */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <button onClick={handlePrev} className="calendar-nav-btn" aria-label="이전 달">
            <ChevronLeft size={20} />
          </button>
          <button onClick={handleToday} className="calendar-today-btn">
            오늘
          </button>
          <button onClick={handleNext} className="calendar-nav-btn" aria-label="다음 달">
            <ChevronRight size={20} />
          </button>
        </div>

        <h2 className="calendar-title">{currentTitle}</h2>

        <button onClick={toggleView} className="calendar-view-btn" aria-label="뷰 전환">
          {currentView === 'month' ? <List size={18} /> : <Calendar size={18} />}
        </button>
      </div>

      {loading && <div className="calendar-loading">불러오는 중...</div>}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        locales={[koLocale]}
        locale="ko"
        timeZone="local"
        initialView="dayGridMonth"
        height="auto"
        dayMaxEvents={5}
        fixedWeekCount={false}
        events={events}
        headerToolbar={false}
        eventOrder={(a, b) => {
          const aMulti = a.extendedProps?.isMultiDay ? 0 : 1
          const bMulti = b.extendedProps?.isMultiDay ? 0 : 1
          return aMulti - bMulti
        }}
        dayCellContent={(arg) => arg.dayNumberText.replace('일', '')}
        eventContent={(arg) => {
          const isMultiDay = arg.event.extendedProps.isMultiDay
          const isHoliday = arg.event.extendedProps.isHoliday
          const eventColor = arg.event.extendedProps.eventColor
          
          if (isHoliday) {
            return <span className="holiday-text">{arg.event.title}</span>
          }
          
          if (isMultiDay) {
            return (
              <div className="multi-event-content">
                <span className="event-title">{arg.event.title}</span>
              </div>
            )
          }
          
          return (
            <div className="single-event-content">
              <span className="event-dot" style={{ backgroundColor: eventColor }} />
              <span className="event-title">{arg.event.title}</span>
            </div>
          )
        }}
        eventClick={(info) => {
          const raw = info.event.extendedProps.raw as Task | undefined
          const isHoliday = info.event.extendedProps.isHoliday

          if (isHoliday) return
          if (raw && onEdit) onEdit(raw)
        }}
        datesSet={() => updateTitle()}
      />
    </div>
  )
}

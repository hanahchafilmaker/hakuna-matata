"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
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

type ViewMode = "month" | "week";

interface WeatherData {
  temp: number;
  weatherCode: number;
  date: string;
}

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

function getWeatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code <= 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

function getStoredLocation(): { city: string; lat: number; lon: number } | null {
  try {
    const stored = localStorage.getItem("calendar-weather-location");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeLocation(loc: { city: string; lat: number; lon: number }) {
  try {
    localStorage.setItem("calendar-weather-location", JSON.stringify(loc));
  } catch {}
}

async function geocodeCity(
  city: string,
): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ko&format=json`,
    );
    const data = await res.json();
    if (data.results?.length > 0) {
      const r = data.results[0];
      return { lat: r.latitude, lon: r.longitude, name: r.name };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData[]> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max&timezone=auto&forecast_days=14`,
    );
    const data = await res.json();
    return data.daily.time.map((date: string, i: number) => ({
      date,
      temp: Math.round(data.daily.temperature_2m_max[i]),
      weatherCode: data.daily.weathercode[i],
    }));
  } catch {
    return [];
  }
}

function LocationModal({
  onSave,
  onClose,
  initialCity,
}: {
  onSave: (city: string, lat: number, lon: number) => void;
  onClose: () => void;
  initialCity?: string;
}) {
  const [input, setInput] = useState(initialCity || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    const result = await geocodeCity(input.trim());
    setLoading(false);
    if (result) {
      onSave(result.name, result.lat, result.lon);
    } else {
      setError("도시를 찾을 수 없어요. 다시 입력해 주세요.");
    }
  }

  return (
    <div className="location-modal-backdrop" onClick={onClose}>
      <div className="location-modal" onClick={(e) => e.stopPropagation()}>
        <p className="location-modal__title">날씨 위치 설정</p>
        <input
          className="location-modal__input"
          type="text"
          placeholder="도시명 입력 (예: 서울, Busan, Tokyo)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
        {error && <p className="location-modal__error">{error}</p>}
        <div className="location-modal__actions">
          <button type="button" className="location-modal__cancel" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="location-modal__save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "검색 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CalendarView({ tasks, onEdit, onToggle }: Props) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [location, setLocation] = useState<{ city: string; lat: number; lon: number } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    const stored = getStoredLocation();
    if (stored) setLocation(stored);
  }, []);

  useEffect(() => {
    if (!location) return;
    fetchWeather(location.lat, location.lon).then(setWeather);
  }, [location]);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.changeView(viewMode === "month" ? "dayGridMonth" : "timeGridWeek");
  }, [viewMode]);

  const weatherMap = useMemo(() => {
    const map: Record<string, WeatherData> = {};
    for (const w of weather) map[w.date] = w;
    return map;
  }, [weather]);

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
        extendedProps: { task },
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
        if ((a.done ? 1 : 0) !== (b.done ? 1 : 0)) return (a.done ? 1 : 0) - (b.done ? 1 : 0);
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

  function handleLocationSave(city: string, lat: number, lon: number) {
    const loc = { city, lat, lon };
    setLocation(loc);
    storeLocation(loc);
    setShowLocationModal(false);
  }

  function renderEventContent(arg: EventContentArg) {
    return (
      <div className="calendar-event-chip">
        <span className="calendar-event-chip__text">{arg.event.title}</span>
      </div>
    );
  }

  function renderDayCellContent(arg: { date: Date; dayNumberText: string }) {
    const dateStr = getLocalDateString(arg.date);
    const w = weatherMap[dateStr];
    const num = arg.date.getDate();
    return (
      <div className="fc-daycell-inner">
        <span className="fc-daycell-num">{num}</span>
        {w && (
          <span className="fc-daycell-weather" title={`${w.temp}°C`}>
            {getWeatherEmoji(w.weatherCode)}
          </span>
        )}
      </div>
    );
  }

  return (
    <section className="calendar-view">
      {showLocationModal && (
        <LocationModal
          onSave={handleLocationSave}
          onClose={() => setShowLocationModal(false)}
          initialCity={location?.city}
        />
      )}

      <div className="calendar-shell">
        <div className="calendar-topbar">
          <div>
            <p className="calendar-topbar__eyebrow">MONTHLY</p>
            <h2 className="calendar-topbar__title">캘린더</h2>
          </div>
          <div className="calendar-topbar__actions">
            <button
              type="button"
              className="calendar-weather-btn"
              onClick={() => setShowLocationModal(true)}
            >
              {location ? `📍 ${location.city}` : "📍 위치"}
            </button>
            <button type="button" className="calendar-today-btn" onClick={goToday}>
              오늘
            </button>
          </div>
        </div>

        <div className="calendar-tabs">
          <button
            type="button"
            className={`calendar-tab${viewMode === "month" ? " is-active" : ""}`}
            onClick={() => setViewMode("month")}
          >
            월간
          </button>
          <button
            type="button"
            className={`calendar-tab${viewMode === "week" ? " is-active" : ""}`}
            onClick={() => setViewMode("week")}
          >
            주간
          </button>
        </div>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={koLocale}
          locales={[koLocale]}
          fixedWeekCount={false}
          height="auto"
          headerToolbar={{ left: "prev", center: "title", right: "next" }}
          dayMaxEventRows={2}
          moreLinkText={(count) => `+${count}`}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          dayCellContent={renderDayCellContent}
          dayHeaderFormat={{ weekday: "short" }}
          titleFormat={{ year: "numeric", month: "long" }}
          buttonText={{ today: "오늘" }}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={true}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        />
      </div>

      <section className="calendar-selected card">
        <div className="calendar-selected__head">
          <div>
            <p className="calendar-selected__eyebrow">SELECTED</p>
            <h3 className="calendar-selected__title">{formatSelectedDate(selectedDate)}</h3>
            {weatherMap[selectedDate] && (
              <p className="calendar-selected__weather">
                {getWeatherEmoji(weatherMap[selectedDate].weatherCode)}{" "}
                {weatherMap[selectedDate].temp}°C
              </p>
            )}
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

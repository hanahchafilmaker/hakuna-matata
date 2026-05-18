"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/components/tasks/task-card";
import { TaskCard } from "@/components/tasks/task-card";
import { todayStr } from "@/lib/dateUtils";

function formatDateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDaysLeft(date: string) {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = parseLocalDate(date);
  return Math.round((target.getTime() - base.getTime()) / 86400000);
}

const WEATHER_CODES: Record<number, { label: string; emoji: string }> = {
  0: { label: "맑음", emoji: "☀️" },
  1: { label: "주로 맑음", emoji: "🌤" },
  2: { label: "구름 조금", emoji: "⛅️" },
  3: { label: "흐림", emoji: "☁️" },
  45: { label: "안개", emoji: "🌫" },
  48: { label: "안개", emoji: "🌫" },
  51: { label: "이슬비", emoji: "🌦" },
  53: { label: "이슬비", emoji: "🌦" },
  55: { label: "이슬비", emoji: "🌦" },
  61: { label: "비", emoji: "🌧" },
  63: { label: "비", emoji: "🌧" },
  65: { label: "강한 비", emoji: "🌧" },
  71: { label: "눈", emoji: "🌨" },
  73: { label: "눈", emoji: "🌨" },
  75: { label: "폭설", emoji: "❄️" },
  80: { label: "소나기", emoji: "🌦" },
  81: { label: "소나기", emoji: "🌦" },
  82: { label: "강한 소나기", emoji: "⛈" },
  95: { label: "뇌우", emoji: "⛈" },
  99: { label: "뇌우", emoji: "⛈" },
};

type WeatherData = { temp: number; code: number };

function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=37.46&longitude=126.70&current=temperature_2m,weather_code&timezone=Asia%2FSeoul&forecast_days=1"
    )
      .then((r) => r.json())
      .then((data) =>
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
        })
      )
      .catch(() => {});
  }, []);
  return weather;
}

function WeatherWidget() {
  const weather = useWeather();
  const today = todayStr();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[new Date().getDay()];

  return (
    <div className="weather-widget card">
      <div className="weather-widget__left">
        <p className="weather-widget__date">
          {formatDateLabel(today)} · {weekday}요일
        </p>
        {weather ? (
          <div className="weather-widget__info">
            <span className="weather-widget__emoji">
              {WEATHER_CODES[weather.code]?.emoji ?? "🌡"}
            </span>
            <span className="weather-widget__temp">{weather.temp}°</span>
            <span className="weather-widget__label">
              {WEATHER_CODES[weather.code]?.label ?? "날씨 정보"}
            </span>
          </div>
        ) : (
          <div className="weather-widget__info">
            <span className="weather-widget__loading">날씨 불러오는 중...</span>
          </div>
        )}
      </div>
      <div className="weather-widget__location">인천</div>
    </div>
  );
}

function DdayItem({ label, date }: { label: string; date: string }) {
  const diff = getDaysLeft(date);
  const display = diff === 0 ? "D-Day" : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
  return (
    <div className="dday-strip__item">
      <div>
        <p className="dday-strip__label">{label}</p>
        <p className="dday-strip__date">{formatDateLabel(date)}</p>
      </div>
      <strong className="dday-strip__value">{display}</strong>
    </div>
  );
}

export function HomeScreen({
  tasks,
  routines,
  ddayItems,
  onEdit,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  routines: Task[];
  ddayItems?: { label: string; date: string }[];
  onEdit: (task: Task) => void;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const today = todayStr();
  const defaultDdays = [
    { label: "금연", date: "2024-11-23" },
    { label: "민효와 처음 만난 날", date: "2024-06-30" },
  ];
  const visibleDdays = ddayItems ?? defaultDdays;

  const todayTasks = tasks
    .filter((t) => !t.done && t.date_start === today)
    .slice(0, 4);
  const upcomingTasks = tasks
    .filter((t) => !t.done && t.date_start > today)
    .sort((a, b) => a.date_start.localeCompare(b.date_start))
    .slice(0, 4);
  const visibleRoutines = routines.filter((t) => !t.done).slice(0, 3);

  return (
    <section className="home-screen">
      <WeatherWidget />

      <section className="home-section">
        <div className="section-head">
          <h3 className="section-title">오늘</h3>
          <span className="section-badge">{todayTasks.length}</span>
        </div>
        {todayTasks.length > 0 ? (
          <div className="section-stack">
            {todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </div>
        ) : (
          <div className="empty-card card"><p>오늘 일정이 없어.</p></div>
        )}
      </section>

      <section className="home-section">
        <div className="section-head">
          <h3 className="section-title">예정</h3>
          <span className="section-badge">최대 4개</span>
        </div>
        {upcomingTasks.length > 0 ? (
          <div className="section-stack">
            {upcomingTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </div>
        ) : (
          <div className="empty-card card"><p>예정된 일정이 없어.</p></div>
        )}
      </section>

      <section className="home-section">
        <div className="section-head">
          <h3 className="section-title">루틴</h3>
          <span className="section-badge">{visibleRoutines.length}</span>
        </div>
        {visibleRoutines.length > 0 ? (
          <div className="section-stack">
            {visibleRoutines.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </div>
        ) : (
          <div className="empty-card card"><p>오늘 루틴이 없어.</p></div>
        )}
      </section>

      {visibleDdays.length > 0 && (
        <section className="home-section">
          <div className="section-head">
            <h3 className="section-title">D-Day</h3>
            <span className="section-badge">내 기념일</span>
          </div>
          <div className="section-stack">
            <div className="card dday-strip">
              {visibleDdays.map((item, i) => (
                <DdayItem key={i} label={item.label} date={item.date} />
              ))}
            </div>
          </div>
        </section>
      )}
    </section>
  );
}

"use client";

import type { Task } from "@/components/task-card";
import { TaskCard } from "@/components/task-card";
import { todayStr } from "@/lib/dateUtils";

function formatDateKorean(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return `${year}년 ${month}월 ${day}일`;
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

function DdayItem({ label, date }: { label: string; date: string }) {
  const diff = getDaysLeft(date);
  const display = diff === 0 ? "D-Day" : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;

  return (
    <div className="dday-strip__item">
      <div>
        <p className="dday-strip__label">{label}</p>
        <p className="dday-strip__date">{formatDateKorean(date)}</p>
      </div>
      <strong className="dday-strip__value">{display}</strong>
    </div>
  );
}

export function HomeScreen({
  tasks,
  routines,
  onEdit,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  routines: Task[];
  onEdit: (task: Task) => void;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const today = todayStr();

  const todayTasks = tasks.filter((task) => !task.done && task.date_start === today).slice(0, 4);

  const upcomingTasks = tasks
    .filter((task) => !task.done && task.date_start > today)
    .sort((a, b) => a.date_start.localeCompare(b.date_start))
    .slice(0, 4);

  const visibleRoutines = routines.filter((task) => !task.done).slice(0, 3);

  return (
    <section className="home-screen">
      <div className="home-screen__hero card">
        <p className="home-screen__hero-date">{formatDateKorean(today)}</p>
        <h2 className="home-screen__hero-title">오늘 필요한 것만 보기</h2>
        <p className="home-screen__hero-subtitle">해야 할 일과 가까운 일정만 가볍게 정리했어.</p>
      </div>

      <section className="home-section">
        <div className="section-head">
          <h3 className="section-title">오늘 일정</h3>
          <span className="section-badge">{todayTasks.length}개</span>
        </div>

        {todayTasks.length > 0 ? (
          <div className="section-stack">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="empty-card card">
            <p>오늘 일정은 비어 있어.</p>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="section-head">
          <h3 className="section-title">가까운 일정</h3>
          <span className="section-badge">최대 4개</span>
        </div>

        {upcomingTasks.length > 0 ? (
          <div className="section-stack">
            {upcomingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="empty-card card">
            <p>다가오는 일정이 아직 없어.</p>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="section-head">
          <h3 className="section-title">오늘 루틴</h3>
          <span className="section-badge">{visibleRoutines.length}개</span>
        </div>

        {visibleRoutines.length > 0 ? (
          <div className="section-stack">
            {visibleRoutines.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="empty-card card">
            <p>오늘 표시할 루틴이 없어.</p>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="section-head">
          <h3 className="section-title">디데이</h3>
          <span className="section-badge">생활 기준점</span>
        </div>

        <div className="section-stack">
          <div className="card dday-strip">
            <DdayItem label="금연 시작" date="2024-11-23" />
            <DdayItem label="우리 만난 날" date="2024-06-30" />
          </div>
        </div>
      </section>
    </section>
  );
}

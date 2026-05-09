"use client";

import { useMemo } from "react";
import { CalendarDays, Flag, ListChecks } from "lucide-react";
import { TaskCard, type Task } from "@/components/task-card";
import { diffDays, getDdayLabel, parseLocalDate, todayStr } from "@/lib/dateUtils";

type Props = {
  tasks: Task[];
  routines: Task[];
  onEdit: (task: Task) => void;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
};

export function HomeScreen({ tasks, routines, onEdit, onToggle, onDelete, onAdd }: Props) {
  const today = todayStr();
  const todayDate = parseLocalDate(today) ?? new Date();

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.date_start === today || task.occurrenceDate === today)
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
        .slice(0, 5),
    [tasks, today],
  );

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.date_start && task.date_start > today)
        .sort((a, b) => a.date_start.localeCompare(b.date_start))
        .slice(0, 4),
    [tasks, today],
  );

  const ddayTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.date_start && task.date_start !== today)
        .map((task) => ({
          task,
          diff: Math.abs(diffDays(todayDate, parseLocalDate(task.date_start) ?? todayDate)),
        }))
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 2)
        .map((item) => item.task),
    [tasks, today, todayDate],
  );

  const todoTasks = useMemo(
    () =>
      tasks
        .filter((task) => !task.done)
        .sort((a, b) => {
          if (!a.date_start) return 1;
          if (!b.date_start) return -1;
          return a.date_start.localeCompare(b.date_start);
        })
        .slice(0, 4),
    [tasks],
  );

  return (
    <div className="section-stack">
      <section className="home-card card">
        <div className="section-header">
          <div>
            <p className="section-label">오늘</p>
            <h2 className="section-title">{today}</h2>
          </div>
          <button type="button" className="secondary-button" onClick={onAdd}>
            + 추가
          </button>
        </div>
      </section>

      <section className="home-card card">
        <div className="section-header">
          <div>
            <p className="section-label">오늘 일정</p>
            <p className="section-description">{todayTasks.length}개 진행 중</p>
          </div>
          <CalendarDays size={18} />
        </div>

        {todayTasks.length > 0 ? (
          <div className="home-list">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="home-empty">오늘 일정이 없습니다. 빠르게 추가해보세요.</div>
        )}
      </section>

      <section className="home-card card">
        <div className="section-header">
          <div>
            <p className="section-label">가까운 일정</p>
            <p className="section-description">다음 3개 일정만 표시</p>
          </div>
          <ListChecks size={18} />
        </div>

        {upcomingTasks.length > 0 ? (
          <div className="home-list">
            {upcomingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="home-empty">등록된 다음 일정이 없습니다.</div>
        )}
      </section>

      <section className="home-card card">
        <div className="section-header">
          <div>
            <p className="section-label">디데이</p>
            <p className="section-description">가까운 디데이를 놓치지 마세요</p>
          </div>
          <Flag size={18} />
        </div>

        {ddayTasks.length > 0 ? (
          <div className="home-dday-grid">
            {ddayTasks.map((task) => (
              <div key={task.id} className="dday-card">
                <p className="dday-title">{task.text}</p>
                <p className="dday-label">{getDdayLabel(task.date_start)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="home-empty">디데이가 없는 일정입니다.</div>
        )}
      </section>

      <section className="home-card card">
        <div className="section-header">
          <div>
            <p className="section-label">오늘 할 일</p>
            <p className="section-description">미완료 항목을 먼저 보여줍니다</p>
          </div>
        </div>

        {todoTasks.length > 0 ? (
          <div className="home-list">
            {todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="home-empty">할 일이 없어요. 새로운 할 일을 추가해보세요.</div>
        )}
      </section>
    </div>
  );
}

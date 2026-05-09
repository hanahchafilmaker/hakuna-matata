"use client";

import type { Task } from "@/components/tasks/task-card";
import { TaskCard } from "@/components/tasks/task-card";
import { todayStr } from "@/lib/dateUtils";

function formatDateKorean(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return `${year}??${month}??${day}??;
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
        <h2 className="home-screen__hero-title">?§Îäò ?ÑÏöî??Í≤ÉÎßå Î≥¥Í∏∞</h2>
        <p className="home-screen__hero-subtitle">?¥Ïïº ???ºÍ≥º Í∞ÄÍπåÏö¥ ?ºÏ†ïÎß?Í∞ÄÎ≥çÍ≤å ?ïÎ¶¨?àÏñ¥.</p>
      </div>

      <section className="home-section">
        <div className="section-head">
          <h3 className="section-title">?§Îäò ?ºÏ†ï</h3>
          <span className="section-badge">{todayTasks.length}Í∞?/span>
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
            <p>?§Îäò ?ºÏ†ï?Ä ÎπÑÏñ¥ ?àÏñ¥.</p>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="section-head">
          <h3 className="section-title">Í∞ÄÍπåÏö¥ ?ºÏ†ï</h3>
          <span className="section-badge">ÏµúÎ? 4Í∞?/span>
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
            <p>?§Í??§Îäî ?ºÏ†ï???ÑÏßÅ ?ÜÏñ¥.</p>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="section-head">
          <h3 className="section-title">?§Îäò Î£®Ìã¥</h3>
          <span className="section-badge">{visibleRoutines.length}Í∞?/span>
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
            <p>?§Îäò ?úÏãú??Î£®Ìã¥???ÜÏñ¥.</p>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="section-head">
          <h3 className="section-title">?îÎç∞??/h3>
          <span className="section-badge">?ùÌôú Í∏∞Ï???/span>
        </div>

        <div className="section-stack">
          <div className="card dday-strip">
            <DdayItem label="Í∏àÏó∞ ?úÏûë" date="2024-11-23" />
            <DdayItem label="?∞Î¶¨ ÎßåÎÇú ?? date="2024-06-30" />
          </div>
        </div>
      </section>
    </section>
  );
}

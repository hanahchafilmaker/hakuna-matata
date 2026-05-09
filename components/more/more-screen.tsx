"use client";

import type { Task } from "@/components/task-card";
import { TaskCard } from "@/components/task-card";

export function MoreScreen({
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
  const activeTasks = tasks.filter((task) => !task.done).slice(0, 8);
  const doneTasks = tasks.filter((task) => task.done).slice(0, 4);
  const visibleRoutines = routines.slice(0, 6);

  return (
    <section className="more-screen">
      <div className="more-group card">
        <div className="more-group__head">
          <div>
            <h3 className="more-group__title">전체 할 일</h3>
            <p className="more-group__desc">지금 진행 중인 항목</p>
          </div>
          <span className="more-group__count">{activeTasks.length}</span>
        </div>

        <div className="section-stack">
          {activeTasks.length > 0 ? (
            activeTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))
          ) : (
            <div className="empty-inline">진행 중인 할 일이 없어.</div>
          )}
        </div>
      </div>

      <div className="more-group card">
        <div className="more-group__head">
          <div>
            <h3 className="more-group__title">루틴</h3>
            <p className="more-group__desc">반복되는 생활 항목</p>
          </div>
          <span className="more-group__count">{visibleRoutines.length}</span>
        </div>

        <div className="section-stack">
          {visibleRoutines.length > 0 ? (
            visibleRoutines.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))
          ) : (
            <div className="empty-inline">등록된 루틴이 없어.</div>
          )}
        </div>
      </div>

      <div className="more-group card">
        <div className="more-group__head">
          <div>
            <h3 className="more-group__title">완료한 일</h3>
            <p className="more-group__desc">최근 체크한 항목</p>
          </div>
          <span className="more-group__count">{doneTasks.length}</span>
        </div>

        <div className="section-stack">
          {doneTasks.length > 0 ? (
            doneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))
          ) : (
            <div className="empty-inline">아직 완료한 항목이 없어.</div>
          )}
        </div>
      </div>
    </section>
  );
}

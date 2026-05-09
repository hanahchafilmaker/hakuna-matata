"use client";

import type { Task } from "@/components/tasks/task-card";
import { TaskCard } from "@/components/tasks/task-card";

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
            <h3 className="more-group__title">?„ì²´ ????/h3>
            <p className="more-group__desc">ì§€ê¸?ì§„í–‰ ì¤‘ì¸ ??ª©</p>
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
            <div className="empty-inline">ì§„í–‰ ì¤‘ì¸ ???¼ì´ ?†ì–´.</div>
          )}
        </div>
      </div>

      <div className="more-group card">
        <div className="more-group__head">
          <div>
            <h3 className="more-group__title">ë£¨í‹´</h3>
            <p className="more-group__desc">ë°˜ë³µ?˜ëŠ” ?í™œ ??ª©</p>
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
            <div className="empty-inline">?±ë¡??ë£¨í‹´???†ì–´.</div>
          )}
        </div>
      </div>

      <div className="more-group card">
        <div className="more-group__head">
          <div>
            <h3 className="more-group__title">?„ë£Œ????/h3>
            <p className="more-group__desc">ìµœê·¼ ì²´í¬????ª©</p>
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
            <div className="empty-inline">?„ì§ ?„ë£Œ????ª©???†ì–´.</div>
          )}
        </div>
      </div>
    </section>
  );
}

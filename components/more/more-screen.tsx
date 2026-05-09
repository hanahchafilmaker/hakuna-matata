"use client"

import type { Task } from "@/components/tasks/task-card"
import { TaskCard } from "@/components/tasks/task-card"

export function MoreScreen({
  tasks,
  routines,
  onEdit,
  onToggle,
  onDelete,
}: {
  tasks: Task[]
  routines: Task[]
  onEdit: (task: Task) => void
  onToggle: (task: Task) => void
  onDelete: (id: string) => void
}) {
  const activeTasks = tasks.filter((task) => !task.done).slice(0, 8)
  const doneTasks = tasks.filter((task) => task.done).slice(0, 4)
  const visibleRoutines = routines.slice(0, 6)

  return (
    <section className="more-screen">
      <div className="more-group card">
        <div className="more-group__head">
          <div>
            <h3 className="more-group__title">All tasks</h3>
            <p className="more-group__desc">Currently active items</p>
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
            <div className="empty-inline">No active task.</div>
          )}
        </div>
      </div>

      <div className="more-group card">
        <div className="more-group__head">
          <div>
            <h3 className="more-group__title">Routines</h3>
            <p className="more-group__desc">Repeated daily or weekly items</p>
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
            <div className="empty-inline">No routine found.</div>
          )}
        </div>
      </div>

      <div className="more-group card">
        <div className="more-group__head">
          <div>
            <h3 className="more-group__title">Done</h3>
            <p className="more-group__desc">Recently completed items</p>
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
            <div className="empty-inline">Nothing completed yet.</div>
          )}
        </div>
      </div>
    </section>
  )
}

"use client"

import type { Task } from "@/components/tasks/task-card"
import { TaskCard } from "@/components/tasks/task-card"
import { MemoWidget } from "@/features/memo/components/MemoWidget"
import { OCRUploadButton } from "@/features/ocr/components/OCRUploadButton"

export function MoreScreen({
  tasks,
  routines,
  onEdit,
  onToggle,
  onDelete,
  addTask,
}: {
  tasks: Task[]
  routines: Task[]
  onEdit: (task: Task) => void
  onToggle: (task: Task) => void
  onDelete: (id: string) => void
  addTask: (task: Partial<Task>) => Promise<void>
}) {
  const activeTasks = tasks.filter((task) => !task.done).slice(0, 8)
  const doneTasks = tasks.filter((task) => task.done).slice(0, 4)
  const visibleRoutines = routines.slice(0, 6)

  // Current year and month for OCR button
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  return (
    <section className="more-screen">
      {/* [추가] 더보기 화면에서도 오늘 적어둔 생각들을 가장 먼저 마주하도록 배치합니다 */}
      <MemoWidget />
      {/* OCR tool */}
      <div className="more-group card">
        <div className="more-group__head">
          <h3 className="more-group__title">도구</h3>
          <p className="more-group__desc">사진으로 일정 등록</p>
        </div>
        <div className="section-stack">
          <OCRUploadButton year={year} month={month} tasks={tasks} addTask={addTask} />
        </div>
      </div>
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

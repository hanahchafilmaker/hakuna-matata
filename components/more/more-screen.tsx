"use client"

import { useMemo, Fragment, type ReactNode } from "react"
import type { Task } from "@/components/tasks/task-card"
import { TaskCard } from "@/components/tasks/task-card"
import { MemoWidget } from "@/features/memo/components/MemoWidget"
import { OCRUploadButton } from "@/features/ocr/components/OCRUploadButton"

/* ------------------------------------------------------------------
 * SectionGroup (재사용 UI 컴포넌트)
 * ------------------------------------------------------------------ */
function SectionGroup<T extends { id: string }>({
  title,
  desc,
  count,
  items,
  renderItem,
  emptyMessage,
  emptyState,
  footer,
  loading,
}: {
  title: string
  desc: string
  count: number
  items: T[]
  renderItem: (item: T) => ReactNode
  emptyMessage?: string
  emptyState?: ReactNode
  footer?: ReactNode
  loading?: boolean
}) {
  if (loading) {
    return <div className="loading">Loading…</div>
  }

  return (
    <div className="more-group card">
      <div className="more-group__head">
        <div>
          <h3 className="more-group__title">{title}</h3>
          <p className="more-group__desc">{desc}</p>
        </div>
        <span className="more-group__count">{count}</span>
      </div>

      <div className="section-stack">
        {items.length > 0 ? (
          items.map((item) => (
            <Fragment key={item.id}>
              {renderItem(item)}
            </Fragment>
          ))
        ) : (
          emptyState ?? (
            <div className="empty-inline">
              {emptyMessage ?? ""}
            </div>
          )
        )}
      </div>

      {footer && <div className="section-footer">{footer}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------
 * MoreScreen (메인 화면)
 * ------------------------------------------------------------------ */
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
  /* -----------------------------
   * 1. 데이터 분리 + slice
   * ----------------------------- */
  const allActiveTasks = useMemo(
    () => tasks.filter((t) => !t.done),
    [tasks]
  )

  const activeTasks = allActiveTasks.slice(0, 8)

  const allDoneTasks = useMemo(
    () => tasks.filter((t) => t.done),
    [tasks]
  )

  const doneTasks = allDoneTasks.slice(0, 4)

  const allRoutines = useMemo(() => routines, [routines])
  const visibleRoutines = allRoutines.slice(0, 6)

  /* -----------------------------
   * 2. 날짜 고정값
   * ----------------------------- */
  const { year, month } = useMemo(() => {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    }
  }, [])

  /* -----------------------------
   * 3. UI
   * ----------------------------- */
  return (
    <section className="more-screen">
      {/* Memo */}
      <MemoWidget />

      {/* OCR */}
      <OCRUploadButton
        year={year}
        month={month}
        addTask={addTask}
      />

      {/* Active tasks */}
      <SectionGroup
        title="All tasks"
        desc="Currently active items"
        count={allActiveTasks.length}
        items={activeTasks}
        renderItem={(task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        )}
        emptyMessage="No active task."
      />

      {/* Routines */}
      <SectionGroup
        title="Routines"
        desc="Repeated daily or weekly items"
        count={allRoutines.length}
        items={visibleRoutines}
        renderItem={(task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        )}
        emptyMessage="No routine found."
      />

      {/* Done */}
      <SectionGroup
        title="Done"
        desc="Recently completed items"
        count={allDoneTasks.length}
        items={doneTasks}
        renderItem={(task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        )}
        emptyMessage="Nothing completed yet."
      />
    </section>
  )
}
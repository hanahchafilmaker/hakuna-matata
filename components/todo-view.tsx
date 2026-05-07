"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, ChevronRight, Flame, Flag, Repeat2 } from "lucide-react"
import { TaskCard, type Task } from "@/components/task-card"
import { daysSince, getDdayLabel, parseLocalDate, todayStr } from "@/lib/dateUtils"
import { expandRepeat, isRepeating } from "@/lib/repeatUtils"

type Props = {
  tasks: Task[]
  showDone: boolean
  onEdit: (task: Task) => void
  onToggle: (task: Task) => void
  onDelete: (id: string) => void
}

function ProgressBar({
  done,
  total,
  label,
  color = "#c9a84c"
}: {
  done: number
  total: number
  label: string
  color?: string
}) {

  const pct = total > 0
    ? Math.round((done / total) * 100)
    : 0

  return (

    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "rgba(255,255,255,0.6)"
        }}
      >
        <span>{label}</span>

        <span>
          {done}/{total}
          {" "}
          ({pct}%)
        </span>

      </div>


      <div
        style={{
          height: 5,
          borderRadius: 999,
          background: "rgba(255,255,255,0.06)"
        }}
      >

        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
            transition: "width .35s"
          }}
        />

      </div>

    </div>

  )

}



function StatCard({
  icon,
  title,
  value,
  subtext
}: any) {

  return (

    <div
      style={{
        borderRadius: 18,
        padding: "14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",

        display: "flex",
        flexDirection: "column",
        gap: 6
      }}
    >

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "var(--gold-soft)"
        }}
      >

        {icon}
        {title}

      </div>


      <div
        style={{
          fontSize: 20,
          color: "#fff"
        }}
      >
        {value}
      </div>


      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.45)"
        }}
      >
        {subtext}
      </div>

    </div>

  )

}



function SelectDdayCard({
  items,
  selectedId,
  setSelectedId
}: any) {

  const selected = items.find(
    (i: Task) => i.id === selectedId
  )

  return (

    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)"
      }}
    >

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "var(--gold-soft)"
        }}
      >

        <Flag size={12} />
        세번째

      </div>


      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}

        style={{
          marginTop: 8,
          width: "100%",
          height: 34,
          borderRadius: 10,

          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",

          color: "#fff",
          fontSize: 12
        }}
      >

        {items.map((t: Task) => (
          <option key={t.id} value={t.id}>
            {t.text}
          </option>
        ))}

      </select>


      <div
        style={{
          marginTop: 8,
          fontSize: 20,
          color: "#fff"
        }}
      >

        {selected
          ? getDdayLabel(selected.date_start)
          : "-"
        }

      </div>

    </div>

  )

}



function PrettyTaskRow({
  task,
  onEdit,
  onToggle,
  onDelete
}: any) {

  return (

    <div
      onClick={() => onEdit(task)}

      style={{
        borderRadius: 16,
        padding: 14,

        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",

        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",

        cursor: "pointer"
      }}
    >

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle(task)
          }}

          style={{
            width: 20,
            height: 20,
            borderRadius: 999,

            border: "1px solid rgba(255,255,255,0.2)",

            background: task.done
              ? "rgba(201,168,76,0.2)"
              : "transparent"
          }}
        />

        <span
          style={{
            fontSize: 14,

            textDecoration: task.done
              ? "line-through"
              : "none"
          }}
        >

          {task.text}

        </span>

      </div>


      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(task.id)
        }}
      >

        <ChevronRight size={16} />

      </button>

    </div>

  )

}



function RoutineProgressPanel({
  routines
}: {
  routines: Task[]
}) {

  const today = todayStr()

  const todayRoutines = useMemo(
    () => routines.filter(
      (t) =>
        expandRepeat(
          t.repeat,
          new Date(today),
          new Date(today)
        ).length > 0
    ),
    [routines, today]
  )


  const doneCount = todayRoutines.filter(
    (t) => {

      let completed: string[] = []

      if (typeof t.completedDates === "string") {
        try {
          completed = JSON.parse(t.completedDates)
        } catch { }
      }

      return completed.includes(today)
    }
  ).length


  if (todayRoutines.length === 0)
    return null


  return (

    <div
      style={{
        borderRadius: 18,
        padding: 14,

        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)"
      }}
    >

      <div
        style={{
          fontSize: 11,
          color: "var(--gold-soft)",
          marginBottom: 8
        }}
      >

        <Repeat2 size={12} />
        오늘 루틴

      </div>


      <ProgressBar
        done={doneCount}
        total={todayRoutines.length}
        label="루틴 진행률"
      />

    </div>

  )

}



export function TodoView({
  tasks,
  showDone,
  onEdit,
  onToggle,
  onDelete
}: Props) {

  const routines =
    tasks.filter((t) =>
      isRepeating(t.repeat)
    )

  const normalTasks =
    tasks.filter((t) =>
      !isRepeating(t.repeat)
    )


  const visibleTasks =
    normalTasks.filter((t) =>
      showDone || !t.done
    )


  const [selectedId, setSelectedId] =
    useState("")


  useEffect(() => {

    if (
      visibleTasks.length > 0 &&
      !selectedId
    ) {

      setSelectedId(
        visibleTasks[0].id
      )

    }

  }, [visibleTasks])


  return (

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14
      }}
    >

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8
        }}
      >

        <StatCard
          icon={<Flame size={12} />}
          title="하나금연"
          value={daysSince("2024-11-23")}
          subtext="2024.11.23"
        />

        <StatCard
          icon={<CalendarDays size={12} />}
          title="오늘부터"
          value={daysSince("2024-06-30")}
          subtext="2024.06.30"
        />

        <SelectDdayCard
          items={visibleTasks}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />

      </section>


      <RoutineProgressPanel routines={routines} />


      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}
      >

        {visibleTasks.map((task) => (

          <PrettyTaskRow
            key={task.id}
            task={task}

            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />

        ))}

      </section>

    </div>

  )

}
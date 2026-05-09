'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, LayoutGrid, UserRound, Sparkles } from 'lucide-react'
import { TaskCard, type Task } from '@/components/task-card'
import { todayStr } from '@/lib/dateUtils'
import { expandRepeat, isRepeating } from '@/lib/repeatUtils'

type Props = {
  tasks: Task[]
  routines: Task[]
  showDone: boolean
  onEdit: (task: Task) => void
  onToggle: (task: Task) => void
  onDelete: (id: string) => void
}

type AssigneeTab = '전체' | '하나' | '민효' | '함께' | '데이트'

function RoutinePanel({ assignee, items, onToggle }: { assignee: AssigneeTab; items: Task[]; onToggle: (t: Task) => void }) {

  const today = todayStr()

  const todayItems = useMemo(() => {
    const now = new Date()
    return items.filter((t) =>
      expandRepeat(t.repeat, now, now).length > 0
    )
  }, [items])

  const done = todayItems.filter((t) => {
    let completed: string[] = []

    if (typeof t.completedDates === 'string') {
      try { completed = JSON.parse(t.completedDates) }
      catch { completed = [] }
    }
    else if (Array.isArray(t.completedDates)) {
      completed = t.completedDates
    }

    return completed.includes(today)
  }).length

  const total = todayItems.length
  const pct = total > 0 ? (done / total) * 100 : 0
  const allDone = total > 0 && done === total


  function isRoutineDoneToday(t: Task): boolean {

    let completed: string[] = []

    if (typeof t.completedDates === 'string') {
      try { completed = JSON.parse(t.completedDates) }
      catch { completed = [] }
    }
    else if (Array.isArray(t.completedDates)) {
      completed = t.completedDates
    }

    return completed.includes(today)
  }


  return (

    <section
      style={{
        borderRadius: 22,
        padding: '16px 16px 14px',

        background: allDone
          ? 'rgba(201,168,76,0.08)'
          : 'rgba(255,255,255,0.04)',

        border: allDone
          ? '1px solid rgba(201,168,76,0.25)'
          : '1px solid rgba(255,255,255,0.08)',

        transition: 'all 0.3s'
      }}
    >

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: allDone ? '#f1d382' : 'var(--gold-soft)',
            fontSize: 11
          }}
        >

          {allDone
            ? <Sparkles size={12} />
            : <CheckCircle2 size={12} />
          }

          <span>
            {assignee === '전체'
              ? '오늘 루틴'
              : `${assignee} 루틴`
            }
          </span>

        </div>


        <div style={{ fontSize: 13 }}>
          {done}
          <span
            style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: 10
            }}
          >
            {' '} / {total}
          </span>
        </div>

      </div>


      <div
        style={{
          marginTop: 12,
          height: 6,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 999,
          overflow: 'hidden'
        }}
      >

        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: '#c9a84c',
            transition: 'width 0.4s'
          }}
        />

      </div>


      <div
        style={{
          marginTop: 12,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 7
        }}
      >

        {todayItems.length === 0
          ? (
            <span
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.35)'
              }}
            >
              오늘 해당 루틴 없음
            </span>
          )

          : todayItems.map((r) => {

            const doneToday = isRoutineDoneToday(r)

            const toggleTask: Task = {
              ...r,
              done: doneToday,
              occurrenceDate: today
            }

            return (

              <button
                key={r.id}

                onClick={() => onToggle(toggleTask)}

                style={{
                  padding: '6px 11px',
                  borderRadius: 999,

                  border: doneToday
                    ? '1px solid rgba(201,168,76,0.35)'
                    : '1px solid rgba(255,255,255,0.08)',

                  background: doneToday
                    ? 'rgba(201,168,76,0.15)'
                    : 'rgba(255,255,255,0.04)',

                  color: doneToday
                    ? '#f1d382'
                    : 'rgba(255,255,255,0.72)',

                  fontSize: 11,

                  textDecoration: doneToday
                    ? 'line-through'
                    : 'none',

                  cursor: 'pointer'
                }}
              >

                {doneToday ? '✓ ' : ''}
                {r.text}

              </button>

            )

          })
        }

      </div>

    </section>

  )
}



function MatrixSection({
  title,
  subtitle,
  items,
  tone,
  onEdit,
  onToggle,
  onDelete
}: any) {

  const toneStyle = {
    red: {
      border: 'rgba(239,104,104,0.15)',
      bg: 'rgba(239,104,104,0.05)',
      text: '#ffb4b4'
    },

    gold: {
      border: 'rgba(212,175,55,0.15)',
      bg: 'rgba(212,175,55,0.05)',
      text: '#f1d382'
    },

    blue: {
      border: 'rgba(91,150,255,0.15)',
      bg: 'rgba(91,150,255,0.05)',
      text: '#b8d6ff'
    },

    gray: {
      border: 'rgba(255,255,255,0.08)',
      bg: 'rgba(255,255,255,0.03)',
      text: 'rgba(255,255,255,0.72)'
    }

  }[tone]


  return (

    <section
      style={{
        minHeight: 220,
        borderRadius: 20,
        padding: '14px 12px',

        background: toneStyle.bg,
        border: `1px solid ${toneStyle.border}`,

        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
    >

      <div>

        <div
          style={{
            fontSize: 12,
            color: toneStyle.text
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 2,
            fontSize: 10,
            color: 'rgba(255,255,255,0.32)'
          }}
        >
          {subtitle}
        </div>

      </div>


      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 7
        }}
      >

        {items.length === 0
          ? (
            <div
              style={{
                borderRadius: 12,
                padding: '14px 10px',
                border: '1px dashed rgba(255,255,255,0.07)',
                fontSize: 11,
                textAlign: 'center',
                color: 'rgba(255,255,255,0.28)'
              }}
            >
              일정 없음
            </div>
          )

          : items.map((task: Task) => (

            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onToggle={onToggle}
              onDelete={onDelete}
              compact
            />

          ))
        }

      </div>

    </section>

  )

}



export function MatrixView({
  tasks,
  routines,
  showDone,
  onEdit,
  onToggle,
  onDelete
}: Props) {

  const [activeTab, setActiveTab] = useState<AssigneeTab>('전체')

  const tabs: AssigneeTab[] = [
    '전체',
    '하나',
    '민효',
    '함께',
    '데이트'
  ]


  const visibleTasks = useMemo(() => {

    const filtered = tasks.filter((t) =>
      showDone || !t.done
    )

    return activeTab === '전체'
      ? filtered
      : filtered.filter((t) =>
        t.assignee === activeTab
      )

  }, [tasks, showDone, activeTab])


  const visibleRoutines = useMemo(() =>

    activeTab === '전체'
      ? routines
      : routines.filter((r) =>
        r.assignee === activeTab
      )

    , [routines, activeTab])



  return (

    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >

      <section
        style={{
          borderRadius: 22,
          padding: '14px 14px 12px',

          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--gold-soft)',
            marginBottom: 11
          }}
        >

          <LayoutGrid size={13} />
          <span>EISENHOWER MATRIX</span>

        </div>


        <div
          style={{
            display: 'flex',
            gap: 7,
            overflowX: 'auto'
          }}
        >

          {tabs.map((tab) => (

            <button
              key={tab}

              onClick={() => setActiveTab(tab)}

              style={{
                padding: '7px 11px',
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,

                border:
                  activeTab === tab
                    ? '1px solid rgba(201,168,76,0.45)'
                    : '1px solid rgba(255,255,255,0.08)',

                background:
                  activeTab === tab
                    ? 'rgba(201,168,76,0.15)'
                    : 'rgba(255,255,255,0.04)',

                color:
                  activeTab === tab
                    ? 'var(--gold-soft)'
                    : 'rgba(255,255,255,0.65)',

                fontSize: 11,

                cursor: 'pointer'
              }}
            >

              <UserRound size={11} />
              {tab}

            </button>

          ))}

        </div>

      </section>



      <RoutinePanel
        assignee={activeTab}
        items={visibleRoutines}
        onToggle={onToggle}
      />


      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10
        }}
      >

        <MatrixSection
          title="중요·긴급"
          subtitle="바로 처리"
          items={visibleTasks.filter((t) => t.type === 'ui')}
          tone="red"
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />

        <MatrixSection
          title="중요·여유"
          subtitle="계획해서 진행"
          items={visibleTasks.filter((t) => t.type === 'nui')}
          tone="gold"
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />

        <MatrixSection
          title="긴급·덜중요"
          subtitle="빠르게 정리"
          items={visibleTasks.filter((t) => t.type === 'uni')}
          tone="blue"
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />

        <MatrixSection
          title="여유·덜중요"
          subtitle="나중에"
          items={visibleTasks.filter((t) => t.type === 'nuni')}
          tone="gray"
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />

      </div>

    </div>

  )

}
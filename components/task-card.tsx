'use client'

import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { parseTime } from '@/lib/dateUtils'

export interface Task {
  id: string
  text: string
  date_start: string
  date_end?: string
  time?: string
  assignee: '하나' | '민효' | '함께' | '데이트'
  type: string
  done: boolean
  repeat?: string
  location?: string
  // 반복 일정 렌더링용 (원본 보존)
  originalId?: string
  occurrenceDate?: string
  completedDates?: string[]
}

interface Props {
  task: Task
  onEdit: (task: Task) => void
  onToggle: (task: Task) => void
  onDelete: (id: string) => void
  compact?: boolean
}

const ASSIGNEE_COLOR: Record<string, string> = {
  하나: '#d4a843',
  민효: '#3a8c6a',
  함께: '#7c6fcc',
  데이트: '#e06b9a',
}

export function TaskCard({ task, onEdit, onToggle, compact }: Props) {
  const timeDisplay = parseTime(task.time)

  return (
    <div
      onClick={() => onEdit(task)}
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: compact ? 10 : 14,
        padding: compact ? '8px 10px' : '10px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggle(task)
        }}
        style={{
          color: task.done ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          padding: 4,
          margin: -4,
          borderRadius: 999,
          cursor: 'pointer',
        }}
      >
        {task.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: compact ? 11 : 13,
            color: task.done ? 'rgba(255,255,255,0.3)' : 'var(--text)',
            textDecoration: task.done ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: 600,
          }}
        >
          {task.text}
        </div>

        {timeDisplay && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              marginTop: 2,
              opacity: 0.5,
            }}
          >
            <Clock size={10} />
            <span style={{ fontSize: 10 }}>{timeDisplay}</span>
          </div>
        )}
      </div>

      <div
        style={{
          width: 4,
          height: 12,
          borderRadius: 2,
          background: ASSIGNEE_COLOR[task.assignee] || 'var(--gold)',
          flexShrink: 0,
        }}
      />
    </div>
  )
}

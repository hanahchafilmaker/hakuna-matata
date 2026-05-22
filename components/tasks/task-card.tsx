"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { parseTime } from "@/lib/dateUtils";

export interface Task {
  id: string;
  text: string;
  date_start: string;
  date_end?: string;
  time?: string;
  assignee: "하나" | "민효" | "함께" | "데이트";
  type: "ui" | "nui" | "uni" | "nuni" | "routine" | "ocr" | "calendar";
  done: boolean;
  repeat?: string;
  location?: string;
  memo?: string;
  originalId?: string;
  occurrenceDate?: string;
  completedDates?: string[] | string;
}

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

function getAssigneeColor(assignee: string) {
  if (assignee === "하나") return "#d4a843";
  if (assignee === "민효") return "#3a8c6a";
  if (assignee === "함께") return "#7c6fcc";
  if (assignee === "데이트") return "#e06b9a";
  return "var(--gold)";
}

export function TaskCard({ task, onEdit, onToggle, compact = false }: Props) {
  const timeDisplay = parseTime(task.time);

  return (
    <div
      onClick={() => onEdit(task)}
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        borderRadius: compact ? 10 : 14,
        padding: compact ? "8px 10px" : "10px 12px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.15s ease",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.985)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task);
        }}
        style={{
          color: task.done ? "var(--gold)" : "rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: "transparent",
          border: "none",
          padding: 4,
          margin: -4,
          borderRadius: 999,
          cursor: "pointer",
        }}
      >
        {task.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: compact ? 11 : 13,
            color: task.done ? "rgba(255,255,255,0.3)" : "var(--text)",
            textDecoration: task.done ? "line-through" : "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: 600,
          }}
        >
          {task.text}
        </div>

        {timeDisplay && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
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
          background: getAssigneeColor(task.assignee),
          flexShrink: 0,
        }}
      />
    </div>
  );
}

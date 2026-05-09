"use client";

import { CheckCircle2, Circle, Clock, MapPin } from "lucide-react";
import type { Task } from "@/components/tasks/task-card";
import { parseTime } from "@/lib/dateUtils";

type Props = {
  task: Task;
  typeLabel: string;
  dateLabel: string;
  onEdit: (task: Task) => void;
  onToggle: (task: Task) => void;
};

function getAssigneeColor(assignee: string) {
  if (assignee === "하나") return "#d4a843";
  if (assignee === "민효") return "#3a8c6a";
  if (assignee === "함께") return "#7c6fcc";
  if (assignee === "데이트") return "#e06b9a";
  return "var(--gold)";
}

export function CalendarTaskRow({ task, typeLabel, dateLabel, onEdit, onToggle }: Props) {
  const timeLabel = parseTime(task.time);

  return (
    <div className="calendar-row" onClick={() => onEdit(task)}>
      <div className="calendar-row__top">
        <div className="calendar-row__meta">
          <span className="calendar-row__type">{typeLabel}</span>
          <span className="calendar-row__date">{dateLabel}</span>
        </div>

        <button
          type="button"
          className="calendar-row__check"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task);
          }}
          aria-label={task.done ? "완료 해제" : "완료"}
        >
          {task.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
        </button>
      </div>

      <div className="calendar-row__body">
        <div className="calendar-row__title-wrap">
          <span
            className="calendar-row__assignee"
            style={{ background: getAssigneeColor(task.assignee) }}
          />
          <div className="calendar-row__text-block">
            <div className={`calendar-row__title ${task.done ? "is-done" : ""}`}>{task.text}</div>

            <div className="calendar-row__sub">
              {timeLabel ? (
                <span className="calendar-row__sub-item">
                  <Clock size={11} />
                  <span>{timeLabel}</span>
                </span>
              ) : null}

              {task.location ? (
                <span className="calendar-row__sub-item">
                  <MapPin size={11} />
                  <span>{task.location}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

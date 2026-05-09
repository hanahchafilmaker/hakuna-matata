"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, LayoutGrid, MapPin, Repeat, UserRound, X } from "lucide-react";
import type { Task } from "@/components/tasks/task-card";
import { parseTime } from "@/lib/dateUtils";
import { DAY_LABELS, parseRepeat, serializeRepeat } from "@/lib/repeatUtils";
import { FieldBlock } from "@/components/tasks/task-modal-field";
import {
  ASSIGNEES,
  TYPES,
  DAY_ORDER,
  grid2,
  inputStyle,
  selectStyle,
  textareaStyle,
  iconBtnStyle,
  secondaryBtnStyle,
  primaryBtnStyle,
} from "@/components/tasks/task-modal-constants";

type Props = {
  task: Partial<Task> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: Partial<Task>) => Promise<void> | void;
  isEditMode?: boolean;
};

function normalizeTask(task?: Partial<Task> | null): Partial<Task> & { _hasTime: boolean } {
  const rawTime = parseTime(task?.time);

  return {
    id: task?.id || "",
    text: task?.text || "",
    assignee: (task?.assignee as Task["assignee"]) || "하나",
    type: task?.type || "ui",
    date_start: task?.date_start || "",
    date_end: task?.date_end || task?.date_start || "",
    location: task?.location || "",
    time: rawTime || "",
    repeat: task?.repeat || "none",
    done: task?.done || false,
    _hasTime: !!rawTime,
  };
}

function getTypeDotColor(type?: Task["type"]) {
  switch (type) {
    case "ui":
      return "#ef6868";
    case "nui":
      return "#d4af37";
    case "uni":
      return "#6ea8ff";
    default:
      return "rgba(255,255,255,0.35)";
  }
}

function getAssigneeDotColor(assignee?: string) {
  if (assignee === "하나") return "#d4a843";
  if (assignee === "민효") return "#3a8c6a";
  if (assignee === "함께") return "#7c6fcc";
  if (assignee === "데이트") return "#e06b9a";
  return "rgba(255,255,255,0.35)";
}

export function TaskModal({ task, isOpen, onClose, onSave, isEditMode = false }: Props) {
  const norm = normalizeTask(task);
  const [form, setForm] = useState<Partial<Task>>(norm);
  const [hasTime, setHasTime] = useState(norm._hasTime);
  const [repeatDays, setRepeatDays] = useState<string[]>(() => parseRepeat(norm.repeat));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const next = normalizeTask(task);
      setForm(next);
      setHasTime(next._hasTime);
      setRepeatDays(parseRepeat(next.repeat));
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  function updateField<K extends keyof Task>(key: K, value: Task[K] | string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleRepeatDay(day: string) {
    setRepeatDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.text?.trim()) {
      alert("일정 제목을 입력해줘.");
      return;
    }

    const payload: Partial<Task> = {
      ...form,
      text: form.text?.trim(),
      date_end: form.date_end || form.date_start,
      time: hasTime ? parseTime(form.time) || "" : "",
      repeat: serializeRepeat(repeatDays as any),
    };

    setIsSubmitting(true);
    try {
      await onSave(payload);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(0,0,0,0.52)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "12px 12px calc(12px + env(safe-area-inset-bottom))",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 430,
          borderRadius: 26,
          overflow: "hidden",
          background: "linear-gradient(180deg, rgba(11,16,28,0.98), rgba(8,12,22,0.99))",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 24px 50px rgba(0,0,0,0.38)",
        }}
      >
        <div
          style={{
            padding: "14px 16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
              }}
            >
              {isEditMode ? "EDIT" : "NEW"}
            </p>

            <h3
              style={{
                margin: "4px 0 0",
                fontSize: 18,
                lineHeight: 1.2,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {isEditMode ? "일정 수정" : "새 일정"}
            </h3>

            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: getTypeDotColor(form.type),
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.58)",
                }}
              >
                {TYPES.find((t) => t.value === form.type)?.label || "일반"}
              </span>

              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: getAssigneeDotColor(form.assignee),
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.58)",
                }}
              >
                {form.assignee || "하나"}
              </span>
            </div>
          </div>

          <button type="button" onClick={onClose} style={iconBtnStyle} title="닫기">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              maxHeight: "72vh",
              overflowY: "auto",
              padding: "14px 16px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                제목
              </div>

              <textarea
                value={form.text || ""}
                onChange={(e) => updateField("text", e.target.value)}
                rows={3}
                placeholder="예: 병원 예약, 기획안 마감, 가족 외식"
                style={{
                  ...textareaStyle,
                  minHeight: 78,
                }}
              />
            </div>

            <div style={grid2}>
              <FieldBlock icon={<UserRound size={13} />} label="담당">
                <select
                  value={form.assignee || "하나"}
                  onChange={(e) => updateField("assignee", e.target.value)}
                  style={selectStyle}
                >
                  {ASSIGNEES.map((name) => (
                    <option key={name} value={name} style={{ color: "#111" }}>
                      {name}
                    </option>
                  ))}
                </select>
              </FieldBlock>

              <FieldBlock icon={<LayoutGrid size={13} />} label="분류">
                <select
                  value={form.type || "ui"}
                  onChange={(e) => updateField("type", e.target.value as Task["type"])}
                  style={selectStyle}
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value} style={{ color: "#111" }}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </FieldBlock>
            </div>

            <div style={grid2}>
              <FieldBlock icon={<CalendarDays size={13} />} label="시작일">
                <input
                  type="date"
                  value={form.date_start || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateField("date_start", v);
                    if (!form.date_end) updateField("date_end", v);
                  }}
                  style={inputStyle}
                />
              </FieldBlock>

              <FieldBlock icon={<CalendarDays size={13} />} label="종료일">
                <input
                  type="date"
                  value={form.date_end || ""}
                  onChange={(e) => updateField("date_end", e.target.value)}
                  style={inputStyle}
                />
              </FieldBlock>
            </div>

            <FieldBlock icon={<Clock3 size={13} />} label="시간">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setHasTime((v) => !v)}
                  style={{
                    height: 38,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: hasTime ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                    color: hasTime ? "#fff" : "rgba(255,255,255,0.55)",
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: "left",
                    padding: "0 12px",
                    cursor: "pointer",
                  }}
                >
                  {hasTime ? "시간 사용 중" : "시간 없음"}
                </button>

                {hasTime && (
                  <input
                    type="text"
                    value={form.time || ""}
                    onChange={(e) => updateField("time", e.target.value)}
                    placeholder="예: 14:00"
                    style={inputStyle}
                  />
                )}
              </div>
            </FieldBlock>

            <FieldBlock icon={<MapPin size={13} />} label="장소">
              <input
                type="text"
                value={form.location || ""}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="예: 송도 / 집 / 병원"
                style={inputStyle}
              />
            </FieldBlock>

            <FieldBlock icon={<Repeat size={13} />} label="반복">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DAY_ORDER.map((day) => {
                  const active = repeatDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleRepeatDay(day)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 800,
                        border: active
                          ? "1px solid rgba(212,175,55,0.45)"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: active ? "rgba(212,175,55,0.16)" : "rgba(255,255,255,0.04)",
                        color: active ? "#f1d382" : "rgba(255,255,255,0.58)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                    </button>
                  );
                })}

                {repeatDays.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRepeatDays([])}
                    style={{
                      height: 36,
                      padding: "0 10px",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.65)",
                      cursor: "pointer",
                    }}
                  >
                    초기화
                  </button>
                )}
              </div>
            </FieldBlock>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 12px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.07)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={!!form.done}
                onChange={(e) => updateField("done", e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#d4af37" }}
              />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>완료 상태</div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.42)",
                  }}
                >
                  이미 끝난 일정이면 체크해둘 수 있어.
                </div>
              </div>
            </label>
          </div>

          <div
            style={{
              padding: "12px 16px 16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              gap: 8,
            }}
          >
            <button type="button" onClick={onClose} style={secondaryBtnStyle}>
              취소
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...primaryBtnStyle,
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? "default" : "pointer",
              }}
            >
              {isSubmitting ? "저장 중..." : isEditMode ? "수정 완료" : "일정 저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

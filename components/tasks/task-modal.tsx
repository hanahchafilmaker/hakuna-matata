"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Clock3,
  LayoutGrid,
  MapPin,
  Repeat,
  UserRound,
  X,
} from "lucide-react"
import type { Task } from "@/components/tasks/task-card"
import { parseTime } from "@/lib/dateUtils"
import { DAY_LABELS, parseRepeat, serializeRepeat } from "@/lib/repeatUtils"
import { FieldBlock } from "@/components/tasks/task-modal-field"
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
} from "@/components/tasks/task-modal-constants"

type Props = {
  task: Partial<Task> | null
  isOpen: boolean
  onClose: () => void
  onSave: (form: Partial<Task>) => Promise<void> | void
  isEditMode?: boolean
}

function normalizeTask(task?: Partial<Task> | null): Partial<Task> & { _hasTime: boolean } {
  const rawTime = parseTime(task?.time)
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
  }
}

function getTypePreview(type?: Task["type"]) {
  switch (type) {
    case "ui":
      return { bg: "rgba(239,104,104,0.16)", color: "#ffb7b7" }
    case "nui":
      return { bg: "rgba(212,175,55,0.16)", color: "#f1d382" }
    case "uni":
      return { bg: "rgba(91,150,255,0.16)", color: "#b9d6ff" }
    default:
      return { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.78)" }
  }
}

export function TaskModal({ task, isOpen, onClose, onSave, isEditMode = false }: Props) {
  const norm = normalizeTask(task)
  const [form, setForm] = useState<Partial<Task>>(norm)
  const [hasTime, setHasTime] = useState(norm._hasTime)
  const [repeatDays, setRepeatDays] = useState<string[]>(() => parseRepeat(norm.repeat))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const next = normalizeTask(task)
      setForm(next)
      setHasTime(next._hasTime)
      setRepeatDays(parseRepeat(next.repeat))
    }
  }, [task, isOpen])

  const typePreview = useMemo(() => getTypePreview(form.type), [form.type])

  if (!isOpen) return null

  function updateField<K extends keyof Task>(key: K, value: Task[K] | string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleRepeatDay(day: string) {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.text?.trim()) {
      alert("Please enter a title.")
      return
    }

    const payload: Partial<Task> = {
      ...form,
      text: form.text?.trim(),
      date_end: form.date_end || form.date_start,
      time: hasTime ? (parseTime(form.time) || "") : "",
      repeat: serializeRepeat(repeatDays as any),
    }

    setIsSubmitting(true)
    try {
      await onSave(payload)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(0,0,0,0.56)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "16px 12px calc(16px + env(safe-area-inset-bottom))",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 390,
          borderRadius: 26,
          overflow: "hidden",
          background: "linear-gradient(180deg, rgba(10,14,22,0.98), rgba(6,9,15,0.99))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 50px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
              {isEditMode ? "Edit task" : "New task"}
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
              Keep it simple.
            </div>
          </div>
          <button type="button" onClick={onClose} style={iconBtnStyle} title="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              maxHeight: "70vh",
              overflowY: "auto",
              padding: "14px 16px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.72)" }}>
                Title
              </div>
              <textarea
                value={form.text || ""}
                onChange={(e) => updateField("text", e.target.value)}
                rows={3}
                placeholder="e.g. hospital, deadline, dinner"
                style={textareaStyle}
              />
            </div>

            <div style={grid2}>
              <FieldBlock icon={<UserRound size={13} />} label="Assignee">
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

              <FieldBlock icon={<LayoutGrid size={13} />} label="Priority">
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

            <div
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                background: typePreview.bg,
                border: "1px solid rgba(255,255,255,0.06)",
                color: typePreview.color,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Selected: {TYPES.find((t) => t.value === form.type)?.label || "General"}
            </div>

            <div style={grid2}>
              <FieldBlock icon={<CalendarDays size={13} />} label="Start">
                <input
                  type="date"
                  value={form.date_start || ""}
                  onChange={(e) => {
                    const v = e.target.value
                    updateField("date_start", v)
                    if (!form.date_end) updateField("date_end", v)
                  }}
                  style={inputStyle}
                />
              </FieldBlock>

              <FieldBlock icon={<CalendarDays size={13} />} label="End">
                <input
                  type="date"
                  value={form.date_end || ""}
                  onChange={(e) => updateField("date_end", e.target.value)}
                  style={inputStyle}
                />
              </FieldBlock>
            </div>

            <FieldBlock icon={<Clock3 size={13} />} label="Time">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <div
                    onClick={() => setHasTime((v) => !v)}
                    style={{
                      width: 36,
                      height: 20,
                      borderRadius: 999,
                      background: hasTime ? "rgba(212,175,55,0.85)" : "rgba(255,255,255,0.12)",
                      position: "relative",
                      flexShrink: 0,
                      transition: "background 0.2s",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: hasTime ? 18 : 2,
                        width: 16,
                        height: 16,
                        borderRadius: 999,
                        background: "#fff",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: hasTime ? "#fff" : "rgba(255,255,255,0.45)",
                      fontWeight: 600,
                    }}
                  >
                    {hasTime ? "Time on" : "Time off"}
                  </span>
                </label>

                {hasTime && (
                  <input
                    type="text"
                    value={form.time || ""}
                    onChange={(e) => updateField("time", e.target.value)}
                    placeholder="e.g. 14:00"
                    style={inputStyle}
                  />
                )}
              </div>
            </FieldBlock>

            <FieldBlock icon={<MapPin size={13} />} label="Location">
              <input
                type="text"
                value={form.location || ""}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="e.g. Songdo / home / clinic"
                style={inputStyle}
              />
            </FieldBlock>

            <FieldBlock icon={<Repeat size={13} />} label="Repeat">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DAY_ORDER.map((day) => {
                  const active = repeatDays.includes(day)
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
                          ? "1px solid rgba(212,175,55,0.6)"
                          : "1px solid rgba(255,255,255,0.1)",
                        background: active
                          ? "rgba(212,175,55,0.22)"
                          : "rgba(255,255,255,0.04)",
                        color: active ? "#f1d382" : "rgba(255,255,255,0.55)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                    </button>
                  )
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
                      border: "1px solid rgba(255,100,100,0.25)",
                      background: "rgba(255,100,100,0.07)",
                      color: "rgba(255,120,120,0.8)",
                      cursor: "pointer",
                    }}
                  >
                    Reset
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
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
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
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Save as done</div>
                <div style={{ marginTop: 2, fontSize: 10, color: "rgba(255,255,255,0.42)" }}>
                  Use this if the item is already finished.
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
              Cancel
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
              {isSubmitting ? "Saving..." : isEditMode ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

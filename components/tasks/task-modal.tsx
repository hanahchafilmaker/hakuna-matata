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
import {
  overlayStyle,
  sheetStyle,
  headerStyle,
  headerTextWrapStyle,
  headerEyebrowStyle,
  headerTitleStyle,
  headerMetaStyle,
  headerDotStyle,
  headerMetaTextStyle,
  bodyStyle,
  titleBlockStyle,
  titleLabelStyle,
  timeWrapStyle,
  timeToggleStyle,
  repeatWrapStyle,
  repeatDayStyle,
  repeatResetStyle,
  doneCardStyle,
  doneTitleStyle,
  doneDescStyle,
  footerStyle,
  getTypeDotColor,
  getAssigneeDotColor,
} from "@/components/tasks/task-modal-styles";

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
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={sheetStyle}>
        <div style={headerStyle}>
          <div style={headerTextWrapStyle}>
            <p style={headerEyebrowStyle}>{isEditMode ? "EDIT" : "NEW"}</p>

            <h3 style={headerTitleStyle}>{isEditMode ? "일정 수정" : "새 일정"}</h3>

            <div style={headerMetaStyle}>
              <span style={headerDotStyle(getTypeDotColor(form.type))} />
              <span style={headerMetaTextStyle}>
                {TYPES.find((t) => t.value === form.type)?.label || "일반"}
              </span>

              <span style={headerDotStyle(getAssigneeDotColor(form.assignee))} />
              <span style={headerMetaTextStyle}>{form.assignee || "하나"}</span>
            </div>
          </div>

          <button type="button" onClick={onClose} style={iconBtnStyle} title="닫기">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={bodyStyle}>
            <div style={titleBlockStyle}>
              <div style={titleLabelStyle}>제목</div>

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
              <div style={timeWrapStyle}>
                <button
                  type="button"
                  onClick={() => setHasTime((v) => !v)}
                  style={timeToggleStyle(hasTime)}
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
              <div style={repeatWrapStyle}>
                {DAY_ORDER.map((day) => {
                  const active = repeatDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleRepeatDay(day)}
                      style={repeatDayStyle(active)}
                    >
                      {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                    </button>
                  );
                })}

                {repeatDays.length > 0 && (
                  <button type="button" onClick={() => setRepeatDays([])} style={repeatResetStyle}>
                    초기화
                  </button>
                )}
              </div>
            </FieldBlock>

            <label style={doneCardStyle}>
              <input
                type="checkbox"
                checked={!!form.done}
                onChange={(e) => updateField("done", e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#d4af37" }}
              />
              <div>
                <div style={doneTitleStyle}>완료 상태</div>
                <div style={doneDescStyle}>이미 끝난 일정이면 체크해둘 수 있어.</div>
              </div>
            </label>
          </div>

          <div style={footerStyle}>
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

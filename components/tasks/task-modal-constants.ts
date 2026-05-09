import type { CSSProperties } from "react";
import type { Task } from "@/components/tasks/task-card";
import type { DayCode } from "@/lib/repeatUtils";

export const ASSIGNEES: Task["assignee"][] = ["하나", "민효", "함께", "데이트"];

export const TYPES: { value: Task["type"]; label: string }[] = [
  { value: "ui", label: "중요·긴급" },
  { value: "nui", label: "중요" },
  { value: "uni", label: "긴급" },
  { value: "nuni", label: "일반" },
];

export const DAY_ORDER: DayCode[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const grid2: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: 13,
  padding: "0 12px",
  outline: "none",
};

export const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
};

export const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 84,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: 14,
  padding: "12px",
  outline: "none",
  resize: "vertical",
  lineHeight: 1.45,
};

export const iconBtnStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

export const secondaryBtnStyle: CSSProperties = {
  flex: 1,
  height: 44,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.82)",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

export const primaryBtnStyle: CSSProperties = {
  flex: 1.35,
  height: 44,
  borderRadius: 14,
  border: "1px solid rgba(212,175,55,0.24)",
  background: "linear-gradient(180deg, rgba(212,175,55,0.96), rgba(186,147,43,0.96))",
  color: "#17130a",
  fontSize: 13,
  fontWeight: 900,
};

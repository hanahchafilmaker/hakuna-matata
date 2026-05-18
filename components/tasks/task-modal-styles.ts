import type { CSSProperties } from "react"
import type { Task } from "@/components/tasks/task-card"

// 반투명 오버레이 — 하단 정렬
export const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 999,
  background: "rgba(0,0,0,0.52)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
}

// 바텀 시트 — 하단에 완전히 붙음, 모서리는 위만 둥글게
export const sheetStyle: CSSProperties = {
  width: "100%",
  maxWidth: 430,
  borderRadius: "24px 24px 0 0",
  overflow: "hidden",
  background: "linear-gradient(180deg, rgba(11,16,28,0.99), rgba(7,11,22,1))",
  border: "1px solid rgba(255,255,255,0.07)",
  borderBottom: "none",
  boxShadow: "0 -12px 40px rgba(0,0,0,0.4)",
  // safe-area 대응
  paddingBottom: "env(safe-area-inset-bottom)",
}

export const headerStyle: CSSProperties = {
  padding: "16px 18px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
}

// 드래그 핸들 (시각적 힌트)
export const handleBarStyle: CSSProperties = {
  width: 36,
  height: 4,
  borderRadius: 999,
  background: "rgba(255,255,255,0.18)",
  margin: "10px auto 0",
}

export const headerTextWrapStyle: CSSProperties = {
  minWidth: 0,
}

export const headerEyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)",
}

export const headerTitleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 18,
  lineHeight: 1.2,
  fontWeight: 700,
  color: "#fff",
}

export const headerMetaStyle: CSSProperties = {
  marginTop: 8,
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
}

export const headerDotStyle = (color: string): CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: 999,
  background: color,
  flexShrink: 0,
})

export const headerMetaTextStyle: CSSProperties = {
  fontSize: 11,
  color: "rgba(255,255,255,0.58)",
}

// 스크롤 영역 — 뷰포트 60% 이내, 스크롤 필요시만 생김
export const bodyStyle: CSSProperties = {
  maxHeight: "60vh",
  overflowY: "auto",
  padding: "14px 18px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  WebkitOverflowScrolling: "touch",
}

export const titleBlockStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

export const titleLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "rgba(255,255,255,0.72)",
}

export const timeWrapStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

export const timeToggleStyle = (active: boolean): CSSProperties => ({
  height: 38,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
  color: active ? "#fff" : "rgba(255,255,255,0.55)",
  fontSize: 12,
  fontWeight: 700,
  textAlign: "left",
  padding: "0 12px",
  cursor: "pointer",
})

export const repeatWrapStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
}

export const repeatDayStyle = (active: boolean): CSSProperties => ({
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
})

export const repeatResetStyle: CSSProperties = {
  height: 36,
  padding: "0 10px",
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 700,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.65)",
  cursor: "pointer",
}

export const doneCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 12px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.07)",
  cursor: "pointer",
}

export const doneTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#fff",
}

export const doneDescStyle: CSSProperties = {
  marginTop: 2,
  fontSize: 10,
  color: "rgba(255,255,255,0.42)",
}

export const footerStyle: CSSProperties = {
  padding: "12px 18px 16px",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  gap: 8,
}

export function getTypeDotColor(type?: Task["type"]) {
  switch (type) {
    case "ui": return "#ef6868"
    case "nui": return "#d4af37"
    case "uni": return "#6ea8ff"
    default: return "rgba(255,255,255,0.35)"
  }
}

export function getAssigneeDotColor(assignee?: string) {
  if (assignee === "하나") return "#d4a843"
  if (assignee === "민효") return "#3a8c6a"
  if (assignee === "함께") return "#7c6fcc"
  if (assignee === "데이트") return "#e06b9a"
  return "rgba(255,255,255,0.35)"
}

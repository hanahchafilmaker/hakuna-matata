"use client";

import type { ReactNode } from "react";

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        color: "rgba(255,255,255,0.68)",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </div>
  );
}

export function FieldBlock({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          minWidth: 0,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.58)",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>

        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "rgba(255,255,255,0.68)",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>

      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

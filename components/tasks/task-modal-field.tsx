'use client'

import type { ReactNode } from 'react'

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        color: 'rgba(255,255,255,0.72)',
      }}
    >
      {children}
    </div>
  )
}

export function FieldBlock({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 800,
          color: 'rgba(255,255,255,0.72)',
        }}
      >
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  )
}


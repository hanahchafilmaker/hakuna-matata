"use client"

import { cn } from "@/lib/utils"

interface DdayCardProps {
  title: string
  date: string
  className?: string
}

export function DdayCard({ title, date, className }: DdayCardProps) {

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = targetDate.getTime() - today.getTime()

  // 당일 포함 (+1)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

  let ddayText = ""

  if (diffDays === 1) {
    ddayText = "D-Day"
  }
  else if (diffDays > 1) {
    ddayText = `D-${diffDays - 1}`
  }
  else {
    ddayText = `D+${Math.abs(diffDays - 1)}`
  }

  return (

    <div
      className={cn(
        "relative rounded-2xl p-5 min-h-[128px]",
        "flex flex-col justify-start",
        "bg-[#0b1422]",
        "border border-[var(--line)]",
        className
      )}
    >

      <span
        className={cn(
          "inline-flex items-center justify-center",
          "min-w-[76px] w-fit px-3.5 py-1.5 rounded-full",
          "bg-[var(--gold-glass)] border border-[var(--gold-border)]",
          "text-[var(--gold-soft)] text-sm",
          "tracking-[0.12em]"
        )}
      >
        {ddayText}
      </span>

      <h3
        className={cn(
          "mt-3 text-[15px] leading-relaxed break-keep",
          "text-[var(--text)]"
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          "mt-1.5 text-xs",
          "text-[var(--text-dim)]"
        )}
      >
        {date}
      </p>

    </div>

  )
}
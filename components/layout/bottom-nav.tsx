"use client";

import { Home, CalendarDays, Menu } from "lucide-react";

export type AppView = "home" | "calendar" | "more";

const NAV_ITEMS = [
  { id: "home" as AppView, label: "홈", Icon: Home },
  { id: "calendar" as AppView, label: "캘린더", Icon: CalendarDays },
  { id: "more" as AppView, label: "더보기", Icon: Menu },
];

export function BottomNav({ view, setView }: { view: AppView; setView: (value: AppView) => void }) {
  return (
    <nav className="bottom-nav" aria-label="하단 메뉴">
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const active = view === id;

        return (
          <button
            key={id}
            type="button"
            className={`bottom-nav__item ${active ? "is-active" : ""}`}
            onClick={() => setView(id)}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

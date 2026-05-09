"use client";

import { CalendarDays, Home, Menu } from "lucide-react";
import type { AppView } from "@/hooks/use-app-view";

const NAV_ITEMS: Array<{ key: AppView; label: string; Icon: typeof Home }> = [
  { key: "home", label: "홈", Icon: Home },
  { key: "calendar", label: "캘린더", Icon: CalendarDays },
  { key: "more", label: "더보기", Icon: Menu },
];

export function BottomNav({ view, setView }: { view: AppView; setView: (value: AppView) => void }) {
  return (
    <nav className="bottom-nav" aria-label="앱 하단 네비게이션">
      {NAV_ITEMS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          className={`bottom-nav__item ${view === key ? "active" : ""}`}
          onClick={() => setView(key)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

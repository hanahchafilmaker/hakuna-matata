"use client";

import type { AppView } from "@/hooks/use-app-view";

const titles: Record<AppView, string> = {
  home: "오늘 홈",
  calendar: "캘린더",
  more: "더보기",
};

const subtitles: Record<AppView, string> = {
  home: "오늘, 가까운 일정, 디데이 중심으로 가볍게.",
  calendar: "월간 보기와 날짜별 일정 확인.",
  more: "전체 할 일과 루틴, 매트릭스를 한 곳에.",
};

export function TopHeader({ view }: { view: AppView }) {
  return (
    <header className="page-header">
      <div>
        <p className="page-header__eyebrow">{titles[view]}</p>
        <h1 className="page-header__title">Hakuna Matata</h1>
      </div>
      <p className="page-header__subtitle">{subtitles[view]}</p>
    </header>
  );
}

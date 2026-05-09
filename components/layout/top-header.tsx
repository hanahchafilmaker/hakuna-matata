"use client";

type HeaderView = "home" | "calendar" | "more";

const TITLE_MAP: Record<HeaderView, { title: string; subtitle: string }> = {
  home: {
    title: "오늘",
    subtitle: "지금 필요한 일정만 조용히 보기",
  },
  calendar: {
    title: "캘린더",
    subtitle: "한눈에 날짜별 흐름 보기",
  },
  more: {
    title: "더보기",
    subtitle: "전체 할 일과 보조 기능",
  },
};

export function TopHeader({ view }: { view: HeaderView }) {
  const meta = TITLE_MAP[view];

  return (
    <header className="top-header">
      <div className="top-header__text">
        <p className="top-header__eyebrow">Hakuna Matata</p>
        <h1 className="top-header__title">{meta.title}</h1>
        <p className="top-header__subtitle">{meta.subtitle}</p>
      </div>
    </header>
  );
}

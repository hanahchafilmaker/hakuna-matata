"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export type DdayItem = { label: string; date: string };
export type BgTheme = "night" | "dusk" | "forest" | "ocean";

const THEMES: { id: BgTheme; label: string; desc: string; gradient: string }[] = [
  {
    id: "night",
    label: "밤하늘",
    desc: "기본 · 딥 네이비",
    gradient: "linear-gradient(135deg, #070b14 0%, #0d1630 100%)",
  },
  {
    id: "dusk",
    label: "황혼",
    desc: "노을 · 따뜻한 느낌",
    gradient: "linear-gradient(135deg, #1a0a0f 0%, #2d1020 50%, #0d1020 100%)",
  },
  {
    id: "forest",
    label: "숲",
    desc: "짙은 초록 · 자연",
    gradient: "linear-gradient(135deg, #051208 0%, #0c2018 50%, #070b14 100%)",
  },
  {
    id: "ocean",
    label: "심해",
    desc: "짙은 청록 · 물",
    gradient: "linear-gradient(135deg, #040d1a 0%, #081828 50%, #070b14 100%)",
  },
];

export function SettingsScreen({
  ddayItems,
  onDdayChange,
  currentTheme,
  onThemeChange,
}: {
  ddayItems: DdayItem[];
  onDdayChange: (items: DdayItem[]) => void;
  currentTheme: BgTheme;
  onThemeChange: (theme: BgTheme) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newDate, setNewDate] = useState("");
  const [addError, setAddError] = useState("");

  function handleAdd() {
    if (!newLabel.trim()) { setAddError("이름을 입력해줘."); return; }
    if (!newDate) { setAddError("날짜를 입력해줘."); return; }
    if (ddayItems.length >= 6) { setAddError("최대 6개까지 추가할 수 있어."); return; }
    onDdayChange([...ddayItems, { label: newLabel.trim(), date: newDate }]);
    setNewLabel("");
    setNewDate("");
    setAddError("");
  }

  function handleDelete(index: number) {
    onDdayChange(ddayItems.filter((_, i) => i !== index));
  }

  return (
    <section className="settings-screen">
      <div className="settings-group card">
        <div className="settings-group__head">
          <h3 className="settings-group__title">D-Day 관리</h3>
          <p className="settings-group__desc">기념일이나 목표일을 홈 화면에 표시해</p>
        </div>

        <div className="settings-dday-list">
          {ddayItems.length === 0 && (
            <p className="settings-empty">등록된 D-Day가 없어.</p>
          )}
          {ddayItems.map((item, i) => (
            <div key={i} className="settings-dday-item">
              <div className="settings-dday-item__info">
                <span className="settings-dday-item__label">{item.label}</span>
                <span className="settings-dday-item__date">{item.date}</span>
              </div>
              <button
                type="button"
                className="settings-dday-item__delete"
                onClick={() => handleDelete(i)}
                aria-label="삭제"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="settings-dday-add">
          <input
            type="text"
            className="settings-dday-add__input"
            placeholder="이름 (예: 생일, 기념일)"
            value={newLabel}
            onChange={(e) => { setNewLabel(e.target.value); setAddError(""); }}
          />
          <input
            type="date"
            className="settings-dday-add__input"
            value={newDate}
            onChange={(e) => { setNewDate(e.target.value); setAddError(""); }}
          />
          {addError && <p className="settings-dday-add__error">{addError}</p>}
          <button type="button" className="settings-dday-add__btn" onClick={handleAdd}>
            <Plus size={14} />
            <span>추가</span>
          </button>
        </div>
      </div>

      <div className="settings-group card">
        <div className="settings-group__head">
          <h3 className="settings-group__title">배경 테마</h3>
          <p className="settings-group__desc">앱 배경 색상을 바꿔봐</p>
        </div>

        <div className="settings-themes">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`settings-theme-item ${currentTheme === theme.id ? "is-active" : ""}`}
              onClick={() => onThemeChange(theme.id)}
            >
              <div
                className="settings-theme-item__swatch"
                style={{ background: theme.gradient }}
              />
              <div className="settings-theme-item__text">
                <span className="settings-theme-item__name">{theme.label}</span>
                <span className="settings-theme-item__desc">{theme.desc}</span>
              </div>
              {currentTheme === theme.id && (
                <span className="settings-theme-item__check">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

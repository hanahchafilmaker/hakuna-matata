"use client";

import { useState, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useOcr } from "@/features/ocr/hooks/useOcr";
import type { Task } from "@/components/tasks/task-card";

export type DdayItem = { id: string; label: string; date: string };
export type BgTheme = "night" | "dusk" | "forest" | "ocean";

const THEMES = [
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
  const [ocrStatus, setOcrStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [ocrProgressMsg, setOcrProgressMsg] = useState<string>("");
  const [ocrError, setOcrError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { runOcr } = useOcr();

  // ─── OCR: useOcr 훅으로 통일 ─────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrStatus("processing");
    setOcrProgressMsg("처리 중...");
    setOcrError(null);
    try {
      const result = await runOcr(file);
      // Convert normalized events to DdayItem
      // result.normalized is array of { text, start, end }? Wait, we changed normalize to return OcrEvent[]?
      // Actually, runOcrPipeline returns raw, normalized (OcrEvent[]), tasks, preview.
      // We'll use normalized as OcrEvent[]
      const normalized = result.normalized as any[]; // TODO: better typing
      if (normalized.length === 0) {
        setOcrStatus("done");
        setOcrProgressMsg("감지된 일정 없음");
        return;
      }
      const newItems: DdayItem[] = normalized.map((e, i) => ({
        id: `ocr-${Date.now()}-${i}`,
        label: e.title || "스캔 일정",
        date: e.date,
      }));
      onDdayChange([...ddayItems, ...newItems]);
      setOcrStatus("done");
      setOcrProgressMsg(`${normalized.length}개 일정 감지됨`);
    } catch (err) {
      console.error(err);
      setOcrStatus("error");
      setOcrError("OCR 처리 중 오류가 발생했습니다.");
    } finally {
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleOpenPicker = () => {
    inputRef.current?.click();
  };

  // ─── D-DAY ───────────────────────────────────────────────

  function handleAdd() {
    if (!newLabel.trim()) return setAddError("이름을 입력해줘.");
    if (!newDate) return setAddError("날짜를 입력해줘.");
    if (ddayItems.length >= 6) return setAddError("최대 6개까지 추가할 수 있어.");

    onDdayChange([
      ...ddayItems,
      { id: crypto.randomUUID(), label: newLabel.trim(), date: newDate },
    ]);

    setNewLabel("");
    setNewDate("");
    setAddError("");
  }

  function handleDelete(id: string) {
    onDdayChange(ddayItems.filter((item) => item.id !== id));
  }

  // ─── THEME ───────────────────────────────────────────────

  function handleThemeClick(theme: BgTheme) {
    localStorage.setItem("hakuna-theme", theme);
    onThemeChange(theme);
  }

  // ─── UI ──────────────────────────────────────────────────

  return (
    <section className="settings-screen">

      {/* ── D-Day 관리 ── */}
      <div className="settings-group card">
        <div className="settings-group__head">
          <h3 className="settings-group__title">D-Day 관리</h3>
          <p className="settings-group__desc">
            기념일이나 목표일을 홈 화면에 표시해
          </p>
        </div>

        <div className="settings-dday-list">
          {ddayItems.length === 0 && (
            <p className="settings-empty">등록된 D-Day가 없어.</p>
          )}
          {ddayItems.map((item, index) => (
            <div key={item.id ?? `dday-${index}`} className="settings-dday-item">
              <div className="settings-dday-item__info">
                <span className="settings-dday-item__label">{item.label}</span>
                <span className="settings-dday-item__date">{item.date}</span>
              </div>
              <button
                type="button"
                className="settings-dday-item__delete"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="settings-dday-add">
          <input
            className="settings-dday-add__input"
            placeholder="이름"
            value={newLabel}
            onChange={(e) => { setNewLabel(e.target.value); setAddError(""); }}
          />
          <input
            type="date"
            className="settings-dday-add__input"
            value={newDate}
            onChange={(e) => { setNewDate(e.target.value); setAddError(""); }}
          />
          {addError && (
            <p className="settings-dday-add__error">{addError}</p>
          )}
          <button
            type="button"
            className="settings-dday-add__btn"
            onClick={handleAdd}
          >
            <Plus size={14} />
            <span>추가</span>
          </button>
        </div>
      </div>

      {/* ── 배경 테마 ── */}
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
              onClick={() => handleThemeClick(theme.id as BgTheme)}
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

      {/* ── 우리집 달력 OCR ── */}
      <div className="settings-group card">
        <div className="settings-group__head">
          <h3 className="settings-group__title">우리집 달력</h3>
          <p className="settings-group__desc">
            집 벽달력 사진으로 일정 가져오기
          </p>
        </div>

        {/* hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={handleFileChange}
        />

        <button
          type="button"
          className="settings-dday-add__btn"
          onClick={handleOpenPicker}
          disabled={ocrStatus === "processing"}
        >
          {ocrStatus === "processing"
            ? ocrProgressMsg || "스캔 중..."
            : "📷 스캔하기"}
        </button>

        {ocrError && (
          <p className="settings-dday-add__error">{ocrError}</p>
        )}

        {ocrStatus === "done" && (
          <p className="settings-dday-add__hint">
            스캔 완료! 캘린더 일정을 확인해봐!
          </p>
        )}
      </div>

    </section>
  );
}
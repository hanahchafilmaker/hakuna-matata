"use client";

import { useState, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";

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
    desc: "자연",
    gradient: "linear-gradient(135deg, #051208 0%, #0c2018 50%, #070b14 100%)",
  },
  {
    id: "ocean",
    label: "심해",
    desc: "청록",
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

  // OCR states
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanSuccess, setScanSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleThemeClick(theme: BgTheme) {
    localStorage.setItem("hakuna-theme", theme);
    onThemeChange(theme);
  }

  function handleAdd() {
    if (!newLabel.trim()) return setAddError("이름을 입력해줘.");
    if (!newDate) return setAddError("날짜를 입력해줘.");
    if (ddayItems.length >= 6) return setAddError("최대 6개까지 가능.");

    onDdayChange([
      ...ddayItems,
      {
        id: crypto.randomUUID(),
        label: newLabel.trim(),
        date: newDate,
      },
    ]);

    setNewLabel("");
    setNewDate("");
    setAddError("");
  }

  function handleDelete(id: string) {
    onDdayChange(ddayItems.filter((i) => i.id !== id));
  }

  function handleScanClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanError("");
    setScanSuccess("");

    try {
      const base64 = await fileToBase64(file);

      const res = await fetch("/api/scan-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: file.type,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "scan failed");
      }

      const data = await res.json();

      if (data.events?.length > 0) {
        const newItems = data.events.map((e: any) => ({
          id: crypto.randomUUID(),
          label: e.title || "스캔 일정",
          date: e.date,
        }));

        onDdayChange([...ddayItems, ...newItems]);

        setScanSuccess(
          `스캔 완료! ${newItems.length}개 일정 추가됨`
        );
      } else {
        setScanSuccess("일정이 감지되지 않았습니다.");
      }
    } catch (err: any) {
      setScanError(err.message || "스캔 실패");
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve((reader.result as string).split(",")[1]);
      };
      reader.onerror = reject;
    });
  }

  return (
    <section className="settings-screen">

      {/* D-DAY */}
      <div className="settings-group card">
        <h3>D-Day 관리</h3>

        {ddayItems.map((item) => (
          <div key={item.id}>
            {item.label} - {item.date}
            <button onClick={() => handleDelete(item.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="이름"
        />
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
        />

        {addError && <p>{addError}</p>}

        <button onClick={handleAdd}>
          <Plus size={14} /> 추가
        </button>
      </div>

      {/* THEME */}
      <div className="settings-group card">
        <h3>테마</h3>

        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleThemeClick(t.id as BgTheme)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SCAN */}
      <div className="settings-group card">
        <h3>우리집 달력</h3>

        <button onClick={handleScanClick}>
          {scanning ? "스캔 중..." : "📷 스캔하기"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={handleFileChange}
        />

        {scanError && <p style={{ color: "red" }}>{scanError}</p>}
        {scanSuccess && <p style={{ color: "green" }}>{scanSuccess}</p>}
      </div>

    </section>
  );
}
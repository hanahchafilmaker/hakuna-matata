"use client";

import { useEffect, useState } from "react";
import type { BgTheme } from "@/components/settings/settings-screen";

const THEME_GRADIENTS: Record<BgTheme, string> = {
  night:  "radial-gradient(circle at top, rgba(126,168,255,0.12), transparent 35%), linear-gradient(180deg, #070b14 0%, #070b14 100%)",
  dusk:   "radial-gradient(circle at top, rgba(255,120,100,0.12), transparent 35%), linear-gradient(180deg, #1a0a0f 0%, #0d1020 100%)",
  forest: "radial-gradient(circle at top, rgba(80,200,100,0.10), transparent 35%), linear-gradient(180deg, #051208 0%, #070b14 100%)",
  ocean:  "radial-gradient(circle at top, rgba(60,180,220,0.12), transparent 35%), linear-gradient(180deg, #040d1a 0%, #070b14 100%)",
};

/**
 * AppBackground
 *
 * theme prop 없이 동작합니다.
 * - 마운트 시 localStorage에서 초기값 읽기
 * - settings-screen이 "themechange" 커스텀 이벤트를 dispatch하면 즉시 반영
 *
 * 이렇게 하면 page.tsx의 state 구조와 무관하게 항상 동작합니다.
 */
export function AppBackground() {
  const [gradient, setGradient] = useState<string>(THEME_GRADIENTS["night"]);

  useEffect(() => {
    // 초기 로드: localStorage에서 읽기
    const saved = (localStorage.getItem("hakuna-theme") as BgTheme) ?? "night";
    setGradient(THEME_GRADIENTS[saved] ?? THEME_GRADIENTS["night"]);

    // settings-screen이 보내는 커스텀 이벤트 수신
    function onThemeChange(e: Event) {
      const theme = (e as CustomEvent<BgTheme>).detail;
      setGradient(THEME_GRADIENTS[theme] ?? THEME_GRADIENTS["night"]);
    }

    window.addEventListener("themechange", onThemeChange);
    return () => window.removeEventListener("themechange", onThemeChange);
  }, []);

  return (
    <>
      <div
        className="app-background"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: gradient,
          transition: "background 0.6s ease",
        }}
      />
      <div className="app-background__texture" aria-hidden="true" />
    </>
  );
}
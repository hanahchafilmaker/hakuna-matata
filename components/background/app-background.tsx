"use client";

import type { BgTheme } from "@/components/settings/settings-screen";

const THEME_GRADIENTS: Record<BgTheme, string> = {
  night: "radial-gradient(circle at top, rgba(126,168,255,0.12), transparent 35%), linear-gradient(180deg, #070b14 0%, #070b14 100%)",
  dusk:  "radial-gradient(circle at top, rgba(255,120,100,0.12), transparent 35%), linear-gradient(180deg, #1a0a0f 0%, #0d1020 100%)",
  forest:"radial-gradient(circle at top, rgba(80,200,100,0.10), transparent 35%), linear-gradient(180deg, #051208 0%, #070b14 100%)",
  ocean: "radial-gradient(circle at top, rgba(60,180,220,0.12), transparent 35%), linear-gradient(180deg, #040d1a 0%, #070b14 100%)",
};

export function AppBackground({ theme = "night" }: { theme?: BgTheme }) {
  return (
    <>
      <div
        className="app-background"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: THEME_GRADIENTS[theme],
          transition: "background 0.6s ease",
        }}
      />
      <div className="app-background__texture" aria-hidden="true" />
    </>
  );
}

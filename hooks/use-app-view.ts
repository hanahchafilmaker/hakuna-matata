"use client";

import { useState } from "react";

export type AppView = "home" | "calendar" | "settings";

export function useAppView() {
  const [view, setView] = useState<AppView>("home");
  return { view, setView };
}

"use client";

import { useState } from "react";

export type AppView = "home" | "calendar" | "more";

export function useAppView() {
  const [view, setView] = useState<AppView>("home");
  return { view, setView };
}

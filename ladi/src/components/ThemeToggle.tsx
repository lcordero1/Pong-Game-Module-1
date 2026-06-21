"use client";

import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";

const STORAGE_KEY = "ladi-theme";

function apply(mode: Mode) {
  const root = document.documentElement;
  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Mode | null) ?? "system";
    setMode(saved);
    apply(saved);
  }, []);

  function cycle() {
    const next: Mode = mode === "system" ? "dark" : mode === "dark" ? "light" : "system";
    setMode(next);
    if (next === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  }

  const label = mode === "system" ? "Auto" : mode === "dark" ? "Dark" : "Light";
  const icon = mode === "system" ? "◐" : mode === "dark" ? "☾" : "☀";

  return (
    <button
      onClick={cycle}
      title={`Theme: ${label} (click to change)`}
      className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-stone-400 text-sm text-stone-700 transition hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
    >
      <span aria-hidden>{icon}</span>
      <span className="sr-only">Theme: {label}</span>
    </button>
  );
}

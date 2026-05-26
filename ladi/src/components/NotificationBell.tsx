"use client";

import { useEffect, useState } from "react";

type Perm = "default" | "granted" | "denied" | "unsupported";

export default function NotificationBell() {
  const [perm, setPerm] = useState<Perm>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission as Perm);
  }, []);

  async function enable() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPerm(result as Perm);
  }

  if (perm === "unsupported") return null;
  if (perm === "granted") {
    return (
      <span
        className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
        title="Alerts on"
      >
        ✓
      </span>
    );
  }
  return (
    <button
      onClick={enable}
      className="ml-2 rounded-full border border-stone-400 px-3 py-1 text-xs text-stone-700 hover:bg-stone-100"
      title="Enable browser alerts"
    >
      Enable alerts
    </button>
  );
}

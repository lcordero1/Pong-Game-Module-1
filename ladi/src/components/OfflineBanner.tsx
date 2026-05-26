"use client";

import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    function update() {
      setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    }
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="sticky top-0 z-40 bg-amber-200/90 px-4 py-1 text-center font-sans-ui text-xs text-amber-900 backdrop-blur dark:bg-amber-900/70 dark:text-amber-100">
      You&rsquo;re offline. Cached pages still work; changes won&rsquo;t save until you&rsquo;re back online.
    </div>
  );
}

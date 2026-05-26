"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";

const TABS = [
  { href: "/", label: "Today" },
  { href: "/projects", label: "Projects" },
  { href: "/coach", label: "Coach" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-stone-300/60 bg-[color:var(--color-bg)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl italic">
          <span className="text-[color:var(--color-accent)]">L</span>adi
        </Link>
        <nav className="flex items-center gap-1 font-sans-ui text-sm">
          {TABS.map((t) => {
            const active =
              t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-full px-4 py-1.5 transition ${
                  active
                    ? "bg-stone-900 text-stone-50"
                    : "text-stone-600 hover:bg-stone-200"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
          <NotificationBell />
        </nav>
      </div>
    </header>
  );
}

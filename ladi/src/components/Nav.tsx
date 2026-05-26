"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

const TABS = [
  { href: "/", label: "Today" },
  { href: "/projects", label: "Projects" },
  { href: "/coach", label: "Coach" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Nav() {
  const pathname = usePathname();
  return (
    <>
      <header className="border-b border-stone-300/60 bg-[color:var(--color-bg)] dark:border-stone-700/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="text-2xl italic shrink-0">
            <span className="text-[color:var(--color-accent)]">L</span>adi
          </Link>
          <nav className="hidden sm:flex items-center gap-1 font-sans-ui text-sm">
            {TABS.map((t) => {
              const active = isActive(pathname, t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`rounded-full px-4 py-1.5 transition ${
                    active
                      ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                      : "text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-300/60 bg-[color:var(--color-bg)]/95 backdrop-blur sm:hidden dark:border-stone-700/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-5xl items-stretch justify-around px-2 py-1 font-sans-ui text-xs">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex-1 rounded-full px-3 py-2 text-center transition ${
                  active
                    ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                    : "text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

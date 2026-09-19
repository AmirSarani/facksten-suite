import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { NavItem } from "../types";
import { useAuth } from "../lib/auth";
import { Button, cx } from "./ui";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "http://77.221.156.164/portfolio").replace(/\/$/, "");

export const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", labelFa: "داشبورد" },
  { to: "/services", label: "Services", labelFa: "خدمات" },
  { to: "/projects", label: "Projects", labelFa: "پروژه‌ها" },
  { to: "/team", label: "Team", labelFa: "تیم" },
  { to: "/settings", label: "Settings", labelFa: "تنظیمات" },
  { to: "/legal", label: "Legal", labelFa: "حقوقی" },
  { to: "/leads", label: "Leads", labelFa: "سرنخ‌ها" },
];

function BrandMark() {
  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <div className="relative grid h-9 w-9 shrink-0 place-items-center bg-surface-container shadow-neon-sm">
        <span className="font-brand text-lg text-cta">F</span>
        <span className="absolute right-1 bottom-1 h-1 w-1 bg-cta" />
      </div>
      <div className="min-w-0">
        <p className="font-brand truncate text-sm text-on-surface">Facksten</p>
        <p className="hidden truncate font-mono text-[10px] tracking-[0.18em] text-on-surface-variant sm:block">
          PORTFOLIO ADMIN
        </p>
      </div>
    </div>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              "flex min-h-11 items-center justify-between border-s-2 px-3 py-2 font-mono text-xs uppercase tracking-wider focus-cta",
              isActive
                ? "border-cta bg-surface-container text-cta"
                : "border-transparent text-on-surface-variant hover:border-outline-variant hover:text-on-surface",
            )
          }
        >
          <span>{item.label}</span>
          <span dir="rtl" lang="fa" className="text-[10px] font-sans normal-case tracking-normal">
            {item.labelFa}
          </span>
        </NavLink>
      ))}
      <a
        href={SITE_URL}
        onClick={onNavigate}
        className="mt-3 flex min-h-11 items-center justify-between border-s-2 border-transparent px-3 py-2 font-mono text-xs uppercase tracking-wider text-cta hover:border-cta focus-cta"
      >
        <span>View site</span>
        <span dir="rtl" lang="fa" className="text-[10px] font-sans normal-case tracking-normal">
          بازگشت به سایت
        </span>
      </a>
    </nav>
  );
}

export function AdminShell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-on-surface">
      <div className="flex min-h-screen min-w-0">
        <aside className="hidden w-64 shrink-0 border-e border-outline bg-surface-container-lowest lg:block">
          <div className="sticky top-0 flex h-screen flex-col overflow-y-auto p-5">
            <BrandMark />
            <div className="mt-8 flex-1">
              <NavItems />
            </div>
            <p className="font-mono text-[10px] text-on-surface-variant">phase 1 · local cms</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-outline bg-background/90 px-3 py-3 backdrop-blur sm:gap-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center border border-outline font-mono text-xs text-on-surface lg:hidden focus-cta"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-label="Toggle navigation"
              >
                menu
              </button>
              <div className="min-w-0 lg:hidden">
                <BrandMark />
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
              <a
                href={SITE_URL}
                className="inline-flex min-h-11 items-center border border-outline px-3 font-mono text-[11px] text-cta hover:border-cta focus-cta"
              >
                ← سایت
              </a>
              <span className="hidden max-w-[10rem] truncate font-mono text-[11px] text-on-surface-variant md:inline">
                {user?.email}
              </span>
              <Button variant="outline" className="min-h-11" onClick={() => void logout()}>
                Logout
              </Button>
            </div>
          </header>

          {open ? (
            <div className="border-b border-outline bg-surface-container-lowest p-4 lg:hidden">
              <NavItems onNavigate={() => setOpen(false)} />
            </div>
          ) : null}

          <main className="min-w-0 flex-1 overflow-x-clip px-3 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

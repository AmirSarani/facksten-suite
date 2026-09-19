import { Link } from "react-router-dom";
import { NAV } from "../components/AdminShell";
import { PageHeader } from "../components/ui";
import { getApiBase } from "../lib/api";
import { useAuth } from "../lib/auth";

export function DashboardPage() {
  const { user, error } = useAuth();
  const cards = NAV.filter((item) => item.to !== "/");

  return (
    <div>
      <PageHeader title="Dashboard" titleFa="داشبورد" />
      <div className="panel-card p-5">
        <p className="font-mono text-[11px] text-on-surface-variant">session</p>
        <p className="mt-1 text-lg">{user?.name ?? user?.email}</p>
        <p className="font-mono text-xs text-on-surface-variant">{user?.email}</p>
        <p className="mt-3 font-mono text-[11px] text-on-surface-variant">
          cookie session against {getApiBase()} · auth is not facksten-market
        </p>
        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="panel-card p-5 transition-colors hover:border-cta focus-cta"
          >
            <p className="font-brand text-lg text-on-surface">{item.label}</p>
            <p className="mt-1 text-sm text-on-surface-variant" dir="rtl" lang="fa">
              {item.labelFa}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

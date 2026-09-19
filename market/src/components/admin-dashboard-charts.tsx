import { formatToman } from "@/lib/format";
import { ORDER_STATUS_FA, PRODUCT_TYPE_FA, formatDayLabel } from "@/lib/panel";

const CHART_HEIGHT = 200;

function pickLabelIndexes(length: number) {
  if (length <= 1) return new Set([0]);
  return new Set([0, Math.floor((length - 1) / 3), Math.floor(((length - 1) * 2) / 3), length - 1]);
}

export function AdminSalesChart({
  series,
  total,
  title = "روند فروش (۳۰ روز)",
  subtitle = "مجموع بدون سفارش‌های لغو‌شده",
  totalLabel = "مجموع ۳۰ روز",
  unit = "toman",
  barClassName = "bg-primary-container",
  height = CHART_HEIGHT,
}: {
  series: { key: string; value: number; label?: string }[];
  total: number;
  title?: string;
  subtitle?: string;
  totalLabel?: string;
  unit?: "toman" | "count";
  barClassName?: string;
  height?: number;
}) {
  const maxDay = Math.max(1, ...series.map((s) => s.value));
  const labelIdx = pickLabelIndexes(series.length);
  const formatValue = (v: number) => (unit === "count" ? String(v) : `${formatToman(v)} تومان`);
  const mid = Math.round(maxDay / 2);

  return (
    <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-on-surface">{title}</h2>
          <p className="mt-0.5 text-xs text-on-surface-variant">{subtitle}</p>
        </div>
        <span className="rounded-lg bg-primary-container/10 px-2.5 py-1 text-[11px] font-bold text-primary-container">
          روزانه
        </span>
      </div>

      <div className="flex gap-2">
        <div
          className="flex w-10 shrink-0 flex-col justify-between pb-5 text-left text-[9px] tabular-nums text-on-surface-variant"
          style={{ height: height + 20 }}
          dir="ltr"
        >
          <span>{unit === "count" ? maxDay : formatToman(maxDay)}</span>
          <span>{unit === "count" ? mid : formatToman(mid)}</span>
          <span>۰</span>
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="relative flex items-end gap-0.5 cyber-chamfer-sm border border-outline bg-surface-container-low/80 px-2 pt-3 pb-1 sm:gap-1 sm:px-3"
            style={{ height: height + 8 }}
          >
            <div className="pointer-events-none absolute inset-x-2 top-3 bottom-6 border-t border-dashed border-outline/50 sm:inset-x-3" />
            <div className="pointer-events-none absolute inset-x-2 top-1/2 bottom-6 border-t border-dashed border-outline/40 sm:inset-x-3" />
            {series.map((point, idx) => {
              const barH =
                point.value > 0 ? Math.max(8, Math.round((point.value / maxDay) * height)) : 3;
              const label = point.label ?? formatDayLabel(point.key);
              return (
                <div
                  key={point.key}
                  className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                >
                  <div
                    className={`w-full max-w-[14px] rounded-t-sm transition-[filter] duration-200 group-hover:brightness-110 sm:max-w-[16px] ${
                      point.value > 0 ? barClassName : "bg-surface-variant/60"
                    }`}
                    style={{ height: barH }}
                    title={`${label}: ${formatValue(point.value)}`}
                  />
                  <span
                    className={`mt-1 h-4 max-w-full truncate text-center text-[9px] tabular-nums text-on-surface-variant ${
                      labelIdx.has(idx) ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {labelIdx.has(idx) ? label : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-on-surface-variant">
        {totalLabel}:{" "}
        <span className="font-bold text-on-surface">{unit === "count" ? total : formatToman(total)}</span>
        {unit === "toman" ? " تومان" : " سفارش"}
      </p>
    </div>
  );
}

/** Sales bars + order-count dots in one panel — reduces vertical sprawl. */
export function AdminOrdersTrendChart({
  salesSeries,
  orderCountSeries,
  salesTotal,
  ordersTotal,
}: {
  salesSeries: { key: string; value: number; label?: string }[];
  orderCountSeries: { key: string; value: number; label?: string }[];
  salesTotal: number;
  ordersTotal: number;
}) {
  const maxSales = Math.max(1, ...salesSeries.map((s) => s.value));
  const maxOrders = Math.max(1, ...orderCountSeries.map((s) => s.value));
  const labelIdx = pickLabelIndexes(salesSeries.length);
  const height = 188;
  const mid = Math.round(maxSales / 2);

  return (
    <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-on-surface">روند فروش و حجم سفارش</h2>
          <p className="mt-0.5 text-xs text-on-surface-variant">۳۰ روز اخیر · بدون لغو‌شده</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary-container" />
            فروش
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-tertiary" />
            تعداد سفارش
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <div
          className="flex w-11 shrink-0 flex-col justify-between pb-5 text-left text-[9px] tabular-nums text-on-surface-variant"
          style={{ height: height + 20 }}
          dir="ltr"
        >
          <span>{formatToman(maxSales)}</span>
          <span>{formatToman(mid)}</span>
          <span>۰</span>
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="relative flex items-end gap-0.5 cyber-chamfer-sm border border-outline bg-surface-container-low/80 px-2 pt-3 pb-1 sm:gap-1 sm:px-3"
            style={{ height: height + 8 }}
          >
            <div className="pointer-events-none absolute inset-x-2 top-3 bottom-6 border-t border-dashed border-outline/50 sm:inset-x-3" />
            <div className="pointer-events-none absolute inset-x-2 top-1/2 bottom-6 border-t border-dashed border-outline/40 sm:inset-x-3" />
            {salesSeries.map((point, idx) => {
              const count = orderCountSeries[idx]?.value ?? 0;
              const barH = point.value > 0 ? Math.max(8, Math.round((point.value / maxSales) * height)) : 3;
              const dotBottom = count > 0 ? Math.max(6, Math.round((count / maxOrders) * height)) : 4;
              const label = point.label ?? formatDayLabel(point.key);
              return (
                <div
                  key={point.key}
                  className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                  title={`${label}\nفروش: ${formatToman(point.value)} تومان\nسفارش: ${count}`}
                >
                  <div className="relative flex w-full flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-[12px] rounded-t-sm bg-primary-container transition-[filter] duration-200 group-hover:brightness-110 sm:max-w-[15px]"
                      style={{ height: barH }}
                    />
                    <span
                      className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-surface bg-accent-tertiary shadow-sm"
                      style={{ bottom: dotBottom }}
                    />
                  </div>
                  <span
                    className={`mt-1 h-4 max-w-full truncate text-center text-[9px] tabular-nums text-on-surface-variant ${
                      labelIdx.has(idx) ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {labelIdx.has(idx) ? label : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-on-surface-variant">
        <p>
          فروش: <span className="font-bold text-on-surface">{formatToman(salesTotal)}</span> تومان
        </p>
        <p>
          سفارش: <span className="font-bold text-on-surface">{ordersTotal}</span>
        </p>
      </div>
    </div>
  );
}

export function AdminStatusBreakdown({
  byStatus,
  byType,
}: {
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number; revenue: number }[];
}) {
  const statusTotal = Math.max(1, byStatus.reduce((s, x) => s + x.count, 0));
  const typeTotal = Math.max(1, byType.reduce((s, x) => s + x.count, 0));

  return (
    <div className="flex h-full flex-col cyber-chamfer border border-outline bg-surface-container-lowest p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 text-base font-bold text-on-surface">وضعیت و نوع فروش</h2>

      <div className="mb-4">
        <p className="mb-2.5 text-[11px] font-bold text-on-surface-variant">وضعیت سفارش‌ها</p>
        <ul className="space-y-2">
          {byStatus.map((row) => {
            const pct = Math.round((row.count / statusTotal) * 100);
            return (
              <li key={row.status}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-on-surface">{ORDER_STATUS_FA[row.status] ?? row.status}</span>
                  <span className="shrink-0 tabular-nums text-on-surface-variant">
                    {row.count} · {pct}٪
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-primary-container"
                    style={{ width: `${Math.max(pct, row.count ? 3 : 0)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto border-t border-outline pt-3">
        <p className="mb-2.5 text-[11px] font-bold text-on-surface-variant">نوع فروش ۳۰ روز</p>
        <ul className="space-y-2.5">
          {byType.map((row) => {
            const pct = Math.round((row.count / typeTotal) * 100);
            return (
              <li key={row.type}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-on-surface">{PRODUCT_TYPE_FA[row.type] ?? row.type}</span>
                  <span className="shrink-0 tabular-nums text-on-surface-variant">{pct}٪</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className={`h-full rounded-full ${row.type === "DIGITAL" ? "bg-accent-tertiary" : "bg-primary-container"}`}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-on-surface-variant">
                  {row.count} قلم · {formatToman(row.revenue)} تومان
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

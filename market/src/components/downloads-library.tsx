"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";

type DownloadItem = {
  id: string;
  title: string;
  orderId: string;
  orderCode: string;
  purchasedAt: string;
  productSlug: string;
  fileLabel?: string | null;
  fileSize?: string | null;
  isNew?: boolean;
  files: { id: string; name: string; url: string }[];
};

const tabs = [
  { id: "all", label: "همه فایل‌ها" },
  { id: "code", label: "کدهای برنامه‌نویسی" },
  { id: "pcb", label: "طرح‌های PCB" },
  { id: "pack", label: "پکیج‌های آموزشی" },
] as const;

function tabOf(item: DownloadItem): (typeof tabs)[number]["id"] {
  const label = `${item.fileLabel ?? ""} ${item.title}`.toLowerCase();
  if (/pcb|altium|gerber|شماتیک/.test(label)) return "pcb";
  if (/آموزش|پکیج|zip|خانه هوشمند|tutorial|course/.test(label)) return "pack";
  return "code";
}

function extHint(item: DownloadItem) {
  if (item.fileLabel?.trim()) return item.fileLabel.trim();
  const name = item.files[0]?.name ?? "";
  const ext = name.includes(".") ? name.split(".").pop()?.toUpperCase() : "";
  return ext || "FILE";
}

export function DownloadsLibrary({ items }: { items: DownloadItem[] }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = { all: items.length, code: 0, pcb: 0, pack: 0 };
    for (const i of items) map[tabOf(i)] += 1;
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((i) => {
      if (tab !== "all" && tabOf(i) !== tab) return false;
      if (!term) return true;
      return (
        i.title.toLowerCase().includes(term) ||
        i.orderCode.toLowerCase().includes(term) ||
        i.files.some((f) => f.name.toLowerCase().includes(term)) ||
        (i.fileLabel ?? "").toLowerCase().includes(term)
      );
    });
  }, [items, q, tab]);

  return (
    <div>
      {/* Filter + search: always stacked to avoid chip/search overlap */}
      <div className="mb-5 grid grid-cols-1 gap-3 cyber-chamfer border border-outline bg-surface-container-lowest p-3">
        <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-primary-container bg-cta text-on-primary"
                    : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 tabular-nums ${active ? "bg-on-primary/20" : "bg-surface-container-low"}`}
                >
                  {counts[t.id]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full min-w-0">
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full min-w-0 cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            placeholder="جستجوی فایل، سفارش یا عنوان..."
          />
        </div>
      </div>

      <p className="mb-3 text-sm text-on-surface-variant">
        {filtered.length} مورد
        {tab !== "all" ? ` · ${tabs.find((t) => t.id === tab)?.label}` : ""}
        {q.trim() ? ` · «${q.trim()}»` : ""}
      </p>

      {!items.length ? (
        <div className="cyber-chamfer border border-dashed border-outline bg-surface-container-low p-10 text-center">
          <p className="text-sm text-on-surface-variant">هنوز محصول دیجیتالی خریداری نکرده‌اید.</p>
          <Link
            href="/shop?type=DIGITAL"
            className="mt-3 inline-flex cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
          >
            مشاهده محصولات دیجیتال
          </Link>
        </div>
      ) : !filtered.length ? (
        <div className="cyber-chamfer border border-dashed border-outline bg-surface-container-low p-10 text-center">
          <p className="text-sm text-on-surface-variant">با این فیلتر فایلی پیدا نشد.</p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setTab("all");
            }}
            className="mt-3 text-sm font-semibold text-primary-container hover:underline"
          >
            پاک کردن فیلترها
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const primary = item.files[0];
            const expanded = openId === item.id;
            const ready = item.files.length > 0;
            return (
              <article
                key={item.id}
                className="flex flex-col cyber-chamfer border border-outline bg-surface-container-lowest p-4 transition-colors hover:border-primary-container/50"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center cyber-chamfer-sm bg-cta/10 text-primary-container">
                    <Icon name="folder_zip" className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap gap-1.5">
                      {item.isNew ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-container/10 px-2 py-0.5 text-[10px] font-bold text-primary-container">
                          <Icon name="new_releases" className="h-3 w-3" />
                          جدید
                        </span>
                      ) : null}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ready ? "alert-ok" : "alert-warn"
                        }`}
                      >
                        <Icon name={ready ? "check_circle" : "support_agent"} className="h-3 w-3" />
                        {ready ? "آماده دانلود" : "بدون فایل"}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold leading-6 text-on-surface">{item.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant">
                      <span className="rounded-md bg-surface-container-low px-1.5 py-0.5 font-semibold">{extHint(item)}</span>
                      {item.fileSize ? <span>{item.fileSize}</span> : null}
                      <span>{item.files.length} فایل</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
                  <Link
                    href={`/account/orders/${item.orderId}`}
                    className="font-semibold text-primary-container hover:underline"
                  >
                    سفارش <span dir="ltr">{item.orderCode}</span>
                  </Link>
                  <span className="tabular-nums">{new Date(item.purchasedAt).toLocaleDateString("fa-IR")}</span>
                </div>

                {expanded && item.files.length > 0 ? (
                  <ul className="mb-3 space-y-1.5 rounded-xl border border-outline/80 p-2.5">
                    {item.files.map((f) => (
                      <li key={f.id}>
                        <a
                          href={f.url}
                          download
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold hover:bg-surface-container-low"
                        >
                          <span className="min-w-0 truncate">{f.name}</span>
                          <Icon name="download" className="h-3.5 w-3.5 shrink-0 text-primary-container" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-auto flex gap-2">
                  {primary ? (
                    <a
                      href={primary.url}
                      download
                      className="flex flex-1 items-center justify-center gap-2 cyber-chamfer-sm bg-cta py-2.5 text-sm font-semibold text-on-primary"
                    >
                      <Icon name="download" className="h-4 w-4" />
                      {item.files.length > 1 ? "دانلود اصلی" : "دانلود فایل"}
                    </a>
                  ) : (
                    <Link
                      href="/account/tickets"
                      className="flex flex-1 items-center justify-center cyber-chamfer-sm border border-dashed border-outline py-2.5 text-sm font-semibold text-on-surface-variant hover:border-primary"
                    >
                      پیگیری فایل
                    </Link>
                  )}
                  {item.files.length > 1 ? (
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-label="فهرست فایل‌ها"
                      onClick={() => setOpenId(expanded ? null : item.id)}
                      className="inline-flex items-center justify-center cyber-chamfer-sm border border-outline bg-surface-container-low px-3 hover:border-primary-container"
                    >
                      <Icon name="description" className="h-5 w-5" />
                    </button>
                  ) : (
                    <Link
                      href={`/product/${item.productSlug}`}
                      aria-label="صفحه محصول"
                      className="inline-flex items-center justify-center cyber-chamfer-sm border border-outline bg-surface-container-low px-3 hover:border-primary-container"
                    >
                      <Icon name="link" className="h-5 w-5" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

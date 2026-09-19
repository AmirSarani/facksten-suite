"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, resolveIconName, type IconName } from "@/components/icon";

export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  intro: string;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  isPassive: boolean;
  _count: { products: number; children: number };
};

const CATEGORY_ICONS: { value: IconName; label: string }[] = [
  { value: "memory", label: "تراشه / قطعات" },
  { value: "developer_board", label: "برد توسعه" },
  { value: "sensors", label: "سنسور" },
  { value: "bolt", label: "برق / تغذیه" },
  { value: "battery_charging_full", label: "باتری / شارژ" },
  { value: "build", label: "ابزار" },
  { value: "inventory_2", label: "انبار / بسته" },
  { value: "schema", label: "ماژول / شبکه" },
  { value: "folder_zip", label: "فایل / دیجیتال" },
  { value: "home_iot_device", label: "IoT" },
  { value: "new_releases", label: "جدید / ویژه" },
  { value: "star", label: "ستاره" },
  { value: "shopping_cart", label: "خرید" },
];

type FilterKey = "all" | "roots" | "children" | "passive" | "empty" | "active";

export function CategoryManager({ categories }: { categories: AdminCategoryRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [defaultParentId, setDefaultParentId] = useState<string>("");
  const [iconPreview, setIconPreview] = useState<string>("memory");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const byId = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const roots = useMemo(
    () => categories.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fa")),
    [categories],
  );

  const childrenOf = (id: string) =>
    categories
      .filter((c) => c.parentId === id)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fa"));

  const stats = useMemo(() => {
    const total = categories.length;
    const rootCount = roots.length;
    const childCount = total - rootCount;
    const passive = categories.filter((c) => c.isPassive).length;
    const empty = categories.filter((c) => c._count.products === 0).length;
    const withProducts = categories.filter((c) => c._count.products > 0).length;
    const productLinks = categories.reduce((s, c) => s + c._count.products, 0);
    return { total, rootCount, childCount, passive, empty, withProducts, productLinks };
  }, [categories, roots.length]);

  const matchesQuery = (c: AdminCategoryRow) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      c.name.toLowerCase().includes(needle) ||
      c.slug.toLowerCase().includes(needle) ||
      c.intro.toLowerCase().includes(needle)
    );
  };

  const matchesFilter = (c: AdminCategoryRow) => {
    if (filter === "roots") return !c.parentId;
    if (filter === "children") return !!c.parentId;
    if (filter === "passive") return c.isPassive;
    if (filter === "empty") return c._count.products === 0;
    if (filter === "active") return !c.isPassive;
    return true;
  };

  /** Keep ancestors visible when a child matches search/filter. */
  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of categories) {
      if (!matchesQuery(c) || !matchesFilter(c)) continue;
      ids.add(c.id);
      let pid = c.parentId;
      while (pid) {
        ids.add(pid);
        pid = byId[pid]?.parentId ?? null;
      }
    }
    return ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- helpers close over q/filter
  }, [categories, byId, q, filter]);

  function pathLabel(c: AdminCategoryRow) {
    const parts = [c.name];
    let pid = c.parentId;
    while (pid) {
      const p = byId[pid];
      if (!p) break;
      parts.unshift(p.name);
      pid = p.parentId;
    }
    return parts.join(" / ");
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: editing?.id,
      name: String(fd.get("name") ?? ""),
      slug: String(fd.get("slug") ?? "") || undefined,
      intro: String(fd.get("intro") ?? ""),
      icon: String(fd.get("icon") ?? "") || null,
      parentId: String(fd.get("parentId") ?? "") || null,
      isPassive: fd.get("isPassive") === "on",
    };
    const res = await fetch("/api/admin/categories", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "ذخیره شد" : (data.error ?? "خطا"));
    if (res.ok) {
      setEditing(null);
      setDefaultParentId("");
      setShowForm(false);
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("این دسته حذف شود؟ محصولات آن بدون دسته می‌مانند.")) return;
    setBusyId(id);
    const res = await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "حذف شد" : (data.error ?? "خطا"));
    setBusyId(null);
    router.refresh();
  }

  async function move(id: string, parentId: string | null, dir: -1 | 1) {
    const siblings = categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = siblings.findIndex((c) => c.id === id);
    const swap = siblings[idx + dir];
    if (!swap) return;
    const orderedIds = siblings.map((c) => c.id);
    [orderedIds[idx], orderedIds[idx + dir]] = [orderedIds[idx + dir], orderedIds[idx]];
    setBusyId(id);
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", orderedIds }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function togglePassive(c: AdminCategoryRow) {
    setBusyId(c.id);
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: c.id,
        name: c.name,
        slug: c.slug,
        intro: c.intro,
        icon: c.icon,
        parentId: c.parentId,
        isPassive: !c.isPassive,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? (c.isPassive ? "در منو فعال شد" : "از منو مخفی شد") : (data.error ?? "خطا"));
    setBusyId(null);
    router.refresh();
  }

  function openCreate(parentId?: string | null) {
    setEditing(null);
    setDefaultParentId(parentId ?? "");
    setIconPreview("memory");
    setShowForm(true);
  }

  function openEdit(c: AdminCategoryRow) {
    setEditing(c);
    setDefaultParentId(c.parentId ?? "");
    setIconPreview(resolveIconName(c.icon, "memory"));
    setShowForm(true);
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function expandAll() {
    setCollapsed({});
  }

  function collapseAll() {
    const next: Record<string, boolean> = {};
    for (const c of categories) {
      if (c._count.children > 0) next[c.id] = true;
    }
    setCollapsed(next);
  }

  const kpiCards = [
    { label: "کل دسته‌ها", value: String(stats.total), hint: `${stats.rootCount} ریشه` },
    { label: "زیردسته", value: String(stats.childCount), hint: "سطح دوم+" },
    { label: "فعال در منو", value: String(stats.total - stats.passive), hint: `${stats.passive} مخفی` },
    { label: "بدون محصول", value: String(stats.empty), hint: `${stats.withProducts} دارای کالا` },
  ];

  const filterChips: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "همه", count: stats.total },
    { key: "roots", label: "ریشه", count: stats.rootCount },
    { key: "children", label: "زیردسته", count: stats.childCount },
    { key: "active", label: "فعال منو", count: stats.total - stats.passive },
    { key: "passive", label: "مخفی", count: stats.passive },
    { key: "empty", label: "خالی", count: stats.empty },
  ];

  function renderRow(c: AdminCategoryRow, depth: number, siblingIndex: number, siblingCount: number) {
    if (!visibleIds.has(c.id)) return null;
    const kids = childrenOf(c.id);
    const visibleKids = kids.filter((k) => visibleIds.has(k.id));
    const isCollapsed = !!collapsed[c.id];
    const iconName = resolveIconName(c.icon, depth === 0 ? "inventory_2" : "schema");
    const canUp = siblingIndex > 0;
    const canDown = siblingIndex < siblingCount - 1;
    const busy = busyId === c.id;

    return (
      <div key={c.id} className="relative">
        {depth > 0 ? (
          <span
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-surface-variant"
            style={{ insetInlineStart: `${depth * 20 - 10}px` }}
            aria-hidden
          />
        ) : null}
        <div
          className={`mb-1.5 flex flex-wrap items-center justify-between gap-2 cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 transition-colors ${
            c.isPassive ? "border-outline/70 opacity-80" : "border-outline hover:border-primary-container/40"
          }`}
          style={{ marginInlineStart: depth * 20 }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {c._count.children > 0 ? (
              <button
                type="button"
                onClick={() => toggleCollapse(c.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-outline text-xs font-bold text-on-surface-variant hover:border-primary-container"
                aria-label={isCollapsed ? "باز کردن" : "بستن"}
              >
                {isCollapsed ? "+" : "−"}
              </button>
            ) : (
              <span className="h-7 w-7 shrink-0" aria-hidden />
            )}
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                depth === 0 ? "bg-primary-container/10 text-primary-container" : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              <Icon name={iconName} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="font-semibold text-on-surface">{c.name}</p>
                {depth === 0 ? (
                  <span className="rounded-md bg-primary-container/10 px-1.5 py-0.5 text-[10px] font-bold text-primary-container">
                    ریشه
                  </span>
                ) : (
                  <span className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant">
                    زیردسته
                  </span>
                )}
                {c.isPassive ? (
                  <span className="alert-danger px-1.5 py-0.5 text-[10px] font-bold">مخفی از منو</span>
                ) : (
                  <span className="alert-ok px-1.5 py-0.5 text-[10px] font-bold">فعال</span>
                )}
                {c._count.products === 0 ? (
                  <span className="alert-warn px-1.5 py-0.5 text-[10px] font-bold">بدون محصول</span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-on-surface-variant">
                <span dir="ltr">/{c.slug}</span>
                {" · "}
                {c._count.products} محصول
                {" · "}
                {c._count.children} زیردسته
                {c.parentId && byId[c.parentId] ? ` · زیر ${byId[c.parentId].name}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              disabled={!canUp || busy}
              title="جابه‌جایی به بالا"
              className="rounded-lg border border-outline px-2 py-1 text-xs font-semibold disabled:opacity-40"
              onClick={() => void move(c.id, c.parentId, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              disabled={!canDown || busy}
              title="جابه‌جایی به پایین"
              className="rounded-lg border border-outline px-2 py-1 text-xs font-semibold disabled:opacity-40"
              onClick={() => void move(c.id, c.parentId, 1)}
            >
              ↓
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-lg border border-outline px-2 py-1 text-xs font-semibold hover:border-primary-container"
              onClick={() => void togglePassive(c)}
            >
              {c.isPassive ? "نمایش در منو" : "مخفی از منو"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-outline px-2 py-1 text-xs font-semibold hover:border-primary-container"
              onClick={() => openCreate(c.id)}
            >
              + زیردسته
            </button>
            <Link
              href={`/shop/category/${c.slug}`}
              className="rounded-lg border border-outline px-2 py-1 text-xs font-semibold hover:border-primary-container"
            >
              فروشگاه
            </Link>
            <Link
              href={`/admin/products?category=${c.id}`}
              className="rounded-lg border border-outline px-2 py-1 text-xs font-semibold hover:border-primary-container"
            >
              کالاها
            </Link>
            <button
              type="button"
              className="rounded-lg border border-outline px-2 py-1 text-xs font-semibold hover:border-primary-container"
              onClick={() => openEdit(c)}
            >
              ویرایش
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-lg border alert-danger cyber-chamfer-sm px-2 py-1 text-xs font-semibold disabled:opacity-40"
              onClick={() => void remove(c.id)}
            >
              حذف
            </button>
          </div>
        </div>

        {!isCollapsed
          ? visibleKids.map((ch, i) => renderRow(ch, depth + 1, i, visibleKids.length))
          : null}
      </div>
    );
  }

  const formParentDefault = editing ? (editing.parentId ?? "") : defaultParentId;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((k) => (
          <div key={k.label} className="cyber-chamfer border border-outline bg-surface-container-lowest p-4">
            <p className="text-xs font-medium text-on-surface-variant">{k.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{k.value}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{k.hint}</p>
          </div>
        ))}
      </div>

      <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">راهنمای سریع</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              ریشه‌ها در منوی هدر دیده می‌شوند · زیردسته‌ها در مگا‌منو · «مخفی از منو» دسته را از ناوبری حذف می‌کند ولی در ادمین می‌ماند
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/shop"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-semibold hover:border-primary-container"
            >
              پیش‌نمایش فروشگاه
            </Link>
            <Link
              href="/admin/products"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-semibold hover:border-primary-container"
            >
              مدیریت محصولات
            </Link>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-xs leading-6 text-on-surface-variant">
            ترتیب با ↑ ↓ بین هم‌سطح‌ها عوض می‌شود (نه بین ریشه و زیردسته).
          </div>
          <div className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-xs leading-6 text-on-surface-variant">
            حذف فقط وقتی مجاز است که زیردسته نداشته باشد؛ محصولات بدون دسته می‌مانند.
          </div>
          <div className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-xs leading-6 text-on-surface-variant">
            جمع ارجاع محصول در درخت: <span className="font-bold text-on-surface">{stats.productLinks}</span>
          </div>
        </div>
      </section>

      {msg ? (
        <p className="cyber-chamfer-sm border border-primary-container/20 bg-primary-container/5 px-3 py-2 text-sm font-semibold text-primary-container">
          {msg}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openCreate(null)}
            className="cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
          >
            دسته ریشه جدید
          </button>
          <button
            type="button"
            onClick={expandAll}
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold hover:border-primary-container"
          >
            باز کردن همه
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold hover:border-primary-container"
          >
            بستن همه
          </button>
        </div>
      </div>

      {(showForm || editing) && (
        <form
          onSubmit={save}
          key={editing ? `edit-${editing.id}` : `new-${defaultParentId || "root"}`}
          className="grid gap-3 cyber-chamfer border border-primary-container/25 bg-surface-container-lowest p-4 shadow-[var(--box-shadow-neon-sm)] sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <h2 className="text-base font-bold">{editing ? "ویرایش دسته" : "دسته جدید"}</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {editing
                ? pathLabel(editing)
                : defaultParentId && byId[defaultParentId]
                  ? `زیردسته برای «${byId[defaultParentId].name}»`
                  : "به‌عنوان ریشه منو"}
            </p>
          </div>
          <label className="block text-xs font-semibold text-on-surface-variant">
            نام
            <input
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              placeholder="مثلاً سنسورها"
              className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
            />
          </label>
          <label className="block text-xs font-semibold text-on-surface-variant">
            اسلاگ
            <input
              name="slug"
              defaultValue={editing?.slug ?? ""}
              placeholder="اختیاری — خودکار از نام"
              dir="ltr"
              className="mt-1 w-full rounded-xl border border-outline px-3 py-2 text-left text-sm font-normal text-on-surface outline-none focus:border-primary-container"
            />
          </label>
          <label className="block text-xs font-semibold text-on-surface-variant sm:col-span-2">
            <span className="mb-1 flex items-center gap-2">
              آیکون
              <Icon name={resolveIconName(iconPreview, "memory")} className="h-4 w-4 text-primary-container" />
            </span>
            <select
              name="icon"
              value={iconPreview}
              onChange={(e) => setIconPreview(e.target.value)}
              className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
            >
              {CATEGORY_ICONS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-on-surface-variant sm:col-span-2">
            والد
            <select
              name="parentId"
              defaultValue={formParentDefault}
              className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
            >
              <option value="">بدون والد (ریشه)</option>
              {categories
                .filter((c) => c.id !== editing?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {pathLabel(c)}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-on-surface-variant sm:col-span-2">
            توضیح کوتاه
            <textarea
              name="intro"
              defaultValue={editing?.intro ?? ""}
              rows={2}
              placeholder="برای صفحه دسته و منو"
              className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              name="isPassive"
              type="checkbox"
              defaultChecked={editing?.isPassive ?? false}
              className="rounded border-outline"
            />
            مخفی از منوی سایت (isPassive)
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" className="cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary">
              {editing ? "ذخیره تغییرات" : "افزودن دسته"}
            </button>
            <button
              type="button"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-4 py-2 text-sm font-semibold hover:border-primary-container"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setDefaultParentId("");
              }}
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      <section id="categories-tree">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">درخت دسته‌بندی</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              {visibleIds.size} مورد نمایشی از {stats.total}
            </p>
          </div>
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجوی نام یا اسلاگ…"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {filterChips.map((chip) => {
            const active = filter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilter(chip.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-primary-container bg-cta text-on-primary"
                    : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
                }`}
              >
                {chip.label}
                <span className={`rounded-md px-1.5 py-0.5 tabular-nums ${active ? "bg-on-primary/20" : "bg-surface-container-low"}`}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-3 sm:p-4">
          {roots.map((c, i) => renderRow(c, 0, i, roots.length))}
          {!roots.length ? (
            <p className="cyber-chamfer-sm border border-dashed border-outline p-8 text-center text-sm text-on-surface-variant">
              دسته‌ای ثبت نشده. یک ریشه جدید بسازید.
            </p>
          ) : null}
          {roots.length > 0 && visibleIds.size === 0 ? (
            <p className="cyber-chamfer-sm border border-dashed border-outline p-8 text-center text-sm text-on-surface-variant">
              نتیجه‌ای برای این فیلتر/جستجو نیست.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

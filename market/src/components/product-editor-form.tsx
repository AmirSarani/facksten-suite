"use client";

import { FormEvent, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";
import { MediaPickerField } from "@/components/media-picker-field";
import { formatToman, unitPrice } from "@/lib/format";

export type ProductEditorCategory = { id: string; name: string; slug: string; parentId?: string | null };
export type ProductEditorSeller = { id: string; name: string; email: string };
export type ProductEditorFile = { name: string; url: string };

export type ProductEditorValues = {
  id?: string;
  slug?: string;
  title: string;
  price: number;
  stock: number;
  type: "HARDWARE" | "DIGITAL";
  brand?: string | null;
  sku?: string | null;
  mpn?: string | null;
  description?: string;
  categoryId?: string | null;
  compareAtPrice?: number | null;
  packQty?: number;
  active?: boolean;
  image?: string;
  icon?: string | null;
  badge?: string | null;
  isNew?: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
  specs?: string;
  fileLabel?: string | null;
  fileSize?: string | null;
  sellerId?: string | null;
  files?: ProductEditorFile[];
};

type SpecRow = { key: string; value: string };

const SPEC_PRESETS: { label: string; rows: SpecRow[] }[] = [
  {
    label: "قطعه الکترونیکی",
    rows: [
      { key: "ولتاژ", value: "" },
      { key: "جریان", value: "" },
      { key: "پکیج", value: "" },
      { key: "دما", value: "" },
    ],
  },
  {
    label: "برد توسعه",
    rows: [
      { key: "میکروکنترلر", value: "" },
      { key: "ولتاژ کاری", value: "" },
      { key: "GPIO", value: "" },
      { key: "رابط", value: "USB / UART" },
    ],
  },
  {
    label: "محصول دیجیتال",
    rows: [
      { key: "فرمت", value: "ZIP" },
      { key: "سازگاری", value: "" },
      { key: "زبان", value: "فارسی / انگلیسی" },
      { key: "به‌روزرسانی", value: "رایگان" },
    ],
  },
];

const BADGE_PRESETS = ["ارسال سریع", "اورجینال", "تخفیف ویژه", "محدود", "پیشنهاد فروشگاه"];

const DIGITAL_ICONS: { value: IconName; label: string }[] = [
  { value: "folder_zip", label: "ZIP / آرشیو" },
  { value: "picture_as_pdf", label: "PDF" },
  { value: "account_tree", label: "شماتیک / پروژه" },
  { value: "description", label: "سند / راهنما" },
  { value: "memory", label: "کد / فریمور" },
];

function parseSpecs(specs?: string): SpecRow[] {
  try {
    const obj = JSON.parse(specs || "{}") as Record<string, string>;
    const rows = Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
    return rows.length ? rows : [{ key: "", value: "" }];
  } catch {
    return [{ key: "", value: "" }];
  }
}

function specsToJson(rows: SpecRow[]) {
  const out: Record<string, string> = {};
  rows.forEach((r) => {
    const k = r.key.trim();
    if (k) out[k] = r.value.trim();
  });
  return JSON.stringify(out);
}

function slugPreviewFromTitle(title: string) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || "product";
}

function Field({
  label,
  hint,
  trailing,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-on-surface-variant">{label}</span>
        {trailing}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-5 text-on-surface-variant">{hint}</span> : null}
    </label>
  );
}

function inputClass() {
  return "w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary-container";
}

function Section({
  id,
  step,
  title,
  hint,
  children,
}: {
  id?: string;
  step?: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 cyber-chamfer border border-outline bg-surface-container-lowest p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        {step ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-xs font-bold text-primary-container">
            {step}
          </span>
        ) : null}
        <div>
          <h2 className="text-base font-bold text-on-surface">{title}</h2>
          {hint ? <p className="mt-1 text-xs leading-6 text-on-surface-variant sm:text-sm">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ProductEditorForm({
  mode,
  initial,
  categories,
  sellers,
  apiBase,
}: {
  mode: "create" | "edit";
  initial?: Partial<ProductEditorValues>;
  categories: ProductEditorCategory[];
  sellers?: ProductEditorSeller[];
  apiBase: "/api/admin/products" | "/api/partner/products";
}) {
  const router = useRouter();
  const isAdmin = apiBase.startsWith("/api/admin");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [compareAt, setCompareAt] = useState(String(initial?.compareAtPrice ?? ""));
  const [stock, setStock] = useState(String(initial?.stock ?? (initial?.type === "DIGITAL" ? 9999 : "")));
  const [packQty, setPackQty] = useState(String(initial?.packQty ?? 1));
  const [image, setImage] = useState(initial?.image ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "folder_zip");
  const [type, setType] = useState<"HARDWARE" | "DIGITAL">(initial?.type ?? "HARDWARE");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isNew, setIsNew] = useState(initial?.isNew ?? false);
  const [isPopular, setIsPopular] = useState(initial?.isPopular ?? false);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [active, setActive] = useState(initial?.active ?? true);
  const [specs, setSpecs] = useState<SpecRow[]>(() => parseSpecs(initial?.specs));
  const [files, setFiles] = useState<ProductEditorFile[]>(() =>
    initial?.files?.length ? initial.files.map((f) => ({ name: f.name, url: f.url })) : [{ name: "", url: "" }],
  );
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const catById = useMemo(() => {
    const map: Record<string, ProductEditorCategory> = {};
    for (const cat of categories) map[cat.id] = cat;
    return map;
  }, [categories]);

  function categoryPath(id: string): string {
    const parts: string[] = [];
    let cur: string | undefined = id;
    const guard = new Set<string>();
    while (cur && !guard.has(cur)) {
      guard.add(cur);
      const node: ProductEditorCategory | undefined = catById[cur];
      if (!node) break;
      parts.unshift(node.name);
      cur = node.parentId ?? undefined;
    }
    return parts.join(" / ");
  }

  const previewPrice = useMemo(() => {
    const n = Number(price);
    return Number.isFinite(n) && n > 0 ? formatToman(n) : "—";
  }, [price]);

  const comparePreview = useMemo(() => {
    const n = Number(compareAt);
    const p = Number(price);
    if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(p) || n <= p) return null;
    const pct = Math.round(((n - p) / n) * 100);
    return { label: formatToman(n), pct };
  }, [compareAt, price]);

  const pack = Math.max(1, Number(packQty) || 1);
  const unitPreview = useMemo(() => {
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0 || pack <= 1) return null;
    return formatToman(unitPrice(p, pack));
  }, [price, pack]);

  const selectedCategory = categoryId ? catById[categoryId] : null;
  const cleanFiles = useMemo(
    () => files.filter((f) => f.name.trim() && f.url.trim()),
    [files],
  );
  const filledSpecs = useMemo(() => specs.filter((s) => s.key.trim()).length, [specs]);
  const slugLive = mode === "edit" && slug.trim() ? slug.trim() : slugPreviewFromTitle(title);

  const checklist = useMemo(() => {
    return [
      { id: "title", label: "عنوان", done: title.trim().length >= 2, href: "#pe-basic", required: true },
      { id: "price", label: "قیمت", done: Number(price) > 0, href: "#pe-price", required: true },
      { id: "category", label: "دسته‌بندی", done: !!categoryId, href: "#pe-basic", required: true },
      { id: "image", label: "تصویر", done: !!image && image !== "/placeholder.svg", href: "#pe-media", required: true },
      {
        id: "stock",
        label: type === "DIGITAL" ? "فایل دیجیتال" : "موجودی",
        done: type === "DIGITAL" ? cleanFiles.length > 0 : stock !== "" && Number(stock) >= 0,
        href: type === "DIGITAL" ? "#pe-digital" : "#pe-price",
        required: true,
      },
      {
        id: "desc",
        label: "توضیحات",
        done: description.trim().length >= 20,
        href: "#pe-desc",
        required: false,
      },
      {
        id: "specs",
        label: "مشخصات فنی",
        done: filledSpecs > 0,
        href: "#pe-desc",
        required: false,
      },
    ];
  }, [title, price, categoryId, image, stock, type, cleanFiles, description, filledSpecs]);

  const requiredDone = checklist.filter((c) => c.required && c.done).length;
  const requiredTotal = checklist.filter((c) => c.required).length;
  const optionalDone = checklist.filter((c) => !c.required && c.done).length;
  const readyToPublish = requiredDone === requiredTotal && active;

  const sections = useMemo(() => {
    const base = [
      { id: "pe-basic", label: "پایه" },
      { id: "pe-price", label: "قیمت" },
      { id: "pe-media", label: "رسانه" },
    ];
    if (type === "DIGITAL") base.push({ id: "pe-digital", label: "فایل" });
    base.push({ id: "pe-desc", label: "توضیحات" }, { id: "pe-seo", label: "سئو" }, { id: "pe-display", label: "نمایش" });
    return base;
  }, [type]);

  async function uploadDigital(idx: number, file: File) {
    setUploadingIdx(idx);
    setError("");
    const fd = new FormData();
    fd.set("folder", "digital");
    fd.set("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploadingIdx(null);
    if (!res.ok) {
      setError(data.error ?? "آپلود ناموفق");
      return;
    }
    setFiles((rows) =>
      rows.map((r, i) => (i === idx ? { name: r.name || file.name, url: data.url as string } : r)),
    );
  }

  function applyPreset(rows: SpecRow[]) {
    setSpecs(rows.map((r) => ({ ...r })));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setOk("");
    const fd = new FormData(e.currentTarget);

    const payload = {
      id: initial?.id,
      title: String(fd.get("title") ?? ""),
      price: Number(fd.get("price")),
      stock: Number(fd.get("stock")),
      type,
      brand: String(fd.get("brand") ?? "") || undefined,
      sku: String(fd.get("sku") ?? "") || undefined,
      mpn: String(fd.get("mpn") ?? "") || null,
      description,
      categoryId: categoryId || null,
      compareAtPrice: compareAt ? Number(compareAt) : null,
      packQty: Number(packQty || 1),
      active,
      image: image || undefined,
      icon: type === "DIGITAL" ? icon || null : null,
      badge: badge.trim() || null,
      isNew,
      isPopular,
      isFeatured,
      specs: specsToJson(specs),
      fileLabel: type === "DIGITAL" ? String(fd.get("fileLabel") ?? "") || null : null,
      fileSize: type === "DIGITAL" ? String(fd.get("fileSize") ?? "") || null : null,
      sellerId: isAdmin ? String(fd.get("sellerId") ?? "") || null : undefined,
      files: type === "DIGITAL" ? cleanFiles : [],
      slug: isAdmin && mode === "edit" && slug.trim() ? slug.trim() : undefined,
    };

    const res = await fetch(apiBase, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "خطا در ذخیره");
      return;
    }
    setOk(mode === "create" ? "محصول ثبت شد" : "تغییرات ذخیره شد");
    router.refresh();
    if (mode === "create" && isAdmin) {
      router.push(`/admin/products/${data.product.id}`);
    } else if (mode === "create") {
      router.push("/partner/inventory");
    }
  }

  const kpis = [
    {
      label: "الزامی",
      value: `${requiredDone}/${requiredTotal}`,
      hint: readyToPublish ? "آماده انتشار" : "موارد ناقص را کامل کنید",
      href: "#pe-checklist",
      tone: readyToPublish ? "text-[color:var(--accent,#00ff88)]" : "text-on-surface",
    },
    {
      label: "نوع",
      value: type === "DIGITAL" ? "دیجیتال" : "سخت‌افزار",
      hint: type === "DIGITAL" ? "دانلود پس از خرید" : "موجودی انبار",
      href: "#pe-basic",
      tone: "text-on-surface",
    },
    {
      label: "قیمت",
      value: previewPrice === "—" ? "—" : previewPrice,
      hint: comparePreview ? `${comparePreview.pct}٪ تخفیف` : "تومان",
      href: "#pe-price",
      tone: Number(price) > 0 ? "text-primary-container" : "text-on-surface",
    },
    {
      label: "وضعیت",
      value: active ? "فعال" : "پیش‌نویس",
      hint: active ? "در فروشگاه دیده می‌شود" : "فقط در پنل",
      href: "#pe-display",
      tone: active ? "text-[color:var(--accent,#00ff88)]" : "text-primary-container",
    },
  ];

  return (
    <form onSubmit={onSubmit} className="relative pb-28 lg:pb-8">
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <a
            key={k.label}
            href={k.href}
            className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 transition-colors hover:border-primary-container"
          >
            <p className="text-[11px] font-bold text-on-surface-variant">{k.label}</p>
            <p className={`mt-1 text-xl font-bold tracking-tight sm:text-2xl ${k.tone}`}>{k.value}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{k.hint}</p>
          </a>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-on-surface-variant">بخش‌ها:</span>
        {sections.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="cursor-pointer cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container"
          >
            {i + 1}. {s.label}
          </a>
        ))}
        {isAdmin && mode === "edit" && initial?.slug ? (
          <Link
            href={`/product/${initial.slug}`}
            target="_blank"
            className="ms-auto cursor-pointer cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-primary-container hover:border-primary-container"
          >
            صفحه عمومی ↗
          </Link>
        ) : null}
        {!isAdmin ? (
          <Link href="/partner/inventory" className="ms-auto text-xs font-semibold text-primary-container hover:underline">
            ← موجودی
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Section id="pe-basic" step="۱" title="اطلاعات پایه" hint="عنوان، نوع محصول و جایگاه در کاتالوگ">
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {(
                [
                  { value: "HARDWARE" as const, title: "سخت‌افزار", desc: "قطعه، برد، ابزار — با موجودی انبار" },
                  { value: "DIGITAL" as const, title: "دیجیتال", desc: "فایل دانلودی پس از خرید" },
                ] as const
              ).map((opt) => {
                const on = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setType(opt.value);
                      if (opt.value === "DIGITAL" && (!stock || stock === "0")) setStock("9999");
                    }}
                    className={`cursor-pointer cyber-chamfer-sm border border-outline px-3.5 py-3 text-right transition-colors ${
                      on
                        ? "border-primary-container bg-primary-container/10"
                        : "border-outline bg-surface-container-low hover:border-primary-container/40"
                    }`}
                  >
                    <span className="block text-sm font-bold">{opt.title}</span>
                    <span className="mt-1 block text-[11px] leading-5 text-on-surface-variant">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="عنوان محصول" className="sm:col-span-2" hint="همان عنوانی که روی کارت و صفحه محصول دیده می‌شود">
                <input
                  name="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً مقاومت ۱۰۰ اهم ۱/۴ وات"
                  className={inputClass()}
                />
              </Field>
              <Field label="SKU" hint="خالی بماند تا خودکار ساخته شود">
                <input
                  name="sku"
                  defaultValue={initial?.sku ?? ""}
                  placeholder="مثلاً RES-100R-50"
                  dir="ltr"
                  className={`${inputClass()} text-left`}
                />
              </Field>
              <Field label="MPN" hint="کد سازنده (Manufacturer Part Number)">
                <input
                  name="mpn"
                  defaultValue={initial?.mpn ?? ""}
                  placeholder="مثلاً LM358N"
                  dir="ltr"
                  className={`${inputClass()} text-left`}
                />
              </Field>
              <Field label="برند">
                <input
                  name="brand"
                  defaultValue={initial?.brand ?? ""}
                  placeholder="مثلاً Texas Instruments"
                  className={inputClass()}
                />
              </Field>
              <Field label="دسته‌بندی" hint="برای منو، فیلتر فروشگاه و مسیر نان‌ریز ضروری است" className="sm:col-span-2">
                <select
                  name="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={inputClass()}
                >
                  <option value="">انتخاب دسته…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? `↳ ${categoryPath(c.id)}` : c.name}
                    </option>
                  ))}
                </select>
                {!categories.length ? (
                  <span className="mt-2 block cyber-chamfer-sm alert-warn px-3 py-2 text-[11px]">
                    هنوز دسته‌ای نیست.{" "}
                    {isAdmin ? (
                      <Link href="/admin/categories" className="font-bold underline">
                        ساخت دسته‌بندی
                      </Link>
                    ) : (
                      "از ادمین بخواهید دسته اضافه کند."
                    )}
                  </span>
                ) : null}
              </Field>
              {isAdmin ? (
                <Field label="فروشنده (همکار)" hint="خالی = فروشگاه مرکزی Facksten" className="sm:col-span-2">
                  <select name="sellerId" defaultValue={initial?.sellerId ?? ""} className={inputClass()}>
                    <option value="">فروشگاه مرکزی</option>
                    {(sellers ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.email}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </div>
          </Section>

          <Section
            id="pe-price"
            step="۲"
            title="قیمت و موجودی"
            hint={
              type === "DIGITAL"
                ? "برای دیجیتال معمولاً موجودی نمایشی بالا (مثلاً ۹۹۹۹) کافی است"
                : "موجودی صفر = ناموجود در فروشگاه"
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="قیمت فروش (تومان)"
                trailing={
                  Number(price) > 0 ? (
                    <span className="text-[11px] tabular-nums text-primary-container">{previewPrice}</span>
                  ) : null
                }
              >
                <input
                  name="price"
                  required
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="مثلاً ۱۲۵۰۰۰"
                  className={inputClass()}
                />
              </Field>
              <Field label="قیمت قبل تخفیف" hint="باید از قیمت فروش بیشتر باشد تا درصد تخفیف نشان داده شود">
                <input
                  name="compareAtPrice"
                  type="number"
                  min={0}
                  value={compareAt}
                  onChange={(e) => setCompareAt(e.target.value)}
                  placeholder="اختیاری"
                  className={inputClass()}
                />
              </Field>
              <Field
                label={type === "DIGITAL" ? "موجودی نمایشی" : "موجودی انبار"}
                hint={type === "HARDWARE" && stock !== "" && Number(stock) <= 5 && Number(stock) > 0 ? "کم‌موجودی — هشدار در لیست ادمین" : undefined}
              >
                <input
                  name="stock"
                  required
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className={inputClass()}
                />
              </Field>
              <Field label="تعداد در بسته" hint="اگر بیشتر از ۱ باشد، قیمت واحد روی صفحه محصول نشان داده می‌شود">
                <input
                  name="packQty"
                  type="number"
                  min={1}
                  value={packQty}
                  onChange={(e) => setPackQty(e.target.value)}
                  className={inputClass()}
                />
              </Field>
            </div>
            {(comparePreview || unitPreview) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {comparePreview ? (
                  <p className="cyber-chamfer-sm bg-primary-container/5 px-3 py-2 text-xs font-semibold text-primary-container">
                    تخفیف حدودی {comparePreview.pct}٪ · قبل: {comparePreview.label} تومان
                  </p>
                ) : null}
                {unitPreview ? (
                  <p className="cyber-chamfer-sm bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface-variant">
                    قیمت واحد ≈ {unitPreview} تومان
                  </p>
                ) : null}
              </div>
            )}
          </Section>

          <Section id="pe-media" step="۳" title="رسانه" hint="تصویر اصلی کارت محصول و گالری صفحه جزئیات">
            <MediaPickerField value={image} onChange={setImage} folder="products" label="تصویر اصلی محصول" />
            {type === "DIGITAL" ? (
              <div className="mt-4">
                <p className="mb-1.5 text-xs font-semibold text-on-surface-variant">آیکون دیجیتال</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {DIGITAL_ICONS.map((opt) => {
                    const on = icon === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setIcon(opt.value)}
                        className={`flex cursor-pointer items-center gap-2 cyber-chamfer-sm border border-outline px-3 py-2.5 text-right text-xs font-semibold transition-colors ${
                          on
                            ? "border-primary-container bg-primary-container/10 text-primary-container"
                            : "border-outline hover:border-primary-container/40"
                        }`}
                      >
                        <Icon name={opt.value} className="h-4 w-4 shrink-0" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11px] leading-5 text-on-surface-variant">
                  روی کارت‌های دیجیتال فروشگاه نمایش داده می‌شود
                </p>
              </div>
            ) : null}
          </Section>

          {type === "DIGITAL" ? (
            <Section id="pe-digital" step="۴" title="فایل‌های دیجیتال" hint="پس از خرید در «دانلودهای حساب» مشتری ظاهر می‌شوند">
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <Field label="برچسب فایل" hint="مثلاً ZIP / PDF / INO">
                  <input
                    name="fileLabel"
                    defaultValue={initial?.fileLabel ?? ""}
                    placeholder="ZIP"
                    className={inputClass()}
                  />
                </Field>
                <Field label="حجم نمایشی" hint="فقط برای نمایش؛ آپلود حجم واقعی را کنترل می‌کند">
                  <input
                    name="fileSize"
                    defaultValue={initial?.fileSize ?? ""}
                    placeholder="مثلاً ۱.۸ مگابایت"
                    className={inputClass()}
                  />
                </Field>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-on-surface-variant">
                    لیست فایل‌ها
                    {cleanFiles.length ? (
                      <span className="ms-1 tabular-nums text-primary-container">({cleanFiles.length})</span>
                    ) : null}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFiles((rows) => [...rows, { name: "", url: "" }])}
                    className="cursor-pointer text-xs font-bold text-primary-container hover:underline"
                  >
                    + فایل جدید
                  </button>
                </div>
                {!cleanFiles.length && files.every((f) => !f.name && !f.url) ? (
                  <p className="cyber-chamfer-sm border border-dashed border-outline bg-surface-container-low/40 px-3 py-3 text-[11px] leading-5 text-on-surface-variant">
                    هنوز فایلی اضافه نشده. نام و آدرس را وارد کنید یا از «آپلود فایل» استفاده کنید.
                  </p>
                ) : null}
                {files.map((row, idx) => (
                  <div key={idx} className="space-y-2 cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low/30 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field label="نام فایل">
                        <input
                          value={row.name}
                          onChange={(e) =>
                            setFiles((rows) => rows.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))
                          }
                          placeholder="مثلاً schematic-v2.zip"
                          className={inputClass()}
                        />
                      </Field>
                      <Field label="آدرس فایل">
                        <input
                          value={row.url}
                          onChange={(e) =>
                            setFiles((rows) => rows.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r)))
                          }
                          placeholder="/uploads/digital/..."
                          dir="ltr"
                          className={`${inputClass()} text-left`}
                        />
                      </Field>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline bg-surface px-3 py-1.5 text-xs font-semibold hover:border-primary-container">
                        {uploadingIdx === idx ? "در حال آپلود…" : "آپلود فایل"}
                        <input
                          type="file"
                          className="hidden"
                          accept=".zip,.pdf,.txt,.ino,.json,.md,application/zip,application/pdf,text/plain"
                          disabled={uploadingIdx !== null}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void uploadDigital(idx, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((rows) =>
                            rows.length <= 1 ? [{ name: "", url: "" }] : rows.filter((_, i) => i !== idx),
                          )
                        }
                        className="cursor-pointer alert-danger cyber-chamfer-sm px-3 py-1.5 text-xs font-semibold"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          <Section
            id="pe-desc"
            step={type === "DIGITAL" ? "۵" : "۴"}
            title="توضیحات و مشخصات"
            hint="متن صفحه محصول و جدول فنی برای مقایسه خرید"
          >
            <Field
              label="توضیحات"
              className="mb-4"
              trailing={
                <span className="text-[11px] tabular-nums text-on-surface-variant">
                  {description.length.toLocaleString("fa-IR")} کاراکتر
                </span>
              }
              hint="ویژگی‌ها، کاربرد، نکات ارسال یا سازگاری را بنویسید"
            >
              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="توضیح کامل برای صفحه محصول…"
                className={`${inputClass()} leading-7`}
              />
            </Field>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-on-surface-variant">
                جدول مشخصات
                {filledSpecs ? (
                  <span className="ms-1 tabular-nums text-primary-container">({filledSpecs} ردیف)</span>
                ) : null}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SPEC_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p.rows)}
                    className="cursor-pointer rounded-lg border border-outline px-2.5 py-1 text-[11px] font-semibold hover:border-primary-container"
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSpecs((rows) => [...rows, { key: "", value: "" }])}
                  className="cursor-pointer rounded-lg border border-primary-container/30 bg-primary-container/5 px-2.5 py-1 text-[11px] font-bold text-primary-container"
                >
                  + ردیف
                </button>
              </div>
            </div>
            {!filledSpecs ? (
              <p className="mb-2 cyber-chamfer-sm border border-dashed border-outline bg-surface-container-low/40 px-3 py-2 text-[11px] text-on-surface-variant">
                از پیش‌فرض‌ها استفاده کنید یا کلید/مقدار اضافه کنید (مثلاً ولتاژ → ۵ ولت).
              </p>
            ) : null}
            <div className="space-y-2">
              {specs.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <div>
                    <span className="mb-1 block text-[10px] font-semibold text-on-surface-variant sm:hidden">کلید</span>
                    <input
                      value={row.key}
                      onChange={(e) =>
                        setSpecs((rows) => rows.map((r, i) => (i === idx ? { ...r, key: e.target.value } : r)))
                      }
                      placeholder="کلید (مثلاً ولتاژ)"
                      aria-label="کلید مشخصات"
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-[10px] font-semibold text-on-surface-variant sm:hidden">مقدار</span>
                    <input
                      value={row.value}
                      onChange={(e) =>
                        setSpecs((rows) => rows.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)))
                      }
                      placeholder="مقدار"
                      aria-label="مقدار مشخصات"
                      className={inputClass()}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="حذف ردیف"
                    onClick={() =>
                      setSpecs((rows) => (rows.length <= 1 ? [{ key: "", value: "" }] : rows.filter((_, i) => i !== idx)))
                    }
                    className="cursor-pointer self-end alert-danger cyber-chamfer-sm px-3 py-2.5 text-sm font-semibold"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="pe-seo"
            step={type === "DIGITAL" ? "۶" : "۵"}
            title="آدرس و سئو"
            hint="اسلاگ در URL صفحه محصول؛ روی ایجاد، از عنوان ساخته می‌شود"
          >
            {mode === "edit" && isAdmin ? (
              <Field label="Slug" hint="فقط حروف، عدد و خط تیره — تغییر URL قبلی را می‌شکند">
                <input
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  dir="ltr"
                  className={`${inputClass()} text-left`}
                />
              </Field>
            ) : (
              <div className="cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low/40 px-3 py-3">
                <p className="text-xs font-semibold text-on-surface-variant">پیش‌نمایش آدرس</p>
                <p className="mt-1 break-all font-mono text-sm text-on-surface" dir="ltr">
                  /product/{slugLive}
                  {mode === "create" ? "-####" : ""}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-on-surface-variant">
                  {mode === "create"
                    ? "پس از ثبت، یک پسوند کوتاه به اسلاگ اضافه می‌شود تا یکتا بماند."
                    : "اسلاگ فعلی محصول."}
                </p>
              </div>
            )}
            {mode === "edit" && initial?.id ? (
              <p className="mt-3 text-[11px] text-on-surface-variant" dir="ltr">
                ID: {initial.id}
              </p>
            ) : null}
          </Section>

          <Section
            id="pe-display"
            step={type === "DIGITAL" ? "۷" : "۶"}
            title="نمایش در فروشگاه"
            hint="وضعیت انتشار و برچسب‌های برجسته روی کارت"
          >
            <Field label="برچسب نمایشی" className="mb-3" hint="متن کوتاه روی تصویر یا کنار عنوان">
              <input
                name="badge"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="مثلاً ارسال سریع"
                className={inputClass()}
              />
            </Field>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {BADGE_PRESETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBadge(b)}
                  className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    badge === b
                      ? "border-primary-container bg-primary-container/10 text-primary-container"
                      : "border-outline hover:border-primary-container"
                  }`}
                >
                  {b}
                </button>
              ))}
              {badge ? (
                <button
                  type="button"
                  onClick={() => setBadge("")}
                  className="cursor-pointer rounded-lg border border-outline px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant hover:border-error hover:text-error"
                >
                  پاک کردن
                </button>
              ) : null}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { key: "active", label: "فعال در فروشگاه", desc: "در کاتالوگ و جستجو دیده شود", checked: active, set: setActive },
                  { key: "isNew", label: "جدید", desc: "نشان جدید روی کارت", checked: isNew, set: setIsNew },
                  { key: "isPopular", label: "پرفروش", desc: "فیلتر و سورت پرفروش", checked: isPopular, set: setIsPopular },
                  { key: "isFeatured", label: "ویژه / ریل خانه", desc: "نمایش در صفحه اصلی", checked: isFeatured, set: setIsFeatured },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.key}
                  className={`flex cursor-pointer items-start gap-3 cyber-chamfer-sm border border-outline px-3 py-3 transition-colors ${
                    opt.checked ? "border-primary-container/50 bg-primary-container/5" : "border-outline"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={opt.checked}
                    onChange={(e) => opt.set(e.target.checked)}
                    className="mt-0.5 accent-[var(--primary-container)]"
                  />
                  <span>
                    <span className="block text-sm font-semibold">{opt.label}</span>
                    <span className="mt-0.5 block text-[11px] text-on-surface-variant">{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </Section>

          {(error || ok) && (
            <p
              role="status"
              className={`cyber-chamfer-sm border border-outline px-3 py-2 text-sm font-semibold ${
                error
                  ? "alert-danger"
                  : "border-primary-container/20 bg-primary-container/5 text-primary-container"
              }`}
            >
              {error || ok}
            </p>
          )}
        </div>

        <aside className="lg:block">
          <div className="space-y-3 lg:sticky lg:top-4">
            <div className="overflow-hidden cyber-chamfer border border-outline bg-surface-container-lowest shadow-sm">
              <div className="aspect-square bg-surface-container-low">
                {image && image !== "/placeholder.svg" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-on-surface-variant">
                    {type === "DIGITAL" ? (
                      <span className="flex h-12 w-12 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-primary-container">
                        <Icon name={(icon as IconName) || "folder_zip"} className="h-6 w-6" />
                      </span>
                    ) : null}
                    <span>بدون تصویر</span>
                    <a href="#pe-media" className="text-xs font-semibold text-primary-container hover:underline">
                      افزودن تصویر
                    </a>
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant">
                    {type === "DIGITAL" ? "دیجیتال" : "سخت‌افزار"}
                  </span>
                  {isNew ? <span className="alert-info px-1.5 py-0.5 text-[10px] font-bold">جدید</span> : null}
                  {isFeatured ? (
                    <span className="rounded-md bg-primary-container/15 px-1.5 py-0.5 text-[10px] font-bold text-primary-container">
                      ویژه
                    </span>
                  ) : null}
                  {isPopular ? (
                    <span className="alert-warn px-1.5 py-0.5 text-[10px] font-bold">پرفروش</span>
                  ) : null}
                  {badge ? (
                    <span className="rounded-md bg-primary-container/10 px-1.5 py-0.5 text-[10px] font-bold text-primary-container">
                      {badge}
                    </span>
                  ) : null}
                  {!active ? (
                    <span className="alert-danger px-1.5 py-0.5 text-[10px] font-bold">پیش‌نویس</span>
                  ) : null}
                </div>
                <p className="line-clamp-2 text-base font-bold text-on-surface">{title || "عنوان محصول"}</p>
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-sm font-bold text-primary-container">{previewPrice} تومان</p>
                  {comparePreview ? (
                    <p className="text-xs tabular-nums text-on-surface-variant line-through">{comparePreview.label}</p>
                  ) : null}
                </div>
                <p className="text-[11px] leading-5 text-on-surface-variant">
                  {selectedCategory ? categoryPath(selectedCategory.id) : "بدون دسته‌بندی"}
                  {type === "HARDWARE" && stock !== "" ? ` · موجودی ${Number(stock).toLocaleString("fa-IR")}` : ""}
                  {type === "DIGITAL" && cleanFiles.length ? ` · ${cleanFiles.length} فایل` : ""}
                  {pack > 1 ? ` · بسته ${pack}` : ""}
                </p>
                <p className="truncate font-mono text-[10px] text-on-surface-variant" dir="ltr">
                  /product/{slugLive}
                </p>
              </div>
            </div>

            <div id="pe-checklist" className="scroll-mt-28 cyber-chamfer border border-outline bg-surface-container-lowest p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-on-surface-variant">چک‌لیست انتشار</p>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    readyToPublish ? "alert-ok" : "alert-warn"
                  }`}
                >
                  {readyToPublish ? "آماده" : "ناقص"}
                </span>
              </div>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-primary-container transition-all duration-300"
                  style={{ width: `${Math.round((requiredDone / requiredTotal) * 100)}%` }}
                />
              </div>
              <ul className="space-y-1.5">
                {checklist.map((c) => (
                  <li key={c.id}>
                    <a
                      href={c.href}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                        c.done
                          ? "bg-[color:#00ff88]/10 text-[color:#00ff88]"
                          : c.required
                            ? "alert-warn"
                            : "bg-surface-container-low text-on-surface-variant"
                      }`}
                    >
                      <span>
                        {c.label}
                        {!c.required ? <span className="ms-1 font-normal opacity-70">(اختیاری)</span> : null}
                      </span>
                      <span aria-hidden>{c.done ? "✓" : c.required ? "!" : "—"}</span>
                    </a>
                  </li>
                ))}
              </ul>
              {optionalDone < 2 ? (
                <p className="mt-3 text-[11px] leading-5 text-on-surface-variant">
                  توضیح و مشخصات اختیاری‌اند ولی نرخ تبدیل را بهتر می‌کنند.
                </p>
              ) : null}
            </div>

            <div className="hidden cyber-chamfer border border-outline bg-surface-container-lowest p-4 lg:block">
              <button
                type="submit"
                disabled={saving}
                className="w-full cursor-pointer cyber-chamfer-sm bg-cta px-4 py-3 text-sm font-semibold text-on-primary transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "در حال ذخیره…" : mode === "create" ? "ثبت محصول" : "ذخیره تغییرات"}
              </button>
              <p className="mt-3 text-[11px] leading-5 text-on-surface-variant">
                تصویر در <span dir="ltr">/uploads/products</span>
                {type === "DIGITAL" ? (
                  <>
                    {" "}
                    و فایل در <span dir="ltr">/uploads/digital</span>
                  </>
                ) : null}
                .
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline bg-surface/95 p-3 backdrop-blur lg:hidden">
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-on-surface-variant">
          <span>
            الزامی {requiredDone}/{requiredTotal}
          </span>
          <span className={readyToPublish ? "font-bold text-[color:var(--accent,#00ff88)]" : "font-semibold text-primary-container"}>
            {readyToPublish ? "آماده انتشار" : "ناقص"}
          </span>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full cursor-pointer cyber-chamfer-sm bg-cta px-4 py-3 text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          {saving ? "در حال ذخیره…" : mode === "create" ? "ثبت محصول" : "ذخیره تغییرات"}
        </button>
        {(error || ok) && (
          <p className={`mt-2 text-center text-xs ${error ? "text-error" : "text-primary-container"}`}>{error || ok}</p>
        )}
      </div>
    </form>
  );
}

"use client";

import { FormEvent, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MediaPickerField } from "@/components/media-picker-field";
import { estimateReadMinutes, parseArticleBody } from "@/lib/article-content";

export type ArticleEditorValues = {
  id?: string;
  title: string;
  excerpt: string;
  category: string;
  body?: string;
  slug?: string;
  image?: string;
  published?: boolean;
  dateLabel?: string;
};

const CATEGORY_PRESETS = [
  "اینترنت اشیا",
  "آموزش کاربردی",
  "بررسی تخصصی",
  "طراحی سخت‌افزار",
  "سیستم‌عامل و لینوکس",
  "ابزار و کارگاه",
];

const BODY_SNIPPETS: { label: string; insert: string }[] = [
  { label: "سرتیتر", insert: "\n\n## عنوان بخش\n\n" },
  { label: "لیست", insert: "\n- مورد اول\n- مورد دوم\n- مورد سوم\n" },
  { label: "نکته", insert: "\n:::tip نکته\nمتن نکته مهم اینجا.\n:::\n" },
  { label: "کد", insert: "\n```c\n// نمونه کد\nint main() {\n  return 0;\n}\n```\n" },
  { label: "تصویر", insert: "\n![توضیح تصویر](/uploads/articles/example.jpg)\n" },
];

function inputClass() {
  return "w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary-container";
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
    <section id={id} className="scroll-mt-24 cyber-chamfer border border-outline bg-surface-container-lowest p-4 shadow-sm sm:p-5">
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

function BodyPreview({ body }: { body: string }) {
  const { blocks } = useMemo(() => parseArticleBody(body), [body]);
  if (!body.trim()) {
    return <p className="py-8 text-center text-sm text-on-surface-variant">هنوز متنی برای پیش‌نمایش نیست.</p>;
  }
  return (
    <div className="max-h-[420px] space-y-3 overflow-y-auto cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low/40 p-4 text-sm leading-7">
      {blocks.map((b, i) => {
        if (b.type === "heading") {
          return (
            <h3 key={i} className="text-base font-bold text-on-surface">
              {b.text}
            </h3>
          );
        }
        if (b.type === "paragraph") {
          return (
            <p key={i} className="text-on-surface-variant">
              {b.text}
            </p>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={i} className="list-disc space-y-1 pr-5 text-on-surface-variant">
              {b.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "code") {
          return (
            <pre
              key={i}
              className="overflow-x-auto cyber-chamfer-sm bg-background p-3 text-left font-mono text-[12px] text-primary-container"
              dir="ltr"
            >
              <code>{b.text}</code>
            </pre>
          );
        }
        if (b.type === "callout") {
          return (
            <div key={i} className="cyber-chamfer-sm border border-primary-container/30 bg-primary-container/5 px-3 py-2">
              <p className="text-xs font-bold text-primary-container">{b.title}</p>
              <p className="mt-1 text-on-surface-variant">{b.text}</p>
            </div>
          );
        }
        if (b.type === "figure") {
          return (
            <figure key={i} className="overflow-hidden cyber-chamfer-sm border border-outline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.src} alt={b.caption} className="max-h-40 w-full object-cover" />
              {b.caption ? <figcaption className="px-2 py-1 text-[11px] text-on-surface-variant">{b.caption}</figcaption> : null}
            </figure>
          );
        }
        return null;
      })}
    </div>
  );
}

export function ArticleEditorForm({
  mode,
  initial,
  categorySuggestions = [],
}: {
  mode: "create" | "edit";
  initial?: Partial<ArticleEditorValues>;
  categorySuggestions?: string[];
}) {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);
  const [bodyMode, setBodyMode] = useState<"write" | "preview">("write");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [dateLabel, setDateLabel] = useState(
    initial?.dateLabel ?? new Date().toLocaleDateString("fa-IR"),
  );
  const [body, setBody] = useState(initial?.body ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);

  const categories = useMemo(() => {
    const set = new Set([...CATEGORY_PRESETS, ...categorySuggestions, category].filter(Boolean));
    return Array.from(set);
  }, [categorySuggestions, category]);

  const charCount = body.length;
  const excerptCount = excerpt.length;
  const readMins = estimateReadMinutes(body || excerpt);
  const slugPreview = slug.trim() || "slug-auto";

  const checklist = useMemo(
    () => [
      { id: "title", label: "عنوان", done: title.trim().length >= 3, href: "#ae-content" },
      { id: "category", label: "دسته", done: category.trim().length >= 2, href: "#ae-content" },
      { id: "excerpt", label: "خلاصه", done: excerpt.trim().length >= 3, href: "#ae-content" },
      { id: "body", label: "متن", done: body.trim().length >= 40, href: "#ae-body" },
      { id: "cover", label: "کاور", done: !!image, href: "#ae-media" },
    ],
    [title, category, excerpt, body, image],
  );
  const doneCount = checklist.filter((c) => c.done).length;

  function insertSnippet(snippet: string) {
    const el = bodyRef.current;
    if (!el) {
      setBody((b) => `${b}${snippet}`);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + snippet + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setOk("");
    const payload = {
      id: initial?.id,
      title,
      excerpt,
      category,
      body,
      slug: slug || undefined,
      image: image || "",
      published,
      dateLabel: dateLabel || undefined,
    };

    const res = await fetch("/api/admin/articles", {
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
    setOk(mode === "create" ? "مقاله ثبت شد" : "تغییرات ذخیره شد");
    if (mode === "create") {
      router.push(`/admin/articles/${data.article.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative pb-28 lg:pb-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/articles" className="font-semibold text-primary-container hover:underline">
            ← لیست مقالات
          </Link>
          <Link href="/articles" className="font-semibold text-on-surface-variant hover:text-primary-container">
            آرشیو سایت
          </Link>
          {mode === "edit" && initial?.slug ? (
            <Link
              href={`/articles/${initial.slug}`}
              className="font-semibold text-on-surface-variant hover:text-primary-container"
            >
              صفحه عمومی
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="font-semibold text-on-surface">
            {doneCount}/{checklist.length}
          </span>
          تکمیل
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-primary-container transition-all"
              style={{ width: `${Math.round((doneCount / checklist.length) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Section id="ae-content" step="۱" title="محتوا" hint="عنوان، دسته و خلاصه‌ای که در کارت و سئو دیده می‌شود">
            <div className="space-y-3">
              <Field label="عنوان">
                <input
                  name="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً راهنمای شروع با ESP32 و MQTT"
                  className={inputClass()}
                />
              </Field>

              <div>
                <p className="mb-1.5 text-xs font-semibold text-on-surface-variant">دسته محتوا</p>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {categories.slice(0, 10).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        category === c
                          ? "border-primary-container bg-cta text-on-primary"
                          : "border-outline bg-surface-container-low hover:border-primary-container"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <input
                  name="category"
                  required
                  list="article-category-list"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="یا دسته جدید بنویسید"
                  className={inputClass()}
                />
                <datalist id="article-category-list">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Slug" hint="خالی = ساخت خودکار از عنوان">
                  <input
                    name="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    dir="ltr"
                    placeholder="optional-slug"
                    className={`${inputClass()} text-left`}
                  />
                </Field>
                <Field
                  label="برچسب تاریخ"
                  trailing={
                    <button
                      type="button"
                      onClick={() => setDateLabel(new Date().toLocaleDateString("fa-IR"))}
                      className="text-[11px] font-semibold text-primary-container hover:underline"
                    >
                      امروز
                    </button>
                  }
                  hint="روی کارت مقاله نمایش داده می‌شود"
                >
                  <input
                    name="dateLabel"
                    value={dateLabel}
                    onChange={(e) => setDateLabel(e.target.value)}
                    className={inputClass()}
                  />
                </Field>
              </div>

              <Field
                label="خلاصه"
                trailing={
                  <span className="text-[11px] tabular-nums text-on-surface-variant">
                    {excerptCount.toLocaleString("fa-IR")} کاراکتر
                  </span>
                }
                hint="یک یا دو جمله برای کارت لیست و توضیحات کوتاه"
              >
                <textarea
                  name="excerpt"
                  required
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="مثلاً در این راهنما اتصال ESP32 به بروکر MQTT را قدم‌به‌قدم یاد می‌گیرید."
                  className={`${inputClass()} leading-7`}
                />
              </Field>

              <div className="cyber-chamfer-sm border border-dashed border-outline bg-surface-container-low/50 px-3 py-2.5 text-[11px] text-on-surface-variant">
                آدرس پیشنهادی:{" "}
                <span className="font-semibold text-on-surface" dir="ltr">
                  /articles/{slugPreview}
                </span>
              </div>
            </div>
          </Section>

          <Section id="ae-body" step="۲" title="متن مقاله" hint="مارک‌داون ساده: ## سرتیتر، - لیست، ``` کد، :::tip نکته">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {BODY_SNIPPETS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      setBodyMode("write");
                      insertSnippet(s.insert);
                    }}
                    className="rounded-lg border border-outline px-2.5 py-1 text-[11px] font-semibold hover:border-primary-container"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex cyber-chamfer-sm border border-outline p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBodyMode("write")}
                  className={`rounded-lg px-3 py-1.5 ${bodyMode === "write" ? "bg-cta text-on-primary" : ""}`}
                >
                  نوشتن
                </button>
                <button
                  type="button"
                  onClick={() => setBodyMode("preview")}
                  className={`rounded-lg px-3 py-1.5 ${bodyMode === "preview" ? "bg-cta text-on-primary" : ""}`}
                >
                  پیش‌نمایش
                </button>
              </div>
            </div>

            {bodyMode === "write" ? (
              <Field
                label="بدنه"
                trailing={
                  <span className="text-[11px] text-on-surface-variant">
                    {charCount.toLocaleString("fa-IR")} کاراکتر · حدود {readMins} دقیقه مطالعه
                  </span>
                }
              >
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={14}
                  placeholder={"## مقدمه\n\nمتن کامل مقاله…\n\n- نکته ۱\n- نکته ۲"}
                  className={`${inputClass()} min-h-[280px] font-mono text-[13px] leading-7`}
                  dir="rtl"
                />
              </Field>
            ) : (
              <BodyPreview body={body} />
            )}
          </Section>

          <Section id="ae-media" step="۳" title="رسانه" hint="کاور ۱۶:۱۰ برای کارت لیست و هدر صفحه مقاله">
            <MediaPickerField value={image} onChange={setImage} folder="articles" label="تصویر کاور" />
          </Section>

          <Section id="ae-publish" step="۴" title="انتشار">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPublished(true)}
                className={`cyber-chamfer-sm border px-3.5 py-3 text-right transition-colors ${
                  published
                    ? "border-[color:#00ff88]/40 bg-[color:#00ff88]/10"
                    : "border-outline hover:border-primary-container/40"
                }`}
              >
                <span className="block text-sm font-bold">منتشر در سایت</span>
                <span className="mt-1 block text-[11px] text-on-surface-variant">در آرشیو و صفحه اصلی دیده می‌شود</span>
              </button>
              <button
                type="button"
                onClick={() => setPublished(false)}
                className={`cyber-chamfer-sm border px-3.5 py-3 text-right transition-colors ${
                  !published
                    ? "alert-warn"
                    : "border-outline hover:border-primary-container/40"
                }`}
              >
                <span className="block text-sm font-bold">پیش‌نویس</span>
                <span className="mt-1 block text-[11px] text-on-surface-variant">فقط در پنل ادمین قابل مشاهده</span>
              </button>
            </div>
          </Section>

          {(error || ok) && (
            <p
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

        <aside>
          <div className="space-y-3 lg:sticky lg:top-4">
            <div className="overflow-hidden cyber-chamfer border border-outline bg-surface-container-lowest shadow-sm">
              <p className="border-b border-outline/70 px-3 py-2 text-[11px] font-bold text-on-surface-variant">
                پیش‌نمایش کارت
              </p>
              <div className="aspect-[16/10] bg-surface-container-low">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 text-sm text-on-surface-variant">
                    <span>بدون کاور</span>
                    <a href="#ae-media" className="text-xs font-semibold text-primary-container hover:underline">
                      افزودن کاور
                    </a>
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant">
                    {category || "بدون دسته"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      published ? "alert-ok" : "alert-warn"
                    }`}
                  >
                    {published ? "منتشر" : "پیش‌نویس"}
                  </span>
                </div>
                <p className="line-clamp-2 text-base font-bold">{title || "عنوان مقاله"}</p>
                <p className="line-clamp-3 text-sm leading-6 text-on-surface-variant">
                  {excerpt || "خلاصه مقاله…"}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {dateLabel || "—"} · {readMins} دقیقه مطالعه
                </p>
              </div>
            </div>

            <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-4">
              <p className="mb-2 text-xs font-bold text-on-surface-variant">چک‌لیست انتشار</p>
              <ul className="space-y-1.5">
                {checklist.map((c) => (
                  <li key={c.id}>
                    <a
                      href={c.href}
                      className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                        c.done ? "bg-[color:#00ff88]/10 text-[color:#00ff88]" : "bg-surface-container-low text-on-surface-variant"
                      }`}
                    >
                      <span>{c.label}</span>
                      <span>{c.done ? "✓" : "—"}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden cyber-chamfer border border-outline bg-surface-container-lowest p-4 lg:block">
              <button
                type="submit"
                disabled={saving}
                className="w-full cyber-chamfer-sm bg-cta px-4 py-3 text-sm font-semibold text-on-primary disabled:opacity-60"
              >
                {saving ? "در حال ذخیره…" : mode === "create" ? "ثبت مقاله" : "ذخیره تغییرات"}
              </button>
              <p className="mt-3 text-[11px] leading-5 text-on-surface-variant">
                وضعیت فعلی: <span className="font-semibold text-on-surface">{published ? "منتشر" : "پیش‌نویس"}</span>
                <br />
                کاور در <span dir="ltr">/uploads/articles</span> ذخیره می‌شود.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline bg-surface/95 p-3 backdrop-blur lg:hidden">
        <div className="mb-2 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>
            {doneCount}/{checklist.length} تکمیل
          </span>
          <span>{published ? "منتشر" : "پیش‌نویس"}</span>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full cyber-chamfer-sm bg-cta px-4 py-3 text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          {saving ? "در حال ذخیره…" : mode === "create" ? "ثبت مقاله" : "ذخیره تغییرات"}
        </button>
      </div>
    </form>
  );
}

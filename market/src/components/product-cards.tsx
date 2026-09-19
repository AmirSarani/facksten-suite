"use client";

import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Icon } from "@/components/icon";
import { formatToman } from "@/lib/format";

export type CardProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  type: "HARDWARE" | "DIGITAL";
  inStock: boolean;
  image: string;
  brand?: string | null;
  icon?: string | null;
  fileLabel?: string | null;
  fileSize?: string | null;
  badge?: string | null;
};

/** Compact RTL spotlight for home “feature” rails — fixed height, no empty vertical column. */
export function HomeFeaturedCard({
  product,
  eyebrow = "پیشنهاد ویژه",
}: {
  product: CardProduct;
  eyebrow?: string;
}) {
  return (
    <article className="product-card group relative overflow-hidden cyber-chamfer bg-surface-container-lowest border border-outline shadow-[var(--box-shadow-neon-sm)]  transition-shadow duration-200 hover:shadow-[var(--box-shadow-neon)]">
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:h-[200px] lg:h-[216px]">
        <Link
          href={`/product/${product.slug}`}
          prefetch
          className="relative flex min-h-[168px] cursor-pointer items-center justify-center overflow-hidden bg-surface-container-low sm:min-h-0"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 70% 40%, rgba(255,122,0,0.12), transparent 55%)",
            }}
          />
          {product.badge ? (
            <span className="absolute top-3 right-3 z-10 cyber-chamfer-sm bg-cta px-2.5 py-1 text-[11px] font-bold shadow-sm">
              {product.badge}
            </span>
          ) : null}
          {!product.inStock ? (
            <span className="absolute top-3 left-3 z-10 cyber-chamfer-sm bg-error-container px-2.5 py-1 text-[11px] font-bold text-error">
              ناموجود
            </span>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.title}
            className={`relative z-[1] max-h-[148px] w-auto max-w-[88%] object-contain p-2 transition-transform duration-300 group-hover:scale-[1.04] sm:max-h-[180px] lg:max-h-[192px] ${
              product.inStock ? "" : "opacity-50"
            }`}
            loading="lazy"
          />
        </Link>

        <div className="flex flex-col justify-center gap-2.5 border-t border-surface-variant/70 p-4 sm:border-t-0 sm:border-s sm:px-5 sm:py-4 lg:px-6">
          <p className="text-[11px] font-bold tracking-wide text-primary-container">{eyebrow}</p>
          <Link href={`/product/${product.slug}`} prefetch className="focus-cta cursor-pointer">
            <h3 className="line-clamp-2 text-base font-bold text-on-surface text-balance sm:text-lg">
              {product.title}
            </h3>
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-0.5">
            <p
              className={`text-xl font-extrabold ${
                product.inStock ? "text-on-surface" : "text-on-surface-variant"
              }`}
            >
              {formatToman(product.price)}{" "}
              <span className="text-xs font-normal text-on-surface-variant">تومان</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <AddToCartButton
              productId={product.id}
              inStock={product.inStock}
              label="افزودن به سبد"
              className={
                product.inStock
                  ? "bg-cta focus-cta inline-flex cursor-pointer items-center justify-center gap-1.5 cyber-chamfer-sm px-4 py-2.5 text-sm font-semibold transition-colors duration-200"
                  : "inline-flex cursor-not-allowed items-center justify-center gap-1.5 cyber-chamfer-sm bg-surface-container px-4 py-2.5 text-sm font-semibold text-on-surface-variant"
              }
            />
            <Link
              href={`/product/${product.slug}`}
              prefetch
              className="focus-cta inline-flex min-h-10 cursor-pointer items-center gap-1 cyber-chamfer-sm px-3 py-2 text-sm font-semibold text-primary-container transition-colors duration-200 hover:bg-primary-container/10"
            >
              جزئیات
              <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Shop grid card — Desktop\\a product-card */
export function HardwareProductCard({
  product,
  variant = "shop",
}: {
  product: CardProduct;
  variant?: "shop" | "home";
  /** @deprecated unused — use HomeFeaturedCard */
  featured?: boolean;
}) {
  if (variant === "home") {
    return (
      <article className="product-card group flex h-full flex-col overflow-hidden cyber-chamfer-sm bg-surface-container-lowest transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        <Link
          href={`/product/${product.slug}`}
          prefetch
          className="relative flex aspect-square items-center justify-center overflow-hidden bg-surface-container-low"
        >
          {!product.inStock && (
            <span className="absolute top-2 right-2 z-10 cyber-chamfer-sm bg-error-container px-2 py-1 text-[10px] font-bold text-error">
              ناموجود
            </span>
          )}
          {product.badge && product.inStock && (
            <span className="absolute top-2 right-2 z-10 cyber-chamfer-sm bg-cta px-2 py-1 text-[10px] font-bold">
              {product.badge}
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.title}
            className={`h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03] ${
              product.inStock ? "" : "opacity-50"
            }`}
            loading="lazy"
          />
        </Link>
        <div className="flex flex-1 flex-col p-3">
          <Link href={`/product/${product.slug}`} prefetch className="cursor-pointer">
            <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-on-surface">{product.title}</h3>
          </Link>
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <span
              className={`text-lg font-bold ${product.inStock ? "text-on-surface" : "text-on-surface-variant"}`}
            >
              {formatToman(product.price)}{" "}
              <span className="text-xs font-normal text-on-surface-variant">تومان</span>
            </span>
            <AddToCartButton productId={product.id} inStock={product.inStock} round />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="product-card group relative flex flex-col overflow-hidden cyber-chamfer-sm border border-surface-variant bg-surface-container-lowest shadow-sm">
      <Link
        href={`/product/${product.slug}`}
        prefetch
        className="relative block aspect-square overflow-hidden bg-surface-container-low"
      >
        {product.badge && product.inStock && (
          <span className="absolute top-2 right-2 z-10 cyber-chamfer-sm bg-primary-container px-2 py-1 text-[10px] font-bold text-on-primary">
            {product.badge}
          </span>
        )}
        {!product.inStock && (
          <span className="absolute top-2 left-2 z-10 cyber-chamfer-sm bg-error-container px-2 py-1 text-[10px] font-bold text-error">
            ناموجود
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.title}
          className={`absolute inset-0 h-full w-full object-cover p-3 ${product.inStock ? "" : "opacity-50"}`}
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
          <span className="translate-y-4 rounded-full bg-primary p-2 text-on-primary shadow-lg transition-transform group-hover:translate-y-0">
            <Icon name="shopping_cart" className="h-5 w-5" />
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3">
        {product.brand && (
          <div className="mb-1 text-[10px] font-medium tracking-wide text-on-surface-variant">{product.brand}</div>
        )}
        <Link href={`/product/${product.slug}`} prefetch>
          <h3 className="mb-2 line-clamp-2 text-sm leading-tight font-semibold text-on-surface">{product.title}</h3>
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-xl font-bold text-primary-container">
            {formatToman(product.price)}
            <span className="mr-1 text-xs font-normal text-on-surface-variant">تومان</span>
          </span>
          <AddToCartButton productId={product.id} inStock={product.inStock} round />
        </div>
      </div>
    </article>
  );
}

export function DigitalProductCard({
  product,
  variant = "shop",
}: {
  product: CardProduct;
  variant?: "shop" | "home";
  /** @deprecated unused — use HomeFeaturedCard */
  featured?: boolean;
}) {
  const media = (
    <Link
      href={`/product/${product.slug}`}
      prefetch
      className={
        variant === "home"
          ? "relative flex aspect-square items-center justify-center overflow-hidden bg-surface-container-low"
          : "relative block aspect-square overflow-hidden bg-surface-container-low"
      }
    >
      {/* Badge lives only on the media — never over the title block */}
      {product.badge ? (
        <span className="absolute top-2 right-2 z-10 flex items-center gap-1 cyber-chamfer-sm bg-cta px-2 py-1 text-[10px] font-bold">
          <Icon name="new_releases" className="h-3.5 w-3.5" />
          {product.badge}
        </span>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.image || "/placeholder.svg"}
        alt={product.title}
        className={
          variant === "home"
            ? "h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
            : "absolute inset-0 h-full w-full object-cover p-3"
        }
        loading="lazy"
      />
      {variant === "shop" && (product.fileLabel || product.fileSize) ? (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 cyber-chamfer-sm bg-surface-container-lowest/95 px-2 py-1 text-[10px] font-semibold text-on-surface-variant shadow-sm backdrop-blur-sm">
          <Icon name={(product.icon as "folder_zip") || "folder_zip"} className="h-3.5 w-3.5 text-primary-container" />
          {product.fileLabel}
          {product.fileSize ? ` · ${product.fileSize}` : ""}
        </div>
      ) : null}
    </Link>
  );

  if (variant === "home") {
    return (
      <article className="product-card group flex h-full flex-col overflow-hidden cyber-chamfer-sm bg-surface-container-lowest transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        {media}
        <div className="flex flex-1 flex-col p-3">
          <Link href={`/product/${product.slug}`} prefetch className="cursor-pointer">
            <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-on-surface">{product.title}</h3>
          </Link>
          {(product.fileLabel || product.fileSize) && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
              {product.fileLabel ? (
                <span className="rounded bg-surface-container-high px-2 py-0.5">{product.fileLabel}</span>
              ) : null}
              {product.fileLabel && product.fileSize ? <span>•</span> : null}
              {product.fileSize ? <span>{product.fileSize}</span> : null}
            </div>
          )}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <span className="text-lg font-bold text-on-surface">
              {formatToman(product.price)}{" "}
              <span className="text-xs font-normal text-on-surface-variant">تومان</span>
            </span>
            <AddToCartButton productId={product.id} inStock={product.inStock} label="افزودن" round />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="product-card group flex flex-col overflow-hidden cyber-chamfer-sm border border-surface-variant bg-surface-container-lowest shadow-sm">
      {media}
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/product/${product.slug}`} prefetch>
          <h3 className="mb-2 line-clamp-2 text-sm leading-tight font-semibold text-on-surface">{product.title}</h3>
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-xl font-bold text-primary-container">
            {formatToman(product.price)}
            <span className="mr-1 text-xs font-normal text-on-surface-variant">تومان</span>
          </span>
          <AddToCartButton productId={product.id} inStock={product.inStock} round />
        </div>
      </div>
    </article>
  );
}

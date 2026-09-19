"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { allProducts, articles } from "@/lib/data";

/** Warm the App Router cache so first clicks feel instant in dev/prod */
const ROUTES = [
  "/",
  "/shop",
  "/shop?type=hardware",
  "/shop?type=digital",
  "/search",
  "/cart",
  "/articles",
  "/about",
  "/contact",
  "/faq",
  "/compare",
  "/login",
  "/account/orders",
  ...allProducts.map((p) => `/product/${p.slug}`),
  ...articles.map((a) => `/articles/${a.slug}`),
];

export function RouteWarmer() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const run = () => {
      if (cancelled) return;
      for (const href of ROUTES) {
        router.prefetch(href);
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(run, { timeout: 1500 });
    } else {
      timeoutId = setTimeout(run, 400);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [router]);

  return null;
}

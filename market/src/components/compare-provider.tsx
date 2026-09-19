"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "facksten_compare_items";
const MAX = 4;

export type CompareItem = { slug: string; title?: string; image?: string };

type CompareCtx = {
  items: CompareItem[];
  slugs: string[];
  toggle: (item: CompareItem | string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
  ready: boolean;
};

const Ctx = createContext<CompareCtx | null>(null);

function normalize(input: CompareItem | string): CompareItem {
  return typeof input === "string" ? { slug: input } : input;
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CompareItem[] | string[];
        if (Array.isArray(parsed) && parsed.length) {
          setItems(
            parsed.map((p) => (typeof p === "string" ? { slug: p } : { slug: p.slug, title: p.title, image: p.image })),
          );
        }
      } else {
        const legacy = localStorage.getItem("facksten_compare_slugs");
        if (legacy) {
          const slugs = JSON.parse(legacy) as string[];
          setItems(slugs.map((slug) => ({ slug })));
        }
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const toggle = useCallback((input: CompareItem | string) => {
    const next = normalize(input);
    setItems((prev) => {
      if (prev.some((p) => p.slug === next.slug)) return prev.filter((p) => p.slug !== next.slug);
      if (prev.length >= MAX) return prev;
      return [...prev, next];
    });
  }, []);

  const remove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((p) => p.slug !== slug));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const has = useCallback((slug: string) => items.some((p) => p.slug === slug), [items]);
  const slugs = useMemo(() => items.map((i) => i.slug), [items]);

  const value = useMemo(
    () => ({ items, slugs, toggle, remove, clear, has, ready }),
    [items, slugs, toggle, remove, clear, has, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompare() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCompare requires CompareProvider");
  return ctx;
}

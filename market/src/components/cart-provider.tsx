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

type CartContextValue = {
  count: number;
  refresh: () => Promise<void>;
  addProductId: (productId: string, qty?: number) => Promise<{ ok: boolean; error?: string }>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) {
        setCount(0);
        return;
      }
      const data = await res.json();
      const n = (data.items ?? []).reduce((s: number, i: { qty: number }) => s + i.qty, 0);
      setCount(n);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addProductId = useCallback(
    async (productId: string, qty = 1) => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qty }),
      });
      if (res.status === 401) {
        return { ok: false, error: "login" };
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error ?? "error" };
      }
      await refresh();
      return { ok: true };
    },
    [refresh],
  );

  const value = useMemo(() => ({ count, refresh, addProductId }), [count, refresh, addProductId]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

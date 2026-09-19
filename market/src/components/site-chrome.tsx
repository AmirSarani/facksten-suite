"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { CompareBar } from "@/components/compare-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, type HeaderCategory } from "@/components/site-header";

function isBareChromePath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/account")
  );
}

export function SiteChrome({
  children,
  categories,
  contact,
}: {
  children: React.ReactNode;
  categories: HeaderCategory[];
  contact?: { phone: string; email: string; address: string };
}) {
  const pathname = usePathname() || "/";
  const bare = isBareChromePath(pathname);

  return (
    <>
      {!bare ? (
        <Suspense fallback={<div className="h-[7.5rem] border-b border-surface-variant/70 bg-surface-container-lowest" />}>
          <SiteHeader categories={categories} />
        </Suspense>
      ) : null}
      <main className="min-w-0 max-w-full flex-1 overflow-x-hidden">{children}</main>
      {!bare ? (
        <>
          <SiteFooter contact={contact} />
          <CompareBar />
        </>
      ) : null}
    </>
  );
}

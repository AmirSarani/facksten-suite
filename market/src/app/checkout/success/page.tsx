import Link from "next/link";
import { Icon } from "@/components/icon";

type Props = { searchParams: Promise<{ code?: string }> };
export const metadata = { title: "سفارش ثبت شد" };

export default async function SuccessPage({ searchParams }: Props) {
  const { code } = await searchParams;
  return (
    <div className="mx-auto max-w-[640px] px-margin-mobile py-20 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center cyber-chamfer bg-primary-container/15 text-primary-container shadow-[var(--box-shadow-neon-sm)]">
        <Icon name="check_circle" className="h-10 w-10" />
      </div>
      <h1 className="font-mono text-3xl font-bold uppercase tracking-wide">سفارش شما ثبت شد</h1>
      <p className="mt-3 text-on-surface-variant">
        شماره پیگیری: <span dir="ltr">{code ?? "—"}</span>
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/account/orders" className="bg-cta focus-cta cyber-chamfer-sm px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon-sm)]">
          پیگیری سفارش
        </Link>
        <Link href="/account/downloads" className="cyber-chamfer-sm border border-outline px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wide transition-colors hover:border-primary-container hover:text-primary-container">
          دانلودها
        </Link>
      </div>
    </div>
  );
}

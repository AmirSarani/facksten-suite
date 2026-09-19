import type { Metadata } from "next";
import { Icon } from "@/components/icon";

export const metadata: Metadata = {
  title: "گارانتی و اصالت",
  description: "ضمانت اصالت و سلامت فیزیکی کالاهای فکستن",
};

export default function WarrantyPage() {
  return (
    <main className="cyber-grid mx-auto max-w-3xl px-margin-mobile py-10 md:px-margin-desktop">
      <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-8 shadow-[var(--box-shadow-neon-sm)]">
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary-container">policy://warranty</p>
        <h1 className="font-mono text-3xl font-bold uppercase tracking-wide text-on-surface">گارانتی و اصالت</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-on-surface-variant">
          <p className="flex items-start gap-2">
            <Icon name="verified_user" className="mt-0.5 h-4 w-4 shrink-0 text-primary-container" />
            فکستن اصالت و سلامت فیزیکی کالاهای سخت‌افزاری را تضمین می‌کند.
          </p>
          <p>در صورت دریافت کالای معیوب یا مغایر، تا ۷ روز کاری امکان تعویض یا مرجوعی وجود دارد.</p>
          <p className="alert-ok cyber-chamfer-sm p-4 text-sm leading-7">
            گارانتی عملکرد بلندمدت قطعات مصرفی و نیمه‌هادی طبق عرف بازار قطعات الکترونیک است و در صفحه هر کالا جزئیات ذکر می‌شود.
          </p>
        </div>
      </div>
    </main>
  );
}

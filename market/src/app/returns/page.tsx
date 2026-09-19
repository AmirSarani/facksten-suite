import type { Metadata } from "next";
import { Icon } from "@/components/icon";

export const metadata: Metadata = {
  title: "مرجوعی کالا",
  description: "شرایط مرجوعی و تعویض کالای فکستن",
};

export default function ReturnsPage() {
  return (
    <main className="cyber-grid mx-auto max-w-3xl px-margin-mobile py-10 md:px-margin-desktop">
      <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-8 shadow-[var(--box-shadow-neon-sm)]">
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary-container">policy://returns</p>
        <h1 className="font-mono text-3xl font-bold uppercase tracking-wide text-on-surface">مرجوعی کالا</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-on-surface-variant">
          <p>کالاهای سخت‌افزاری پلمب‌نشده تا ۷ روز کاری در صورت ایراد فنی یا مغایرت قابل مرجوعی هستند.</p>
          <p className="alert-warn cyber-chamfer-sm p-4 text-sm leading-7">
            محصولات دیجیتال پس از دانلود معمولاً قابل مرجوعی نیستند، مگر نقص فایل اثبات شود.
          </p>
          <p className="flex items-start gap-2">
            <Icon name="support_agent" className="mt-0.5 h-4 w-4 shrink-0 text-primary-container" />
            برای ثبت درخواست مرجوعی از بخش تیکت پشتیبانی اقدام کنید و کد سفارش را ذکر کنید.
          </p>
        </div>
      </div>
    </main>
  );
}

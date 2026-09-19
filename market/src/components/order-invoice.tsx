"use client";

import { ORDER_STATUS_FA } from "@/lib/panel";
import { formatToman } from "@/lib/format";

export type InvoiceOrder = {
  code: string;
  createdAt: string;
  status: string;
  total: number;
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddr?: string | null;
  paymentMethod?: string | null;
  user?: { name: string; email: string } | null;
  items: { title: string; price: number; qty: number; type: string }[];
};

export function OrderInvoice({ order }: { order: InvoiceOrder }) {
  return (
    <div className="print-invoice cyber-chamfer border border-outline bg-surface-container-lowest p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xl font-black text-primary">Facksten</p>
          <p className="text-sm text-on-surface-variant">فاکتور فروش</p>
        </div>
        <div className="text-left text-sm">
          <p dir="ltr" className="font-bold">
            {order.code}
          </p>
          <p>{new Date(order.createdAt).toLocaleDateString("fa-IR")}</p>
          <p>{ORDER_STATUS_FA[order.status] ?? order.status}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <p className="font-semibold">خریدار</p>
          <p>{order.shippingName || order.user?.name || "—"}</p>
          <p className="text-on-surface-variant" dir="ltr">
            {order.shippingPhone || order.user?.email || ""}
          </p>
        </div>
        <div>
          <p className="font-semibold">آدرس ارسال</p>
          <p className="text-on-surface-variant">{order.shippingAddr || "—"}</p>
          <p className="mt-1 text-on-surface-variant">پرداخت: {order.paymentMethod || "—"}</p>
        </div>
      </div>

      <table className="mb-6 w-full text-sm">
        <thead>
          <tr className="border-b border-outline text-on-surface-variant">
            <th className="py-2 text-right font-normal">کالا</th>
            <th className="py-2 text-right font-normal">تعداد</th>
            <th className="py-2 text-right font-normal">قیمت</th>
            <th className="py-2 text-right font-normal">جمع</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i, idx) => (
            <tr key={idx} className="border-b border-outline/60">
              <td className="py-2">{i.title}</td>
              <td className="py-2">{i.qty}</td>
              <td className="py-2">{formatToman(i.price)}</td>
              <td className="py-2">{formatToman(i.price * i.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">با تشکر از خرید شما</p>
        <p className="text-lg font-bold">جمع کل: {formatToman(order.total)} تومان</p>
      </div>

      <div className="mt-6 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
        >
          چاپ فاکتور
        </button>
      </div>
    </div>
  );
}

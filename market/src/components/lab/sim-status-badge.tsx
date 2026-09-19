import { SIM_STATUS_LABEL } from "@/lab/registry";
import type { SimulationStatus } from "@/lab/types";

const COLORS: Record<SimulationStatus, string> = {
  simulated: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
  wireable: "border-amber-500/50 text-amber-300 bg-amber-500/10",
  "3d-only": "border-slate-500/50 text-slate-300 bg-slate-500/10",
};

export function SimStatusBadge({ status }: { status: SimulationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${COLORS[status]}`}
    >
      {SIM_STATUS_LABEL[status] ?? status}
    </span>
  );
}

import { SIM_STATUS_LABEL } from "@/lab/registry";
import type { SimulationStatus } from "@/lab/types";

// Same colour language as the /lab parts catalog legend
const COLORS: Record<SimulationStatus, string> = {
  simulated: "border-accent-tertiary/50 text-accent-tertiary bg-accent-tertiary/10",
  wireable: "border-primary-container/50 text-primary-container bg-primary-container/10",
  "3d-only": "border-outline text-on-surface-variant bg-surface-container",
};

export function SimStatusBadge({ status }: { status: SimulationStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${COLORS[status]}`}>
      {SIM_STATUS_LABEL[status] ?? status}
    </span>
  );
}

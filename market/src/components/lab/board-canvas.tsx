"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ComponentDef, LabProject, PlacedPart, WireDef } from "@/lab/types";
import { canConnectPins, suggestWireColor } from "@/lab/wiring/validate";

type Props = {
  project: LabProject;
  components: ComponentDef[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMovePart: (instanceId: string, x: number, y: number) => void;
  onAddWire: (wire: WireDef) => void;
  onDeleteSelected: () => void;
  ledOn: boolean;
  simpleMode: boolean;
  onWireBlocked: (message: string) => void;
};

function defFor(part: PlacedPart, map: Map<string, ComponentDef>) {
  return map.get(part.componentId);
}

export function BoardCanvas({
  project,
  components,
  selectedId,
  onSelect,
  onMovePart,
  onAddWire,
  onDeleteSelected,
  ledOn,
  simpleMode,
  onWireBlocked,
}: Props) {
  const map = useMemo(() => new Map(components.map((c) => [c.id, c])), [components]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [wireFrom, setWireFrom] = useState<{ instanceId: string; pinId: string } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [panning, setPanning] = useState<{ x: number; y: number; px: number; py: number } | null>(null);

  const toLocal = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom],
  );

  const pinAbs = (part: PlacedPart, pinId: string) => {
    const d = defFor(part, map);
    const pin = d?.pins.find((p) => p.id === pinId);
    if (!pin) return { x: part.x, y: part.y };
    return { x: part.x + pin.x, y: part.y + pin.y };
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded border border-outline bg-[#0d0d14]">
      <div className="absolute start-2 top-2 z-10 flex gap-1">
        <button
          type="button"
          className="rounded bg-surface-container px-2 py-1 text-xs"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
        >
          +
        </button>
        <button
          type="button"
          className="rounded bg-surface-container px-2 py-1 text-xs"
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
        >
          −
        </button>
        <button
          type="button"
          className="rounded bg-surface-container px-2 py-1 text-xs"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          Reset
        </button>
      </div>
      <svg
        ref={svgRef}
        className="h-full w-full touch-none"
        onWheel={(e) => {
          e.preventDefault();
          setZoom((z) => Math.min(2.5, Math.max(0.4, z - e.deltaY * 0.001)));
        }}
        onMouseDown={(e) => {
          if (e.button === 1 || (e.button === 0 && e.altKey)) {
            setPanning({ x: pan.x, y: pan.y, px: e.clientX, py: e.clientY });
          } else if (e.target === svgRef.current) {
            onSelect(null);
            setWireFrom(null);
          }
        }}
        onMouseMove={(e) => {
          const loc = toLocal(e.clientX, e.clientY);
          setCursor(loc);
          if (panning) {
            setPan({
              x: panning.x + (e.clientX - panning.px),
              y: panning.y + (e.clientY - panning.py),
            });
          }
          if (drag) {
            onMovePart(drag.id, loc.x - drag.ox, loc.y - drag.oy);
          }
        }}
        onMouseUp={() => {
          setDrag(null);
          setPanning(null);
        }}
        onMouseLeave={() => {
          setDrag(null);
          setPanning(null);
          setCursor(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Delete" || e.key === "Backspace") onDeleteSelected();
        }}
        tabIndex={0}
      >
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          <defs>
            <pattern id="lab-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1c1c2e" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x={-2000} y={-2000} width={6000} height={6000} fill="url(#lab-grid)" />

          {/* wires */}
          {project.wires.map((w) => {
            const fromPart = project.parts.find((p) => p.instanceId === w.from.instanceId);
            const toPart = project.parts.find((p) => p.instanceId === w.to.instanceId);
            if (!fromPart || !toPart) return null;
            const a = pinAbs(fromPart, w.from.pinId);
            const b = pinAbs(toPart, w.to.pinId);
            const midX = (a.x + b.x) / 2;
            return (
              <path
                key={w.id}
                d={`M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`}
                stroke={w.color}
                strokeWidth={selectedId === w.id ? 3.5 : 2.2}
                fill="none"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(w.id);
                }}
              />
            );
          })}

          {wireFrom && cursor && (
            <line
              x1={(() => {
                const p = project.parts.find((x) => x.instanceId === wireFrom.instanceId);
                return p ? pinAbs(p, wireFrom.pinId).x : 0;
              })()}
              y1={(() => {
                const p = project.parts.find((x) => x.instanceId === wireFrom.instanceId);
                return p ? pinAbs(p, wireFrom.pinId).y : 0;
              })()}
              x2={cursor.x}
              y2={cursor.y}
              stroke="#94a3b8"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
          )}

          {project.parts.map((part) => {
            const d = defFor(part, map);
            if (!d) return null;
            const selected = selectedId === part.instanceId;
            const isLed = d.behaviorModel.kind === "led";
            const glow = isLed && ledOn;
            return (
              <g
                key={part.instanceId}
                transform={`translate(${part.x},${part.y})`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onSelect(part.instanceId);
                  const loc = toLocal(e.clientX, e.clientY);
                  setDrag({ id: part.instanceId, ox: loc.x - part.x, oy: loc.y - part.y });
                }}
                className="cursor-grab"
              >
                <rect
                  width={d.width}
                  height={d.height}
                  rx={6}
                  fill={selected ? "#1c1c2e" : "#16161f"}
                  stroke={selected ? "#ff9a40" : "#2a2a3a"}
                  strokeWidth={selected ? 2 : 1}
                />
                {isLed && (
                  <circle
                    cx={d.width / 2}
                    cy={d.height / 2 - 4}
                    r={10}
                    fill={glow ? (d.behaviorModel.kind === "led" ? d.behaviorModel.color : "#ef4444") : "#3f3f46"}
                    style={
                      glow
                        ? { filter: "drop-shadow(0 0 8px #ef4444)" }
                        : undefined
                    }
                  />
                )}
                {d.behaviorModel.kind === "mcu" && (
                  <rect x={16} y={40} width={d.width - 40} height={60} rx={4} fill="#0a0a0f" stroke="#ff7a00" />
                )}
                <text
                  x={8}
                  y={d.height - 8}
                  fill="#9ca3af"
                  fontSize={simpleMode ? 12 : 10}
                  style={{ userSelect: "none" }}
                >
                  {d.name}
                </text>
                {d.pins.map((pin) => (
                  <g key={pin.id}>
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r={wireFrom?.instanceId === part.instanceId && wireFrom.pinId === pin.id ? 6 : 4}
                      fill={
                        pin.signal === "gnd"
                          ? "#111"
                          : pin.signal === "vcc"
                            ? "#e11d48"
                            : "#3b82f6"
                      }
                      stroke="#e0e0e0"
                      strokeWidth={1}
                      className="cursor-crosshair"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onSelect(part.instanceId);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!wireFrom) {
                          setWireFrom({ instanceId: part.instanceId, pinId: pin.id });
                          return;
                        }
                        if (
                          wireFrom.instanceId === part.instanceId &&
                          wireFrom.pinId === pin.id
                        ) {
                          setWireFrom(null);
                          return;
                        }
                        const fromPart = project.parts.find((p) => p.instanceId === wireFrom.instanceId);
                        const fromDef = fromPart ? defFor(fromPart, map) : undefined;
                        const fromPin = fromDef?.pins.find((p) => p.id === wireFrom.pinId);
                        if (!fromPin) {
                          setWireFrom(null);
                          return;
                        }
                        const check = canConnectPins(fromPin, pin, simpleMode);
                        if (!check.ok) {
                          onWireBlocked(check.message ?? "اتصال غیرمجاز");
                          setWireFrom(null);
                          return;
                        }
                        const color = suggestWireColor(fromPin.signal, pin.signal);
                        onAddWire({
                          id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          from: wireFrom,
                          to: { instanceId: part.instanceId, pinId: pin.id },
                          color,
                        });
                        setWireFrom(null);
                      }}
                    />
                    {simpleMode && (
                      <text
                        x={pin.x + 6}
                        y={pin.y + 3}
                        fill="#6b7280"
                        fontSize={8}
                        style={{ pointerEvents: "none" }}
                      >
                        {pin.label}
                      </text>
                    )}
                  </g>
                ))}
              </g>
            );
          })}
        </g>
      </svg>
      {project.parts.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-on-surface-variant">
          قطعه را از پنل سمت راست اضافه کنید یا یک قالب باز کنید
        </div>
      )}
    </div>
  );
}

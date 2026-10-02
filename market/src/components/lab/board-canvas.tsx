"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import type { ComponentDef, LabProject, PinDef, PlacedPart, WireDef } from "@/lab/types";
import { canConnectPins, suggestWireColor } from "@/lab/wiring/validate";
import { fitView, partBox, pinPosition, snap, unionBox } from "@/lab/geometry";
import { PartArt } from "@/lab/visuals/part-art";
import { newId } from "@/lab/ids";
import { Icon } from "@/components/icon";

export const PART_DRAG_MIME = "application/x-pushrsp-lab-part";

export type CanvasApi = {
  fitTo: (parts: PlacedPart[]) => void;
  /** Canvas-space point at the centre of the visible area (for tap-to-add). */
  center: () => { x: number; y: number };
};

type Props = {
  apiRef?: Ref<CanvasApi>;
  project: LabProject;
  components: ComponentDef[];
  selectedId: string | null;
  simpleMode: boolean;
  litLeds: Set<string>;
  highlight: { partIds: string[]; wireIds: string[] } | null;
  emptyState?: ReactNode;
  onSelect: (id: string | null) => void;
  onMoveStart: () => void;
  onMovePart: (instanceId: string, x: number, y: number) => void;
  onAddWire: (wire: WireDef) => void;
  onDropPart: (componentId: string, x: number, y: number) => void;
  onDeleteSelected: () => void;
  onRotateSelected: () => void;
  onWireBlocked: (message: string) => void;
};

type View = { z: number; x: number; y: number };
type WireStart = { instanceId: string; pinId: string };

const MIN_Z = 0.3;
const MAX_Z = 3;
const clampZ = (z: number) => Math.min(MAX_Z, Math.max(MIN_Z, z));

const PIN_FILL: Record<string, string> = { gnd: "#27272a", vcc: "#e11d48", analog: "#8b5cf6", pwm: "#f59e0b" };
/** GND wires are stored black; on the dark bench draw them light grey so they stay visible. */
const displayColor = (c: string) => (c === "#111111" || c === "#000000" ? "#a1a1aa" : c);

export function BoardCanvas(props: Props) {
  const {
    apiRef, project, components, selectedId, simpleMode, litLeds, highlight, emptyState,
    onSelect, onMoveStart, onMovePart, onAddWire, onDropPart, onDeleteSelected, onRotateSelected, onWireBlocked,
  } = props;

  const defs = useMemo(() => new Map(components.map((c) => [c.id, c])), [components]);
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ z: 1, x: 40, y: 40 });
  const [wireFrom, setWireFrom] = useState<WireStart | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [hoverPin, setHoverPin] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);
  const [panning, setPanning] = useState(false);

  const gesture = useRef<
    | { kind: "drag"; id: string; ox: number; oy: number; sx: number; sy: number; moved: boolean }
    | { kind: "pan"; sx: number; sy: number; vx: number; vy: number; moved: boolean }
    | null
  >(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number }; view: View } | null>(null);
  const viewRef = useRef(view);
  const fittedOnce = useRef(false);
  const projectRef = useRef(project);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const toLocal = useCallback((clientX: number, clientY: number, v: View = viewRef.current) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left - v.x) / v.z, y: (clientY - rect.top - v.y) / v.z };
  }, []);

  const fitTo = useCallback(
    (parts: PlacedPart[]) => {
      const host = hostRef.current;
      if (!host) return;
      const boxes = parts.flatMap((p) => {
        const d = defs.get(p.componentId);
        return d ? [partBox(p, d)] : [];
      });
      const box = unionBox(boxes);
      if (!box) {
        setView({ z: 1, x: 40, y: 40 });
        return;
      }
      const { zoom, pan } = fitView(box, host.clientWidth, host.clientHeight, 48, 1.4);
      setView({ z: zoom, x: pan.x, y: pan.y });
    },
    [defs],
  );

  useImperativeHandle(
    apiRef,
    () => ({
      fitTo,
      center: () => {
        const host = hostRef.current;
        const v = viewRef.current;
        if (!host) return { x: 200, y: 150 };
        return { x: (host.clientWidth / 2 - v.x) / v.z, y: (host.clientHeight / 2 - v.y) / v.z };
      },
    }),
    [fitTo],
  );

  // Fit the first time the canvas gets a real size
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => {
      if (fittedOnce.current || host.clientWidth < 50) return;
      fittedOnce.current = true;
      fitTo(projectRef.current.parts);
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, [fitTo]);

  // Wheel zoom around the cursor (needs a non-passive listener to stop page scroll)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setView((v) => {
        const z = clampZ(v.z * Math.exp(-e.deltaY * 0.0015));
        return { z, x: mx - ((mx - v.x) * z) / v.z, y: my - ((my - v.y) * z) / v.z };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  // Esc cancels a wire in progress
  useEffect(() => {
    if (!wireFrom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWireFrom(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wireFrom]);

  const zoomBy = (f: number) => {
    const host = hostRef.current;
    const mx = (host?.clientWidth ?? 0) / 2;
    const my = (host?.clientHeight ?? 0) / 2;
    setView((v) => {
      const z = clampZ(v.z * f);
      return { z, x: mx - ((mx - v.x) * z) / v.z, y: my - ((my - v.y) * z) / v.z };
    });
  };

  const partById = (id: string) => project.parts.find((p) => p.instanceId === id);
  const pinAbs = (instanceId: string, pinId: string) => {
    const part = partById(instanceId);
    const def = part && defs.get(part.componentId);
    const pin = def?.pins.find((p) => p.id === pinId);
    return part && def && pin ? pinPosition(part, def, pin) : null;
  };

  const fromPinDef: PinDef | undefined = useMemo(() => {
    if (!wireFrom) return undefined;
    const part = project.parts.find((p) => p.instanceId === wireFrom.instanceId);
    return part ? defs.get(part.componentId)?.pins.find((p) => p.id === wireFrom.pinId) : undefined;
  }, [wireFrom, project.parts, defs]);

  function clickPin(part: PlacedPart, pin: PinDef) {
    if (!wireFrom) {
      setWireFrom({ instanceId: part.instanceId, pinId: pin.id });
      onSelect(part.instanceId);
      return;
    }
    if (wireFrom.instanceId === part.instanceId && wireFrom.pinId === pin.id) {
      setWireFrom(null);
      return;
    }
    if (!fromPinDef) {
      setWireFrom(null);
      return;
    }
    const same = (a: WireStart, b: WireStart) => a.instanceId === b.instanceId && a.pinId === b.pinId;
    const target = { instanceId: part.instanceId, pinId: pin.id };
    const exists = project.wires.some(
      (w) => (same(w.from, wireFrom) && same(w.to, target)) || (same(w.to, wireFrom) && same(w.from, target)),
    );
    if (exists) {
      onWireBlocked("این دو پین از قبل به هم وصل هستند.");
      setWireFrom(null);
      return;
    }
    const check = canConnectPins(fromPinDef, pin, simpleMode);
    if (!check.ok) {
      onWireBlocked(check.message ?? "اتصال غیرمجاز");
      setWireFrom(null);
      return;
    }
    onAddWire({
      id: newId("w"),
      from: wireFrom,
      to: target,
      color: suggestWireColor(fromPinDef.signal, pin.signal),
    });
    setWireFrom(null);
  }

  // ---- pointer handling (mouse, pen and touch) ----
  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    svgRef.current?.setPointerCapture(e.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = null;
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        view: viewRef.current,
      };
      return;
    }
    if (!gesture.current) {
      gesture.current = { kind: "pan", sx: e.clientX, sy: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y, moved: false };
    }
  }

  function onPartPointerDown(e: React.PointerEvent, part: PlacedPart) {
    if (e.button !== 0) return;
    const loc = toLocal(e.clientX, e.clientY);
    gesture.current = { kind: "drag", id: part.instanceId, ox: loc.x - part.x, oy: loc.y - part.y, sx: e.clientX, sy: e.clientY, moved: false };
    onSelect(part.instanceId);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.current && pointers.current.size === 2 && svgRef.current) {
      const [a, b] = [...pointers.current.values()];
      const rect = svgRef.current.getBoundingClientRect();
      const p0 = pinch.current;
      const z = clampZ((p0.view.z * Math.hypot(a.x - b.x, a.y - b.y)) / p0.dist);
      const mid = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top };
      const m0 = { x: p0.mid.x - rect.left, y: p0.mid.y - rect.top };
      setView({
        z,
        x: mid.x - ((m0.x - p0.view.x) * z) / p0.view.z,
        y: mid.y - ((m0.y - p0.view.y) * z) / p0.view.z,
      });
      return;
    }

    if (wireFrom) setCursor(toLocal(e.clientX, e.clientY));
    const g = gesture.current;
    if (!g) return;
    const dist = Math.hypot(e.clientX - g.sx, e.clientY - g.sy);
    if (!g.moved && dist < 4) return;
    if (g.kind === "drag") {
      if (!g.moved) {
        g.moved = true;
        onMoveStart();
      }
      const loc = toLocal(e.clientX, e.clientY);
      onMovePart(g.id, snap(loc.x - g.ox), snap(loc.y - g.oy));
    } else {
      if (!g.moved) {
        g.moved = true;
        setPanning(true);
      }
      setView((v) => ({ ...v, x: g.vx + (e.clientX - g.sx), y: g.vy + (e.clientY - g.sy) }));
    }
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const g = gesture.current;
    if (pointers.current.size === 0) gesture.current = null;
    setPanning(false);
    // a click (no movement) on empty bench clears selection / cancels a wire
    if (g && g.kind === "pan" && !g.moved && !pinch.current) {
      onSelect(null);
      setWireFrom(null);
    }
  }

  const sel = selectedId ? partById(selectedId) : undefined;
  const selDef = sel ? defs.get(sel.componentId) : undefined;
  const hint = !project.parts.length
    ? null
    : wireFrom
      ? "روی پین مقصد بزنید · پین‌های روشن قابل اتصال‌اند · Esc برای لغو"
      : sel
        ? "بکشید تا جابه‌جا شود · R چرخش · Del حذف · روی پین بزنید تا سیم‌کشی شروع شود"
        : "برای سیم‌کشی روی یک پین بزنید · فضای خالی را بکشید تا صفحه جابه‌جا شود";

  const toolBtn =
    "flex size-9 cursor-pointer items-center justify-center text-on-surface-variant transition-colors hover:bg-primary-container/10 hover:text-primary-container disabled:pointer-events-none disabled:opacity-30";

  return (
    <div
      ref={hostRef}
      className={`relative h-full w-full overflow-hidden bg-background ${dropping ? "outline-2 -outline-offset-2 outline-dashed outline-primary-container" : ""}`}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(PART_DRAG_MIME)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        if (!dropping) setDropping(true);
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(e) => {
        setDropping(false);
        const id = e.dataTransfer.getData(PART_DRAG_MIME);
        if (!id) return;
        e.preventDefault();
        const loc = toLocal(e.clientX, e.clientY);
        onDropPart(id, loc.x, loc.y);
      }}
    >
      <svg
        ref={svgRef}
        className={`h-full w-full touch-none select-none ${panning ? "cursor-grabbing" : "cursor-default"}`}
        style={{ direction: "ltr" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setCursor(null)}
        role="application"
        aria-label="میز کار مدار"
      >
        <defs>
          <pattern
            id="lab-bench-dots"
            width={20 * view.z}
            height={20 * view.z}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${view.x} ${view.y})`}
          >
            <circle cx={1} cy={1} r={Math.max(0.6, view.z)} fill="#2a2a3a" />
          </pattern>
          <filter id="lab-wire-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ff7a00" floodOpacity=".9" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#lab-bench-dots)" />

        <g transform={`translate(${view.x} ${view.y}) scale(${view.z})`}>
          {/* parts */}
          {project.parts.map((part) => {
            const def = defs.get(part.componentId);
            if (!def) return null;
            const selected = selectedId === part.instanceId;
            const flagged = highlight?.partIds.includes(part.instanceId);
            const box = partBox(part, def);
            return (
              <g key={part.instanceId}>
                {(selected || flagged) && (
                  <rect
                    x={box.x - 6}
                    y={box.y - 6}
                    width={box.w + 12}
                    height={box.h + 12}
                    fill="none"
                    stroke={flagged ? "#ff3366" : "#ff7a00"}
                    strokeWidth={1.5 / view.z}
                    strokeDasharray={`${6 / view.z} ${4 / view.z}`}
                    rx={4}
                  />
                )}
                <g
                  transform={`translate(${part.x} ${part.y}) rotate(${part.rotation ?? 0} ${def.width / 2} ${def.height / 2})`}
                  onPointerDown={(e) => onPartPointerDown(e, part)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <PartArt def={def} on={litLeds.has(part.instanceId)} />
                </g>
              </g>
            );
          })}

          {/* wires above parts so they stay clickable */}
          {project.wires.map((w) => {
            const a = pinAbs(w.from.instanceId, w.from.pinId);
            const b = pinAbs(w.to.instanceId, w.to.pinId);
            if (!a || !b) return null;
            const sag = Math.min(60, Math.hypot(b.x - a.x, b.y - a.y) * 0.25);
            const d = `M ${a.x} ${a.y} C ${a.x} ${a.y + sag}, ${b.x} ${b.y + sag}, ${b.x} ${b.y}`;
            const selected = selectedId === w.id;
            const flagged = highlight?.wireIds.includes(w.id);
            return (
              <g key={w.id}>
                <path d={d} stroke="#0a0a0f" strokeOpacity=".7" strokeWidth={5} fill="none" strokeLinecap="round" />
                <path
                  d={d}
                  stroke={flagged ? "#ff3366" : displayColor(w.color)}
                  strokeWidth={selected ? 4 : 3}
                  strokeDasharray={flagged ? "6 4" : undefined}
                  fill="none"
                  strokeLinecap="round"
                  filter={selected ? "url(#lab-wire-glow)" : undefined}
                />
                {/* wide invisible hit area */}
                <path
                  d={d}
                  stroke="transparent"
                  strokeWidth={14}
                  fill="none"
                  className="cursor-pointer"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onSelect(w.id);
                  }}
                >
                  <title>سیم — برای انتخاب بزنید، Del برای حذف</title>
                </path>
              </g>
            );
          })}

          {/* live wire preview */}
          {wireFrom && cursor && (() => {
            const a = pinAbs(wireFrom.instanceId, wireFrom.pinId);
            return a ? (
              <line x1={a.x} y1={a.y} x2={cursor.x} y2={cursor.y} stroke="#ff7a00" strokeWidth={2} strokeDasharray="6 4" className="lab-wire-live" />
            ) : null;
          })()}

          {/* pins on top of everything */}
          {project.parts.map((part) => {
            const def = defs.get(part.componentId);
            if (!def) return null;
            const showLabels = selectedId === part.instanceId;
            return def.pins.map((pin) => {
              const pos = pinPosition(part, def, pin);
              const key = `${part.instanceId}:${pin.id}`;
              const isStart = wireFrom?.instanceId === part.instanceId && wireFrom.pinId === pin.id;
              const compatible = fromPinDef && !isStart ? canConnectPins(fromPinDef, pin, simpleMode).ok : null;
              const dim = wireFrom && !isStart && compatible === false;
              const glow = wireFrom && !isStart && compatible === true && part.instanceId !== wireFrom.instanceId;
              const hovered = hoverPin === key;
              return (
                <g key={key} opacity={dim ? 0.25 : 1}>
                  {(glow || isStart) && <circle cx={pos.x} cy={pos.y} r={8} fill="none" stroke="#ff7a00" strokeWidth={1.5} className="lab-led-glow" />}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isStart || hovered ? 6 : 4.2}
                    fill={isStart ? "#ff7a00" : PIN_FILL[pin.signal] ?? "#3b82f6"}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    className="cursor-crosshair"
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerEnter={() => setHoverPin(key)}
                    onPointerLeave={() => setHoverPin((h) => (h === key ? null : h))}
                    onClick={(e) => {
                      e.stopPropagation();
                      clickPin(part, pin);
                    }}
                  >
                    <title>{`${pin.label} · ${pin.signal}`}</title>
                  </circle>
                  {(hovered || showLabels || isStart) && (
                    <text
                      x={pos.x + 7}
                      y={pos.y + 3}
                      fontSize={9 / Math.max(1, view.z * 0.9)}
                      fill="#e5e7eb"
                      stroke="#0a0a0f"
                      strokeWidth={2.5 / Math.max(1, view.z)}
                      paintOrder="stroke"
                      fontFamily="var(--font-mono)"
                      style={{ pointerEvents: "none" }}
                    >
                      {pin.label}
                    </text>
                  )}
                </g>
              );
            });
          })}
        </g>
      </svg>

      {/* floating toolbar */}
      <div className="cyber-chamfer-sm absolute top-3 left-3 z-10 flex items-center border border-outline bg-surface-container-lowest/95 shadow-lg backdrop-blur" dir="ltr">
        <button type="button" className={toolBtn} onClick={() => zoomBy(1 / 1.2)} aria-label="کوچک‌نمایی" title="کوچک‌نمایی">
          <Icon name="remove" className="h-4 w-4" />
        </button>
        <span className="w-12 text-center font-mono text-[11px] text-on-surface-variant">{Math.round(view.z * 100)}%</span>
        <button type="button" className={toolBtn} onClick={() => zoomBy(1.2)} aria-label="بزرگ‌نمایی" title="بزرگ‌نمایی">
          <Icon name="add" className="h-4 w-4" />
        </button>
        <button type="button" className={toolBtn} onClick={() => fitTo(project.parts)} aria-label="نمایش کل مدار" title="نمایش کل مدار">
          <Icon name="search" className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-outline" />
        <button type="button" className={toolBtn} disabled={!selDef} onClick={onRotateSelected} aria-label="چرخش قطعه" title="چرخش ۹۰° (R)">
          <Icon name="build" className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${toolBtn} hover:!text-error`}
          disabled={!selectedId}
          onClick={onDeleteSelected}
          aria-label="حذف انتخاب‌شده"
          title="حذف (Del)"
        >
          <Icon name="delete" className="h-4 w-4" />
        </button>
      </div>

      {hint && (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 z-10 mx-auto w-fit max-w-[92%] truncate border border-outline bg-surface-container-lowest/90 px-3 py-1.5 font-mono text-[11px] text-on-surface-variant backdrop-blur">
          <span className="text-primary-container">&gt;</span> {hint}
        </p>
      )}

      {!project.parts.length && emptyState ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6">{emptyState}</div>
      ) : null}
    </div>
  );
}

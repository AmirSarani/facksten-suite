"use client";

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import type { ComponentDef, LabProject, PinDef, PlacedPart, WireDef } from "@/lab/types";
import { canConnectPins, suggestWireColor } from "@/lab/wiring/validate";
import { joinShortsSupply, netAt, netSignal, pinKey, pluggedInto, type Netlist } from "@/lab/netlist";
import { isSocket } from "@/lab/registry";
import { fitView, partBox, pinPosition, snap, unionBox } from "@/lab/geometry";
import { intersects, nearest, orthoBends, rectFrom, segmentMids, simplify, wirePath, type Pt } from "@/lab/wiring/route";
import { PartArt, type PartVisual } from "@/lab/visuals/part-art";
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
  netlist: Netlist;
  /** Selected part and wire ids. */
  selection: string[];
  simpleMode: boolean;
  /** Live part state while the board is powered (LED level, servo angle…). */
  visuals: Map<string, PartVisual>;
  /** Simulation running: buttons press and potentiometers turn instead of dragging. */
  interactive: boolean;
  onPress: (instanceId: string, down: boolean) => void;
  /** Potentiometer position 0–1. */
  onPot: (instanceId: string, value: number) => void;
  potValue: (instanceId: string) => number;
  highlight: { partIds: string[]; wireIds: string[] } | null;
  emptyState?: ReactNode;
  onSelect: (ids: string[]) => void;
  /** Called once before a live edit (drag of parts or wire handles) so it can be undone. */
  onEditStart: () => void;
  /** Move one or more parts at once (a breadboard drags the parts plugged into it). */
  onMoveParts: (moves: Map<string, { x: number; y: number }>, wirePoints?: Map<string, Pt[]>) => void;
  onAddWire: (wire: WireDef) => void;
  /** Live wire change during a handle drag (no history entry of its own). */
  onPatchWire: (id: string, patch: Partial<WireDef>) => void;
  onDropPart: (componentId: string, x: number, y: number) => void;
  onDeleteSelected: () => void;
  onRotateSelected: () => void;
  onWireBlocked: (message: string) => void;
};

type View = { z: number; x: number; y: number };
type End = { instanceId: string; pinId: string };
type Target = { at: Pt; key: string; end: End; pin: PinDef };
/** A wire being drawn: from a pin, through bend points, towards the cursor. */
type Draft = { from: End; points: Pt[]; dragged: boolean };

type Gesture =
  | { kind: "pan"; sx: number; sy: number; vx: number; vy: number; moved: boolean }
  | { kind: "marquee"; sx: number; sy: number; start: Pt; moved: boolean; additive: string[]; clickToggles?: string }
  | {
      kind: "drag";
      id: string;
      ox: number;
      oy: number;
      sx: number;
      sy: number;
      moved: boolean;
      /** Start positions of every part that moves with this one. */
      group: Map<string, { x: number; y: number }>;
      /** Bend points of wires whose both ends move, so they travel along. */
      wires: Map<string, Pt[]>;
    }
  | { kind: "pin"; sx: number; sy: number; vx: number; vy: number; moved: boolean; continuing: boolean }
  | { kind: "bend"; wireId: string; index: number; sx: number; sy: number; moved: boolean; inserted: boolean }
  | { kind: "end"; wireId: string; side: "from" | "to"; sx: number; sy: number; moved: boolean }
  | { kind: "press"; id: string; sx: number; sy: number; moved: boolean }
  | { kind: "knob"; id: string; sx: number; sy: number; moved: boolean; start: number };

const MIN_Z = 0.3;
const MAX_Z = 3;
const clampZ = (z: number) => Math.min(MAX_Z, Math.max(MIN_Z, z));
const netSummary = (n: number) => `${n.toLocaleString("fa-IR")} نقطه‌ی هم‌مسیر`;
/** Magnetic pull towards a pin, in screen pixels. */
const SNAP_PX = 16;
/** Breadboard holes sit 10 units apart, so they only catch the cursor right over them. */
const HOLE_SNAP = 6;
/** How close (screen px) a press must be to a header pin to start a wire from it. */
const PIN_GRAB_PX = 8;

/** Nearest pin to `p`: pins pull from SNAP_PX away, holes only from directly over them. */
function pickPin(candidates: Target[], p: Pt, z: number): Target | null {
  const far = nearest(candidates.filter((t) => t.pin.signal !== "passive"), p, SNAP_PX / z);
  const hole = nearest(candidates.filter((t) => t.pin.signal === "passive"), p, Math.min(HOLE_SNAP, SNAP_PX / z));
  if (!far) return hole;
  if (!hole) return far;
  return Math.hypot(hole.at.x - p.x, hole.at.y - p.y) < Math.hypot(far.at.x - p.x, far.at.y - p.y) ? hole : far;
}

const PIN_FILL: Record<string, string> = { gnd: "#27272a", vcc: "#e11d48", analog: "#8b5cf6", pwm: "#f59e0b" };
/** GND wires are stored black; on the dark bench draw them light grey so they stay visible. */
const displayColor = (c: string) => (c === "#111111" || c === "#000000" ? "#a1a1aa" : c);
const sameEnd = (a: End, b: End) => a.instanceId === b.instanceId && a.pinId === b.pinId;

export function BoardCanvas(props: Props) {
  const {
    apiRef, project, components, netlist, selection, simpleMode, visuals, interactive, highlight, emptyState,
    onPress, onPot, potValue, onSelect, onEditStart, onMoveParts, onAddWire, onPatchWire, onDropPart, onDeleteSelected, onRotateSelected, onWireBlocked,
  } = props;

  const defs = useMemo(() => new Map(components.map((c) => [c.id, c])), [components]);
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ z: 1, x: 40, y: 40 });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [cursor, setCursor] = useState<Pt | null>(null);
  const [shift, setShift] = useState(false);
  const [hoverPin, setHoverPin] = useState<string | null>(null);
  const [hoverWire, setHoverWire] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);
  const [panning, setPanning] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  /** Wire end being dragged to another pin. */
  const [reconnect, setReconnect] = useState<{ wireId: string; side: "from" | "to" } | null>(null);

  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number }; view: View } | null>(null);
  const viewRef = useRef(view);
  const fittedOnce = useRef(false);
  const projectRef = useRef(project);
  const draftRef = useRef(draft);

  // Layout effects: pointer events can follow each other before a paint, and the handlers
  // read these refs, so they must be current as soon as React commits.
  useLayoutEffect(() => {
    viewRef.current = view;
    projectRef.current = project;
    draftRef.current = draft;
  }, [view, project, draft]);

  const selected = useMemo(() => new Set(selection), [selection]);
  const primaryId = selection.length === 1 ? selection[0] : null;

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

  // While drawing: Esc cancels, Backspace removes the last bend. Capture phase, so the
  // workspace's own Delete/Escape shortcuts don't also fire.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShift(e.type === "keydown");
      if (e.type !== "keydown" || !draftRef.current) return;
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        setDraft(null);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.stopImmediatePropagation();
        e.preventDefault();
        setDraft((d) => (d && d.points.length ? { ...d, points: d.points.slice(0, -1) } : null));
      }
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
    };
  }, []);

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
  const pinDefOf = (end: End) => {
    const part = partById(end.instanceId);
    return part ? defs.get(part.componentId)?.pins.find((p) => p.id === end.pinId) : undefined;
  };
  const pinAbs = (end: End) => {
    const part = partById(end.instanceId);
    const def = part && defs.get(part.componentId);
    const pin = def?.pins.find((p) => p.id === end.pinId);
    return part && def && pin ? pinPosition(part, def, pin) : null;
  };

  // Every pin on the bench, for magnetic snapping.
  const allPins = useMemo(() => {
    const out: Target[] = [];
    for (const part of project.parts) {
      const def = defs.get(part.componentId);
      if (!def) continue;
      for (const pin of def.pins) {
        out.push({ at: pinPosition(part, def, pin), key: pinKey(part.instanceId, pin.id), end: { instanceId: part.instanceId, pinId: pin.id }, pin });
      }
    }
    return out;
  }, [project.parts, defs]);

  const reconnectFixed = (() => {
    if (!reconnect) return undefined;
    const w = project.wires.find((x) => x.id === reconnect.wireId);
    return w ? (reconnect.side === "from" ? w.to : w.from) : undefined;
  })();
  /** The pin the wire would attach to at the cursor (magnetic), honouring compatibility. */
  const snapTarget: Target | null = useMemo(() => {
    const anchor = draft?.from ?? reconnectFixed;
    if (!anchor || !cursor) return null;
    const anchorPin = pinDefOf(anchor);
    if (!anchorPin) return null;
    const ok = allPins.filter((t) => !sameEnd(t.end, anchor) && canConnectPins(anchorPin, t.pin, simpleMode).ok);
    return pickPin(ok, cursor, view.z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, reconnect, cursor, allPins, simpleMode, view.z]);

  /** Validate a new connection; returns an error message or null. */
  function connectionProblem(a: End, b: End, ignoreWire?: string): string | null {
    if (sameEnd(a, b)) return "یک پین را نمی‌شود به خودش وصل کرد.";
    const exists = project.wires.some(
      (w) => w.id !== ignoreWire && ((sameEnd(w.from, a) && sameEnd(w.to, b)) || (sameEnd(w.to, a) && sameEnd(w.from, b))),
    );
    if (exists) return "این دو پین از قبل به هم وصل هستند.";
    const pa = pinDefOf(a);
    const pb = pinDefOf(b);
    if (!pa || !pb) return "اتصال نامعتبر";
    const check = canConnectPins(pa, pb, simpleMode);
    if (!check.ok) return check.message ?? "اتصال غیرمجاز";
    if (simpleMode && joinShortsSupply(netlist, pinKey(a.instanceId, a.pinId), pinKey(b.instanceId, b.pinId))) {
      return "این سیم تغذیه را مستقیم به GND وصل می‌کند (اتصال کوتاه).";
    }
    return null;
  }

  function finishDraft(target: Target) {
    const d = draftRef.current;
    if (!d) return;
    const problem = connectionProblem(d.from, target.end);
    if (problem) {
      onWireBlocked(problem);
      setDraft(null);
      return;
    }
    const start = pinAbs(d.from)!;
    const last = d.points[d.points.length - 1] ?? start;
    // once the wire has bends, keep its final run orthogonal too
    const points = d.points.length ? simplify([start, ...d.points, ...orthoBends(last, target.at), target.at]).slice(1, -1) : [];
    const sig = (end: End, p: PinDef) => {
      const s = netSignal(netAt(netlist, pinKey(end.instanceId, end.pinId)));
      return s === "gnd" ? "gnd" : s === "vcc" ? "vcc" : p.signal;
    };
    onAddWire({
      id: newId("w"),
      from: d.from,
      to: target.end,
      color: suggestWireColor(sig(d.from, pinDefOf(d.from)!), sig(target.end, target.pin)),
      ...(points.length ? { points } : {}),
    });
    setDraft(null);
  }

  /** Add a bend at the cursor (grid-snapped), keeping runs orthogonal unless Shift is held. */
  function addBend(at: Pt, free: boolean) {
    setDraft((d) => {
      if (!d) return d;
      const start = pinAbs(d.from)!;
      const last = d.points[d.points.length - 1] ?? start;
      const p = { x: snap(at.x), y: snap(at.y) };
      const next = free ? [p] : [...orthoBends(last, p), p];
      return { ...d, points: simplify([start, ...d.points, ...next]).slice(1) };
    });
  }

  // ---- pointer handling (mouse, pen and touch) ----
  function targetOf(e: React.PointerEvent): { kind: string; id: string; extra?: string } | null {
    const el = (e.target as Element).closest("[data-kind]");
    if (!el) return null;
    return { kind: el.getAttribute("data-kind")!, id: el.getAttribute("data-id")!, extra: el.getAttribute("data-extra") ?? undefined };
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    // Only fingers pinch. A mouse/pen press starts fresh, so an up event that never arrived
    // (released outside the window) can never leave a phantom "second finger" behind.
    if (e.pointerType !== "touch") pointers.current.clear();
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
    if (e.button === 2) {
      setDraft(null);
      return;
    }
    const loc = toLocal(e.clientX, e.clientY);
    setCursor(loc);
    const hit = targetOf(e);
    const base = { sx: e.clientX, sy: e.clientY, moved: false };

    // While a wire is being drawn, presses go to the wire: pin = finish, elsewhere = bend.
    if (draftRef.current) {
      gesture.current = { kind: "pin", ...base, vx: viewRef.current.x, vy: viewRef.current.y, continuing: true };
      return;
    }

    // Zoomed out, header pins are a couple of pixels wide: a press close to one still grabs
    // it. Breadboard holes need a direct hit so the board itself stays draggable.
    let pinHit = hit?.kind === "pin" ? { instanceId: hit.id, pinId: hit.extra! } : null;
    if (!pinHit && (!hit || hit.kind === "part")) {
      const close = nearest(allPins.filter((t) => t.pin.signal !== "passive"), loc, Math.max(5, PIN_GRAB_PX / viewRef.current.z));
      if (close) pinHit = close.end;
    }
    if (pinHit) {
      const { instanceId, pinId } = pinHit;
      setDraft({ from: { instanceId, pinId }, points: [], dragged: false });
      gesture.current = { kind: "pin", ...base, vx: viewRef.current.x, vy: viewRef.current.y, continuing: false };
      return;
    }
    if (hit?.kind === "bend" || hit?.kind === "mid") {
      const wire = project.wires.find((w) => w.id === hit.id);
      if (!wire) return;
      const index = Number(hit.extra);
      if (hit.kind === "mid") {
        onEditStart();
        const points = [...(wire.points ?? [])];
        points.splice(index, 0, { x: snap(loc.x), y: snap(loc.y) });
        onPatchWire(wire.id, { points });
      }
      gesture.current = { kind: "bend", wireId: wire.id, index, ...base, inserted: hit.kind === "mid" };
      return;
    }
    if (hit?.kind === "end") {
      gesture.current = { kind: "end", wireId: hit.id, side: hit.extra as "from" | "to", ...base };
      setReconnect({ wireId: hit.id, side: hit.extra as "from" | "to" });
      return;
    }
    if (hit?.kind === "wire") {
      onSelect(e.shiftKey ? toggle(selection, hit.id) : [hit.id]);
      return;
    }
    if (hit?.kind === "part") {
      if (e.button !== 0) return;
      const part = partById(hit.id);
      if (!part) return;
      const partDef = defs.get(part.componentId);
      // while running, controls are operated rather than moved (Alt+drag still moves them)
      if (interactive && !e.altKey && partDef?.behaviorModel.kind === "button") {
        onPress(part.instanceId, true);
        gesture.current = { kind: "press", id: part.instanceId, ...base };
        return;
      }
      if (interactive && !e.altKey && partDef?.behaviorModel.kind === "potentiometer") {
        gesture.current = { kind: "knob", id: part.instanceId, ...base, start: potValue(part.instanceId) };
        return;
      }
      // Shift+drag on a breadboard boxes the parts sitting on it; Shift+click still toggles it
      if (e.shiftKey && partDef && isSocket(partDef)) {
        gesture.current = { kind: "marquee", ...base, start: loc, additive: selection, clickToggles: part.instanceId };
        return;
      }
      let next = selection;
      if (e.shiftKey) next = toggle(selection, part.instanceId);
      else if (!selected.has(part.instanceId)) next = [part.instanceId];
      onSelect(next);
      // move every selected part, plus whatever is plugged into a selected breadboard
      const moving = new Set(next.filter((id) => partById(id)));
      if (!moving.has(part.instanceId)) return;
      for (const id of [...moving]) {
        const d = defs.get(partById(id)!.componentId);
        if (d && isSocket(d)) for (const p of pluggedInto(netlist, id)) moving.add(p);
      }
      const group = new Map([...moving].map((id) => [id, { x: partById(id)!.x, y: partById(id)!.y }]));
      const wires = new Map(
        project.wires
          .filter((w) => w.points?.length && moving.has(w.from.instanceId) && moving.has(w.to.instanceId))
          .map((w) => [w.id, w.points!]),
      );
      gesture.current = { kind: "drag", id: part.instanceId, ox: loc.x - part.x, oy: loc.y - part.y, ...base, group, wires };
      setDragging(part.instanceId);
      return;
    }
    // empty bench: pan, or box-select with Shift
    gesture.current = e.shiftKey
      ? { kind: "marquee", ...base, start: loc, additive: selection }
      : { kind: "pan", ...base, vx: viewRef.current.x, vy: viewRef.current.y };
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

    const loc = toLocal(e.clientX, e.clientY);
    if (draftRef.current || reconnect) setCursor(loc);
    const g = gesture.current;
    if (!g) return;
    const dist = Math.hypot(e.clientX - g.sx, e.clientY - g.sy);
    if (!g.moved && dist < 4) return;
    const first = !g.moved;
    g.moved = true;

    switch (g.kind) {
      case "drag": {
        if (first) onEditStart();
        const start = g.group.get(g.id)!;
        const dx = snap(loc.x - g.ox) - start.x;
        const dy = snap(loc.y - g.oy) - start.y;
        onMoveParts(
          new Map([...g.group].map(([id, p]) => [id, { x: p.x + dx, y: p.y + dy }])),
          new Map([...g.wires].map(([id, pts]) => [id, pts.map((p) => ({ x: p.x + dx, y: p.y + dy }))])),
        );
        break;
      }
      case "pan":
        if (first) setPanning(true);
        setView((v) => ({ ...v, x: g.vx + (e.clientX - g.sx), y: g.vy + (e.clientY - g.sy) }));
        break;
      case "marquee":
        setMarquee(rectFrom(g.start, loc));
        break;
      case "pin":
        if (!g.continuing && first) setDraft((d) => (d ? { ...d, dragged: true } : d));
        // dragging while a wire is in progress pans the view
        if (g.continuing) setView((v) => ({ ...v, x: g.vx + (e.clientX - g.sx), y: g.vy + (e.clientY - g.sy) }));
        break;
      case "bend": {
        if (first && !g.inserted) onEditStart();
        const wire = projectRef.current.wires.find((w) => w.id === g.wireId);
        if (!wire?.points) break;
        const points = wire.points.map((p, i) => (i === g.index ? { x: snap(loc.x), y: snap(loc.y) } : p));
        onPatchWire(wire.id, { points });
        break;
      }
      case "end":
      case "press":
        break;
      case "knob":
        // drag up to turn clockwise; 150 px for the full sweep
        onPot(g.id, Math.max(0, Math.min(1, g.start + (g.sy - e.clientY) / 150)));
        break;
    }
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const g = gesture.current;
    if (pointers.current.size === 0) gesture.current = null;
    setPanning(false);
    setDragging(null);
    if (!g) return;
    const loc = toLocal(e.clientX, e.clientY);

    switch (g.kind) {
      case "pan":
        // a click (no movement) on empty bench clears the selection
        if (!g.moved && !pinch.current) onSelect([]);
        break;
      case "marquee": {
        setMarquee(null);
        if (!g.moved) {
          onSelect(g.clickToggles ? toggle(g.additive, g.clickToggles) : g.additive);
          break;
        }
        const r = rectFrom(g.start, loc);
        const hits = project.parts.filter((p) => {
          const d = defs.get(p.componentId);
          if (!d) return false;
          const box = partBox(p, d);
          // breadboards only when wholly inside the box, so boxing parts on them works
          if (isSocket(d)) return r.x <= box.x && r.y <= box.y && r.x + r.w >= box.x + box.w && r.y + r.h >= box.y + box.h;
          return intersects(r, box);
        });
        const ids = new Set([...g.additive, ...hits.map((p) => p.instanceId)]);
        for (const w of project.wires) if (ids.has(w.from.instanceId) && ids.has(w.to.instanceId)) ids.add(w.id);
        onSelect([...ids]);
        break;
      }
      case "pin": {
        const d = draftRef.current;
        if (!d) break;
        const target = pickPin(allPins.filter((t) => !sameEnd(t.end, d.from)), loc, viewRef.current.z);
        if (!g.continuing) {
          // released on the start pin without dragging: click-to-click mode continues
          if (!g.moved) break;
          if (target) finishDraft(snapTarget ?? target);
          break;
        }
        if (g.moved) break; // that was a pan
        if (target) {
          finishDraft(snapTarget ?? target);
        } else {
          // click on the start pin again cancels; elsewhere adds a bend
          const onStart = allPins.find((t) => sameEnd(t.end, d.from) && Math.hypot(t.at.x - loc.x, t.at.y - loc.y) < SNAP_PX / viewRef.current.z);
          if (onStart) setDraft(null);
          else addBend(loc, e.shiftKey);
        }
        break;
      }
      case "bend": {
        const wire = project.wires.find((w) => w.id === g.wireId);
        if (wire?.points && g.moved) onPatchWire(wire.id, { points: simplifyWire(wire) });
        break;
      }
      case "end": {
        setReconnect(null);
        const wire = project.wires.find((w) => w.id === g.wireId);
        if (!wire || !g.moved) break;
        const fixed = g.side === "from" ? wire.to : wire.from;
        const target = snapTarget ?? pickPin(allPins, loc, viewRef.current.z);
        if (!target) break;
        const problem = connectionProblem(fixed, target.end, wire.id);
        if (problem) {
          onWireBlocked(problem);
          break;
        }
        onEditStart();
        // a bent wire stays orthogonal: re-route the run that now ends somewhere else
        const pts = wire.points ?? [];
        let points: Pt[] | undefined = pts.length ? pts : undefined;
        const fixedAt = pinAbs(fixed);
        if (pts.length && fixedAt) {
          if (g.side === "to") {
            points = simplify([fixedAt, ...pts, ...orthoBends(pts[pts.length - 1], target.at), target.at]).slice(1, -1);
          } else {
            const rev = [...pts].reverse();
            points = simplify([fixedAt, ...rev, ...orthoBends(rev[rev.length - 1], target.at), target.at]).slice(1, -1).reverse();
          }
        }
        onPatchWire(wire.id, { [g.side]: target.end, points });
        break;
      }
      case "press":
        onPress(g.id, false);
        break;
      case "drag":
      case "knob":
        break;
    }
  }

  function simplifyWire(w: WireDef): Pt[] {
    const a = pinAbs(w.from);
    const b = pinAbs(w.to);
    if (!a || !b || !w.points) return w.points ?? [];
    return simplify([a, ...w.points, b]).slice(1, -1);
  }

  function onDoubleClick(e: React.MouseEvent<SVGSVGElement>) {
    const el = (e.target as Element).closest("[data-kind='bend']");
    if (!el) return;
    const wire = project.wires.find((w) => w.id === el.getAttribute("data-id"));
    if (!wire?.points) return;
    onEditStart();
    onPatchWire(wire.id, { points: wire.points.filter((_, i) => i !== Number(el.getAttribute("data-extra"))) });
  }

  // Breadboards sit underneath everything plugged into them.
  const ordered = useMemo(() => {
    const socket = (p: PlacedPart) => {
      const d = defs.get(p.componentId);
      return d && isSocket(d) ? 0 : 1;
    };
    return [...project.parts].sort((a, b) => socket(a) - socket(b));
  }, [project.parts, defs]);

  const hoverKey = hoverPin ?? (hoverWire ? (() => {
    const w = project.wires.find((x) => x.id === hoverWire);
    return w ? pinKey(w.from.instanceId, w.from.pinId) : null;
  })() : null);
  const hoverNet = hoverKey ? netAt(netlist, hoverKey) : undefined;
  const hoverNetKeys = useMemo(() => new Set(hoverNet && hoverNet.pins.length > 1 ? hoverNet.pins.map((p) => p.key) : []), [hoverNet]);
  const hoverNetWires = useMemo(() => new Set(hoverNet?.wireIds ?? []), [hoverNet]);
  // Leads seated in a hole: shown for the part being dragged or selected.
  const focusId = dragging ?? primaryId;
  const seated = focusId ? netlist.contacts.filter((c) => c.a.startsWith(`${focusId}:`) || c.b.startsWith(`${focusId}:`)) : [];

  const sockets = ordered.filter((p) => {
    const d = defs.get(p.componentId);
    return !!d && isSocket(d);
  });
  const parts = ordered.filter((p) => !sockets.includes(p));
  const z = view.z;

  const renderParts = (list: PlacedPart[]) =>
    list.map((part) => {
      const def = defs.get(part.componentId);
      if (!def) return null;
      const isSel = selected.has(part.instanceId);
      const flagged = highlight?.partIds.includes(part.instanceId);
      const box = partBox(part, def);
      return (
        <g key={part.instanceId}>
          {(isSel || flagged) && (
            <rect
              x={box.x - 6}
              y={box.y - 6}
              width={box.w + 12}
              height={box.h + 12}
              fill="none"
              stroke={flagged ? "#ff3366" : "#ff7a00"}
              strokeWidth={1.5 / z}
              strokeDasharray={`${6 / z} ${4 / z}`}
              rx={4}
            />
          )}
          <g
            data-kind="part"
            data-id={part.instanceId}
            transform={`translate(${part.x} ${part.y}) rotate(${part.rotation ?? 0} ${def.width / 2} ${def.height / 2})`}
            className={
              interactive && def.behaviorModel.kind === "button"
                ? "cursor-pointer"
                : interactive && def.behaviorModel.kind === "potentiometer"
                  ? "cursor-ns-resize"
                  : "cursor-grab active:cursor-grabbing"
            }
          >
            <PartArt def={def} state={visuals.get(part.instanceId)} />
          </g>
        </g>
      );
    });

  const anchor = draft?.from ?? reconnectFixed;
  const anchorPin = anchor ? pinDefOf(anchor) : undefined;

  const renderPins = (list: PlacedPart[]) =>
    list.map((part) => {
      const def = defs.get(part.componentId);
      if (!def) return null;
      const showLabels = primaryId === part.instanceId && def.pins.length <= 40;
      return def.pins.map((pin) => {
        const pos = pinPosition(part, def, pin);
        const key = pinKey(part.instanceId, pin.id);
        const hole = pin.signal === "passive";
        const isStart = !!anchor && anchor.instanceId === part.instanceId && anchor.pinId === pin.id;
        const compatible = anchorPin && !isStart ? canConnectPins(anchorPin, pin, simpleMode).ok : null;
        const dim = !!anchor && !isStart && compatible === false;
        const glow = !hole && !!anchor && !isStart && compatible === true && part.instanceId !== anchor.instanceId;
        const isSnap = snapTarget?.key === key;
        const hovered = hoverPin === key || isSnap;
        const inNet = hoverNetKeys.has(key);
        const r = hole ? 2.6 : isStart || hovered ? 4.6 : 3.4;
        return (
          <g key={key} opacity={dim ? 0.25 : 1}>
            {(glow || isStart) && <circle cx={pos.x} cy={pos.y} r={6.5} fill="none" stroke="#ff7a00" strokeWidth={1.2} className="lab-led-glow" />}
            {isSnap && <circle cx={pos.x} cy={pos.y} r={8} fill="#ff7a00" fillOpacity={0.18} stroke="#ff7a00" strokeWidth={1.5} style={{ pointerEvents: "none" }} />}
            {inNet && !hovered && <circle cx={pos.x} cy={pos.y} r={4.6} fill="#22c55e" fillOpacity={0.25} stroke="#22c55e" strokeWidth={1} style={{ pointerEvents: "none" }} />}
            <circle
              data-kind="pin"
              data-id={part.instanceId}
              data-extra={pin.id}
              cx={pos.x}
              cy={pos.y}
              r={hole ? 4.6 : Math.max(r, Math.min(4.6, 5 / z))}
              fill={hole ? (hovered || isStart ? "#ff7a00" : "transparent") : isStart ? "#ff7a00" : PIN_FILL[pin.signal] ?? "#3b82f6"}
              fillOpacity={hole && !hovered && !isStart ? 0 : 1}
              stroke={hole ? (hovered ? "#fff" : "none") : "#e5e7eb"}
              strokeWidth={0.8}
              className="cursor-crosshair"
              onPointerEnter={() => setHoverPin(key)}
              onPointerLeave={() => setHoverPin((h) => (h === key ? null : h))}
            >
              <title>{hole ? pin.id : `${pin.label} · ${pin.signal}`}</title>
            </circle>
            {(hovered || showLabels || isStart) && (
              <text
                x={pos.x + 6}
                y={pos.y - 5}
                fontSize={8 / Math.max(1, z * 0.9)}
                fill="#e5e7eb"
                stroke="#0a0a0f"
                strokeWidth={2.5 / Math.max(1, z)}
                paintOrder="stroke"
                fontFamily="var(--font-mono)"
                style={{ pointerEvents: "none" }}
              >
                {pin.label}
              </text>
            )}
            {hovered && hoverNet && hoverNet.pins.length > 1 && hoverKey === key && (
              // own line: Persian laid out right-to-left, growing rightwards from the pin
              <text
                x={pos.x + 6}
                y={pos.y + 6}
                direction="rtl"
                textAnchor="end"
                fontSize={7 / Math.max(1, z * 0.9)}
                fill="#86efac"
                stroke="#0a0a0f"
                strokeWidth={2.5 / Math.max(1, z)}
                paintOrder="stroke"
                style={{ pointerEvents: "none" }}
              >
                {netSummary(hoverNet.pins.length)}
              </text>
            )}
          </g>
        );
      });
    });

  // Live preview of the wire being drawn, in the style it will have once placed.
  const preview = (() => {
    if (!draft) return null;
    const start = pinAbs(draft.from);
    if (!start) return null;
    const end = snapTarget?.at ?? cursor;
    if (!end) return null;
    const last = draft.points[draft.points.length - 1] ?? start;
    const tail = draft.points.length || shift ? (shift ? [] : orthoBends(last, end)) : [];
    const d = wirePath(start, [...draft.points, ...tail], end);
    return (
      <g style={{ pointerEvents: "none" }}>
        <path d={d} stroke="#0a0a0f" strokeOpacity=".6" strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d={d} stroke="#ff7a00" strokeWidth={2.5} strokeDasharray={snapTarget ? undefined : "6 4"} fill="none" strokeLinecap="round" className="lab-wire-live" />
        {draft.points.map((p, i) => (
          <rect key={i} x={p.x - 2.5} y={p.y - 2.5} width={5} height={5} fill="#ff7a00" />
        ))}
      </g>
    );
  })();

  const selWire = primaryId ? project.wires.find((w) => w.id === primaryId) : undefined;
  const selPart = primaryId ? partById(primaryId) : undefined;
  const anySelectedPart = selection.some((id) => partById(id));
  const hint = !project.parts.length
    ? null
    : interactive && !draft
      ? "شبیه‌سازی روشن است · روی دکمه نگه دارید تا فشرده بماند · ولوم را بالا/پایین بکشید · Alt+کشیدن = جابه‌جایی"
      : draft
      ? draft.dragged
        ? "روی پین مقصد رها کنید · آهنربا به نزدیک‌ترین پین می‌چسبد"
        : "روی پین مقصد بزنید · کلیک روی فضای خالی = نقطه‌ی خم · Shift = خط آزاد · Backspace = حذف خم · Esc لغو"
      : selWire
        ? "دستگیره‌ها را بکشید · + روی سیم = خم جدید · دوبار کلیک روی خم = حذف · سر سیم را به پین دیگر ببرید"
        : selection.length > 1
          ? `${selection.length.toLocaleString("fa-IR")} مورد انتخاب شده · با هم جابه‌جا می‌شوند · Del حذف · R چرخش`
          : selPart
            ? "بکشید تا جابه‌جا شود · R چرخش · Del حذف · Ctrl+D کپی · از پین بکشید تا سیم بسازید"
            : "از یک پین بکشید یا رویش بزنید تا سیم بسازید · Shift+کشیدن = انتخاب چندتایی · فضای خالی را بکشید تا صفحه جابه‌جا شود";

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
        className={`h-full w-full touch-none select-none ${panning ? "cursor-grabbing" : draft ? "cursor-crosshair" : "cursor-default"}`}
        style={{ direction: "ltr" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onLostPointerCapture={(e) => pointers.current.delete(e.pointerId)}
        onDoubleClick={onDoubleClick}
        onContextMenu={(e) => {
          if (draftRef.current) e.preventDefault();
        }}
        role="application"
        aria-label="میز کار مدار"
      >
        <defs>
          <pattern
            id="lab-bench-dots"
            width={20 * z}
            height={20 * z}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${view.x} ${view.y})`}
          >
            <circle cx={1} cy={1} r={Math.max(0.6, z)} fill="#2a2a3a" />
          </pattern>
          <filter id="lab-wire-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ff7a00" floodOpacity=".9" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#lab-bench-dots)" />

        <g transform={`translate(${view.x} ${view.y}) scale(${z})`}>
          {/* breadboards, their holes, then the parts sitting on them */}
          {renderParts(sockets)}
          {renderPins(sockets)}
          {renderParts(parts)}

          {/* wires above parts so they stay clickable */}
          {project.wires.map((w) => {
            const a = pinAbs(w.from);
            const b = pinAbs(w.to);
            if (!a || !b) return null;
            const d = wirePath(a, w.points ?? [], b);
            const isSel = selected.has(w.id);
            const flagged = highlight?.wireIds.includes(w.id);
            const inNet = hoverNetWires.has(w.id);
            return (
              <g key={w.id}>
                <path d={d} stroke="#0a0a0f" strokeOpacity=".7" strokeWidth={5} fill="none" strokeLinecap="round" />
                {inNet && !isSel && <path d={d} stroke="#22c55e" strokeOpacity=".45" strokeWidth={7} fill="none" strokeLinecap="round" />}
                <path
                  d={d}
                  stroke={flagged ? "#ff3366" : displayColor(w.color)}
                  strokeWidth={isSel ? 3.6 : 2.8}
                  strokeDasharray={flagged ? "6 4" : undefined}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={isSel ? "url(#lab-wire-glow)" : undefined}
                />
                {/* wide invisible hit area */}
                <path
                  data-kind="wire"
                  data-id={w.id}
                  d={d}
                  stroke="transparent"
                  strokeWidth={Math.max(10, 12 / z)}
                  fill="none"
                  className="cursor-pointer"
                  onPointerEnter={() => setHoverWire(w.id)}
                  onPointerLeave={() => setHoverWire((h) => (h === w.id ? null : h))}
                >
                  <title>سیم — برای انتخاب بزنید، Del برای حذف</title>
                </path>
              </g>
            );
          })}

          {/* the wire end being moved to another pin */}
          {reconnect && reconnectFixed && cursor && (() => {
            const a = pinAbs(reconnectFixed);
            const end = snapTarget?.at ?? cursor;
            return a ? <path d={wirePath(a, [], end)} stroke="#ff7a00" strokeWidth={2.5} strokeDasharray="6 4" fill="none" style={{ pointerEvents: "none" }} /> : null;
          })()}

          {preview}

          {/* leads seated in breadboard holes */}
          {seated.map((c) => (
            <rect key={`${c.a}|${c.b}`} x={c.x - 3.5} y={c.y - 3.5} width={7} height={7} rx={1.5} fill="none" stroke="#22c55e" strokeWidth={1.4} style={{ pointerEvents: "none" }} />
          ))}

          {/* pins of everything else on top */}
          {renderPins(parts)}

          {/* editing handles of the selected wire — above the pins they sit on */}
          {selWire && !draft && (() => {
            const a = pinAbs(selWire.from);
            const b = pinAbs(selWire.to);
            if (!a || !b) return null;
            const pts = selWire.points ?? [];
            const hs = 4.5 / Math.max(0.6, z);
            return (
              <g>
                {segmentMids(a, pts, b).map((m) => (
                  <g key={`mid-${m.index}`} data-kind="mid" data-id={selWire.id} data-extra={m.index} className="cursor-copy">
                    <circle cx={m.at.x} cy={m.at.y} r={hs} fill="#0a0a0f" stroke="#ff7a00" strokeWidth={1.2 / Math.max(0.6, z)} />
                    <path d={`M${m.at.x - hs * 0.55} ${m.at.y} h${hs * 1.1} M${m.at.x} ${m.at.y - hs * 0.55} v${hs * 1.1}`} stroke="#ff7a00" strokeWidth={1.2 / Math.max(0.6, z)} />
                    <title>بکشید تا خم جدید بسازید</title>
                  </g>
                ))}
                {pts.map((p, i) => (
                  <rect
                    key={`bend-${i}`}
                    data-kind="bend"
                    data-id={selWire.id}
                    data-extra={i}
                    x={p.x - hs}
                    y={p.y - hs}
                    width={hs * 2}
                    height={hs * 2}
                    fill="#ff7a00"
                    stroke="#0a0a0f"
                    strokeWidth={1 / Math.max(0.6, z)}
                    className="cursor-move"
                  >
                    <title>بکشید · دوبار کلیک = حذف خم</title>
                  </rect>
                ))}
                {(["from", "to"] as const).map((side) => {
                  const p = side === "from" ? a : b;
                  return (
                    <circle
                      key={side}
                      data-kind="end"
                      data-id={selWire.id}
                      data-extra={side}
                      cx={p.x}
                      cy={p.y}
                      r={hs * 1.15}
                      fill="#0a0a0f"
                      stroke="#ff7a00"
                      strokeWidth={1.6 / Math.max(0.6, z)}
                      className="cursor-grab"
                    >
                      <title>بکشید تا این سر سیم را به پین دیگری ببرید</title>
                    </circle>
                  );
                })}
              </g>
            );
          })()}


          {marquee && (
            <rect x={marquee.x} y={marquee.y} width={marquee.w} height={marquee.h} fill="#ff7a00" fillOpacity={0.08} stroke="#ff7a00" strokeWidth={1 / z} strokeDasharray={`${4 / z} ${3 / z}`} style={{ pointerEvents: "none" }} />
          )}
        </g>
      </svg>

      {/* floating toolbar */}
      <div className="cyber-chamfer-sm absolute top-3 left-3 z-10 flex items-center border border-outline bg-surface-container-lowest/95 shadow-lg backdrop-blur" dir="ltr">
        <button type="button" className={toolBtn} onClick={() => zoomBy(1 / 1.2)} aria-label="کوچک‌نمایی" title="کوچک‌نمایی">
          <Icon name="remove" className="h-4 w-4" />
        </button>
        <span className="w-12 text-center font-mono text-[11px] text-on-surface-variant">{Math.round(z * 100)}%</span>
        <button type="button" className={toolBtn} onClick={() => zoomBy(1.2)} aria-label="بزرگ‌نمایی" title="بزرگ‌نمایی">
          <Icon name="add" className="h-4 w-4" />
        </button>
        <button type="button" className={toolBtn} onClick={() => fitTo(project.parts)} aria-label="نمایش کل مدار" title="نمایش کل مدار">
          <Icon name="fit_screen" className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-outline" />
        <button type="button" className={toolBtn} disabled={!anySelectedPart} onClick={onRotateSelected} aria-label="چرخش" title="چرخش ۹۰° (R)">
          <Icon name="rotate_right" className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${toolBtn} hover:!text-error`}
          disabled={!selection.length}
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

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

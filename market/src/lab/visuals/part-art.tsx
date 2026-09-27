import type { ReactNode } from "react";
import type { ComponentDef } from "../types";

/**
 * Extruded, shaded (pseudo-3D) drawings of every lab part. Each drawing lives in the part's
 * own box (def.width × def.height) so the pin dots the canvas draws on top (pins[].x/.y)
 * always sit on the visible headers / legs. Gradients are defined once by <PartDefs/>.
 */

const MONO = "var(--font-mono)";

export function PartDefs() {
  return (
    <defs>
      <filter id="lab-shadow" x="-20%" y="-20%" width="150%" height="160%">
        <feDropShadow dx="3" dy="5" stdDeviation="3" floodColor="#000" floodOpacity=".55" />
      </filter>
      <linearGradient id="lab-pcb" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0f8a7e" />
        <stop offset="1" stopColor="#0a5f57" />
      </linearGradient>
      <linearGradient id="lab-pcb-blue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2563c9" />
        <stop offset="1" stopColor="#173f88" />
      </linearGradient>
      <linearGradient id="lab-pcb-green" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#1f9d55" />
        <stop offset="1" stopColor="#136b3a" />
      </linearGradient>
      <linearGradient id="lab-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e5e7eb" />
        <stop offset=".5" stopColor="#9ca3af" />
        <stop offset="1" stopColor="#6b7280" />
      </linearGradient>
      <linearGradient id="lab-black" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2b2b36" />
        <stop offset="1" stopColor="#111118" />
      </linearGradient>
      <radialGradient id="lab-dome" cx=".35" cy=".3" r=".8">
        <stop offset="0" stopColor="#fff" stopOpacity=".85" />
        <stop offset=".25" stopColor="#ff6b6b" stopOpacity=".9" />
        <stop offset="1" stopColor="#a31212" />
      </radialGradient>
      <radialGradient id="lab-dome-on" cx=".4" cy=".35" r=".8">
        <stop offset="0" stopColor="#fff" />
        <stop offset=".35" stopColor="#ff8a8a" />
        <stop offset="1" stopColor="#ef2b2b" />
      </radialGradient>
      <radialGradient id="lab-dome-white" cx=".35" cy=".3" r=".85">
        <stop offset="0" stopColor="#fff" />
        <stop offset="1" stopColor="#cfd5df" />
      </radialGradient>
    </defs>
  );
}

/** Extruded slab: a darker offset "side" first, then the lit top face with a specular edge. */
function Slab({
  x, y, w, h, d = 5, top, side = "#000", r = 3, stroke,
}: {
  x: number; y: number; w: number; h: number; d?: number; top: string; side?: string; r?: number; stroke?: string;
}) {
  return (
    <g>
      <rect x={x + d} y={y + d} width={w} height={h} rx={r} fill={side} opacity=".85" />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={top} stroke={stroke} strokeWidth={stroke ? 0.8 : 0} />
      <rect x={x + 1} y={y + 1} width={w - 2} height={Math.min(4, h / 3)} rx={r} fill="#fff" opacity=".13" />
    </g>
  );
}

function Lead({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return <rect x={x - 1.2} y={Math.min(y1, y2)} width="2.4" height={Math.abs(y2 - y1)} fill="url(#lab-metal)" />;
}

/** Female header strip with gold contacts centred on the given pin positions. */
function Header({ cx, ys, width = 12 }: { cx: number; ys: number[]; width?: number }) {
  if (!ys.length) return null;
  const top = Math.min(...ys) - 6;
  const bottom = Math.max(...ys) + 6;
  return (
    <g>
      <rect x={cx - width / 2 + 2} y={top + 2} width={width} height={bottom - top} fill="#000" opacity=".6" />
      <rect x={cx - width / 2} y={top} width={width} height={bottom - top} fill="url(#lab-black)" />
      {ys.map((y) => (
        <rect key={y} x={cx - 1.8} y={y - 1.8} width="3.6" height="3.6" fill="#d4af37" />
      ))}
    </g>
  );
}

function Label({ x, y, text, size = 8, fill = "#e5e7eb", anchor = "middle" }: { x: number; y: number; text: string; size?: number; fill?: string; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={fill} fontFamily={MONO} style={{ pointerEvents: "none", userSelect: "none" }}>
      {text}
    </text>
  );
}

function pinYs(def: ComponentDef, x: number) {
  return def.pins.filter((p) => Math.abs(p.x - x) < 1).map((p) => p.y);
}

function Uno({ def }: { def: ComponentDef }) {
  const { width: w } = def;
  const h = Math.max(def.height, ...def.pins.map((p) => p.y + 12));
  return (
    <g>
      <Slab x={0} y={0} w={w} h={h} d={6} top="url(#lab-pcb)" side="#063b37" r={8} stroke="#0a3d38" />
      {/* USB-B + DC barrel jack */}
      <Slab x={52} y={4} w={58} h={38} d={5} top="url(#lab-metal)" side="#6b7280" r={2} />
      <Slab x={124} y={4} w={46} h={32} d={5} top="url(#lab-black)" side="#000" r={2} />
      <Header cx={8} ys={pinYs(def, 8)} />
      <Header cx={200} ys={pinYs(def, 200)} />
      {/* ATmega328P DIP */}
      <Slab x={60} y={96} w={96} h={30} d={4} top="url(#lab-black)" side="#000" r={2} />
      {Array.from({ length: 14 }, (_, i) => (
        <g key={i}>
          <rect x={63 + i * 6.5} y={92} width="2.4" height="5" fill="url(#lab-metal)" />
          <rect x={63 + i * 6.5} y={125} width="2.4" height="5" fill="url(#lab-metal)" />
        </g>
      ))}
      <circle cx={66} cy={104} r={2} fill="#3f3f46" />
      <Label x={108} y={115} text="ATmega328P" size={7} fill="#9ca3af" />
      {/* 16 MHz crystal, reset button, status LEDs */}
      <Slab x={84} y={148} w={28} h={12} d={3} top="url(#lab-metal)" side="#6b7280" r={6} />
      <Label x={98} y={170} text="16MHz" size={5} fill="#a7f3d0" />
      <circle cx={42} cy={62} r={7} fill="#dc2626" stroke="#7f1d1d" />
      <circle cx={40} cy={60} r={2.2} fill="#fff" opacity=".45" />
      <Label x={42} y={80} text="RESET" size={6} fill="#a7f3d0" />
      <rect x={160} y={60} width="7" height="4" fill="#f59e0b" />
      <Label x={172} y={64} text="L" size={5} fill="#a7f3d0" anchor="start" />
      <Label x={108} y={h - 26} text="ARDUINO UNO" size={9} fill="#d1fae5" />
      <Label x={108} y={h - 15} text="R3 · ATmega328P" size={6} fill="#a7f3d0" />
    </g>
  );
}

function Nano({ def }: { def: ComponentDef }) {
  const { width: w } = def;
  const h = Math.max(def.height, ...def.pins.map((p) => p.y + 10));
  return (
    <g>
      <Slab x={0} y={0} w={w} h={h} d={5} top="url(#lab-pcb-blue)" side="#0c2450" r={5} stroke="#0c2450" />
      <Header cx={8} ys={pinYs(def, 8)} width={11} />
      <Header cx={120} ys={pinYs(def, 120)} width={11} />
      <Slab x={40} y={h - 26} w={50} h={22} d={4} top="url(#lab-metal)" side="#6b7280" r={2} />
      <Slab x={42} y={86} w={46} h={46} d={4} top="url(#lab-black)" side="#000" r={2} />
      <Label x={65} y={112} text="ATmega" size={6} fill="#9ca3af" />
      <Label x={65} y={60} text="NANO" size={10} fill="#dbeafe" />
    </g>
  );
}

function Breadboard({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  return (
    <g>
      <Slab x={0} y={0} w={w} h={h} d={7} top="#f3f0e6" side="#b8b29a" r={6} stroke="#cfc9b3" />
      <rect x={18} y={8} width={w - 26} height={3} fill="#dc2626" opacity=".85" />
      <rect x={18} y={h - 22} width={w - 26} height={3} fill="#2563eb" opacity=".85" />
      <rect x={6} y={h / 2 - 3} width={w - 12} height={6} fill="#d8d3c0" />
      {Array.from({ length: 30 }, (_, c) =>
        [0, 1].map((band) =>
          [0, 1, 2, 3, 4].map((r) => (
            <rect key={`${c}-${band}-${r}`} x={20 + c * 8.4} y={(band ? h / 2 + 8 : 20) + r * 9} width="3" height="3" fill="#6b7280" opacity=".7" />
          )),
        ),
      )}
      <Label x={20} y={h - 6} text="830" size={7} fill="#8a8470" anchor="start" />
    </g>
  );
}

function Led({ def, on }: { def: ComponentDef; on: boolean }) {
  const cx = def.width / 2;
  const cy = def.height / 2;
  return (
    <g>
      {on && <circle cx={cx} cy={cy} r={24} fill="#ef4444" opacity=".35" />}
      <Lead x={cx} y1={8} y2={cy - 12} />
      <Lead x={cx} y1={cy + 12} y2={def.height - 8} />
      <circle cx={cx + 2} cy={cy + 3} r={13} fill="#000" opacity=".5" />
      <circle cx={cx} cy={cy} r={13} fill="#7f1d1d" />
      <circle cx={cx} cy={cy} r={11} fill={on ? "url(#lab-dome-on)" : "url(#lab-dome)"} />
      <path d={`M${cx - 13} ${cy + 5} h26`} stroke="#450a0a" strokeWidth="1.4" />
      <ellipse cx={cx - 4} cy={cy - 4} rx={3} ry={4.5} fill="#fff" opacity=".6" />
    </g>
  );
}

function LedRgb({ def }: { def: ComponentDef }) {
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={20} />
      ))}
      <circle cx={42} cy={27} r={12} fill="#000" opacity=".45" />
      <circle cx={40} cy={25} r={12} fill="url(#lab-dome-white)" stroke="#9ca3af" strokeWidth=".8" />
      <circle cx={36} cy={27} r={2.6} fill="#ef4444" />
      <circle cx={40} cy={22} r={2.6} fill="#22c55e" />
      <circle cx={44} cy={27} r={2.6} fill="#3b82f6" />
    </g>
  );
}

const BANDS: Record<string, string[]> = {
  "resistor-220": ["#dc2626", "#dc2626", "#7a4a1f", "#d4af37"],
  "resistor-10k": ["#7a4a1f", "#111118", "#f97316", "#d4af37"],
};

function Resistor({ def }: { def: ComponentDef }) {
  const { width: w, height: h, id } = def;
  const bands = BANDS[id] ?? BANDS["resistor-220"];
  return (
    <g>
      <rect x={4} y={h / 2 - 1.2} width={w - 8} height={2.4} fill="url(#lab-metal)" />
      <rect x={20} y={h / 2 - 7} width={w - 36} height={17} rx={8} fill="#000" opacity=".45" />
      <rect x={18} y={h / 2 - 9} width={w - 36} height={17} rx={8} fill="#d9b98a" />
      <rect x={22} y={h / 2 - 8} width={w - 44} height={4} rx={2} fill="#fff" opacity=".3" />
      {bands.map((c, i) => (
        <rect key={i} x={26 + i * 8.5} y={h / 2 - 9} width="4" height="17" fill={c} />
      ))}
    </g>
  );
}

function Button({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  return (
    <g>
      {def.pins.map((p) => (
        <rect key={p.id} x={p.x - 2} y={p.y - 2} width="4" height="4" fill="url(#lab-metal)" />
      ))}
      <Slab x={10} y={10} w={w - 20} h={h - 20} d={4} top="url(#lab-black)" side="#000" r={3} />
      <circle cx={w / 2} cy={h / 2} r={9} fill="#e11d48" stroke="#7f1d1d" />
      <circle cx={w / 2 - 3} cy={h / 2 - 3} r={3} fill="#fff" opacity=".4" />
    </g>
  );
}

function Pot({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={16} />
      ))}
      <Slab x={6} y={14} w={w - 12} h={h - 18} d={4} top="url(#lab-pcb-blue)" side="#0c2450" r={4} />
      <circle cx={w / 2 + 2} cy={h / 2 + 7} r={13} fill="#000" opacity=".5" />
      <circle cx={w / 2} cy={h / 2 + 5} r={13} fill="url(#lab-metal)" stroke="#4b5563" />
      <rect x={w / 2 - 1.5} y={h / 2 - 7} width="3" height="12" fill="#1f2937" />
    </g>
  );
}

function Buzzer({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  return (
    <g>
      <circle cx={w / 2 + 3} cy={h / 2 + 3} r={14} fill="#000" opacity=".6" />
      <circle cx={w / 2} cy={h / 2} r={14} fill="url(#lab-black)" stroke="#3f3f46" />
      <circle cx={w / 2} cy={h / 2} r={3.5} fill="#0a0a0f" stroke="#52525b" />
      <Label x={w / 2 + 8} y={h / 2 - 6} text="+" size={8} fill="#9ca3af" />
    </g>
  );
}

function Servo({ def }: { def: ComponentDef }) {
  const { width: w } = def;
  const wires: [number, string][] = [
    [10, "#7a4a1f"],
    [30, "#dc2626"],
    [50, "#f97316"],
  ];
  return (
    <g>
      {wires.map(([x, c]) => (
        <path key={x} d={`M${x} 60 V50 Q${x} 44 ${x + 6} 44`} stroke={c} strokeWidth="2.6" fill="none" />
      ))}
      <Slab x={4} y={12} w={w - 8} h={32} d={5} top="url(#lab-pcb-blue)" side="#0c2450" r={3} />
      <Slab x={0} y={20} w={8} h={16} d={2} top="#1d4ed8" side="#0c2450" r={1} />
      <Slab x={w - 8} y={20} w={8} h={16} d={2} top="#1d4ed8" side="#0c2450" r={1} />
      <circle cx={48} cy={20} r={9} fill="url(#lab-dome-white)" stroke="#9ca3af" />
      <rect x={30} y={17} width="18" height="6" rx={3} fill="#f3f4f6" stroke="#9ca3af" strokeWidth=".6" />
      <Label x={22} y={37} text="SG90" size={7} fill="#dbeafe" />
    </g>
  );
}

function Dht22({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={16} />
      ))}
      <Slab x={6} y={14} w={w - 12} h={h - 18} d={4} top="#f8fafc" side="#94a3b8" r={4} />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={16 + i * 9} y={19} width="4" height="14" rx={2} fill="#94a3b8" />
      ))}
      <Label x={w / 2} y={h - 7} text="DHT22" size={7} fill="#475569" />
    </g>
  );
}

function HcSr04({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={h - 18} />
      ))}
      <Slab x={2} y={2} w={w - 4} h={h - 20} d={4} top="url(#lab-pcb-blue)" side="#0c2450" r={3} />
      {[24, 66].map((cx) => (
        <g key={cx}>
          <circle cx={cx + 3} cy={23} r={14} fill="#000" opacity=".6" />
          <circle cx={cx} cy={20} r={14} fill="url(#lab-metal)" stroke="#4b5563" />
          <circle cx={cx} cy={20} r={9} fill="#374151" />
          <circle cx={cx} cy={20} r={4} fill="#111827" />
        </g>
      ))}
      <Label x={w / 2} y={h - 22} text="HC-SR04" size={5} fill="#dbeafe" />
    </g>
  );
}

function Pir({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={h - 18} />
      ))}
      <Slab x={2} y={4} w={w - 4} h={h - 22} d={4} top="url(#lab-pcb-green)" side="#0c3d20" r={3} />
      <circle cx={w / 2 + 3} cy={22} r={17} fill="#000" opacity=".5" />
      <circle cx={w / 2} cy={19} r={17} fill="url(#lab-dome-white)" stroke="#9ca3af" />
      {[-7, 0, 7].map((dx) => (
        <path key={dx} d={`M${w / 2 + dx} 6 v26`} stroke="#cbd5e1" strokeWidth="1" />
      ))}
    </g>
  );
}

function Lcd({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={h - 16} />
      ))}
      <Slab x={0} y={0} w={w} h={h - 16} d={5} top="url(#lab-pcb-green)" side="#0c3d20" r={3} />
      <rect x={8} y={7} width={w - 16} height={40} fill="#0a0a0f" />
      <rect x={11} y={10} width={w - 22} height={34} fill="#1d5fa8" />
      {[0, 1].map((row) =>
        Array.from({ length: 16 }, (_, i) => (
          <rect key={`${row}-${i}`} x={14 + i * 8.4} y={15 + row * 14} width="6" height="10" fill="#dbeafe" opacity=".25" />
        )),
      )}
      <Label x={w - 10} y={h - 20} text="1602 I2C" size={6} fill="#bbf7d0" anchor="end" />
    </g>
  );
}

function Oled({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={h - 16} />
      ))}
      <Slab x={2} y={2} w={w - 4} h={h - 18} d={4} top="url(#lab-black)" side="#000" r={3} stroke="#3f3f46" />
      <rect x={9} y={7} width={w - 18} height={26} fill="#020617" stroke="#334155" />
      <path d="M13 26 l8 -10 l7 6 l9 -12 l9 8 l10 -6 l8 4" stroke="#38bdf8" strokeWidth="1.6" fill="none" />
      <Label x={w / 2} y={h - 20} text="OLED 128×64" size={5} fill="#94a3b8" />
    </g>
  );
}

function Fallback({ def }: { def: ComponentDef }) {
  return (
    <g>
      <Slab x={0} y={0} w={def.width} h={def.height} d={5} top="url(#lab-pcb)" side="#063b37" r={6} />
      <Label x={def.width / 2} y={def.height / 2 + 3} text={def.name} size={9} />
    </g>
  );
}

/** The drawing for one part, in its own coordinate box. `on` lights LEDs. */
export function PartArt({ def, on = false }: { def: ComponentDef; on?: boolean }): ReactNode {
  let art: ReactNode;
  switch (def.id) {
    case "arduino-uno": art = <Uno def={def} />; break;
    case "arduino-nano": art = <Nano def={def} />; break;
    case "breadboard": art = <Breadboard def={def} />; break;
    case "led-red": art = <Led def={def} on={on} />; break;
    case "led-rgb": art = <LedRgb def={def} />; break;
    case "resistor-220":
    case "resistor-10k": art = <Resistor def={def} />; break;
    case "button": art = <Button def={def} />; break;
    case "potentiometer": art = <Pot def={def} />; break;
    case "buzzer": art = <Buzzer def={def} />; break;
    case "servo-sg90": art = <Servo def={def} />; break;
    case "dht22": art = <Dht22 def={def} />; break;
    case "hc-sr04": art = <HcSr04 def={def} />; break;
    case "pir": art = <Pir def={def} />; break;
    case "lcd-1602": art = <Lcd def={def} />; break;
    case "oled-128x64": art = <Oled def={def} />; break;
    default: art = <Fallback def={def} />;
  }
  return <g filter="url(#lab-shadow)">{art}</g>;
}

/** Visual extent of a part drawing (some boards draw headers past def.height). */
export function artHeight(def: ComponentDef) {
  return Math.max(def.height, ...def.pins.map((p) => p.y + 12));
}

/**
 * Render once per page. Gradient ids must be unique in the document, and gradients that live
 * inside a `display:none` subtree stop painting for every other SVG — so the defs sit in a
 * zero-size, always-rendered sprite that all part drawings reference.
 */
export function PartDefsSprite() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <PartDefs />
    </svg>
  );
}

/** Standalone thumbnail (parts palette, BOM, inspector fallback). Needs <PartDefsSprite/> on the page. */
export function PartThumb({ def, className, on = false }: { def: ComponentDef; className?: string; on?: boolean }) {
  const pad = 10;
  const h = artHeight(def);
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${def.width + pad * 2 + 8} ${h + pad * 2 + 8}`}
      className={className ?? "h-full w-full"}
      aria-hidden="true"
      style={{ direction: "ltr" }}
    >
      <PartArt def={def} on={on} />
    </svg>
  );
}

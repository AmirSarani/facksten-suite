import type { ReactNode } from "react";
import type { ComponentDef, PlacedPart } from "../types";
import { LED_COLORS, ledColor, resistorBands, resistorOhms } from "../part-props";

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
      <radialGradient id="lab-dome-shade" cx=".35" cy=".3" r=".9">
        <stop offset="0" stopColor="#fff" stopOpacity=".55" />
        <stop offset=".35" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity=".45" />
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

function Lead({ x, y1, y2, w = 2 }: { x: number; y1: number; y2: number; w?: number }) {
  return <rect x={x - w / 2} y={Math.min(y1, y2)} width={w} height={Math.abs(y2 - y1)} fill="url(#lab-metal)" />;
}

/** Horizontal female header with a gold contact on every pin of the row. */
function HeaderRow({ xs, y, h = 9 }: { xs: number[]; y: number; h?: number }) {
  if (!xs.length) return null;
  const x1 = Math.min(...xs) - 5;
  const x2 = Math.max(...xs) + 5;
  return (
    <g>
      <rect x={x1 + 1.5} y={y - h / 2 + 1.5} width={x2 - x1} height={h} fill="#000" opacity=".6" />
      <rect x={x1} y={y - h / 2} width={x2 - x1} height={h} rx={1} fill="url(#lab-black)" />
      {xs.map((x) => (
        <rect key={x} x={x - 1.6} y={y - 1.6} width="3.2" height="3.2" fill="#d4af37" />
      ))}
    </g>
  );
}

function Label({ x, y, text, size = 8, fill = "#e5e7eb", anchor = "middle", rotate }: { x: number; y: number; text: string; size?: number; fill?: string; anchor?: "start" | "middle" | "end"; rotate?: number }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      fill={fill}
      fontFamily={MONO}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {text}
    </text>
  );
}

/** Group a part's pins into header rows (same y, consecutive 0.1" steps). */
function headerRows(def: ComponentDef) {
  const byY = new Map<number, number[]>();
  for (const p of def.pins) byY.set(p.y, [...(byY.get(p.y) ?? []), p.x]);
  const rows: { y: number; xs: number[] }[] = [];
  for (const [y, xs] of byY) {
    const sorted = [...xs].sort((a, b) => a - b);
    let run: number[] = [];
    for (const x of sorted) {
      if (run.length && x - run[run.length - 1] > 10) {
        rows.push({ y, xs: run });
        run = [];
      }
      run.push(x);
    }
    if (run.length) rows.push({ y, xs: run });
  }
  return rows;
}

/** Tiny silkscreen pin names beside a header, like the real board. */
function PinNames({ def, side, fill = "#d1fae5" }: { def: ComponentDef; side: "below" | "above"; fill?: string }) {
  return (
    <g>
      {def.pins.map((p) => {
        const below = side === "below" ? p.y < def.height / 2 : p.y > def.height / 2;
        const y = below ? p.y + 8 : p.y - 8;
        return <Label key={p.id} x={p.x + 1.6} y={y} text={p.label.replace("/LED", "").replace("/SDA", "").replace("/SCL", "")} size={3.6} fill={fill} anchor={below ? "end" : "start"} rotate={-90} />;
      })}
    </g>
  );
}

function Uno({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  return (
    <g>
      <Slab x={0} y={0} w={w} h={h} d={5} top="url(#lab-pcb)" side="#063b37" r={7} stroke="#0a3d38" />
      {/* mounting holes */}
      {[[14, 14], [w - 14, 24], [w - 14, h - 14], [60, h - 10]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3.2} fill="#0a0a0f" stroke="#cbd5e1" strokeWidth=".8" />
      ))}
      {/* USB-B (overhangs the left edge) and DC barrel jack */}
      <Slab x={-12} y={34} w={52} h={46} d={4} top="url(#lab-metal)" side="#6b7280" r={2} />
      <rect x={-8} y={44} width={10} height={26} fill="#4b5563" />
      <Slab x={-8} y={150} w={46} h={36} d={4} top="url(#lab-black)" side="#000" r={2} />
      <circle cx={6} cy={168} r={6} fill="#0a0a0f" stroke="#3f3f46" />
      {headerRows(def).map((r) => (
        <HeaderRow key={`${r.y}-${r.xs[0]}`} xs={r.xs} y={r.y} />
      ))}
      <PinNames def={def} side="below" />
      <Label x={225} y={50} text="DIGITAL (PWM ~)" size={5} fill="#a7f3d0" />
      <Label x={130} y={186} text="POWER" size={5} fill="#a7f3d0" />
      <Label x={225} y={186} text="ANALOG IN" size={5} fill="#a7f3d0" />
      {/* ATmega328P DIP-28 */}
      <Slab x={110} y={124} w={140} h={26} d={3} top="url(#lab-black)" side="#000" r={2} />
      {Array.from({ length: 14 }, (_, i) => (
        <g key={i}>
          <rect x={115 + i * 9.6} y={120} width="2.4" height="5" fill="url(#lab-metal)" />
          <rect x={115 + i * 9.6} y={149} width="2.4" height="5" fill="url(#lab-metal)" />
        </g>
      ))}
      <circle cx={116} cy={137} r={2} fill="#3f3f46" />
      <Label x={180} y={140} text="ATMEGA328P-PU" size={6.5} fill="#9ca3af" />
      {/* crystal, reset, LEDs */}
      <Slab x={80} y={96} w={26} h={10} d={2} top="url(#lab-metal)" side="#6b7280" r={5} />
      <Label x={93} y={115} text="16MHz" size={4} fill="#a7f3d0" />
      <circle cx={30} cy={22} r={6} fill="#dc2626" stroke="#7f1d1d" />
      <circle cx={28.5} cy={20.5} r={1.8} fill="#fff" opacity=".45" />
      <Label x={30} y={36} text="RESET" size={4} fill="#a7f3d0" />
      {[["L", 64], ["TX", 76], ["RX", 88], ["ON", 100]].map(([t, y]) => (
        <g key={t}>
          <rect x={150} y={Number(y) - 3} width="7" height="4" fill={t === "ON" ? "#22c55e" : "#f59e0b"} opacity=".9" />
          <Label x={160} y={Number(y) + 1} text={String(t)} size={4} fill="#a7f3d0" anchor="start" />
        </g>
      ))}
      <Label x={212} y={92} text="UNO" size={18} fill="#d1fae5" />
      <Label x={212} y={106} text="ARDUINO" size={7} fill="#a7f3d0" />
    </g>
  );
}

function Nano({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  return (
    <g>
      <Slab x={0} y={0} w={w} h={h} d={4} top="url(#lab-pcb-blue)" side="#0c2450" r={3} stroke="#0c2450" />
      {/* mini-USB at the left */}
      <Slab x={-8} y={28} w={26} h={24} d={3} top="url(#lab-metal)" side="#6b7280" r={2} />
      {def.pins.map((p) => (
        <g key={p.id}>
          <circle cx={p.x} cy={p.y} r={3.6} fill="#d4af37" />
          <circle cx={p.x} cy={p.y} r={1.6} fill="#1e3a8a" />
        </g>
      ))}
      <PinNames def={def} side="below" fill="#dbeafe" />
      <Slab x={78} y={28} w={26} h={26} d={3} top="url(#lab-black)" side="#000" r={2} />
      <Label x={91} y={43} text="328P" size={5} fill="#9ca3af" />
      <circle cx={40} cy={40} r={4} fill="#e5e7eb" stroke="#64748b" />
      <Label x={140} y={44} text="NANO" size={9} fill="#dbeafe" />
    </g>
  );
}

function Breadboard({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  const holes = def.pins;
  const rowY: Record<string, number> = {};
  for (const p of holes) {
    const m = /^([a-j])1$/.exec(p.id);
    if (m) rowY[m[1]] = p.y;
  }
  const colX = (c: number) => holes.find((p) => p.id === `a${c}`)?.x ?? 0;
  const rails = [
    { y: holes.find((p) => p.id === "tp1")?.y ?? 20, color: "#dc2626", sign: "+" },
    { y: holes.find((p) => p.id === "tn1")?.y ?? 30, color: "#2563eb", sign: "−" },
    { y: holes.find((p) => p.id === "bp1")?.y ?? 200, color: "#dc2626", sign: "+" },
    { y: holes.find((p) => p.id === "bn1")?.y ?? 210, color: "#2563eb", sign: "−" },
  ];
  const trenchY = ((rowY.e ?? 100) + (rowY.f ?? 130)) / 2;
  return (
    <g>
      <Slab x={0} y={0} w={w} h={h} d={6} top="#f4f1e8" side="#b8b29a" r={5} stroke="#d6d0bb" />
      {/* rail stripes sit outside each rail pair */}
      {rails.map((r, i) => {
        const y = i % 2 === 0 ? r.y - 6 : r.y + 6;
        const outer = i === 0 || i === 3;
        return (
          <g key={i}>
            <rect x={20} y={outer ? (i === 0 ? r.y - 7 : r.y + 6) : y - 0.75} width={w - 40} height={1.5} fill={r.color} opacity=".8" />
            <Label x={12} y={r.y + 2.5} text={r.sign} size={7} fill={r.color} />
            <Label x={w - 12} y={r.y + 2.5} text={r.sign} size={7} fill={r.color} />
          </g>
        );
      })}
      {/* centre trench */}
      <rect x={6} y={trenchY - 5} width={w - 12} height={10} fill="#ddd8c4" />
      <rect x={6} y={trenchY - 5} width={w - 12} height={2} fill="#c9c3ad" />
      {/* holes */}
      {holes.map((p) => (
        <rect key={p.id} x={p.x - 1.7} y={p.y - 1.7} width="3.4" height="3.4" rx=".6" fill="#3f3f46" opacity=".85" />
      ))}
      {/* row letters and every-5th column numbers */}
      {Object.entries(rowY).map(([r, y]) => (
        <g key={r}>
          <Label x={16} y={y + 2} text={r} size={5} fill="#8a8470" />
          <Label x={w - 16} y={y + 2} text={r} size={5} fill="#8a8470" />
        </g>
      ))}
      {Array.from({ length: 13 }, (_, i) => (i === 0 ? 1 : i * 5)).map((c) => (
        <g key={c}>
          <Label x={colX(c)} y={(rowY.a ?? 60) - 7} text={String(c)} size={4.5} fill="#8a8470" />
          <Label x={colX(c)} y={(rowY.j ?? 170) + 11} text={String(c)} size={4.5} fill="#8a8470" />
        </g>
      ))}
    </g>
  );
}

function Led({ def, on, level = on ? 1 : 0, color = "#ef4444" }: { def: ComponentDef; on: boolean; level?: number; color?: string }) {
  const cathode = def.pins.find((p) => p.id === "cathode")!;
  const anode = def.pins.find((p) => p.id === "anode")!;
  const cx = (cathode.x + anode.x) / 2;
  const cy = cathode.y - 11;
  return (
    <g>
      {level > 0.02 && <circle cx={cx} cy={cy} r={8 + 14 * level} fill={color} opacity={0.15 + 0.3 * level} />}
      {/* leads: anode is the longer, bent one */}
      <path d={`M${cathode.x} ${cathode.y} V${cy + 4}`} stroke="url(#lab-metal)" strokeWidth="1.6" fill="none" />
      <path d={`M${anode.x} ${anode.y} V${cy + 7} L${anode.x - 2} ${cy + 4}`} stroke="url(#lab-metal)" strokeWidth="1.6" fill="none" />
      <circle cx={cx + 1.5} cy={cy + 2} r={9} fill="#000" opacity=".45" />
      <circle cx={cx} cy={cy} r={9} fill={color} />
      <circle cx={cx} cy={cy} r={9} fill="#000" opacity=".45" />
      {/* tinted epoxy: dim when off, bright with a hot core when lit */}
      <circle cx={cx} cy={cy} r={7.6} fill={color} opacity={0.55 + 0.45 * Math.min(1, level)} />
      <circle cx={cx} cy={cy} r={7.6} fill="url(#lab-dome-shade)" />
      {level > 0.02 && <circle cx={cx} cy={cy} r={4.5} fill="#fff" opacity={0.6 * Math.min(1, level)} />}
      {/* flat edge marks the cathode */}
      <path d={`M${cx - 8.6} ${cy - 3.5} v7`} stroke="#450a0a" strokeWidth="1.4" />
      <ellipse cx={cx - 2.6} cy={cy - 2.8} rx={2} ry={3} fill="#fff" opacity=".6" />
    </g>
  );
}

function LedRgb({ def }: { def: ComponentDef }) {
  const y = def.pins[0].y;
  const cx = def.width / 2;
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={y - (p.id === "gnd" ? 22 : 16)} w={1.6} />
      ))}
      <circle cx={cx + 1.5} cy={y - 22} r={11} fill="#000" opacity=".45" />
      <circle cx={cx} cy={y - 24} r={11} fill="url(#lab-dome-white)" stroke="#9ca3af" strokeWidth=".8" />
      <circle cx={cx - 4} cy={y - 22} r={2.4} fill="#ef4444" />
      <circle cx={cx} cy={y - 27} r={2.4} fill="#22c55e" />
      <circle cx={cx + 4} cy={y - 22} r={2.4} fill="#3b82f6" />
    </g>
  );
}

function Resistor({ def, ohms }: { def: ComponentDef; ohms: number }) {
  const [a, b] = def.pins;
  const y = a.y;
  const bodyX = a.x + 7;
  const bodyW = b.x - a.x - 14;
  return (
    <g>
      <rect x={a.x} y={y - 0.9} width={b.x - a.x} height={1.8} fill="url(#lab-metal)" />
      <rect x={bodyX + 1.5} y={y - 4} width={bodyW} height={9} rx={4} fill="#000" opacity=".4" />
      <rect x={bodyX} y={y - 5} width={bodyW} height={10} rx={4.5} fill="#d9b98a" />
      <rect x={bodyX + 3} y={y - 4.5} width={bodyW - 6} height={2.4} rx={1.2} fill="#fff" opacity=".3" />
      {resistorBands(ohms).map((c, i) => (
        <rect key={i} x={bodyX + 4 + i * (i === 3 ? 6.5 : 4.6)} y={y - 5} width="2.4" height="10" fill={c} />
      ))}
    </g>
  );
}

function Button({ def, pressed = false }: { def: ComponentDef; pressed?: boolean }) {
  const { width: w, height: h } = def;
  return (
    <g>
      {def.pins.map((p) => (
        <rect key={p.id} x={p.x - 1.4} y={p.y - 1.4} width="2.8" height="2.8" fill="url(#lab-metal)" />
      ))}
      <Slab x={6} y={6} w={w - 12} h={h - 12} d={3} top="url(#lab-black)" side="#000" r={3} />
      <circle cx={w / 2} cy={h / 2} r={10} fill="#1f2937" />
      <circle cx={w / 2 + (pressed ? 1 : 0)} cy={h / 2 + (pressed ? 1 : 0)} r={pressed ? 7 : 8} fill={pressed ? "#9f1239" : "#e11d48"} stroke="#7f1d1d" />
      {!pressed && <circle cx={w / 2 - 2.5} cy={h / 2 - 2.5} r={2.6} fill="#fff" opacity=".4" />}
    </g>
  );
}

function Pot({ def, value = 0.5 }: { def: ComponentDef; value?: number }) {
  const { width: w } = def;
  const y = def.pins[0].y;
  const knobY = (y - 10) / 2 + 2;
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={y - 12} w={1.8} />
      ))}
      <Slab x={2} y={4} w={w - 4} h={y - 14} d={3} top="url(#lab-pcb-blue)" side="#0c2450" r={3} />
      <circle cx={w / 2 + 1.5} cy={(y - 10) / 2 + 3.5} r={13} fill="#000" opacity=".45" />
      <circle cx={w / 2} cy={(y - 10) / 2 + 2} r={13} fill="url(#lab-metal)" stroke="#4b5563" />
      <rect x={w / 2 - 1.4} y={knobY - 11} width="2.8" height="11" fill="#1f2937" transform={`rotate(${-135 + 270 * value} ${w / 2} ${knobY})`} />
    </g>
  );
}

function Buzzer({ def }: { def: ComponentDef }) {
  const { width: w } = def;
  const y = def.pins[0].y;
  const cy = y - 16;
  return (
    <g>
      <circle cx={w / 2 + 2} cy={cy + 2} r={17} fill="#000" opacity=".55" />
      <circle cx={w / 2} cy={cy} r={17} fill="url(#lab-black)" stroke="#3f3f46" />
      <circle cx={w / 2} cy={cy} r={3} fill="#0a0a0f" stroke="#52525b" />
      <Label x={def.pins[0].x + 4} y={y - 3} text="+" size={7} fill="#e5e7eb" />
    </g>
  );
}

function Servo({ def, angle = 90 }: { def: ComponentDef; angle?: number }) {
  const { width: w } = def;
  const colors: Record<string, string> = { gnd: "#7a4a1f", vcc: "#dc2626", sig: "#f97316" };
  const y = def.pins[0].y;
  return (
    <g>
      {def.pins.map((p) => (
        <path key={p.id} d={`M${p.x} ${p.y} V${y - 8}`} stroke={colors[p.id] ?? "#999"} strokeWidth="2.2" fill="none" />
      ))}
      <rect x={def.pins[0].x - 5} y={y - 4} width={def.pins[def.pins.length - 1].x - def.pins[0].x + 10} height={8} fill="url(#lab-black)" />
      <Slab x={4} y={2} w={w - 8} h={30} d={4} top="url(#lab-pcb-blue)" side="#0c2450" r={3} />
      <Slab x={-2} y={10} w={8} h={14} d={2} top="#1d4ed8" side="#0c2450" r={1} />
      <Slab x={w - 6} y={10} w={8} h={14} d={2} top="#1d4ed8" side="#0c2450" r={1} />
      <circle cx={58} cy={17} r={9} fill="url(#lab-dome-white)" stroke="#9ca3af" />
      <g transform={`rotate(${angle - 90} 58 17)`}>
        <rect x={40} y={14} width="21" height="6" rx={3} fill="#f3f4f6" stroke="#9ca3af" strokeWidth=".6" />
        <circle cx={44} cy={17} r={1.2} fill="#9ca3af" />
      </g>
      <circle cx={58} cy={17} r={2.2} fill="#9ca3af" />
      <Label x={24} y={21} text="SG90" size={7} fill="#dbeafe" />
    </g>
  );
}

function Dht22({ def }: { def: ComponentDef }) {
  const { width: w } = def;
  const y = def.pins[0].y;
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={y - 10} w={1.6} />
      ))}
      <Slab x={2} y={2} w={w - 4} h={y - 12} d={3} top="#f8fafc" side="#94a3b8" r={3} />
      {Array.from({ length: 4 }, (_, i) => (
        <rect key={i} x={9 + i * 9} y={8} width="4" height={y - 34} rx={2} fill="#94a3b8" />
      ))}
      <Label x={w / 2} y={y - 16} text="DHT22" size={6} fill="#475569" />
    </g>
  );
}

function HcSr04({ def }: { def: ComponentDef }) {
  const { width: w } = def;
  const y = def.pins[0].y;
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={y - 8} w={1.6} />
      ))}
      <Slab x={0} y={0} w={w} h={y - 8} d={3} top="url(#lab-pcb-blue)" side="#0c2450" r={2} />
      {[20, w - 20].map((cx) => (
        <g key={cx}>
          <circle cx={cx + 2} cy={16} r={13} fill="#000" opacity=".55" />
          <circle cx={cx} cy={14} r={13} fill="url(#lab-metal)" stroke="#4b5563" />
          <circle cx={cx} cy={14} r={8.5} fill="#374151" />
          <circle cx={cx} cy={14} r={3.5} fill="#111827" />
        </g>
      ))}
      <Label x={w / 2} y={y - 12} text="HC-SR04" size={4.5} fill="#dbeafe" />
    </g>
  );
}

function Pir({ def }: { def: ComponentDef }) {
  const { width: w } = def;
  const y = def.pins[0].y;
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={y - 8} w={1.6} />
      ))}
      <Slab x={0} y={0} w={w} h={y - 8} d={3} top="url(#lab-pcb-green)" side="#0c3d20" r={2} />
      <circle cx={w / 2 + 2} cy={(y - 8) / 2 + 2} r={17} fill="#000" opacity=".45" />
      <circle cx={w / 2} cy={(y - 8) / 2} r={17} fill="url(#lab-dome-white)" stroke="#9ca3af" />
      {[-7, 0, 7].map((dx) => (
        <path key={dx} d={`M${w / 2 + dx} ${(y - 8) / 2 - 15} v30`} stroke="#cbd5e1" strokeWidth="1" />
      ))}
    </g>
  );
}

function Lcd({ def }: { def: ComponentDef }) {
  const { width: w } = def;
  const y = def.pins[0].y;
  return (
    <g>
      {def.pins.map((p) => (
        <Lead key={p.id} x={p.x} y1={p.y} y2={y - 8} w={1.6} />
      ))}
      <Slab x={0} y={0} w={w} h={y - 8} d={4} top="url(#lab-pcb-green)" side="#0c3d20" r={3} />
      <rect x={8} y={7} width={w - 16} height={40} fill="#0a0a0f" />
      <rect x={11} y={10} width={w - 22} height={34} fill="#1d5fa8" />
      {[0, 1].map((row) =>
        Array.from({ length: 16 }, (_, i) => (
          <rect key={`${row}-${i}`} x={14 + i * 8.4} y={15 + row * 14} width="6" height="10" fill="#dbeafe" opacity=".25" />
        )),
      )}
      <Label x={w - 10} y={y - 12} text="1602 I2C" size={5} fill="#bbf7d0" anchor="end" />
    </g>
  );
}

function Oled({ def }: { def: ComponentDef }) {
  const { width: w, height: h } = def;
  const y = def.pins[0].y;
  return (
    <g>
      <Slab x={0} y={0} w={w} h={h} d={3} top="url(#lab-black)" side="#000" r={3} stroke="#3f3f46" />
      <HeaderRow xs={def.pins.map((p) => p.x)} y={y} h={8} />
      {def.pins.map((p) => (
        <Label key={p.id} x={p.x} y={y + 10} text={p.label} size={3.6} fill="#94a3b8" />
      ))}
      <rect x={7} y={y + 15} width={w - 14} height={h - y - 21} fill="#020617" stroke="#334155" />
      <path d={`M12 ${h - 14} l8 -10 l7 6 l9 -12 l9 8 l10 -6 l8 4`} stroke="#38bdf8" strokeWidth="1.4" fill="none" />
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
/** Live state from the simulation, drawn on the part. */
export type PartVisual = { level?: number; pressed?: boolean; angle?: number; value?: number };

export function PartArt({
  def,
  on = false,
  state,
  props,
}: {
  def: ComponentDef;
  on?: boolean;
  state?: PartVisual;
  /** Per-instance overrides (resistor value, LED colour). */
  props?: PlacedPart["props"];
}): ReactNode {
  const inst = { props };
  let art: ReactNode;
  switch (def.id) {
    case "arduino-uno": art = <Uno def={def} />; break;
    case "arduino-nano": art = <Nano def={def} />; break;
    case "breadboard": art = <Breadboard def={def} />; break;
    case "led-red": art = <Led def={def} on={on} level={state?.level} color={LED_COLORS[ledColor(inst, def)].hex} />; break;
    case "led-rgb": art = <LedRgb def={def} />; break;
    case "resistor-220":
    case "resistor-10k": art = <Resistor def={def} ohms={resistorOhms(inst, def)} />; break;
    case "button": art = <Button def={def} pressed={state?.pressed} />; break;
    case "potentiometer": art = <Pot def={def} value={state?.value} />; break;
    case "buzzer": art = <Buzzer def={def} />; break;
    case "servo-sg90": art = <Servo def={def} angle={state?.angle} />; break;
    case "dht22": art = <Dht22 def={def} />; break;
    case "hc-sr04": art = <HcSr04 def={def} />; break;
    case "pir": art = <Pir def={def} />; break;
    case "lcd-1602": art = <Lcd def={def} />; break;
    case "oled-128x64": art = <Oled def={def} />; break;
    default: art = <Fallback def={def} />;
  }
  return <g filter="url(#lab-shadow)">{art}</g>;
}

/** Visual extent of a part drawing. */
export function artHeight(def: ComponentDef) {
  return def.height;
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

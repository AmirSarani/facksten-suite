import type { ReactNode } from "react";

/**
 * Decorative illustrations for the lab "how it works" steps. Colors come from the design
 * tokens so they follow the theme; the text next to them carries the meaning (aria-hidden).
 */

const MONO = "var(--font-mono)";

function Frame({ id, children }: { id: string; children: ReactNode }) {
  return (
    // direction:ltr — the page is RTL, and SVG text would otherwise be mirrored/clipped.
    <svg viewBox="0 0 240 150" aria-hidden="true" className="block h-auto w-full" style={{ direction: "ltr" }}>
      <defs>
        <pattern id={`${id}-dots`} width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.9" fill="var(--outline)" />
        </pattern>
      </defs>
      <rect width="240" height="150" fill="var(--background)" />
      <rect width="240" height="150" fill={`url(#${id}-dots)`} opacity=".7" />
      {children}
    </svg>
  );
}

/** 1 — parts on the bench */
export function PlacePartsArt() {
  return (
    <Frame id="pp">
      {/* Arduino */}
      <rect x="14" y="26" width="86" height="98" fill="var(--surface-container-low)" stroke="var(--outline)" />
      <rect x="28" y="44" width="34" height="24" fill="none" stroke="var(--accent-tertiary)" strokeOpacity=".7" />
      <text x="45" y="59" textAnchor="middle" fontSize="8" fill="var(--accent-tertiary)" fontFamily={MONO}>ATmega</text>
      <text x="57" y="112" textAnchor="middle" fontSize="8" fill="var(--on-surface-variant)" fontFamily={MONO} letterSpacing="1.5">UNO</text>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x="96" y={36 + i * 14} width="8" height="6" fill="var(--on-surface-variant)" />
      ))}

      {/* resistor */}
      <path d="M118 46 H128 M168 46 H178" stroke="var(--on-surface-variant)" strokeWidth="2" />
      <rect x="128" y="39" width="40" height="14" fill="var(--surface-container)" stroke="var(--on-surface-variant)" />
      {[136, 146, 156].map((x, i) => (
        <rect key={x} x={x} y="39" width="4" height="14" fill={i === 2 ? "var(--primary-container)" : "var(--on-surface)"} opacity=".85" />
      ))}

      {/* LED */}
      <path d="M200 66 V88 M212 66 V82" stroke="var(--on-surface-variant)" strokeWidth="2" />
      <path d="M192 66 v-14 a14 14 0 0 1 28 0 v14 z" fill="var(--primary-container)" opacity=".9" />

      {/* ghost being placed */}
      <rect x="118" y="82" width="106" height="44" fill="none" stroke="var(--primary-container)" strokeDasharray="4 4" />
      <circle cx="171" cy="104" r="11" fill="var(--primary-container)" fillOpacity=".12" stroke="var(--primary-container)" />
      <path d="M171 98 v12 M165 104 h12" stroke="var(--primary-container)" strokeWidth="2" />
      <path d="M186 112 l16 6 -7 2 4 8 -3 1 -4 -8 -6 5z" fill="var(--on-surface)" stroke="var(--background)" strokeWidth="1" />
    </Frame>
  );
}

/** 2 — wiring with a live short-circuit warning */
export function WireUpArt() {
  return (
    <Frame id="wu">
      <rect x="12" y="22" width="44" height="106" fill="var(--surface-container-low)" stroke="var(--outline)" />
      <rect x="184" y="22" width="44" height="106" fill="var(--surface-container-low)" stroke="var(--outline)" />
      {[
        { y: 44, l: "D13", c: "var(--primary-container)" },
        { y: 76, l: "GND", c: "var(--on-surface-variant)" },
        { y: 108, l: "5V", c: "var(--error)" },
      ].map((p) => (
        <g key={p.l}>
          <circle cx="56" cy={p.y} r="4.5" fill={p.c} />
          <text x="34" y={p.y + 3} textAnchor="middle" fontSize="8" fill="var(--on-surface)" fontFamily={MONO}>{p.l}</text>
        </g>
      ))}
      {[
        { y: 44, l: "A" },
        { y: 76, l: "K" },
        { y: 108, l: "5V" },
      ].map((p) => (
        <g key={p.l + p.y}>
          <circle cx="184" cy={p.y} r="4.5" fill="var(--on-surface-variant)" />
          <text x="206" y={p.y + 3} textAnchor="middle" fontSize="8" fill="var(--on-surface)" fontFamily={MONO}>{p.l}</text>
        </g>
      ))}

      {/* good wire */}
      <path d="M56 44 C110 44 130 44 184 44" stroke="var(--primary-container)" strokeWidth="2.5" fill="none" className="lab-wire-live" />
      <circle cx="120" cy="44" r="8" fill="var(--background)" stroke="var(--accent-tertiary)" />
      <path d="M116 44 l3 3 5 -6" stroke="var(--accent-tertiary)" strokeWidth="1.8" fill="none" />

      {/* GND wire */}
      <path d="M56 76 C110 76 130 76 184 76" stroke="var(--on-surface-variant)" strokeWidth="2.5" fill="none" />

      {/* bad wire → warning */}
      <path d="M56 108 C110 108 130 108 184 108" stroke="var(--error)" strokeWidth="2.5" strokeDasharray="5 4" fill="none" />
      <path d="M120 96 l11 19 h-22z" fill="var(--background)" stroke="var(--error)" strokeWidth="1.6" />
      <path d="M120 103 v6 M120 112 v.5" stroke="var(--error)" strokeWidth="1.8" strokeLinecap="round" />
      <text x="120" y="136" textAnchor="middle" fontSize="8" fill="var(--error)" fontFamily={MONO} letterSpacing="1.5">SHORT!</text>
    </Frame>
  );
}

/** 3 — code editor */
export function WriteCodeArt() {
  return (
    <Frame id="wc">
      <rect x="10" y="12" width="220" height="126" fill="var(--surface-container-lowest)" stroke="var(--outline)" />
      <rect x="10" y="12" width="220" height="16" fill="var(--surface-container-low)" stroke="var(--outline)" />
      <circle cx="22" cy="20" r="3" fill="var(--error)" opacity=".8" />
      <circle cx="32" cy="20" r="3" fill="var(--primary-container)" opacity=".8" />
      <circle cx="42" cy="20" r="3" fill="var(--accent-tertiary)" opacity=".8" />
      <text x="218" y="23" textAnchor="end" fontSize="7" fill="var(--on-surface-variant)" fontFamily={MONO}>blink.ino</text>

      {[
        { n: 1, parts: [["void ", "var(--accent-tertiary)"], ["setup() {", "var(--on-surface)"]] },
        { n: 2, parts: [["  pinMode", "var(--primary-container)"], ["(13, OUTPUT);", "var(--on-surface-variant)"]] },
        { n: 3, parts: [["}", "var(--on-surface)"]] },
        { n: 4, parts: [["void ", "var(--accent-tertiary)"], ["loop() {", "var(--on-surface)"]] },
        { n: 5, parts: [["  digitalWrite", "var(--primary-container)"], ["(13, HIGH);", "var(--on-surface-variant)"]] },
      ].map((line, i) => {
        const y = 46 + i * 15;
        return (
          <g key={line.n}>
            <text x="20" y={y} fontSize="8" fill="var(--outline)" fontFamily={MONO}>{line.n}</text>
            <text x="34" y={y} fontSize="8.5" fontFamily={MONO} xmlSpace="preserve">
              {line.parts.map(([t, c]) => (
                <tspan key={t} fill={c}>{t}</tspan>
              ))}
            </text>
          </g>
        );
      })}
      <rect x="140" y="98" width="5" height="10" fill="var(--primary-container)" className="lab-led-glow" />

      <rect x="150" y="112" width="72" height="18" fill="var(--accent-tertiary)" fillOpacity=".12" stroke="var(--accent-tertiary)" />
      <path d="M158 121 l3 3 5 -6" stroke="var(--accent-tertiary)" strokeWidth="1.6" fill="none" />
      <text x="192" y="124" textAnchor="middle" fontSize="8" fill="var(--accent-tertiary)" fontFamily={MONO} letterSpacing="1">BUILD OK</text>
    </Frame>
  );
}

/** 4 — run, then send the BOM to the cart */
export function RunBuyArt() {
  return (
    <Frame id="rb">
      <circle cx="54" cy="52" r="26" fill="var(--primary-container)" opacity=".18" className="lab-led-glow" />
      <circle cx="54" cy="52" r="13" fill="var(--primary-container)" className="lab-led-glow" />
      <circle cx="54" cy="52" r="17" fill="none" stroke="var(--primary-container)" strokeWidth="2" />
      <text x="54" y="92" textAnchor="middle" fontSize="8" fill="var(--on-surface-variant)" fontFamily={MONO}>PORTB.5 = 1</text>
      <circle cx="54" cy="116" r="15" fill="var(--primary-container)" />
      <path d="M50 109 l13 7 -13 7z" fill="var(--on-primary)" />

      <path d="M86 70 H124" stroke="var(--on-surface-variant)" strokeWidth="1.6" strokeDasharray="4 4" />
      <path d="M124 65 l8 5 -8 5z" fill="var(--on-surface-variant)" />

      <rect x="138" y="20" width="92" height="112" fill="var(--surface-container-lowest)" stroke="var(--primary-container)" strokeOpacity=".6" />
      <text x="148" y="36" fontSize="8" fill="var(--primary-container)" fontFamily={MONO} letterSpacing="1.5">BOM</text>
      {[
        ["UNO R3", "×1"],
        ["LED 5mm", "×1"],
        ["220Ω", "×1"],
      ].map(([n, q], i) => (
        <g key={n}>
          <rect x="148" y={46 + i * 20} width="72" height="14" fill="var(--surface-container-low)" />
          <text x="153" y={56 + i * 20} fontSize="8" fill="var(--on-surface)" fontFamily={MONO}>{n}</text>
          <text x="216" y={56 + i * 20} textAnchor="end" fontSize="8" fill="var(--on-surface-variant)" fontFamily={MONO}>{q}</text>
        </g>
      ))}
      <rect x="148" y="108" width="72" height="16" fill="var(--primary-container)" />
      <text x="184" y="119" textAnchor="middle" fontSize="8" fill="var(--on-primary)" fontFamily={MONO} fontWeight="700" letterSpacing="1">+ CART</text>
    </Frame>
  );
}

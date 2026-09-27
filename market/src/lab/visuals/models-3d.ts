import * as THREE from "three";
import type { ComponentDef } from "../types";

/**
 * Procedural, simplified 3D models of the lab parts (built in code — no CAD download).
 * Y is up; the board plane is X/Z. 1 unit ≈ 20px of the 2D part box, so proportions match
 * the canvas drawing. Returns the group plus the LED materials the viewer can light up.
 */

export type PartModel = { group: THREE.Group; glow: THREE.MeshStandardMaterial[] };

const S = 1 / 20;

type MatOpts = { metalness?: number; roughness?: number; emissive?: number; transparent?: boolean; opacity?: number };

function mat(color: number, o: MatOpts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: o.metalness ?? 0.1,
    roughness: o.roughness ?? 0.6,
    emissive: o.emissive ?? 0x000000,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
  });
}

const C = {
  pcbTeal: 0x0e7c74,
  pcbBlue: 0x1d4ed8,
  pcbGreen: 0x15803d,
  black: 0x18181b,
  plastic: 0x27272a,
  metal: 0xc7ccd4,
  gold: 0xd4af37,
  white: 0xf1f5f9,
  cream: 0xf3f0e6,
};

class Builder {
  group = new THREE.Group();
  glow: THREE.MeshStandardMaterial[] = [];

  add(mesh: THREE.Object3D, x = 0, y = 0, z = 0) {
    mesh.position.set(x, y, z);
    mesh.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    this.group.add(mesh);
    return mesh;
  }

  box(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) {
    return this.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z);
  }

  cyl(rTop: number, rBottom: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 32) {
    return this.add(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), m), x, y, z);
  }

  /** Vertical wire lead going down from the part. */
  lead(x: number, z: number, len = 1.6, top = 0) {
    this.cyl(0.035, 0.035, len, mat(C.metal, { metalness: 0.9, roughness: 0.3 }), x, top - len / 2, z, 8);
  }

  /** Printed text laid flat on a surface. */
  label(text: string, width: number, x: number, y: number, z: number, color = "#e5e7eb") {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.font = "bold 60px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 50);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(width, (width * 96) / 512),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x, y, z);
    this.group.add(plane);
  }

  pcb(w: number, d: number, color: number, t = 0.16, z = 0) {
    this.box(w, t, d, mat(color, { roughness: 0.75 }), 0, t / 2, z);
    return t;
  }

  /** Header strip with gold contacts at the given local (px) positions along Z. */
  header(xPx: number, zsPx: number[], def: ComponentDef, top: number, h = 0.8) {
    if (!zsPx.length) return;
    const x = xPx * S - def.width * S / 2;
    const z1 = Math.min(...zsPx) * S - def.height * S / 2 - 0.3;
    const z2 = Math.max(...zsPx) * S - def.height * S / 2 + 0.3;
    this.box(0.55, h, z2 - z1, mat(C.black, { roughness: 0.8 }), x, top + h / 2, (z1 + z2) / 2);
    const gold = mat(C.gold, { metalness: 0.9, roughness: 0.25 });
    for (const zp of zsPx) {
      this.box(0.18, 0.02, 0.18, gold, x, top + h + 0.01, zp * S - def.height * S / 2);
    }
  }
}

const px = (v: number, span: number) => v * S - span * S / 2;

function pinXs(def: ComponentDef) {
  return def.pins.map((p) => ({ x: px(p.x, def.width), z: px(p.y, def.height) }));
}

function arduinoUno(def: ComponentDef): PartModel {
  const b = new Builder();
  const w = def.width * S;
  const d = Math.max(def.height, ...def.pins.map((p) => p.y + 12)) * S;
  // headers may run past def.height: grow the board downward, keep pins in place
  const t = b.pcb(w, d, C.pcbTeal, 0.16, (d - def.height * S) / 2);
  const at = (xPx: number, yPx: number) => ({ x: px(xPx, def.width), z: px(yPx, def.height) });

  const rows = (xPx: number) => def.pins.filter((p) => Math.abs(p.x - xPx) < 1).map((p) => p.y);
  b.header(8, rows(8), def, t);
  b.header(200, rows(200), def, t);

  // USB-B and DC barrel jack
  const usb = at(81, 23);
  b.box(2.9, 1.1, 1.9, mat(C.metal, { metalness: 0.95, roughness: 0.25 }), usb.x, t + 0.55, usb.z);
  const dc = at(147, 20);
  b.box(2.3, 1.1, 1.6, mat(C.black, { roughness: 0.5 }), dc.x, t + 0.55, dc.z);
  b.cyl(0.35, 0.35, 0.02, mat(0x09090b), dc.x, t + 1.11, dc.z);

  // ATmega328P DIP-28 with legs
  const chip = at(108, 111);
  b.box(4.8, 0.35, 1.5, mat(C.black, { roughness: 0.4 }), chip.x, t + 0.3, chip.z);
  const legMat = mat(C.metal, { metalness: 0.9, roughness: 0.3 });
  for (let i = 0; i < 14; i++) {
    const lx = chip.x - 2.25 + i * 0.345;
    b.box(0.12, 0.25, 0.28, legMat, lx, t + 0.15, chip.z - 0.85);
    b.box(0.12, 0.25, 0.28, legMat, lx, t + 0.15, chip.z + 0.85);
  }
  b.label("ATMEGA328P", 3.6, chip.x, t + 0.48, chip.z, "#9ca3af");

  // crystal, reset button, voltage regulator, capacitors
  const xt = at(98, 154);
  b.box(1.3, 0.4, 0.5, mat(C.metal, { metalness: 0.95, roughness: 0.2 }), xt.x, t + 0.2, xt.z);
  const rst = at(42, 62);
  b.box(0.7, 0.3, 0.7, mat(0xa1a1aa, { metalness: 0.6 }), rst.x, t + 0.15, rst.z);
  b.cyl(0.22, 0.22, 0.2, mat(0xdc2626), rst.x, t + 0.4, rst.z);
  const cap = at(150, 70);
  for (const dx of [0, 0.8]) b.cyl(0.3, 0.3, 0.9, mat(0x1f2937, { metalness: 0.4 }), cap.x + dx, t + 0.45, cap.z);
  const led = at(163, 62);
  const ledMat = mat(0xf59e0b, { emissive: 0x000000 });
  b.box(0.3, 0.12, 0.2, ledMat, led.x, t + 0.06, led.z);

  b.label("ARDUINO UNO", 5, 0, t + 0.01, at(108, 200).z, "#d1fae5");
  return { group: b.group, glow: [ledMat] };
}

function arduinoNano(def: ComponentDef): PartModel {
  const b = new Builder();
  const w = def.width * S;
  const d = Math.max(def.height, ...def.pins.map((p) => p.y + 10)) * S;
  const zOff = (d - def.height * S) / 2;
  const t = b.pcb(w, d, C.pcbBlue, 0.16, zOff);
  const rows = (xPx: number) => def.pins.filter((p) => Math.abs(p.x - xPx) < 1).map((p) => p.y);
  b.header(8, rows(8), def, t, 0.6);
  b.header(120, rows(120), def, t, 0.6);
  // mini-USB at the far edge, MCU in the middle
  b.box(2.1, 0.8, 1.2, mat(C.metal, { metalness: 0.95, roughness: 0.25 }), 0, t + 0.4, zOff + d / 2 - 0.6);
  b.box(2.2, 0.2, 2.2, mat(C.black, { roughness: 0.4 }), 0, t + 0.1, 0.4);
  b.label("NANO", 2.2, 0, t + 0.01, -2, "#dbeafe");
  return { group: b.group, glow: [] };
}

function breadboard(def: ComponentDef): PartModel {
  const b = new Builder();
  const w = def.width * S;
  const d = def.height * S;
  b.box(w, 0.5, d, mat(C.cream, { roughness: 0.9 }), 0, 0.25, 0);
  b.box(w - 1.2, 0.02, 0.12, mat(0xdc2626), 0.3, 0.51, px(9, def.height));
  b.box(w - 1.2, 0.02, 0.12, mat(0x2563eb), 0.3, 0.51, px(def.height - 20, def.height));
  b.box(w - 0.4, 0.02, 0.3, mat(0xd8d3c0), 0, 0.51, 0);
  const hole = new THREE.BoxGeometry(0.14, 0.03, 0.14);
  const holes = new THREE.InstancedMesh(hole, mat(0x3f3f46), 30 * 10);
  const m = new THREE.Matrix4();
  let i = 0;
  for (let c = 0; c < 30; c++) {
    for (let r = 0; r < 10; r++) {
      const band = r < 5 ? 0 : 1;
      const zPx = (band ? def.height / 2 + 8 : 20) + (r % 5) * 9;
      m.makeTranslation(px(20 + c * 8.4, def.width), 0.51, px(zPx, def.height));
      holes.setMatrixAt(i++, m);
    }
  }
  b.group.add(holes);
  return { group: b.group, glow: [] };
}

function ledRed(): PartModel {
  const b = new Builder();
  const glowMat = mat(0xdc2626, { roughness: 0.15, transparent: true, opacity: 0.88, emissive: 0x000000 });
  b.cyl(0.62, 0.62, 0.15, glowMat, 0, 0.075, 0);
  b.cyl(0.5, 0.5, 0.85, glowMat, 0, 0.55, 0);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), glowMat);
  b.add(dome, 0, 0.97, 0);
  b.lead(-0.13, 0, 2.2);
  b.lead(0.13, 0, 1.8);
  return { group: b.group, glow: [glowMat] };
}

function ledRgb(): PartModel {
  const b = new Builder();
  const body = mat(0xf8fafc, { roughness: 0.2, transparent: true, opacity: 0.8 });
  b.cyl(0.62, 0.62, 0.15, body, 0, 0.075, 0);
  b.cyl(0.5, 0.5, 0.85, body, 0, 0.55, 0);
  b.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), body), 0, 0.97, 0);
  [0xef4444, 0x22c55e, 0x3b82f6].forEach((c, i) => b.box(0.14, 0.14, 0.14, mat(c, { emissive: c }), -0.18 + i * 0.18, 0.7, 0));
  [-0.3, -0.1, 0.1, 0.3].forEach((x, i) => b.lead(x, 0, i === 1 ? 2.2 : 1.8));
  return { group: b.group, glow: [] };
}

const BAND_COLORS: Record<string, number[]> = {
  "resistor-220": [0xdc2626, 0xdc2626, 0x7a4a1f, 0xd4af37],
  "resistor-10k": [0x7a4a1f, 0x111118, 0xf97316, 0xd4af37],
};

function resistor(def: ComponentDef): PartModel {
  const b = new Builder();
  const body = b.cyl(0.32, 0.32, 1.9, mat(0xd9b98a, { roughness: 0.5 }), 0, 0.4, 0);
  body.rotation.z = Math.PI / 2;
  for (const x of [-0.95, 0.95]) b.add(new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 16), mat(0xd9b98a, { roughness: 0.5 })), x, 0.4, 0);
  (BAND_COLORS[def.id] ?? BAND_COLORS["resistor-220"]).forEach((c, i) => {
    const band = b.cyl(0.335, 0.335, 0.14, mat(c, { roughness: 0.4 }), -0.6 + i * 0.36 + (i === 3 ? 0.18 : 0), 0.4, 0);
    band.rotation.z = Math.PI / 2;
  });
  const leadMat = mat(C.metal, { metalness: 0.9, roughness: 0.3 });
  for (const s of [-1, 1]) {
    const l = b.cyl(0.035, 0.035, 1.3, leadMat, s * 1.95, 0.4, 0, 8);
    l.rotation.z = Math.PI / 2;
  }
  return { group: b.group, glow: [] };
}

function button(def: ComponentDef): PartModel {
  const b = new Builder();
  b.box(1.6, 0.6, 1.6, mat(C.black, { roughness: 0.7 }), 0, 0.3, 0);
  b.box(1.64, 0.08, 1.64, mat(C.metal, { metalness: 0.8 }), 0, 0.62, 0);
  b.cyl(0.42, 0.42, 0.4, mat(0xe11d48, { roughness: 0.4 }), 0, 0.85, 0);
  for (const p of pinXs(def)) b.lead(p.x * 0.8, p.z * 0.8, 1);
  return { group: b.group, glow: [] };
}

function potentiometer(def: ComponentDef): PartModel {
  const b = new Builder();
  b.box(2.2, 0.8, 1.8, mat(C.pcbBlue, { roughness: 0.6 }), 0, 0.4, 0);
  b.cyl(0.7, 0.75, 0.3, mat(C.metal, { metalness: 0.9, roughness: 0.25 }), 0, 0.95, 0);
  b.cyl(0.3, 0.3, 0.9, mat(C.metal, { metalness: 0.9, roughness: 0.2 }), 0, 1.5, 0);
  b.box(0.08, 0.1, 0.6, mat(0x1f2937), 0, 1.96, 0);
  for (const p of pinXs(def)) b.lead(p.x, -0.6, 1.2);
  return { group: b.group, glow: [] };
}

function buzzer(): PartModel {
  const b = new Builder();
  b.cyl(0.9, 0.9, 0.75, mat(C.black, { roughness: 0.5 }), 0, 0.375, 0);
  b.cyl(0.18, 0.18, 0.02, mat(0x09090b), 0, 0.76, 0);
  b.label("+", 0.5, 0.45, 0.76, -0.4, "#9ca3af");
  b.lead(-0.3, 0, 1.6);
  b.lead(0.3, 0, 1.4);
  return { group: b.group, glow: [] };
}

function servo(): PartModel {
  const b = new Builder();
  const blue = mat(0x1e40af, { roughness: 0.55 });
  b.box(3, 2.2, 1.4, blue, 0, 1.1, 0);
  b.box(4.4, 0.18, 1.4, blue, 0, 1.6, 0);
  b.cyl(0.5, 0.5, 0.4, mat(C.white, { roughness: 0.5 }), 0.8, 2.4, 0);
  b.cyl(0.14, 0.14, 0.3, mat(C.white), 0.8, 2.7, 0);
  b.box(2.2, 0.12, 0.35, mat(C.white, { roughness: 0.5 }), 0.3, 2.8, 0);
  b.label("SG90", 1.2, -0.6, 2.21, 0, "#dbeafe");
  [0x7a4a1f, 0xdc2626, 0xf97316].forEach((c, i) => b.box(0.12, 0.12, 2.2, mat(c), -1 + i * 0.16, 0.3, 1.8));
  return { group: b.group, glow: [] };
}

function dht22(def: ComponentDef): PartModel {
  const b = new Builder();
  b.box(2.4, 3, 0.8, mat(C.white, { roughness: 0.7 }), 0, 1.5, 0);
  for (let i = 0; i < 6; i++) b.box(0.18, 1.8, 0.05, mat(0x94a3b8), -0.9 + i * 0.36, 1.8, 0.41);
  b.label("DHT22", 1.6, 0, 0.35, 0.42, "#475569");
  for (const p of pinXs(def)) b.lead(p.x * 0.6, 0, 1.4);
  return { group: b.group, glow: [] };
}

function hcsr04(def: ComponentDef): PartModel {
  const b = new Builder();
  const t = b.pcb(4.5, 2.1, C.pcbBlue, 0.1);
  for (const x of [-1.2, 1.2]) {
    b.cyl(0.8, 0.8, 0.7, mat(C.metal, { metalness: 0.9, roughness: 0.3 }), x, t + 0.35, 0);
    b.cyl(0.62, 0.62, 0.02, mat(0x374151, { roughness: 0.9 }), x, t + 0.71, 0);
  }
  b.box(0.6, 0.25, 0.25, mat(C.metal, { metalness: 0.9 }), 0, t + 0.12, -0.6);
  b.label("HC-SR04", 1.6, 0, t + 0.01, 0.75, "#dbeafe");
  for (const p of pinXs(def)) b.box(0.12, 0.12, 0.8, mat(C.gold, { metalness: 0.9 }), p.x, t / 2, 1.4);
  return { group: b.group, glow: [] };
}

function pir(def: ComponentDef): PartModel {
  const b = new Builder();
  const t = b.pcb(3.2, 3.2, C.pcbGreen, 0.1);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.35, flatShading: true, transparent: true, opacity: 0.92 }),
  );
  b.add(dome, 0, t, 0);
  for (const p of pinXs(def)) b.box(0.12, 0.12, 0.8, mat(C.gold, { metalness: 0.9 }), p.x, t / 2, 1.9);
  return { group: b.group, glow: [] };
}

function lcd1602(def: ComponentDef): PartModel {
  const b = new Builder();
  const t = b.pcb(8, 3.6, C.pcbGreen, 0.1);
  b.box(7.2, 0.4, 2.3, mat(C.black, { roughness: 0.6 }), 0, t + 0.2, -0.2);
  const screen = mat(0x1d5fa8, { emissive: 0x0b3a6e, roughness: 0.2 });
  b.box(6.6, 0.02, 1.8, screen, 0, t + 0.41, -0.2);
  const cell = mat(0xdbeafe, { emissive: 0x1e3a8a, transparent: true, opacity: 0.35 });
  for (let r = 0; r < 2; r++) for (let i = 0; i < 16; i++) b.box(0.3, 0.01, 0.5, cell, -3.05 + i * 0.41, t + 0.43, -0.6 + r * 0.8);
  for (const p of pinXs(def)) b.box(0.12, 0.12, 0.7, mat(C.gold, { metalness: 0.9 }), p.x, t / 2, 2.1);
  return { group: b.group, glow: [screen] };
}

function oled(def: ComponentDef): PartModel {
  const b = new Builder();
  const t = b.pcb(4.4, 3, 0x1e3a8a, 0.1);
  b.box(3.8, 0.15, 1.9, mat(0x020617, { roughness: 0.1, metalness: 0.3 }), 0, t + 0.075, -0.3);
  b.label("~/\\_/\\~", 2.6, 0, t + 0.16, -0.3, "#38bdf8");
  for (const p of pinXs(def)) b.box(0.12, 0.12, 0.7, mat(C.gold, { metalness: 0.9 }), p.x, t / 2, 1.8);
  return { group: b.group, glow: [] };
}

function fallback(def: ComponentDef): PartModel {
  const b = new Builder();
  const t = b.pcb(def.width * S, def.height * S, C.pcbTeal);
  b.label(def.name, Math.min(4, def.width * S * 0.8), 0, t + 0.01, 0);
  return { group: b.group, glow: [] };
}

export function buildPartModel(def: ComponentDef): PartModel {
  switch (def.id) {
    case "arduino-uno": return arduinoUno(def);
    case "arduino-nano": return arduinoNano(def);
    case "breadboard": return breadboard(def);
    case "led-red": return ledRed();
    case "led-rgb": return ledRgb();
    case "resistor-220":
    case "resistor-10k": return resistor(def);
    case "button": return button(def);
    case "potentiometer": return potentiometer(def);
    case "buzzer": return buzzer();
    case "servo-sg90": return servo();
    case "dht22": return dht22(def);
    case "hc-sr04": return hcsr04(def);
    case "pir": return pir(def);
    case "lcd-1602": return lcd1602(def);
    case "oled-128x64": return oled(def);
    default: return fallback(def);
  }
}

/** Turn a model's LED / screen materials on or off without rebuilding the scene. */
export function setGlow(materials: THREE.MeshStandardMaterial[], on: boolean) {
  for (const m of materials) {
    m.emissive.set(on ? m.color : 0x000000);
    m.emissiveIntensity = on ? 2.2 : 0;
  }
}

/** Free every GPU resource under `root`. */
export function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const map = (m as THREE.MeshBasicMaterial).map;
      map?.dispose();
      m.dispose();
    }
  });
}

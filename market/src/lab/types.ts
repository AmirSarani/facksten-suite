/** Lab component & project types — shared by registry, canvas, sim, BOM */

export type SimulationStatus = "simulated" | "wireable" | "3d-only";
export type Protocol = "gpio" | "i2c" | "spi" | "uart" | "pwm" | "analog" | "onewire" | "power";
export type PinDirection = "input" | "output" | "bidirectional" | "power" | "gnd" | "nc";
export type PinSignal =
  | "digital"
  | "analog"
  | "pwm"
  | "i2c-sda"
  | "i2c-scl"
  | "spi-mosi"
  | "spi-miso"
  | "spi-sck"
  | "spi-ss"
  | "uart-tx"
  | "uart-rx"
  | "vcc"
  | "gnd"
  | "reset"
  | "clock"
  | "nc";

export type ComponentCategory =
  | "board"
  | "passive"
  | "led"
  | "input"
  | "actuator"
  | "sensor"
  | "display"
  | "misc";

export type StockStatus = "in-stock" | "out-of-stock" | "unknown";

export type PinDef = {
  id: string;
  label: string;
  x: number;
  y: number;
  direction: PinDirection;
  signal: PinSignal;
  arduinoPin?: number;
  voltage?: number;
  description?: string;
};

export type BehaviorModel =
  | { kind: "mcu"; mcu: "atmega328p"; clockHz: number }
  | { kind: "led"; color: string; forwardVoltage: number }
  | { kind: "resistor"; ohms: number }
  | { kind: "button"; normallyOpen: boolean }
  | { kind: "potentiometer"; maxOhms: number }
  | { kind: "buzzer"; passive: boolean }
  | { kind: "servo"; minUs: number; maxUs: number }
  | { kind: "dht22" }
  | { kind: "hcsr04" }
  | { kind: "pir" }
  | { kind: "lcd1602"; cols: number; rows: number }
  | { kind: "oled"; width: number; height: number; bus: "i2c" }
  | { kind: "breadboard"; rows: number; cols: number }
  | { kind: "none" };

export type ComponentDef = {
  id: string;
  name: string;
  slug: string;
  productId: string | null;
  catalogSlug: string | null;
  category: ComponentCategory;
  description: string;
  thumbnail: string;
  modelUrl: string | null;
  sourceUrl: string | null;
  license: string;
  simulationStatus: SimulationStatus;
  protocols: Protocol[];
  pins: PinDef[];
  voltageRange: { min: number; max: number };
  currentLimit: number | null;
  properties: Record<string, string | number | boolean>;
  behaviorModel: BehaviorModel;
  compatibleBoards: string[];
  stockStatus: StockStatus;
  price: number | null;
  width: number;
  height: number;
};

export type PlacedPart = {
  instanceId: string;
  componentId: string;
  x: number;
  y: number;
  rotation: number;
  props?: Record<string, string | number | boolean>;
};

export type WireEndpoint = {
  instanceId: string;
  pinId: string;
};

export type WireDef = {
  id: string;
  from: WireEndpoint;
  to: WireEndpoint;
  color: string;
};

export type LabProject = {
  version: number;
  id: string;
  name: string;
  description?: string;
  parts: PlacedPart[];
  wires: WireDef[];
  code: string;
  boardId: string;
  mode?: "simple" | "pro";
  updatedAt: string;
  createdAt: string;
};

export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  firmwareHex?: string;
  bom: { componentId: string; qty: number }[];
};

export type TemplateDef = TemplateMeta & {
  project: Omit<LabProject, "id" | "createdAt" | "updatedAt"> & { id?: string };
};

export type WiringIssue = {
  code: string;
  severity: "error" | "warning" | "hint";
  message: string;
  wireIds?: string[];
  partIds?: string[];
};

export type SimPinState = {
  instanceId: string;
  pinId: string;
  value: 0 | 1 | number;
  kind: "digital" | "analog" | "pwm";
};

export type BomLine = {
  componentId: string;
  slug: string;
  name: string;
  qty: number;
  productId: string | null;
  price: number | null;
  stockStatus: StockStatus;
};

export type EngineStatus = "idle" | "loading" | "running" | "paused" | "stopped" | "error";

export type SerialByte = { byte: number; ts: number };

/** Arduino pin numbers 0–19: D0–D13, then A0–A5 (14–19). */
export const SIM_PINS = 20;

/**
 * What the MCU did during one display frame (~33 ms of wall time).
 * Arrays are indexed by Arduino pin number.
 */
export type SimFrame = {
  /** Pin driven HIGH at the end of the frame (bit per pin). */
  levels: number;
  /** Pin configured as output (DDR bit per pin). */
  outputs: number;
  /** Fraction of the frame each pin was HIGH, 0–1 (PWM duty). */
  duty: number[];
  /** Rising edges per second during the frame (tone() frequency). */
  freq: number[];
  /** Width of the last complete HIGH pulse in µs (servo signal), 0 if none. */
  pulseUs: number[];
  /** Simulated time since start, ms. */
  simMs: number;
  /** Simulated time / wall time over the frame (1 = real time at 1×). */
  realtime: number;
};

/** External drive on each pin from the circuit: 1/0, or null when nothing drives it. */
export type SimInputs = { digital: (0 | 1 | null)[]; analog: number[] };

export type SimulationEngine = {
  load(hex: string): Promise<void>;
  start(): void;
  pause(): void;
  stop(): void;
  reset(): void;
  setSpeed(multiplier: number): void;
  setInputs(inputs: SimInputs): void;
  sendSerial(text: string): void;
  onFrame(cb: (frame: SimFrame) => void): () => void;
  onSerial(cb: (data: SerialByte) => void): () => void;
  onStatus(cb: (status: EngineStatus, detail?: string) => void): () => void;
  terminate(): void;
  getStatus(): EngineStatus;
};

export type WorkerInMessage =
  | { type: "load"; hex: string }
  | { type: "start" }
  | { type: "pause" }
  | { type: "stop" }
  | { type: "reset" }
  | { type: "setSpeed"; multiplier: number }
  | { type: "inputs"; inputs: SimInputs }
  | { type: "serialIn"; bytes: number[] }
  | { type: "terminate" };

export type WorkerOutMessage =
  | { type: "ready" }
  | { type: "status"; status: EngineStatus; detail?: string }
  | { type: "frame"; frame: SimFrame }
  | { type: "serial"; byte: number }
  | { type: "error"; message: string };

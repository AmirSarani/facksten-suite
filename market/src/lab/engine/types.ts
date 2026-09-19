import type { SimPinState } from "../types";

export type EngineStatus = "idle" | "loading" | "running" | "paused" | "stopped" | "error";

export type SerialByte = { byte: number; ts: number };

export type SimulationEngine = {
  load(hex: string): Promise<void>;
  start(): void;
  pause(): void;
  stop(): void;
  reset(): void;
  setSpeed(multiplier: number): void;
  onPinChange(cb: (state: SimPinState) => void): () => void;
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
  | { type: "terminate" };

export type WorkerOutMessage =
  | { type: "ready" }
  | { type: "status"; status: EngineStatus; detail?: string }
  | { type: "pin"; pin: number; value: 0 | 1 }
  | { type: "serial"; byte: number }
  | { type: "error"; message: string };

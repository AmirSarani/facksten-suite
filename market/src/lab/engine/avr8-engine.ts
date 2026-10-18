"use client";

import type {
  EngineStatus,
  SerialByte,
  SimFrame,
  SimInputs,
  SimulationEngine,
  WorkerInMessage,
  WorkerOutMessage,
} from "./types";

/** Main-thread wrapper around the avr8js Web Worker (see avr8-worker.ts). */
export class Avr8Engine implements SimulationEngine {
  private worker: Worker | null = null;
  private status: EngineStatus = "idle";
  private frameListeners = new Set<(f: SimFrame) => void>();
  private serialListeners = new Set<(d: SerialByte) => void>();
  private statusListeners = new Set<(s: EngineStatus, d?: string) => void>();

  private ensureWorker() {
    if (this.worker) return;
    this.worker = new Worker(new URL("./avr8-worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (ev: MessageEvent<WorkerOutMessage>) => {
      const msg = ev.data;
      switch (msg.type) {
        case "status":
          this.status = msg.status;
          this.statusListeners.forEach((cb) => cb(msg.status, msg.detail));
          break;
        case "frame":
          this.frameListeners.forEach((cb) => cb(msg.frame));
          break;
        case "serial":
          this.serialListeners.forEach((cb) => cb({ byte: msg.byte, ts: Date.now() }));
          break;
        case "error":
          this.status = "error";
          this.statusListeners.forEach((cb) => cb("error", msg.message));
          break;
        default:
          break;
      }
    };
    this.worker.onerror = (err) => {
      this.status = "error";
      this.statusListeners.forEach((cb) => cb("error", err.message));
    };
  }

  private send(msg: WorkerInMessage) {
    this.ensureWorker();
    this.worker!.postMessage(msg);
  }

  async load(hex: string): Promise<void> {
    this.send({ type: "load", hex });
  }

  start(): void {
    this.send({ type: "start" });
  }

  pause(): void {
    this.send({ type: "pause" });
  }

  stop(): void {
    this.send({ type: "stop" });
  }

  reset(): void {
    this.send({ type: "reset" });
  }

  setSpeed(multiplier: number): void {
    this.send({ type: "setSpeed", multiplier });
  }

  setInputs(inputs: SimInputs): void {
    this.send({ type: "inputs", inputs });
  }

  sendSerial(text: string): void {
    this.send({ type: "serialIn", bytes: [...new TextEncoder().encode(text)] });
  }

  onFrame(cb: (frame: SimFrame) => void): () => void {
    this.frameListeners.add(cb);
    return () => this.frameListeners.delete(cb);
  }

  onSerial(cb: (data: SerialByte) => void): () => void {
    this.serialListeners.add(cb);
    return () => this.serialListeners.delete(cb);
  }

  onStatus(cb: (status: EngineStatus, detail?: string) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  terminate(): void {
    if (this.worker) {
      this.send({ type: "terminate" });
      this.worker.terminate();
      this.worker = null;
    }
    this.status = "idle";
  }

  getStatus(): EngineStatus {
    return this.status;
  }
}

export function createSimulationEngine(): SimulationEngine {
  return new Avr8Engine();
}

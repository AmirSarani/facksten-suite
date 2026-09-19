/**
 * Web Worker entry — runs avr8js CPU loop off the main thread.
 * Built as a separate chunk; loaded via `new Worker(new URL(...), { type: "module" })`.
 */
import {
  CPU,
  avrInstruction,
  AVRTimer,
  timer0Config,
  timer1Config,
  timer2Config,
  AVRIOPort,
  portBConfig,
  portCConfig,
  portDConfig,
  AVRUSART,
  usart0Config,
  PinState,
} from "avr8js";
import { loadHex } from "./intelhex";
import type { WorkerInMessage, WorkerOutMessage, EngineStatus } from "./types";

const FLASH_WORDS = 0x8000;
const CLOCK = 16e6;

let program = new Uint16Array(FLASH_WORDS);
let cpu: CPU | null = null;
let portB: AVRIOPort | null = null;
let usart: AVRUSART | null = null;
let timers: AVRTimer[] = [];
let running = false;
let paused = false;
let speed = 1;
let lastLed: 0 | 1 | null = null;
let status: EngineStatus = "idle";
let timeoutId: ReturnType<typeof setTimeout> | null = null;
const MAX_RUN_MS = 120_000;

function post(msg: WorkerOutMessage) {
  self.postMessage(msg);
}

function setStatus(s: EngineStatus, detail?: string) {
  status = s;
  post({ type: "status", status: s, detail });
}

function createRunner(hex: string) {
  program = new Uint16Array(FLASH_WORDS);
  loadHex(hex, new Uint8Array(program.buffer));
  cpu = new CPU(program);
  timers = [
    new AVRTimer(cpu, timer0Config),
    new AVRTimer(cpu, timer1Config),
    new AVRTimer(cpu, timer2Config),
  ];
  portB = new AVRIOPort(cpu, portBConfig);
  new AVRIOPort(cpu, portCConfig);
  new AVRIOPort(cpu, portDConfig);
  usart = new AVRUSART(cpu, usart0Config, CLOCK);

  portB.addListener(() => {
    if (!portB) return;
    const high = portB.pinState(5) === PinState.High ? 1 : 0;
    if (high !== lastLed) {
      lastLed = high as 0 | 1;
      post({ type: "pin", pin: 13, value: lastLed });
    }
  });

  usart.onByteTransmit = (value: number) => {
    post({ type: "serial", byte: value });
  };
}

function workUnit() {
  if (!cpu || !running || paused) return;
  const cyclesToRun = cpu.cycles + Math.floor(500_000 * speed);
  const start = performance.now();
  while (cpu.cycles < cyclesToRun) {
    avrInstruction(cpu);
    cpu.tick();
    if (performance.now() - start > 12) break;
  }
  // Report LED from PORTB even if listener missed
  if (portB) {
    const high = (cpu.data[0x25] & 0x20) !== 0 ? 1 : 0;
    if (high !== lastLed) {
      lastLed = high as 0 | 1;
      post({ type: "pin", pin: 13, value: lastLed });
    }
  }
  if (running && !paused) {
    timeoutId = setTimeout(workUnit, 0);
  }
}

function clearTimer() {
  if (timeoutId != null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

let hardStopTimer: ReturnType<typeof setTimeout> | null = null;

function armHardStop() {
  if (hardStopTimer) clearTimeout(hardStopTimer);
  hardStopTimer = setTimeout(() => {
    running = false;
    clearTimer();
    setStatus("stopped", "زمان شبیه‌سازی به پایان رسید (حداکثر ۲ دقیقه).");
  }, MAX_RUN_MS);
}

self.onmessage = (ev: MessageEvent<WorkerInMessage>) => {
  const msg = ev.data;
  try {
    switch (msg.type) {
      case "load":
        createRunner(msg.hex);
        lastLed = null;
        setStatus("loading");
        setStatus("idle", "فرم‌ویر بارگذاری شد");
        break;
      case "start":
        if (!cpu) {
          post({ type: "error", message: "ابتدا فرم‌ویر را بارگذاری کنید" });
          return;
        }
        running = true;
        paused = false;
        setStatus("running");
        armHardStop();
        workUnit();
        break;
      case "pause":
        paused = true;
        setStatus("paused");
        break;
      case "stop":
        running = false;
        paused = false;
        clearTimer();
        if (hardStopTimer) clearTimeout(hardStopTimer);
        setStatus("stopped");
        break;
      case "reset":
        running = false;
        paused = false;
        clearTimer();
        lastLed = null;
        if (cpu) {
          cpu.reset();
        }
        setStatus("idle", "ریست شد — برای اجرا دوباره Run بزنید");
        break;
      case "setSpeed":
        speed = Math.max(0.1, Math.min(20, msg.multiplier));
        break;
      case "terminate":
        running = false;
        clearTimer();
        if (hardStopTimer) clearTimeout(hardStopTimer);
        cpu = null;
        self.close();
        break;
    }
  } catch (e) {
    post({ type: "error", message: e instanceof Error ? e.message : String(e) });
    setStatus("error", e instanceof Error ? e.message : String(e));
  }
};

post({ type: "ready" });

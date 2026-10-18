/**
 * Web Worker entry — runs the simulated board (avr-runner.ts) locked to wall-clock time.
 * Built as a separate chunk; loaded via `new Worker(new URL(...), { type: "module" })`.
 */
import { AvrRunner, CLOCK } from "./avr-runner";
import { SIM_PINS, type SimInputs, type WorkerInMessage, type WorkerOutMessage, type EngineStatus } from "./types";

const FRAME_MS = 33;
/** Never try to catch up more than this much wall time in one go (tab was hidden, etc.). */
const MAX_CATCHUP_MS = 50;
/** Longest a single slice may block before yielding. */
const SLICE_BUDGET_MS = 30;
const MAX_RUN_MS = 10 * 60_000;

let runner: AvrRunner | null = null;
let running = false;
let speed = 1;
let inputs: SimInputs = { digital: Array(SIM_PINS).fill(null), analog: Array(8).fill(0) };
let startedAt = 0;
let lastWall = 0;
let frameWall = 0;

const channel = new MessageChannel();

function post(msg: WorkerOutMessage) {
  self.postMessage(msg);
}

function setStatus(s: EngineStatus, detail?: string) {
  post({ type: "status", status: s, detail });
}

/** One scheduling slice: run as many cycles as wall time (× speed) asks for. */
function slice() {
  if (!runner || !running) return;
  const wall = performance.now();
  const dt = Math.min(MAX_CATCHUP_MS, wall - lastWall);
  lastWall = wall;
  runner.run(dt * (CLOCK / 1000) * speed, () => performance.now() - wall > SLICE_BUDGET_MS);
  if (wall - frameWall >= FRAME_MS) {
    post({ type: "frame", frame: runner.frame(wall - frameWall) });
    frameWall = wall;
  }
  if (wall - startedAt > MAX_RUN_MS) {
    running = false;
    setStatus("stopped", "زمان شبیه‌سازی به پایان رسید (حداکثر ۱۰ دقیقه).");
    return;
  }
  // MessageChannel instead of setTimeout(0): no 4 ms clamp between slices
  channel.port2.postMessage(0);
}
channel.port1.onmessage = () => slice();

self.onmessage = (ev: MessageEvent<WorkerInMessage>) => {
  const msg = ev.data;
  try {
    switch (msg.type) {
      case "load":
        running = false;
        runner = new AvrRunner(msg.hex);
        runner.onSerial = (byte) => post({ type: "serial", byte });
        runner.setInputs(inputs);
        startedAt = 0;
        setStatus("idle", "فرم‌ویر بارگذاری شد");
        break;
      case "start":
        if (!runner) {
          post({ type: "error", message: "ابتدا فرم‌ویر را بارگذاری کنید" });
          return;
        }
        if (running) return;
        running = true;
        lastWall = performance.now();
        frameWall = lastWall;
        runner.frame();
        if (!startedAt) startedAt = lastWall;
        setStatus("running");
        slice();
        break;
      case "pause":
        running = false;
        setStatus("paused");
        break;
      case "stop":
        running = false;
        setStatus("stopped");
        break;
      case "reset":
        running = false;
        runner?.cpu.reset();
        startedAt = 0;
        setStatus("idle", "ریست شد — برای اجرا دوباره Run بزنید");
        break;
      case "setSpeed":
        speed = Math.max(0.1, Math.min(20, msg.multiplier));
        break;
      case "inputs":
        inputs = msg.inputs;
        runner?.setInputs(inputs);
        break;
      case "serialIn":
        runner?.sendSerial(msg.bytes);
        break;
      case "terminate":
        running = false;
        runner = null;
        self.close();
        break;
    }
  } catch (e) {
    post({ type: "error", message: e instanceof Error ? e.message : String(e) });
    setStatus("error", e instanceof Error ? e.message : String(e));
  }
};

post({ type: "ready" });

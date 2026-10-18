/**
 * The simulated ATmega328P and its pin measurements, without any scheduling — the worker
 * drives it in real time, tests drive it cycle by cycle.
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
  AVRADC,
  adcConfig,
  PinState,
} from "avr8js";
import { loadHex } from "./intelhex";
import { SIM_PINS, type SimFrame, type SimInputs } from "./types";

export const CLOCK = 16e6;
const FLASH_WORDS = 0x8000;
type Port = "B" | "C" | "D";
/** Data-space addresses of DDRx / PORTx. */
const DDR: Record<Port, number> = { B: 0x24, C: 0x27, D: 0x2a };
const PORT: Record<Port, number> = { B: 0x25, C: 0x28, D: 0x2b };

/** Arduino pin → (port, bit). D0–7 PORTD, D8–13 PORTB, A0–5 (14–19) PORTC. */
export const PIN_MAP: { port: Port; bit: number }[] = Array.from({ length: SIM_PINS }, (_, p) =>
  p <= 7 ? { port: "D", bit: p } : p <= 13 ? { port: "B", bit: p - 8 } : { port: "C", bit: p - 14 },
);

export class AvrRunner {
  readonly cpu: CPU;
  private ports: Record<Port, AVRIOPort>;
  private usart: AVRUSART;
  private adc: AVRADC;
  private inputs: SimInputs = { digital: Array(SIM_PINS).fill(null), analog: Array(8).fill(0) };
  private rxQueue: number[] = [];
  onSerial: (byte: number) => void = () => undefined;

  // per-pin measurement within the current frame (CPU cycles)
  private high = new Uint8Array(SIM_PINS);
  private riseAt = new Float64Array(SIM_PINS);
  private highCycles = new Float64Array(SIM_PINS);
  private rises = new Uint32Array(SIM_PINS);
  private pulse = new Float64Array(SIM_PINS);
  /** Cycles between the last two rising edges (one period of a tone / PWM wave). */
  /** Cycles between the last three pairs of rising edges, newest first. */
  private periods = Array.from({ length: SIM_PINS }, () => [0, 0, 0]);
  private frameStart = 0;

  constructor(hex: string) {
    const program = new Uint16Array(FLASH_WORDS);
    loadHex(hex, new Uint8Array(program.buffer));
    this.cpu = new CPU(program);
    new AVRTimer(this.cpu, timer0Config);
    new AVRTimer(this.cpu, timer1Config);
    new AVRTimer(this.cpu, timer2Config);
    this.ports = { B: new AVRIOPort(this.cpu, portBConfig), C: new AVRIOPort(this.cpu, portCConfig), D: new AVRIOPort(this.cpu, portDConfig) };
    this.usart = new AVRUSART(this.cpu, usart0Config, CLOCK);
    this.adc = new AVRADC(this.cpu, adcConfig);
    // a PORT/DDR write can change what an input reads (pinMode INPUT_PULLUP) — re-drive at once
    for (const p of ["B", "C", "D"] as Port[]) {
      this.ports[p].addListener(() => {
        this.edges(p);
        this.applyInputs(p);
      });
    }
    this.usart.onByteTransmit = (b) => this.onSerial(b);
    this.usart.onRxComplete = () => this.feedSerial();
    this.applyInputs();
  }

  /** Run until `cycles` more CPU cycles have elapsed (or `deadline()` says stop). */
  run(cycles: number, deadline?: () => boolean) {
    const cpu = this.cpu;
    const target = cpu.cycles + cycles;
    let n = 0;
    while (cpu.cycles < target) {
      avrInstruction(cpu);
      cpu.tick();
      if (deadline && (++n & 0xfff) === 0 && deadline()) break;
    }
    this.applyInputs();
    this.feedSerial();
  }

  setInputs(inputs: SimInputs) {
    this.inputs = inputs;
    this.applyInputs();
  }

  sendSerial(bytes: number[]) {
    this.rxQueue.push(...bytes);
    this.feedSerial();
  }

  pinHigh(p: number): boolean {
    const { port, bit } = PIN_MAP[p];
    return this.ports[port].pinState(bit) === PinState.High;
  }

  /** Measurements since the last frame; starts a new one. `wallMs` is for the real-time ratio. */
  frame(wallMs = 0): SimFrame {
    const now = this.cpu.cycles;
    const span = Math.max(1, now - this.frameStart);
    const seconds = span / CLOCK;
    const duty: number[] = [];
    const freq: number[] = [];
    const pulseUs: number[] = [];
    let levels = 0;
    let outputs = 0;
    for (let p = 0; p < SIM_PINS; p++) {
      let hc = this.highCycles[p];
      if (this.high[p]) hc += now - Math.max(this.riseAt[p], this.frameStart);
      duty.push(Math.min(1, hc / span));
      // a tone that starts or stops mid-frame still reports its true pitch
      // median of the last three periods: ignores the short cycle when tone() retunes the timer
      // and the long gap of silence between two notes
      const per = [...this.periods[p]].sort((a, b) => a - b)[1];
      freq.push(this.rises[p] && per ? CLOCK / per : 0);
      pulseUs.push(this.pulse[p] / (CLOCK / 1e6));
      if (this.high[p]) levels |= 1 << p;
      const { port, bit } = PIN_MAP[p];
      if (this.cpu.data[DDR[port]] & (1 << bit)) outputs |= 1 << p;
    }
    this.highCycles.fill(0);
    this.rises.fill(0);
    this.frameStart = now;
    return { levels, outputs, duty, freq, pulseUs, simMs: now / (CLOCK / 1000), realtime: wallMs > 0 ? (seconds * 1000) / wallMs : 1 };
  }

  private edges(port: Port) {
    const now = this.cpu.cycles;
    for (let p = 0; p < SIM_PINS; p++) {
      if (PIN_MAP[p].port !== port) continue;
      const h = this.pinHigh(p) ? 1 : 0;
      if (h === this.high[p]) continue;
      if (h) {
        if (this.riseAt[p] > 0) this.periods[p] = [now - this.riseAt[p], this.periods[p][0], this.periods[p][1]];
        this.riseAt[p] = now;
        this.rises[p]++;
      } else {
        this.highCycles[p] += now - Math.max(this.riseAt[p], this.frameStart);
        this.pulse[p] = now - this.riseAt[p];
      }
      this.high[p] = h;
    }
  }

  private feedSerial() {
    if (!this.rxQueue.length || this.usart.rxBusy) return;
    this.usart.writeByte(this.rxQueue.shift()!);
  }

  /**
   * Drive each input pin from the circuit. A pin nothing drives floats: it reads its internal
   * pull-up if INPUT_PULLUP is set, LOW otherwise (a real floating pin would read noise).
   */
  private applying = false;
  private applyInputs(only?: Port) {
    if (this.applying) return;
    this.applying = true;
    const data = this.cpu.data;
    for (let p = 0; p < SIM_PINS; p++) {
      const { port, bit } = PIN_MAP[p];
      if (only && port !== only) continue;
      if (data[DDR[port]] & (1 << bit)) continue;
      const ext = this.inputs.digital[p];
      const pullup = (data[PORT[port]] & (1 << bit)) !== 0;
      this.ports[port].setPin(bit, ext == null ? pullup : ext === 1);
    }
    for (let ch = 0; ch < 8; ch++) this.adc.channelValues[ch] = this.inputs.analog[ch] ?? 0;
    this.applying = false;
  }
}

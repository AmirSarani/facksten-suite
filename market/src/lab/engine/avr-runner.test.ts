import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { AvrRunner, CLOCK } from "./avr-runner";
import { SIM_PINS } from "./types";

/* Real firmware compiled from __fixtures__/*.ino with the lab shim (scripts/lab-build-fixtures.ts). */
const hex = (name: string) => readFileSync(join(import.meta.dirname, "__fixtures__", `${name}.hex`), "utf8");
const ms = (n: number) => n * (CLOCK / 1000);
const noInputs = () => ({ digital: Array<0 | 1 | null>(SIM_PINS).fill(null), analog: Array(8).fill(0) });

describe("AvrRunner (real firmware)", () => {
  it("keeps time: delay(500) toggles D13 every 500 ms of simulated time", () => {
    const r = new AvrRunner(hex("timing"));
    const edges: number[] = [];
    let last = r.pinHigh(13);
    for (let t = 0; t < 2100; t++) {
      r.run(ms(1));
      const now = r.pinHigh(13);
      if (now !== last) edges.push(t);
      last = now;
    }
    // first edge right after start-up, then every 500 ms within 1%
    assert.ok(edges.length >= 4, `edges: ${edges}`);
    for (let i = 1; i < edges.length; i++) {
      const gap = edges[i] - edges[i - 1];
      assert.ok(Math.abs(gap - 500) <= 5, `gap ${gap} ms (edges ${edges})`);
    }
  });

  it("measures hardware PWM duty on Timer0, Timer1 and Timer2", () => {
    const r = new AvrRunner(hex("pwm"));
    r.run(ms(5));
    r.frame();
    r.run(ms(50));
    const f = r.frame();
    assert.ok(Math.abs(f.duty[5] - 64 / 255) < 0.03, `D5 ${f.duty[5]}`);
    assert.ok(Math.abs(f.duty[9] - 191 / 255) < 0.03, `D9 ${f.duty[9]}`);
    assert.ok(Math.abs(f.duty[3] - 128 / 255) < 0.03, `D3 ${f.duty[3]}`);
    assert.ok(f.outputs & (1 << 5));
  });

  it("generates a real servo pulse (write(90) ≈ 1472 µs, every 20 ms)", () => {
    const r = new AvrRunner(hex("servo"));
    r.run(ms(30));
    r.frame();
    r.run(ms(100));
    const f = r.frame();
    assert.ok(Math.abs(f.pulseUs[9] - 1472) < 15, `pulse ${f.pulseUs[9]} µs`);
    assert.ok(Math.abs(f.freq[9] - 50) < 3, `frame rate ${f.freq[9]} Hz`);
  });

  it("plays tone(8, 440) at 440 Hz", () => {
    const r = new AvrRunner(hex("tone"));
    r.run(ms(10));
    r.frame();
    r.run(ms(500));
    const f = r.frame();
    assert.ok(Math.abs(f.freq[8] - 440) < 5, `freq ${f.freq[8]}`);
  });

  it("reads inputs: pull-up, external drive, serial RX and the ADC", () => {
    const r = new AvrRunner(hex("io"));
    let out = "";
    r.onSerial = (b) => (out += String.fromCharCode(b));
    r.run(ms(20));
    // D2 floats with INPUT_PULLUP → HIGH → D13 stays LOW
    assert.equal(r.pinHigh(13), false);
    const pressed = noInputs();
    pressed.digital[2] = 0;
    r.setInputs(pressed);
    r.run(ms(5));
    assert.equal(r.pinHigh(13), true);

    const half = noInputs();
    half.analog[0] = 2.5;
    r.setInputs(half);
    r.sendSerial([..."xa"].map((c) => c.charCodeAt(0)));
    r.run(ms(60));
    assert.match(out, /^x/);
    const value = Number(/A0=(\d+)/.exec(out)?.[1]);
    assert.ok(Math.abs(value - 512) <= 3, `A0 read ${value} (serial: ${JSON.stringify(out)})`);
  });
});

describe("AvrRunner melody", () => {
  it("reports each note's pitch, without glitches when tone() retunes the timer", () => {
    const r = new AvrRunner(hex("melody"));
    const seen: number[] = [];
    for (let i = 0; i < 70; i++) {
      r.run(ms(33));
      const f = r.frame().freq[8];
      if (f) seen.push(f);
    }
    const notes = [262, 294, 330, 349, 392, 440, 494, 523];
    for (const f of seen) assert.ok(notes.some((n) => Math.abs(f - n) / n < 0.01), `unexpected ${f.toFixed(0)} Hz in ${seen.map((x) => x.toFixed(0))}`);
    for (const n of notes) assert.ok(seen.some((f) => Math.abs(f - n) / n < 0.01), `missing ${n} Hz`);
  });
});

describe("AvrRunner with the official Arduino core", () => {
  // core-servo.hex: core-servo.ino.txt built by arduino-cli + ArduinoCore-avr 1.8.6 (lab-compiler's arduino-cli backend)
  it("runs real-core firmware: millis()/delay timing and the real Servo library", () => {
    const r = new AvrRunner(hex("core-servo"));
    const edges: number[] = [];
    let last = r.pinHigh(13);
    r.frame();
    for (let t = 0; t < 1600; t++) {
      r.run(ms(1));
      const now = r.pinHigh(13);
      if (now !== last) edges.push(t);
      last = now;
    }
    for (let i = 1; i < edges.length; i++) assert.ok(Math.abs(edges[i] - edges[i - 1] - 500) <= 5, `edges ${edges}`);
    const f = r.frame();
    // write(90) with the library's 544–2400 µs range ≈ 1472 µs (the real library rounds a little)
    assert.ok(Math.abs(f.pulseUs[9] - 1472) < 25, `pulse ${f.pulseUs[9]}`);
    assert.ok(Math.abs(f.freq[9] - 50) < 3, `servo frame ${f.freq[9]} Hz`);
  });
});

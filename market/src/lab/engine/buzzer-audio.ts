"use client";

/**
 * Plays the simulated buzzer through WebAudio: a quiet square wave at the tone() frequency.
 * The AudioContext must be created from a user gesture (the Run click), so `unlock()` is
 * called there; until then nothing sounds.
 */
export class BuzzerAudio {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  muted = false;

  unlock() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(this.ctx.destination);
  }

  /** Sound at `hz`, or silence for null. */
  play(hz: number | null) {
    if (!this.ctx || !this.gain) return;
    const t = this.ctx.currentTime;
    if (!hz || this.muted) {
      this.gain.gain.setTargetAtTime(0, t, 0.01);
      return;
    }
    if (!this.osc) {
      this.osc = this.ctx.createOscillator();
      this.osc.type = "square";
      this.osc.connect(this.gain);
      this.osc.start();
    }
    this.osc.frequency.setTargetAtTime(hz, t, 0.005);
    this.gain.gain.setTargetAtTime(0.04, t, 0.01);
  }

  close() {
    this.osc?.stop();
    void this.ctx?.close();
    this.ctx = null;
    this.osc = null;
    this.gain = null;
  }
}

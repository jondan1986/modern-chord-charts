// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

/**
 * ClickEngine — Web Audio API lookahead scheduler for click track playback.
 *
 * Uses the standard lookahead pattern:
 *   - A setInterval (~25ms) checks AudioContext.currentTime
 *   - Schedules oscillator bursts ahead of time for sample-accurate timing
 *   - Calls back on each beat for UI updates
 */

export interface ClickEngineOptions {
  tempo: number;            // BPM
  beatsPerMeasure: number;  // e.g. 4 for 4/4
  clickEnabled: boolean;
  onBeat: (beat: number, measure: number) => void;
  onMeasureEnd: (measure: number) => void;
}

export class ClickEngine {
  private audioCtx: AudioContext | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private nextBeatTime = 0;
  private currentBeat = 0;    // 0-based internally
  private currentMeasure = 0; // 0-based internally
  private isRunning = false;

  private tempo: number;
  private beatsPerMeasure: number;
  private clickEnabled: boolean;
  private onBeat: ClickEngineOptions['onBeat'];
  private onMeasureEnd: ClickEngineOptions['onMeasureEnd'];

  // Lookahead config
  private readonly SCHEDULE_AHEAD = 0.1;  // seconds
  private readonly INTERVAL_MS = 25;

  constructor(options: ClickEngineOptions) {
    this.tempo = options.tempo;
    this.beatsPerMeasure = options.beatsPerMeasure;
    this.clickEnabled = options.clickEnabled;
    this.onBeat = options.onBeat;
    this.onMeasureEnd = options.onMeasureEnd;
  }

  start(startBeat = 0, startMeasure = 0) {
    if (this.isRunning) return;

    // Create AudioContext on user gesture
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.currentBeat = startBeat;
    this.currentMeasure = startMeasure;
    this.nextBeatTime = this.audioCtx.currentTime + 0.05; // small delay to start
    this.isRunning = true;

    this.intervalId = setInterval(() => this.scheduler(), this.INTERVAL_MS);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause() {
    this.stop();
  }

  resume() {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.nextBeatTime = this.audioCtx.currentTime + 0.05;
    this.isRunning = true;
    this.intervalId = setInterval(() => this.scheduler(), this.INTERVAL_MS);
  }

  setTempo(tempo: number) {
    this.tempo = tempo;
  }

  setBeatsPerMeasure(beats: number) {
    this.beatsPerMeasure = beats;
  }

  setClickEnabled(enabled: boolean) {
    this.clickEnabled = enabled;
  }

  resetPosition(beat = 0, measure = 0) {
    this.currentBeat = beat;
    this.currentMeasure = measure;
  }

  getIsRunning() {
    return this.isRunning;
  }

  destroy() {
    this.stop();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  private scheduler() {
    if (!this.audioCtx || !this.isRunning) return;

    const secondsPerBeat = 60.0 / this.tempo;

    while (this.nextBeatTime < this.audioCtx.currentTime + this.SCHEDULE_AHEAD) {
      // Schedule click sound
      if (this.clickEnabled) {
        this.scheduleClick(this.nextBeatTime, this.currentBeat === 0);
      }

      // Fire beat callback (use setTimeout to stay off audio thread)
      const beat = this.currentBeat;
      const measure = this.currentMeasure;
      setTimeout(() => this.onBeat(beat + 1, measure + 1), 0); // 1-based for UI

      // Advance
      this.currentBeat++;
      if (this.currentBeat >= this.beatsPerMeasure) {
        this.currentBeat = 0;
        const completedMeasure = this.currentMeasure;
        this.currentMeasure++;
        setTimeout(() => this.onMeasureEnd(completedMeasure + 1), 0); // 1-based
      }

      this.nextBeatTime += secondsPerBeat;
    }
  }

  private scheduleClick(time: number, isDownbeat: boolean) {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    // High pitch on beat 1, low pitch on other beats
    osc.frequency.value = isDownbeat ? 880 : 440;
    osc.type = 'sine';

    // Short burst: ~50ms
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.05);
  }
}

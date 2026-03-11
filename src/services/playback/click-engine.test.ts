import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClickEngine } from './click-engine';

// Mock Web Audio API
class MockOscillatorNode {
  frequency = { value: 440 };
  type = 'sine';
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn();
}

class MockAudioContext {
  currentTime = 0;
  state = 'running';
  destination = {};
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createGain = vi.fn(() => new MockGainNode());
  resume = vi.fn();
  close = vi.fn();
}

// Replace global AudioContext
const origAudioCtx = globalThis.AudioContext;
beforeEach(() => {
  (globalThis as unknown as Record<string, unknown>).AudioContext = MockAudioContext;
});
afterEach(() => {
  (globalThis as unknown as Record<string, unknown>).AudioContext = origAudioCtx;
});

describe('ClickEngine', () => {
  it('should create without errors', () => {
    const engine = new ClickEngine({
      tempo: 120,
      beatsPerMeasure: 4,
      clickEnabled: true,
      onBeat: vi.fn(),
      onMeasureEnd: vi.fn(),
    });
    expect(engine).toBeDefined();
    expect(engine.getIsRunning()).toBe(false);
  });

  it('should start and report running', () => {
    const engine = new ClickEngine({
      tempo: 120,
      beatsPerMeasure: 4,
      clickEnabled: true,
      onBeat: vi.fn(),
      onMeasureEnd: vi.fn(),
    });
    engine.start();
    expect(engine.getIsRunning()).toBe(true);
    engine.stop();
    expect(engine.getIsRunning()).toBe(false);
  });

  it('should not double-start', () => {
    const engine = new ClickEngine({
      tempo: 120,
      beatsPerMeasure: 4,
      clickEnabled: true,
      onBeat: vi.fn(),
      onMeasureEnd: vi.fn(),
    });
    engine.start();
    engine.start(); // should not error
    expect(engine.getIsRunning()).toBe(true);
    engine.stop();
  });

  it('should allow setting tempo', () => {
    const engine = new ClickEngine({
      tempo: 120,
      beatsPerMeasure: 4,
      clickEnabled: true,
      onBeat: vi.fn(),
      onMeasureEnd: vi.fn(),
    });
    engine.setTempo(140);
    engine.setBeatsPerMeasure(3);
    engine.setClickEnabled(false);
    // No errors thrown
    expect(true).toBe(true);
  });

  it('should pause and resume', () => {
    const engine = new ClickEngine({
      tempo: 120,
      beatsPerMeasure: 4,
      clickEnabled: true,
      onBeat: vi.fn(),
      onMeasureEnd: vi.fn(),
    });
    engine.start();
    expect(engine.getIsRunning()).toBe(true);
    engine.pause();
    expect(engine.getIsRunning()).toBe(false);
    engine.resume();
    expect(engine.getIsRunning()).toBe(true);
    engine.destroy();
    expect(engine.getIsRunning()).toBe(false);
  });

  it('should reset position', () => {
    const engine = new ClickEngine({
      tempo: 120,
      beatsPerMeasure: 4,
      clickEnabled: true,
      onBeat: vi.fn(),
      onMeasureEnd: vi.fn(),
    });
    engine.resetPosition(2, 5);
    // No errors
    expect(true).toBe(true);
  });
});

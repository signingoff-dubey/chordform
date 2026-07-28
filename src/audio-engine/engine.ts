import * as Tone from 'tone';
import type { SynthPreset } from './types';

// Every instrument shares the exact same envelope/trigger/legato mechanics
// (see playNotes/setPreset) — only oscillator timbre and filter cutoff
// differ. This keeps playback continuous and sustained for every instrument
// choice rather than some being plucked/percussive.
const PRESET_PARAMS: Record<SynthPreset, {
  oscillator: { type: string; count: number; spread: number };
  attack: number;
  release: number;
  filterFreq: number;
  filterQ: number;
}> = {
  warm: { oscillator: { type: 'fattriangle', count: 3, spread: 18 }, attack: 0.35, release: 1.1, filterFreq: 1400, filterQ: 0.7 },
  bright: { oscillator: { type: 'fatsawtooth', count: 3, spread: 24 }, attack: 0.12, release: 0.75, filterFreq: 4200, filterQ: 0.7 },
  keys: { oscillator: { type: 'fatsquare', count: 2, spread: 12 }, attack: 0.05, release: 0.9, filterFreq: 2600, filterQ: 0.9 },
  strings: { oscillator: { type: 'fatsine', count: 4, spread: 30 }, attack: 0.55, release: 1.6, filterFreq: 1800, filterQ: 0.6 },
};

export class AudioEngine {
  private polySynth: Tone.PolySynth | null = null;
  private filter: Tone.Filter | null = null;
  private chorus: Tone.Chorus | null = null;
  private reverb: Tone.Freeverb | null = null;
  private gain: Tone.Gain | null = null;
  private waveform: Tone.Waveform | null = null;
  private captureGain: Tone.Gain | null = null;
  private captureDestination: MediaStreamAudioDestinationNode | null = null;

  private currentPreset: SynthPreset = 'warm';
  private activeNotes: number[] = [];
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    await Tone.start();

    this.gain = new Tone.Gain(1);
    this.gain.toDestination();

    this.waveform = new Tone.Waveform(256);
    this.gain.connect(this.waveform);

    this.captureGain = new Tone.Gain(1);

    // Shared effects chain for all presets: gentle room reverb + a light
    // chorus for width/movement, so voices don't sound like a single bare
    // digital oscillator. Every preset routes through this same chain via
    // its own filter stage.
    this.reverb = new Tone.Freeverb({ roomSize: 0.55, dampening: 3000 });
    this.reverb.wet.value = 0.22;
    this.reverb.connect(this.gain);
    this.reverb.connect(this.captureGain);

    this.chorus = new Tone.Chorus(3.2, 2.2, 0.25);
    this.chorus.wet.value = 0.35;
    this.chorus.start();
    this.chorus.connect(this.reverb);

    this.filter = new Tone.Filter(1200, 'lowpass');
    this.filter.Q.value = 0.7;
    this.filter.connect(this.chorus);

    this.createSynth('warm');

    this.isInitialized = true;
  }

  private createSynth(preset: SynthPreset): void {
    if (this.polySynth) {
      this.polySynth.dispose();
    }

    const params = PRESET_PARAMS[preset];

    this.polySynth = new Tone.PolySynth(Tone.Synth);

    this.polySynth.set({
      oscillator: params.oscillator as any,
      envelope: {
        attack: params.attack,
        decay: 0.25,
        sustain: 0.82,
        release: params.release,
        attackCurve: 'sine',
        decayCurve: 'exponential',
        releaseCurve: 'exponential',
      },
    });

    if (this.filter) {
      this.filter.frequency.value = params.filterFreq;
      this.filter.Q.value = params.filterQ;
      this.polySynth.connect(this.filter);
    }

    this.currentPreset = preset;
  }

  setPreset(preset: SynthPreset): void {
    const wasSounding = this.activeNotes.length > 0;
    if (wasSounding) {
      this.polySynth?.releaseAll();
    }

    this.createSynth(preset);

    if (wasSounding && this.activeNotes.length > 0) {
      this.polySynth?.triggerAttack(
        this.activeNotes.map(n => Tone.Frequency(n, 'midi').toNote()),
        Tone.now() + 0.05
      );
    }
  }

  playNotes(midiNotes: number[]): void {
    if (!this.polySynth || !this.gain) return;

    const currentNoteSet = new Set(this.activeNotes);
    const newNoteSet = new Set(midiNotes);

    const notesToAdd = midiNotes.filter(n => !currentNoteSet.has(n));
    const notesToRemove = this.activeNotes.filter(n => !newNoteSet.has(n));

    if (notesToRemove.length > 0) {
      this.polySynth.triggerRelease(
        notesToRemove.map(n => Tone.Frequency(n, 'midi').toNote())
      );
    }

    if (notesToAdd.length > 0) {
      this.polySynth.triggerAttack(
        notesToAdd.map(n => Tone.Frequency(n, 'midi').toNote()),
        Tone.now() + 0.02
      );
    }

    this.activeNotes = [...midiNotes];
  }

  stopAll(): void {
    if (this.polySynth && this.activeNotes.length > 0) {
      this.polySynth.releaseAll();
      this.activeNotes = [];
    }
  }

  setVibrato(detuneCents: number): void {
    if (!this.polySynth || this.activeNotes.length === 0) return;
    this.polySynth.set({ detune: detuneCents });
  }

  getWaveform(): Float32Array | null {
    if (!this.waveform) return null;
    return this.waveform.getValue() as Float32Array;
  }

  getStreamForCapture(): MediaStream | null {
    if (!this.captureDestination) {
      const ctx = Tone.getContext();
      const audioCtx = ctx.rawContext as AudioContext;
      this.captureDestination = audioCtx.createMediaStreamDestination();
      this.captureGain?.connect(this.captureDestination as any);
    }
    return this.captureDestination?.stream ?? null;
  }

  get preset(): SynthPreset {
    return this.currentPreset;
  }

  get isReady(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    this.stopAll();
    this.polySynth?.dispose();
    this.filter?.dispose();
    this.chorus?.dispose();
    this.reverb?.dispose();
    this.gain?.dispose();
    this.waveform?.dispose();
    this.captureGain?.dispose();
    this.isInitialized = false;
  }
}

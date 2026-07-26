import * as Tone from 'tone';
import type { SynthPreset } from './types';

export class AudioEngine {
  private polySynth: Tone.PolySynth | null = null;
  private gain: Tone.Gain | null = null;
  private captureGain: Tone.Gain | null = null;
  private captureDestination: MediaStreamAudioDestinationNode | null = null;
  private micStream: MediaStream | null = null;

  private currentPreset: SynthPreset = 'warm';
  private activeNotes: number[] = [];
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    await Tone.start();

    this.gain = new Tone.Gain(1);
    this.gain.toDestination();

    this.captureGain = new Tone.Gain(1);

    this.createSynth('warm');

    this.isInitialized = true;
  }

  private createSynth(preset: SynthPreset): void {
    if (this.polySynth) {
      this.polySynth.dispose();
    }

    const isWarm = preset === 'warm';

    this.polySynth = new Tone.PolySynth(Tone.Synth);

    this.polySynth.set({
      oscillator: {
        type: isWarm ? 'triangle' : 'sawtooth',
      } as any,
      envelope: {
        attack: isWarm ? 0.35 : 0.12,
        decay: 0.1,
        sustain: 1,
        release: 0.6,
        attackCurve: 'linear',
        decayCurve: 'exponential',
        releaseCurve: 'exponential',
      },
    });

    if (isWarm) {
      const filter = new Tone.Filter(1200, 'lowpass');
      this.polySynth.connect(filter);
      filter.connect(this.gain!);
      filter.connect(this.captureGain!);
    } else {
      this.polySynth.connect(this.gain!);
      this.polySynth.connect(this.captureGain!);
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

  async initMic(): Promise<MediaStream | null> {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return this.micStream;
    } catch {
      return null;
    }
  }

  disposeMic(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
  }

  dispose(): void {
    this.stopAll();
    this.polySynth?.dispose();
    this.gain?.dispose();
    this.captureGain?.dispose();
    this.disposeMic();
    this.isInitialized = false;
  }
}

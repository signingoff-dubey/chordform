export type SynthPreset = 'warm' | 'bright';

export interface AudioEngineState {
  isReady: boolean;
  activePreset: SynthPreset;
  isSounding: boolean;
}

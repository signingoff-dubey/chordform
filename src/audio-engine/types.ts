export type SynthPreset = 'warm' | 'bright' | 'keys' | 'strings';

export interface InstrumentOption {
  id: SynthPreset;
  label: string;
}

export const INSTRUMENTS: InstrumentOption[] = [
  { id: 'warm', label: 'Warm' },
  { id: 'bright', label: 'Bright' },
  { id: 'keys', label: 'Keys' },
  { id: 'strings', label: 'Strings' },
];

export interface AudioEngineState {
  isReady: boolean;
  activePreset: SynthPreset;
  isSounding: boolean;
}

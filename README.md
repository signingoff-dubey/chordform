# Chordform

Play chords with hand gestures in your browser — no instrument needed.

Chordform maps hand shapes to chord shapes: hold your left hand in a specific position to select a root note, your right hand to select the chord quality (major, minor, 7th, sus, etc.), and it sounds as a continuous synth chord for as long as you hold it. Move your right hand in an arc while holding a shape and it bends the pitch, like a string vibrato.

Built for people who can read a chord name off a chart but have never played an instrument — the whole point is that you don't need to memorize anything before you start. The chart below is also shown live in-app while you play.

## Status

Pre-alpha / MVP in active development. Not yet packaged for general use.

## How to play a chord

A chord needs **two hands, at the same time**: your left hand picks the root note, your right hand picks the quality. Hold both shapes together and the chord sustains for as long as you hold it. Drop either hand to fist (all fingers curled) and it goes silent.

`●` = finger extended &nbsp;&nbsp; `○` = finger curled

Isolating just the middle finger or just the ring finger is hard for most hands, so neither is ever used alone — they only appear paired with other fingers. The progression starts at the index finger (not the thumb) and the note names read in full chromatic order (A, A#, B, C, C#, D, D#, E, F, F#, G, G#) regardless of which gesture happens to be easiest.

### Left hand — root note

| Thumb | Index | Middle | Ring | Pinky | Root |
|---|---|---|---|---|---|
| ○ | ○ | ○ | ○ | ○ | *(silent — no root)* |
| ○ | ● | ○ | ○ | ○ | **A** |
| ● | ○ | ○ | ○ | ○ | **A# / Bb** |
| ○ | ○ | ○ | ○ | ● | **B** |
| ● | ● | ○ | ○ | ○ | **C** |
| ○ | ● | ● | ○ | ○ | **C# / Db** |
| ● | ○ | ○ | ○ | ● | **D** |
| ○ | ● | ○ | ○ | ● | **D# / Eb** |
| ● | ○ | ● | ○ | ○ | **E** |
| ○ | ○ | ○ | ● | ● | **F** |
| ● | ● | ○ | ○ | ● | **F# / Gb** |
| ● | ● | ● | ○ | ○ | **G** |
| ● | ○ | ● | ○ | ● | **G# / Ab** |

### Right hand — chord quality

| Thumb | Index | Middle | Ring | Pinky | Quality |
|---|---|---|---|---|---|
| ○ | ○ | ○ | ○ | ○ | *(silent — no quality)* |
| ○ | ● | ○ | ○ | ○ | **Major** |
| ● | ○ | ○ | ○ | ○ | **Minor** |
| ○ | ○ | ○ | ○ | ● | **Dominant 7** |
| ● | ● | ○ | ○ | ○ | **Major 7** |
| ○ | ● | ● | ○ | ○ | **Minor 7** |
| ● | ○ | ○ | ○ | ● | **Sus2** |
| ○ | ● | ○ | ○ | ● | **Sus4** |
| ● | ○ | ● | ○ | ○ | **Diminished** |
| ○ | ○ | ○ | ● | ● | **Augmented** |
| ● | ● | ○ | ○ | ● | **Major 6** |
| ● | ● | ● | ○ | ○ | **Minor 6** |
| ● | ○ | ● | ○ | ● | **Add9** |

### Example

Want to play **Cm7**? Left hand: thumb + index up (**C**). Right hand: index + middle up (**Minor 7**). Hold both — that's the chord. Move your right hand slowly left-right in an arc while holding it for vibrato.

Full spec, including which finger-combinations are reserved for future chords (v2), lives in [`docs/GESTURE_ENCODING.md`](./docs/GESTURE_ENCODING.md).

## Features (MVP)

- Real-time gesture recognition via webcam/front camera (desktop, tablet, and phone)
- Two selectable synth characters: Warm and Bright
- Continuous, legato chord playback — no plucked/percussive triggering, chords glide into each other
- Right-hand motion vibrato while a chord is held
- Local performance recording (video + your voice + the synth, mixed) with direct download — nothing uploaded anywhere
- Fully responsive layout, phone through desktop, from first release

## Tech stack

- React + TypeScript + Vite
- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) (Hand Landmarker) for gesture tracking
- [Tone.js](https://tonejs.github.io/) for audio synthesis
- No backend. Everything — tracking, audio, and recording — runs entirely client-side.

## Privacy

Your camera and microphone never leave your device. Hand tracking runs locally in-browser; nothing is uploaded, logged, or stored on a server, because there is no server. Recordings stay in memory until you explicitly download them. See [`docs/SECURITY.md`](./docs/SECURITY.md) for details.

## Getting started

```bash
git clone https://github.com/signingoff-dubey/chordform.git
cd chordform
npm install
npm run dev
```

Open the local dev URL in a browser, grant camera access when prompted, and hold up your hands.

**Requirements:**
- A browser that supports `getUserMedia` (Chrome/Edge recommended for best MediaPipe + WebGL support)
- HTTPS or `localhost` — camera access requires a secure context
- A webcam or front-facing camera

## Project docs

| Doc | Covers |
|---|---|
| [`docs/PRD.md`](./docs/PRD.md) | Product scope, target user, MVP boundaries, competitive landscape |
| [`docs/APP_FLOW.md`](./docs/APP_FLOW.md) | Screens, state machine, edge cases |
| [`docs/DESIGN.md`](./docs/DESIGN.md) | Visual design tokens, responsive behavior across phone/tablet/laptop |
| [`docs/GESTURE_ENCODING.md`](./docs/GESTURE_ENCODING.md) | The full finger-to-chord mapping spec, including reserved/future states |
| [`docs/AUDIO_ENGINE.md`](./docs/AUDIO_ENGINE.md) | Synth presets, voicing, vibrato mapping |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Frontend structure, module layout, recording pipeline |
| [`docs/SECURITY.md`](./docs/SECURITY.md) | Privacy commitments, dependency/supply-chain handling |

## Out of scope for now

Slash chords, user accounts, cloud recording/sharing, MIDI/DAW output, and extended chord vocabulary (9ths, 11ths, altered chords) are deliberately deferred — see the backlog section of `docs/PRD.md` for why.

## License

TODO — not yet chosen.

## Contributing

Not currently open to outside contributions. This may change once the MVP is stable.

## Project structure

```
chordform/
├── docs/                          # PRD, architecture, gesture spec, security, etc.
├── public/                        # Static assets
├── src/
│   ├── App.tsx                    # Screen router (landing/loading/play/error states)
│   ├── main.tsx                   # App entry point
│   ├── index.css
│   ├── audio-engine/              # Tone.js synth setup, presets, vibrato, capture stream
│   │   ├── engine.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── gesture-encoding/          # Pure finger-state -> chord lookup tables (unit tested)
│   │   ├── lookup.ts
│   │   ├── lookup.test.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── hand-tracking/             # MediaPipe wrapper, finger-curl classification, overlay drawing
│   │   ├── tracker.ts
│   │   ├── finger-curl.ts
│   │   ├── drawing.ts
│   │   └── index.ts
│   ├── recording/                 # MediaRecorder orchestration, mixed-stream composition
│   │   ├── recorder.ts
│   │   └── index.ts
│   ├── hooks/                     # App-level state and canvas render loop
│   │   ├── useAppState.ts
│   │   └── useCanvasRenderer.ts
│   ├── design-tokens/             # CSS custom properties (palette, type scale, breakpoints)
│   │   └── tokens.css
│   ├── ui/
│   │   ├── play-screen/           # Camera feed, canvas overlay, HUD host
│   │   ├── hud/                   # Chord readout, instrument/transpose/record controls
│   │   ├── reference-panel/       # On-screen chord vocabulary chart
│   │   ├── recording-review/      # Post-recording preview/download/discard
│   │   └── visualizer/            # Live waveform display
│   └── types/                     # Ambient type declarations (e.g. fingerpose)
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig*.json
└── netlify.toml
```

## Changelog

### v1.0.1

- Fixed disabled fingerpose confidence threshold that let ambiguous/mid-transition hand shapes resolve to a definite gesture, causing chord flicker
- Fixed leaked `AudioContext` created per recording (never closed)
- Fixed leaked microphone `MediaStream` that stayed active after a recording stopped
- Removed dead, unused mic-lifecycle code from the audio engine
- Removed a dead `micStream` state field and added a guard against double-starting the camera/audio/tracking pipeline
- Fixed a mismatched `orientationchange` listener that was never actually removed on unmount
- Added keyboard shortcuts on the play screen: `Space` (record/stop), `R` (reference), `↑`/`↓` (transpose), `Esc` (exit), disabled while a modal is open

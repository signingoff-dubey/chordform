export class SessionRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private recording = false;
  private canvasStream: MediaStream | null = null;
  private mixedStream: MediaStream | null = null;

  async startRecording(
    canvas: HTMLCanvasElement,
    audioStream: MediaStream | null,
    micStream: MediaStream | null
  ): Promise<void> {
    this.chunks = [];

    this.canvasStream = canvas.captureStream(30);
    const tracks: MediaStreamTrack[] = this.canvasStream.getVideoTracks();
    const audioTracks: MediaStreamTrack[] = [];

    if (audioStream) {
      audioTracks.push(...audioStream.getAudioTracks());
    }

    if (micStream) {
      const context = new AudioContext();
      const dest = context.createMediaStreamDestination();
      const audioSrc = audioStream ? context.createMediaStreamSource(audioStream) : null;
      const micSrc = context.createMediaStreamSource(micStream);

      if (audioSrc) {
        const audioGain = context.createGain();
        audioGain.gain.value = 1;
        audioSrc.connect(audioGain);
        audioGain.connect(dest);
      }

      const micGain = context.createGain();
      micGain.gain.value = 0.7;
      micSrc.connect(micGain);
      micGain.connect(dest);

      audioTracks.push(...dest.stream.getAudioTracks());
    } else if (audioStream) {
      audioTracks.push(...audioStream.getAudioTracks());
    }

    this.mixedStream = new MediaStream([...tracks, ...audioTracks]);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm';

    this.mediaRecorder = new MediaRecorder(this.mixedStream, { mimeType });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100);
    this.recording = true;
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.recording) {
        resolve(new Blob());
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder!.mimeType });
        this.chunks = [];
        this.recording = false;
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  private cleanup(): void {
    if (this.canvasStream) {
      this.canvasStream.getTracks().forEach(t => t.stop());
      this.canvasStream = null;
    }
    if (this.mixedStream) {
      this.mixedStream.getTracks().forEach(t => t.stop());
      this.mixedStream = null;
    }
    this.mediaRecorder = null;
  }

  get isRecording(): boolean {
    return this.recording;
  }

  dispose(): void {
    this.cleanup();
    this.chunks = [];
  }
}

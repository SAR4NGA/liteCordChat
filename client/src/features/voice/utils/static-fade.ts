export class StaticFadeEngine {
  private audioCtx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;

  private init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(this.audioCtx.destination);

    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.audioCtx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;
    this.noiseNode.connect(this.gainNode);
    this.noiseNode.start();
  }

  public setFadeLevel(level: number) {
    // level 0.0 to 1.0
    if (!this.audioCtx) this.init();
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume();
    }
    
    if (this.gainNode) {
      const targetGain = level * 0.05; // Keep static subtle
      this.gainNode.gain.setTargetAtTime(targetGain, this.audioCtx!.currentTime, 0.1);
    }
  }

  public stop() {
    if (this.noiseNode) {
      this.noiseNode.stop();
      this.noiseNode = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

export const staticFadeEngine = new StaticFadeEngine();

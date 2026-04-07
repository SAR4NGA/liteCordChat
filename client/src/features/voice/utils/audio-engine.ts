export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private peerNodes: Map<string, {
    source: MediaStreamAudioSourceNode,
    panner: StereoPannerNode,
    gain: GainNode,
    sink: HTMLAudioElement
  }> = new Map();
  private backchannelGain: GainNode | null = null;
  private teamGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private init() {
    if (this.audioCtx) return;
    console.log('[AudioEngine] Initializing AudioContext');
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    this.masterGain = this.audioCtx.createGain();
    this.masterGain.connect(this.audioCtx.destination);

    this.teamGain = this.audioCtx.createGain();
    this.teamGain.connect(this.masterGain);

    this.backchannelGain = this.audioCtx.createGain();
    this.backchannelGain.connect(this.masterGain);
  }

  /**
   * Resume the AudioContext (required by browser autoplay policy).
   * Returns a Promise so callers can `await` it before setting up nodes.
   */
  public resume(): Promise<void> {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      return this.audioCtx.resume();
    }
    return Promise.resolve();
  }

  public async setupPeer(peerId: string, stream: MediaStream, type: 'team' | 'backchannel', startMuted = false) {
    if (!this.audioCtx) this.init();

    // Resume FIRST — creating nodes on a suspended context works, but it's
    // safer to ensure the context is running before wiring the graph.
    await this.resume();

    // If AudioContext was closed (e.g. after stop()), re-init.
    if (this.audioCtx!.state === 'closed') {
      this.audioCtx = null;
      this.masterGain = null;
      this.teamGain = null;
      this.backchannelGain = null;
      this.init();
      await this.resume();
    }

    this.removePeer(peerId);

    const audioTracks = stream.getAudioTracks();
    console.log(`[AudioEngine] Setting up peer: ${peerId} (${type}) — ${audioTracks.length} audio tracks`);
    if (audioTracks.length === 0) {
      console.warn(`[AudioEngine] No audio tracks for peer ${peerId}. Stream ID: ${stream.id}`);
      return;
    }

    // A hidden <audio> element keeps the stream "alive" in some browsers
    // even when all AudioContext nodes are connected.
    const sink = new Audio();
    sink.srcObject = stream;
    sink.muted = true; // Actual sound goes through AudioContext
    sink.play().catch(e => console.warn('[AudioEngine] Sink play failed:', e));

    const source = this.audioCtx!.createMediaStreamSource(stream);
    const panner = this.audioCtx!.createStereoPanner();
    const gain = this.audioCtx!.createGain();

    // Subtle pan separation: team slightly left, backchannel slightly right.
    // Avoid extreme values (-0.8/+0.8) — they sound broken on mono speakers.
    panner.pan.value = type === 'team' ? -0.2 : 0.2;

    source.connect(panner);
    panner.connect(gain);

    if (type === 'team') {
      gain.connect(this.teamGain!);
    } else {
      gain.connect(this.backchannelGain!);
    }

    this.peerNodes.set(peerId, { source, panner, gain, sink });
    console.log(`[AudioEngine] Peer ${peerId} wired into audio graph. Ctx state: ${this.audioCtx!.state}`);

    // Apply initial mute state — prevents audio bleed before area-gating runs
    if (startMuted) {
      gain.gain.setValueAtTime(0, this.audioCtx!.currentTime);
    }
  }

  public removePeer(peerId: string) {
    const nodes = this.peerNodes.get(peerId);
    if (nodes) {
      try { nodes.source.disconnect(); } catch { }
      try { nodes.panner.disconnect(); } catch { }
      try { nodes.gain.disconnect(); } catch { }
      nodes.sink.srcObject = null;
      nodes.sink.remove();
      this.peerNodes.delete(peerId);
    }
  }

  /**
   * Mute or unmute a specific peer by setting their gain node to 0 or 1.
   * This is the correct way to gate audio routed through the AudioContext graph —
   * setting track.enabled on the original MediaStreamTrack has no effect once
   * a MediaStreamAudioSourceNode has been created from it.
   */
  public setMuted(peerId: string, muted: boolean) {
    const nodes = this.peerNodes.get(peerId);
    if (!nodes || !this.audioCtx) return;
    const targetGain = muted ? 0 : 1;
    nodes.gain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.05);
    console.log(`[AudioEngine] Peer ${peerId} ${muted ? 'muted' : 'unmuted'}`);
  }

  public setDucking(active: boolean) {
    if (!this.teamGain || !this.audioCtx) return;
    const targetGain = active ? 0.4 : 1.0;
    this.teamGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.1);
  }

  public stop() {
    this.peerNodes.forEach((_, id) => this.removePeer(id));
    if (this.audioCtx) {
      // Close asynchronously but null the ref synchronously so any concurrent
      // resume() / setupPeer() call treats the engine as un-initialized.
      const ctx = this.audioCtx;
      this.audioCtx = null;
      this.masterGain = null;
      this.teamGain = null;
      this.backchannelGain = null;
      ctx.close().catch(() => { });
    }
  }
}

export const audioEngine = new AudioEngine();
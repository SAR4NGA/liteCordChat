/**
 * StaticFadeEngine is now a thin delegation facade over AudioEngine.
 * Both previously created their own AudioContext, which caused browsers
 * to hit the concurrent-context limit (~6 in Chrome). Now they share
 * AudioEngine's single context.
 */
import { audioEngine } from './audio-engine';

export class StaticFadeEngine {
  public setFadeLevel(level: number) {
    audioEngine.setFadeLevel(level);
  }

  public stop() {
    // No-op: AudioEngine.stop() handles the full teardown (including noise).
    // This is intentionally empty — the caller (useDataMonitor cleanup) runs
    // this per-interval, but we must NOT close the context here because other
    // peers are still active. The RoomPage unmount calls audioEngine.stop().
  }
}

export const staticFadeEngine = new StaticFadeEngine();

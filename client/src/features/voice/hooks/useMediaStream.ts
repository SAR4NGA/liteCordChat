import { useState, useCallback } from 'react';

export const useMediaStream = () => {
  const [error, setError] = useState<Error | null>(null);

  const [isMuted, setIsMuted] = useState(false);

  const startStream = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,       // mono is optimal for voice
        }
      });
      mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      setError(null);
      return mediaStream;
    } catch (err) {
      setError(err as Error);
      console.error('Error accessing microphone:', err);
      return null;
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const stopStream = useCallback(() => {
    // Stream state is now managed externally by useSocketStore
  }, []);

  return { error, isMuted, startStream, stopStream, toggleMute };
};

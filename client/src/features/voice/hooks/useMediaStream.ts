import { useState, useEffect, useCallback } from 'react';

export const useMediaStream = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
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
      setStream(mediaStream);
      setError(null);
      return mediaStream;
    } catch (err) {
      setError(err as Error);
      console.error('Error accessing microphone:', err);
      return null;
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (stream) {
        stream.getAudioTracks().forEach(track => {
          track.enabled = !next;
        });
      }
      return next;
    });
  }, [stream]);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  return { stream, error, isMuted, startStream, stopStream, toggleMute };
};

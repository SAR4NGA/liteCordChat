import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock WebRTC components
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'MediaStream', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      getTracks: vi.fn().mockReturnValue([]),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
    })),
  });

  Object.defineProperty(window, 'RTCPeerConnection', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      createOffer: vi.fn(),
      createAnswer: vi.fn(),
      setLocalDescription: vi.fn(),
      setRemoteDescription: vi.fn(),
      addTrack: vi.fn(),
      close: vi.fn(),
      onicecandidate: null,
      ontrack: null,
      onnegotiationneeded: null,
    })),
  });
}

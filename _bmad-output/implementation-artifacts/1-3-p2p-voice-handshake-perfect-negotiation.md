# Story 1.3: P2P Voice Handshake (Perfect Negotiation)

Status: done

## Story

As a participant,
I want to connect directly to another user via WebRTC,
so that we can communicate with minimal latency.

## Acceptance Criteria

1. **Given** two users in the same signaling room.
2. **When** they exchange SDP offers/answers using the "Polite/Impolite" pattern.
3. **Then** a stable P2P data and audio connection is established.

## Tasks / Subtasks

- [x] Implement WebRTC Manager Hook (AC: 2, 3)
  - [x] Create a `useWebRTC` hook to manage `RTCPeerConnection` instances
  - [x] Implement "Perfect Negotiation" logic (polite/impolite)
  - [x] Handle `ontrack` and `onicecandidate` events
- [x] Implement Signaling Integration (AC: 2)
  - [x] Connect `useWebRTC` with Socket.io `signal` event
  - [x] Manage peer state (connecting, connected, disconnected)
- [x] Basic Audio Stream Handling (AC: 3)
  - [x] Capture local microphone stream
  - [x] Add local stream to peer connections
  - [x] Play remote audio streams
- [x] Verify P2P Connectivity (AC: 3)
  - [x] Test 1-on-1 connection in a single room (manual or automated if possible)

## Dev Notes

### Architecture Patterns & Constraints
- **Perfect Negotiation**: Use the canonical pattern to avoid glare (polite peer ignores its own offer if an incoming one is received).
- **Mesh Network**: Each peer connects to every other peer in the room.

### Source Tree Components
- `client/src/hooks/useWebRTC.ts`: Core WebRTC logic.
- `client/src/features/voice/`: Audio stream management components.

### References
- [Source: _bmad-output/planning-artifacts/research/technical-webrtc-p2p-mesh-research-20260402.md]
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Protocol]

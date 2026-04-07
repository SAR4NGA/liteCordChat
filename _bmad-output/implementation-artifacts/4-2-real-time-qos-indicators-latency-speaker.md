# Story 4.2: Real-Time QoS Indicators (Latency & Speaker)

Status: done

## Story

As a participant,
I want to see the connection quality (latency) and who is currently speaking,
so that I can troubleshoot lag and follow the conversation easily.

## Acceptance Criteria

1. **Given** an active voice session.
2. **When** a peer is connected.
3. **Then** their latency (RTT) is displayed next to their name.
4. **When** a peer is speaking (audio level > threshold).
5. **Then** their avatar is visually highlighted.

## Tasks / Subtasks

- [x] Implement QoS Stats Extraction (AC: 3)
  - [x] Update `useDataMonitor` to retrieve `roundTripTime` from `candidate-pair` or `remote-inbound-rtp` stats
- [x] Implement Speaking Detection (AC: 5)
  - [x] Use `getStats()` to monitor `audioLevel` or `totalAudioEnergy` for incoming tracks
  - [x] Expose a `speakingPeers` set from the hook
- [x] Update Member UI (AC: 3, 5)
  - [x] Display "ping" (ms) for each peer in the triptych columns
  - [x] Add a "speaking" glow/border to active speakers
- [x] Verify QoS Feedback (AC: 3, 5)
  - [x] Confirm latency updates and speaker highlights reflect real-time activity

## Dev Notes

### Architecture Patterns & Constraints
- **Latency Source**: `currentRoundTripTime` in the `selected-candidate-pair` report is usually the most reliable for WebRTC.
- **Speaking Threshold**: A simple threshold on `audioLevel` (0.0 to 1.0) is enough for basic detection.

### Source Tree Components
- `client/src/hooks/useDataMonitor.ts`: Expand to include latency and levels.
- `client/src/App.tsx`: UI highlights.

### References
- [Source: _bmad-output/planning-artifacts/prd.md#UX-DR2]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]

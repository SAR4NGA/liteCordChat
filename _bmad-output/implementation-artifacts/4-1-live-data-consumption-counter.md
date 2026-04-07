# Story 4.1: Live Data Consumption Counter

Status: done

## Story

As a user on a limited data plan,
I want to see exactly how much data the app is consuming in real-time,
so that I can manage my usage effectively.

## Acceptance Criteria

1. **Given** an active voice session.
2. **When** audio data is sent or received.
3. **Then** the UI displays a live counter showing cumulative KB/MB used.
4. **When** the session ends.
5. **Then** the final data consumption is summarized.

## Tasks / Subtasks

- [x] Implement WebRTC Stats Tracking (AC: 3)
  - [x] Use `getStats()` on `RTCPeerConnection` to retrieve `bytesReceived` and `bytesSent`
  - [x] Calculate the total delta across all active peer connections
- [x] Create Data Monitor Store/Hook (AC: 3)
  - [x] Create a `useDataMonitor` hook to poll stats every 2-5 seconds
  - [x] Maintain a global "Session Data Used" state
- [x] Update UI with Live Counter (AC: 3)
  - [x] Add a small data usage indicator in the `RoomPage` header or footer
- [x] Verify Accuracy (AC: 3)
  - [x] Confirm the counter increases while speaking or hearing others

## Dev Notes

### Architecture Patterns & Constraints
- **Performance**: Polling `getStats()` on all mesh connections can be expensive. Poll at a reasonable interval (e.g., 2000ms).
- **Cumulative vs. Current**: Track cumulative session usage since the page loaded.

### Source Tree Components
- `client/src/hooks/useDataMonitor.ts`: Stats extraction logic.
- `client/src/App.tsx`: Usage display.

### References
- [Source: _bmad-output/planning-artifacts/prd.md#UX-DR2]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]

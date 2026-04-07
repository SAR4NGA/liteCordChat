# Story 3.2: Room-to-Room "Navigation Hopping"

Status: done

## Story

As a participant,
I want to move between Lobby and Teams without re-joining,
so that I can switch contexts instantly.

## Acceptance Criteria

1. **Given** a connected participant.
2. **When** they select a different area column.
3. **Then** their presence indicator moves instantly.
4. **Then** the WebRTC connection remains stable (no reconnection).

## Tasks / Subtasks

- [x] Implement Presence Hopping (AC: 3)
  - [x] Ensure `moveArea` updates the server-side state without disconnecting the socket
  - [x] Ensure `AREA_MOVED` event updates all clients' member lists
- [x] Verify Connection Stability (AC: 4)
  - [x] Confirm that moving between areas does not trigger a WebRTC `onnegotiationneeded` or `onconnectionstatechange` (unless necessary for the mesh)
- [x] UX Polish (AC: 3)
  - [x] Add visual highlight to the user's current area (implemented in 3.1)

## Dev Notes

### Architecture Patterns & Constraints
- **Session Continuity**: The primary goal is to ensure the WebRTC mesh remains alive. We only change metadata (`roomArea`), not the connection itself. Audio segregation (Story 3.3) will use this metadata to mute/unmute streams.

### Source Tree Components
- `server/src/features/rooms/room-manager.ts`: Metadata update.
- `client/src/App.tsx`: Navigation trigger.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]
